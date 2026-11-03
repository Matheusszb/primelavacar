import {configured,rest,rpc,esc,brl,dateBR,localISO} from './api.js';

const $=selector=>document.querySelector(selector);
const preset=new URLSearchParams(location.search).get('servico');
const groups=['Lavagem automotiva','Estética automotiva','Lavagem de motocicletas'];
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
  $('#summary-when').textContent=$('#date').value&&period?`${dateBR($('#date').value)} · ${period}${isSaturday()&&$('#saturday-time').value?` · ${$('#saturday-time').value}`:''}`:'—';
  $('#summary-price').textContent=item?.price!=null?brl(item.price):'Sob consulta';
}
function weekday(){const value=$('#date').value;if(!/^\d{4}-\d{2}-\d{2}$/.test(value))return null;const [year,month,day]=value.split('-').map(Number);const date=new Date(year,month-1,day);return date.getFullYear()===year&&date.getMonth()===month-1&&date.getDate()===day?date.getDay():null}
function isSaturday(){return weekday()===6}
function updateDateOptions(){
  const saturday=isSaturday();
  $('#saturday-time-field').classList.toggle('hidden',!saturday);
  $('#saturday-time').required=saturday;
  if(!saturday)$('#saturday-time').value='';
  const period=$('#period');
  period.querySelector('[value="sem_preferencia"]').disabled=saturday;
  if(saturday&&period.value==='sem_preferencia')period.value='';
  updateSummary();
}

$('#service').addEventListener('change',()=>{clearNotice();updateService()});
$('#date').addEventListener('change',updateDateOptions);
$('#period').addEventListener('change',()=>{if(isSaturday()){const time=$('#saturday-time');if($('#period').value==='manha'&&!['08:00','10:00'].includes(time.value))time.value='';if($('#period').value==='tarde'&&!['14:00','16:00'].includes(time.value))time.value=''}updateSummary()});
$('#saturday-time').addEventListener('change',()=>{const time=$('#saturday-time').value;if(time)$('#period').value=time<'12:00'?'manha':'tarde';updateSummary()});
$('#next-service').addEventListener('click',()=>{if(!service()){notice('Escolha um serviço para continuar.');$('#service').focus();return}step(2)});
$('#next-date').addEventListener('click',()=>{const date=$('#date'),day=weekday(),time=$('#saturday-time').value,period=$('#period').value;if(!date.value||!date.checkValidity()||day===null||day===0||!periodNames[period]||(day===6&&(!time||(time<'12:00'?'manha':'tarde')!==period))){notice(day===0?'Não atendemos aos domingos. Escolha outro dia.':day===6?'Escolha um dos horários disponíveis no sábado.':'Escolha uma data e um período de preferência.');(day===6?$('#saturday-time'):date.value&&day!==0?$('#period'):date).focus();return}updateSummary();step(3)});
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
  const item=service(),date=$('#date').value,period=$('#period').value,time=$('#saturday-time').value,name=$('#name').value.trim(),phone=$('#phone').value.replace(/\D/g,''),address=$('#address').value.trim();
  if(!item||!date||!$('#date').checkValidity()||weekday()===null||weekday()===0||!periodNames[period]||(isSaturday()&&(!time||(time<'12:00'?'manha':'tarde')!==period))){notice('Confira o serviço, a data e o horário de preferência.');return}
  if(name.length<3){notice('Informe seu nome.');$('#name').focus();return}
  if(phone.length<10||phone.length>11){notice('Informe um WhatsApp válido com DDD.');$('#phone').focus();return}
  if(address.length<10){notice('Informe rua, número, bairro e cidade.');$('#address').focus();return}
  if(!$('#consent').checked){notice('Autorize o uso dos dados para registrar o pedido.');$('#consent').focus();return}
  const button=$('#submit-booking');button.disabled=true;button.textContent='Enviando pedido...';
  try{
    const preference=`${dateBR(date)}, ${periodNames[period]}${isSaturday()?` às ${time}`:''}`;
    const notes=`${isSaturday()?`Horário preferido no sábado: ${time}. `:''}${$('#notes').value.trim()}`.trim().slice(0,1000);
    await rpc('request_appointment',{p_service_id:item.id,p_date:date,p_period:period,p_name:name,p_phone:phone,p_address:address,p_notes:notes,p_consent:true,p_whatsapp_opt_in:false});
    const message=`Olá! Enviei um pedido de atendimento na Prime Lava Car JP. Nome: ${name}. Serviço: ${item.name}. Preferência: ${preference}. Endereço: ${address}.`;
    $('#booking-form').innerHTML=`<div class="eyebrow">Pedido enviado</div><h2 style="margin-top:17px">Recebemos sua solicitação.</h2><p>Registramos seu pedido de <strong>${esc(item.name)}</strong> para <strong>${esc(preference)}</strong>. A equipe entrará em contato para confirmar a disponibilidade e a duração.</p><div class="notice success">A preferência ainda precisa ser confirmada pela equipe.</div><a class="btn btn-red" href="${waUrl(message)}" target="_blank" rel="noopener" style="margin-top:20px">Falar no WhatsApp ↗</a>`;
  }catch(error){notice(error.message)}
  finally{button.disabled=false;button.innerHTML='Enviar pedido <span class="arrow">↗</span>'}
});
