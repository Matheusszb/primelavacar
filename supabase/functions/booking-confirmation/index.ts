// Supabase Database Webhook: INSERT em public.appointment_requests.
// verify_jwt = false em supabase/config.toml; configure x-prime-webhook-secret.
const env=(name:string)=>Deno.env.get(name)||'';
const root=env('SUPABASE_URL').replace(/\/$/,'');
const key=env('SUPABASE_SERVICE_ROLE_KEY');
const secret=env('PRIME_WEBHOOK_SECRET');
const token=env('WHATSAPP_ACCESS_TOKEN');
const phoneId=env('WHATSAPP_PHONE_NUMBER_ID');
const template=env('WHATSAPP_TEMPLATE_NAME');
const version=env('WHATSAPP_GRAPH_VERSION');
const headers={apikey:key,Authorization:`Bearer ${key}`,'Content-Type':'application/json'};
function equal(a:string,b:string){if(a.length!==b.length)return false;let n=0;for(let i=0;i<a.length;i++)n|=a.charCodeAt(i)^b.charCodeAt(i);return n===0}
async function db(path:string,init:RequestInit={}){const r=await fetch(`${root}/rest/v1/${path}`,{...init,headers:{...headers,...init.headers}});const data=await r.json().catch(()=>null);if(!r.ok)throw new Error(data?.message||`Supabase ${r.status}`);return data}
Deno.serve(async request=>{
  if(request.method!=='POST')return new Response('Method not allowed',{status:405});
  if(!secret||!equal(request.headers.get('x-prime-webhook-secret')||'',secret))return new Response('Unauthorized',{status:401});
  if(!root||!key||!token||!phoneId||!template||!version)return new Response('Integration not configured',{status:503});
  let id='';let claimed=false;
  try{
    const event=await request.json();
    if(event.type!=='INSERT'||event.table!=='appointment_requests'||event.schema!=='public'||!event.record?.id)return Response.json({skipped:true});
    id=event.record.id;
    const rows=await db(`appointment_requests?id=eq.${encodeURIComponent(id)}&select=id,customer_name,phone,preferred_date,preferred_period,address,consent_at,whatsapp_opt_in,services(name)`);
    const bookingRequest=rows?.[0];if(!bookingRequest?.consent_at||!bookingRequest?.whatsapp_opt_in)return Response.json({skipped:true});
    const claim=await fetch(`${root}/rest/v1/message_delivery`,{method:'POST',headers:{...headers,Prefer:'return=representation'},body:JSON.stringify({request_id:id,status:'processing'})});
    if(claim.status===409)return Response.json({skipped:true,reason:'already_claimed'});
    if(!claim.ok)throw new Error(`Delivery claim ${claim.status}`);
    claimed=true;
    const [year,month,dayPart]=bookingRequest.preferred_date.split('-');
    const day=`${dayPart}/${month}/${year}`;
    const period=({manha:'manhã',tarde:'tarde',sem_preferencia:'sem preferência'} as Record<string,string>)[bookingRequest.preferred_period]||'sem preferência';
    const raw=String(bookingRequest.phone).replace(/\D/g,'');const to=raw.startsWith('55')?raw:`55${raw}`;
    const values=[bookingRequest.customer_name,day,period,bookingRequest.services.name,bookingRequest.address];
    const body={messaging_product:'whatsapp',to,type:'template',template:{name:template,language:{code:'pt_BR'},components:[{type:'body',parameters:values.map(text=>({type:'text',text}))}]}};
    const sent=await fetch(`https://graph.facebook.com/${encodeURIComponent(version)}/${encodeURIComponent(phoneId)}/messages`,{method:'POST',headers:{Authorization:`Bearer ${token}`,'Content-Type':'application/json'},body:JSON.stringify(body)});
    const result=await sent.json().catch(()=>({}));
    if(!sent.ok){await fetch(`${root}/rest/v1/message_delivery?request_id=eq.${encodeURIComponent(id)}`,{method:'DELETE',headers});claimed=false;throw new Error(`WhatsApp ${sent.status}: ${result.error?.message||'provider error'}`)}
    await db(`message_delivery?request_id=eq.${encodeURIComponent(id)}`,{method:'PATCH',body:JSON.stringify({status:'sent',provider_message_id:result.messages?.[0]?.id||null,updated_at:new Date().toISOString()})});
    return Response.json({sent:true});
  }catch(error){console.error(error);return Response.json({error:'Confirmation failed',claimed},{status:500})}
});
