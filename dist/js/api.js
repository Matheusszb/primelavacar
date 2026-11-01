import {SUPABASE_URL,SUPABASE_ANON_KEY} from './config.js';
export const configured=Boolean(SUPABASE_URL&&SUPABASE_ANON_KEY);
const base=SUPABASE_URL.replace(/\/$/,'');
let session=null;
try{session=JSON.parse(sessionStorage.getItem('prime_session')||'null')}catch{}
function storeSession(value){session=value;if(value)sessionStorage.setItem('prime_session',JSON.stringify(value));else sessionStorage.removeItem('prime_session')}
async function request(path,{method='GET',body,auth=false,headers={}}={}){
  if(!configured)throw new Error('Supabase ainda não configurado. Fale conosco pelo WhatsApp.');
  if(auth&&session?.expires_at&&Date.now()/1000>session.expires_at-60)await refresh();
  const token=auth?session?.access_token:(SUPABASE_ANON_KEY.startsWith('sb_publishable_')?null:SUPABASE_ANON_KEY);
  if(auth&&!token)throw new Error('Faça login novamente.');
  const response=await fetch(base+path,{method,headers:{apikey:SUPABASE_ANON_KEY,...(token?{Authorization:`Bearer ${token}`}:{}) ,...(body?{'Content-Type':'application/json'}:{}),...headers},body:body?JSON.stringify(body):undefined});
  const raw=await response.text();let data;try{data=raw?JSON.parse(raw):null}catch{data=raw}
  if(!response.ok)throw new Error(data?.message||data?.error_description||data?.error||`Erro ${response.status}`);
  return data;
}
export async function signIn(email,password){const data=await request('/auth/v1/token?grant_type=password',{method:'POST',body:{email,password}});storeSession({...data,expires_at:Math.floor(Date.now()/1000)+data.expires_in});return data}
export async function refresh(){if(!session?.refresh_token)throw new Error('Sessão expirada.');const data=await request('/auth/v1/token?grant_type=refresh_token',{method:'POST',body:{refresh_token:session.refresh_token}});storeSession({...data,expires_at:Math.floor(Date.now()/1000)+data.expires_in});return data}
export async function signOut(){try{if(session)await request('/auth/v1/logout',{method:'POST',auth:true})}catch{}storeSession(null)}
export function hasSession(){return !!session?.access_token}
export async function getUser(){return request('/auth/v1/user',{auth:true})}
export function rest(table,query='',options={}){return request(`/rest/v1/${table}${query?`?${query}`:''}`,options)}
export function rpc(name,body={},auth=false){return request(`/rest/v1/rpc/${name}`,{method:'POST',body,auth})}
export async function upsert(table,body,conflict='id'){return rest(table,`on_conflict=${encodeURIComponent(conflict)}`,{method:'POST',body,auth:true,headers:{Prefer:'resolution=merge-duplicates,return=representation'}})}
export async function insert(table,body){return rest(table,'',{method:'POST',body,auth:true,headers:{Prefer:'return=representation'}})}
export async function update(table,id,body){return rest(table,`id=eq.${encodeURIComponent(id)}`,{method:'PATCH',body,auth:true,headers:{Prefer:'return=representation'}})}
export async function remove(table,id){return rest(table,`id=eq.${encodeURIComponent(id)}`,{method:'DELETE',auth:true})}
export async function uploadImage(file){
  if(!configured||!session?.access_token)throw new Error('Faça login novamente.');
  if(!['image/jpeg','image/png','image/webp'].includes(file.type)||file.size>6_000_000)throw new Error('Envie uma imagem JPG, PNG ou WebP de até 6 MB.');
  if(session.expires_at&&Date.now()/1000>session.expires_at-60)await refresh();
  const ext=({'image/jpeg':'jpg','image/png':'png','image/webp':'webp'})[file.type],name=`${crypto.randomUUID()}.${ext}`;
  const response=await fetch(`${base}/storage/v1/object/service-images/${name}`,{method:'POST',headers:{apikey:SUPABASE_ANON_KEY,Authorization:`Bearer ${session.access_token}`,'Content-Type':file.type},body:file});
  if(!response.ok){const data=await response.json().catch(()=>({}));throw new Error(data.message||data.error||'Falha ao enviar imagem.')}
  return `${base}/storage/v1/object/public/service-images/${name}`;
}
export function esc(s){return String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]))}
export function brl(n){return Number(n||0).toLocaleString('pt-BR',{style:'currency',currency:'BRL'})}
export function dateBR(v){if(!v)return '—';const [y,m,d]=String(v).slice(0,10).split('-');return `${d}/${m}/${y}`}
export function localISO(date=new Date()){const p=n=>String(n).padStart(2,'0');return `${date.getFullYear()}-${p(date.getMonth()+1)}-${p(date.getDate())}`}
export const defaults={name:'Prime Lava Car JP',whatsapp:'5583986201295',address:'Avenida Cidade de Nova Floresta, 251, João Pessoa - PB',instagram:'https://www.instagram.com/primelavacar.jp/',review_url:'',about:'Cuidamos do seu veículo com qualidade, praticidade e atenção aos detalhes.'};
