import {insert,esc,brl,dateBR,localISO} from './api.js';

const $=selector=>document.querySelector(selector);
let context;

function addItem(name='',quantity=1,unitPrice=''){
  const row=document.createElement('div');
  row.className='quote-item';
  row.innerHTML=`<input class="quote-item-name" list="quote-services" aria-label="Serviço" placeholder="Nome do serviço" maxlength="120" required value="${esc(name)}"><input class="quote-item-qty" type="number" aria-label="Quantidade" min="1" max="100" step="1" value="${quantity}" required><input class="quote-item-price" type="number" aria-label="Valor unitário em reais" min="0" step="0.01" placeholder="Valor (R$)" required value="${unitPrice}"><button type="button" class="quote-remove" aria-label="Remover serviço">Remover</button>`;
  $('#quote-items').append(row);
  updateTotal();
}
function itemsFromForm(){
  return [...document.querySelectorAll('.quote-item')].map(row=>({
    name:row.querySelector('.quote-item-name').value.trim(),
    quantity:Number(row.querySelector('.quote-item-qty').value),
    unit_price:Number(row.querySelector('.quote-item-price').value)
  }));
}
function totalOf(items){return Math.round(items.reduce((sum,item)=>sum+item.quantity*item.unit_price,0)*100)/100}
function updateTotal(){$('#quote-total').textContent=brl(totalOf(itemsFromForm()))}
function quoteNumber(value){return `#${String(value).padStart(6,'0')}`}

function openPdf(quote,windowRef){
  const win=windowRef||window.open('','_blank');
  if(!win)return false;
  const company=context.settings()||{};
  const logo=new URL('/assets/logo-prime-small.png',location.origin).href;
  const rows=quote.items.map(item=>`<tr><td>${esc(item.name)}</td><td class="number">${item.quantity}</td><td class="number">${brl(item.unit_price)}</td><td class="number">${brl(item.quantity*item.unit_price)}</td></tr>`).join('');
  const phone=quote.customer_phone?`<span>WhatsApp: ${esc(quote.customer_phone)}</span>`:'';
  const vehicle=quote.vehicle?`<span>Veículo: ${esc(quote.vehicle)}</span>`:'';
  const valid=quote.valid_until?`<span>Válido até: ${dateBR(quote.valid_until)}</span>`:'';
  const notes=quote.notes?`<section class="notes"><h2>Observações</h2><p>${esc(quote.notes).replace(/\n/g,'<br>')}</p></section>`:'';
  win.document.open();
  win.document.write(`<!doctype html><html lang="pt-BR"><head><meta charset="utf-8"><title>Orçamento ${quoteNumber(quote.quote_number)} · Prime Lava Car JP</title><style>@page{size:A4;margin:18mm}*{box-sizing:border-box}body{font:13px Arial,sans-serif;color:#1e2328;margin:0;background:#eef0f2}.sheet{width:210mm;min-height:297mm;margin:20px auto;background:#fff;padding:18mm;box-shadow:0 8px 30px #0002}.toolbar{text-align:right;padding:12px 20px}.toolbar button{background:#c9232a;color:#fff;border:0;border-radius:5px;padding:11px 17px;font-weight:bold;cursor:pointer}.brand{display:flex;align-items:center;gap:13px;border-bottom:3px solid #c9232a;padding-bottom:19px}.brand img{width:63px;height:63px;object-fit:cover;border-radius:5px}.brand strong{display:block;font-size:20px;letter-spacing:.03em}.brand span{color:#626971;font-size:11px}.title{display:flex;justify-content:space-between;align-items:end;gap:20px;margin:30px 0}.title h1{font-size:30px;margin:0}.title p{margin:5px 0 0;color:#737980}.number-block{text-align:right}.number-block b{font-size:17px}.customer{background:#f4f5f6;border-radius:5px;padding:18px;margin-bottom:29px}.customer h2,.notes h2{font-size:12px;text-transform:uppercase;letter-spacing:.11em;color:#b52128;margin:0 0 10px}.customer strong{display:block;font-size:17px;margin-bottom:8px}.customer span{display:block;line-height:1.7}table{width:100%;border-collapse:collapse}th{text-align:left;background:#242930;color:#fff;padding:12px 9px;font-size:11px}td{padding:13px 9px;border-bottom:1px solid #e4e6e8;vertical-align:top}.number{text-align:right;white-space:nowrap}.total{display:flex;justify-content:space-between;margin:25px 0 36px;padding:17px 0;border-top:2px solid #242930;border-bottom:2px solid #242930;font-size:18px;font-weight:bold}.notes{margin-top:20px}.notes p{line-height:1.6;white-space:normal}.foot{margin-top:45px;border-top:1px solid #d8dade;padding-top:14px;color:#6b7077;font-size:11px;line-height:1.6}@media print{body{background:#fff}.toolbar{display:none}.sheet{width:auto;min-height:0;margin:0;padding:0;box-shadow:none}}</style></head><body><div class="toolbar"><button onclick="window.print()">Salvar como PDF / Imprimir</button></div><main class="sheet"><header class="brand"><img src="${logo}" alt="Prime Lava Car JP"><div><strong>${esc(company.name||'Prime Lava Car JP')}</strong><span>Estética automotiva a domicílio · João Pessoa, PB</span></div></header><div class="title"><div><h1>Orçamento</h1><p>Serviços para seu veículo</p></div><div class="number-block"><b>${quoteNumber(quote.quote_number)}</b><p>Emitido em ${dateBR(quote.issued_on)}</p></div></div><section class="customer"><h2>Cliente</h2><strong>${esc(quote.customer_name)}</strong>${phone}${vehicle}${valid}</section><table><thead><tr><th>Serviço</th><th class="number">Qtd.</th><th class="number">Valor unit.</th><th class="number">Subtotal</th></tr></thead><tbody>${rows}</tbody></table><div class="total"><span>Total do orçamento</span><strong>${brl(quote.total)}</strong></div>${notes}<footer class="foot">${esc(company.name||'Prime Lava Car JP')} · ${esc(company.whatsapp||'5583986201295')}<br>Este orçamento não reserva um horário de atendimento.</footer></main></body></html>`);
  win.document.close();
  win.focus();
  setTimeout(()=>win.print(),700);
  return true;
}

export function renderQuotes(){
  if(!context)return;
  $('#quote-services').innerHTML=context.services().filter(service=>service.active).map(service=>`<option value="${esc(service.name)}"></option>`).join('');
  const quotes=context.quotes();
  $('#quotes-body').innerHTML=quotes.length?quotes.map(quote=>`<tr><td><b>${quoteNumber(quote.quote_number)}</b></td><td>${dateBR(quote.issued_on)}</td><td>${esc(quote.customer_name)}</td><td>${esc(quote.vehicle||'—')}</td><td>${brl(quote.total)}</td><td><button type="button" data-quote-pdf="${esc(quote.id)}">Abrir PDF</button></td></tr>`).join(''):'<tr><td colspan="6" class="empty">Nenhum orçamento salvo.</td></tr>';
  document.querySelectorAll('[data-quote-pdf]').forEach(button=>button.addEventListener('click',()=>{const quote=quotes.find(x=>x.id===button.dataset.quotePdf);if(quote)openPdf(quote)}));
}

export function initQuotes(options){
  context=options;
  const valid=new Date();valid.setDate(valid.getDate()+14);$('#quote-valid').min=localISO();$('#quote-valid').value=localISO(valid);
  addItem();
  $('#quote-add-item').addEventListener('click',()=>addItem());
  $('#quote-items').addEventListener('input',updateTotal);
  $('#quote-items').addEventListener('click',event=>{if(!event.target.closest('.quote-remove'))return;event.target.closest('.quote-item').remove();if(!document.querySelector('.quote-item'))addItem();updateTotal()});
  $('#quote-form').addEventListener('submit',async event=>{
    event.preventDefault();
    const items=itemsFromForm();
    if(!items.length||items.some(item=>!item.name||!Number.isInteger(item.quantity)||item.quantity<1||item.quantity>100||!Number.isFinite(item.unit_price)||item.unit_price<0)){context.notify('Confira serviços, quantidades e valores.',true);return}
    const phone=$('#quote-phone').value.replace(/\D/g,'');
    if(phone&&!(phone.length===10||phone.length===11)){context.notify('Informe um WhatsApp válido com DDD ou deixe o campo vazio.',true);return}
    const body={customer_name:$('#quote-customer').value.trim(),customer_phone:phone||null,vehicle:$('#quote-vehicle').value.trim()||null,issued_on:localISO(),valid_until:$('#quote-valid').value||null,items,total:totalOf(items),notes:$('#quote-notes').value.trim()||null};
    const windowRef=window.open('','_blank');
    if(windowRef){windowRef.document.write('<!doctype html><html lang="pt-BR"><meta charset="utf-8"><title>Preparando orçamento</title><body style="font:16px Arial;padding:32px">Preparando orçamento...</body></html>');windowRef.document.close()}
    const button=event.submitter;button.disabled=true;button.textContent='Salvando...';
    try{
      const saved=(await insert('quotes',body))[0];
      const opened=openPdf(saved,windowRef);
      event.target.reset();$('#quote-items').innerHTML='';addItem();$('#quote-valid').value=localISO(valid);
      context.notify(opened?`Orçamento ${quoteNumber(saved.quote_number)} salvo. Use “Salvar como PDF” na janela aberta.`:`Orçamento ${quoteNumber(saved.quote_number)} salvo. Permita pop-ups e use “Abrir PDF” no histórico.`,!opened);
      await context.reload();
    }catch(error){windowRef?.close();context.notify(error.message,true)}
    finally{button.disabled=false;button.textContent='Salvar e abrir PDF'}
  });
}
