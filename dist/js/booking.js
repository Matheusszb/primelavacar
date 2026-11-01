import {configured,rest,rpc,esc,brl,dateBR,localISO} from './api.js';

const $=selector=>document.querySelector(selector);
const preset=new URLSearchParams(location.search).get('servico');
const groups=['Lavagem','Interior','Detalhes e acabamento'];
const periodNames={manha:'manhã',tarde:'tarde',sem_preferencia:'sem preferência'};
let services=[],whatsapp='5583986201295';

const menu=$('#menu-btn'),links=$('#navlinks');
menu?.addEventListener('click',()=>{const open=links.classList.toggle('open');menu.setAttribute('aria-expanded',String(open))});
links?.querySelectorAll('a').forEach(a=>a.addEventListener('click',()=>links.classList.remove('open')));
$('#date').min=localISO();
const maxDate=new Date();maxDate.setDate(maxDate.getDate()+90);$('#date').max=localISO(maxDate);

function notice(message){$('#booking-message').innerHTML=`<div class="notice error">${esc(message)}</div>`}
function clearNotice(){$('#booking-message').innerHTML=''}
function service(){return services.find(item=>item.id===$('#service').value)}
function waUrl(message=''){return `https://wa.me/${whatsapp}${message?`?text=${encodeURIComponent(message)}`:''}`}
function updateWhatsAppLinks(){document.querySelectorAll('a[href^="https://wa.me/"]').forEach(a=>a.href=waUrl())}
function showFallback(){$('#booking-fallback').classList.remove('hidden');$('#next-service').disabled=true}
function step(number){
  clearNotice();
  document.querySelectorAll('.booking-step').forEach(el=>el.classList.toggle('hidden',Number(el.dataset.step)!==number));
  document.querySelectorAll('[data-progress]').forEach(el=>{const n=Number(el.dataset.progress);el.classList.toggle('active',n===number);el.classList.toggle('done',n<number)});
  $('#booking-form').scrollIntoView({behavior:'smooth',block:'start'});
}
function updateService(){
  const item=service(),preview=$('#service-preview');
  preview.classList.toggle('hidden',!item);
  if(!item)return;
  preview.innerHTML=`<strong>${esc(item.name)}</strong><p>${esc(item.description)}</p><span>${item.price!=null?brl(item.price):'Valor sob consulta'}</span><span>${item.duration_minutes?`${item.duration_minutes} min estimados`:'Duração a confirmar'}</span>`;
}
function updateSummary(){
  const item=service(),period=periodNames[$('#period').value];
  $('#summary-service').textContent=item?.name||'—';
  $('#summary-when').textContent=$('#date').value&&period?`${dateBR($('#date').value)} · ${period}`:'—';
  $('#summary-price').textContent=item?.price!=null?brl(item.price):'Sob consulta';
}

$('#service').addEventListener('change',()=>{clearNotice();updateService()});
$('#date').addEventListener('change',updateSummary);
$('#period').addEventListener('change',updateSummary);
$('#next-service').addEventListener('click',()=>{if(!service()){notice('Escolha um serviço para continuar.');$('#service').focus();return}step(2)});
$('#next-date').addEventListener('click',()=>{const date=$('#date');if(!date.value||!date.checkValidity()||!periodNames[$('#period').value]){notice('Escolha uma data e um período de preferência.');(date.value?$('#period'):date).focus();return}updateSummary();step(3)});
$('#back-date').addEventListener('click',()=>step(1));
$('#back-contact').addEventListener('click',()=>step(2));
$('#phone').addEventListener('input',event=>{const digits=event.target.value.replace(/\D/g,'').slice(0,11);const ddd=digits.slice(0,2),number=digits.slice(2);event.target.value=digits.length>2?`(${ddd}) ${number.length>4?`${number.slice(0,-4)}-${number.slice(-4)}`:number}`:digits});

if(!configured){
  $('#service').innerHTML='<option value="">Pedidos online indisponíveis</option>';
  showFallback();
}else{
  try{
    const [catalog,settings]=await Promise.all([rest('services','select=id,slug,name,category,description,price,duration_minutes&active=eq.true&order=sort_order.asc'),rest('company_settings','select=whatsapp').catch(()=>[])]);
    services=catalog||[];
    whatsapp=(settings?.[0]?.whatsapp||whatsapp).replace(/\D/g,'');updateWhatsAppLinks();
    $('#service').innerHTML='<option value="">Selecione um serviço</option>'+groups.map(group=>{
      const items=services.filter(item=>item.category===group);
      return items.length?`<optgroup label="${esc(group)}">${items.map(item=>`<option value="${esc(item.id)}">${esc(item.name)}</option>`).join('')}</optgroup>`:'';
    }).join('');
    if(preset){const item=services.find(x=>x.id===preset||x.slug===preset);if(item){$('#service').value=item.id;updateService()}}
    if(!services.length)showFallback();
  }catch{ $('#service').innerHTML='<option value="">Não foi possível carregar os serviços</option>';showFallback() }
}

$('#booking-form').addEventListener('submit',async event=>{
  event.preventDefault();
  const item=service(),date=$('#date').value,period=$('#period').value,name=$('#name').value.trim(),phone=$('#phone').value.replace(/\D/g,''),address=$('#address').value.trim();
  if(!item||!date||!$('#date').checkValidity()||!periodNames[period]){notice('Confira o serviço, a data e o período de preferência.');return}
  if(name.length<3){notice('Informe seu nome.');$('#name').focus();return}
  if(phone.length<10||phone.length>11){notice('Informe um WhatsApp válido com DDD.');$('#phone').focus();return}
  if(address.length<10){notice('Informe rua, número, bairro e cidade.');$('#address').focus();return}
  if(!$('#consent').checked){notice('Autorize o uso dos dados para registrar o pedido.');$('#consent').focus();return}
  const button=$('#submit-booking');button.disabled=true;button.textContent='Enviando pedido...';
  try{
    await rpc('request_appointment',{p_service_id:item.id,p_date:date,p_period:period,p_name:name,p_phone:phone,p_address:address,p_notes:$('#notes').value.trim(),p_consent:true,p_whatsapp_opt_in:$('#whatsapp-opt-in').checked});
    const message=`Olá! Enviei um pedido de atendimento na Prime Lava Car JP. Nome: ${name}. Serviço: ${item.name}. Preferência: ${dateBR(date)}, ${periodNames[period]}. Endereço: ${address}.`;
    $('#booking-form').innerHTML=`<div class="eyebrow">Pedido enviado</div><h2 style="margin-top:17px">Recebemos sua solicitação.</h2><p>Registramos seu pedido de <strong>${esc(item.name)}</strong> para <strong>${esc(dateBR(date))}, ${esc(periodNames[period])}</strong>. A equipe entrará em contato para combinar disponibilidade, duração e valor.</p><div class="notice success">A data e o período ainda precisam ser confirmados pela equipe.</div><a class="btn btn-red" href="${waUrl(message)}" target="_blank" rel="noopener" style="margin-top:20px">Falar no WhatsApp ↗</a>`;
  }catch(error){notice(error.message)}
  finally{button.disabled=false;button.innerHTML='Enviar pedido <span class="arrow">↗</span>'}
});
