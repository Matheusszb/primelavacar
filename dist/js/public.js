import {configured,rest,defaults,esc} from './api.js';
const safeUrl=(value,fallback='')=>{try{const u=new URL(value,location.origin);return ['https:','http:'].includes(u.protocol)?u.href:fallback}catch{return fallback}};
const menu=document.querySelector('#menu-btn'),links=document.querySelector('#navlinks');
menu?.addEventListener('click',()=>{const open=links.classList.toggle('open');menu.setAttribute('aria-expanded',String(open))});
links?.querySelectorAll('a').forEach(a=>a.addEventListener('click',()=>links.classList.remove('open')));
if(document.querySelector('#year'))document.querySelector('#year').textContent=new Date().getFullYear();
const observer=new IntersectionObserver(entries=>entries.forEach(e=>{if(e.isIntersecting){e.target.classList.add('visible');observer.unobserve(e.target)}}),{threshold:.08});
document.querySelectorAll('.reveal').forEach(el=>observer.observe(el));
if(configured){
  try{
    const [settings,hours,services,testimonials]=await Promise.all([
      rest('company_settings','select=*'),
      rest('business_hours','select=*&order=weekday.asc'),
      rest('services','select=*&active=eq.true&order=sort_order.asc'),
      rest('testimonials','select=*&published=eq.true&order=created_at.desc')
    ]);
    const s=settings?.[0]||defaults;
    if(s.whatsapp)document.querySelectorAll('a[href^="https://wa.me/"]').forEach(a=>a.href=`https://wa.me/${s.whatsapp.replace(/\D/g,'')}`);
    if(s.instagram){const a=document.querySelector('a[href*="instagram.com"]');if(a)a.href=safeUrl(s.instagram,a.href)}
    if(s.logo_url)document.querySelectorAll('.brand img').forEach(img=>img.src=safeUrl(s.logo_url,img.src));
    const about=document.querySelector('#about-text');if(about&&s.about)about.textContent=s.about;
    const address=document.querySelector('#contact-address');if(address&&s.address)address.textContent=s.address;
    const review=document.querySelector('#google-review-link');if(review&&s.review_url){const url=safeUrl(s.review_url);if(url){review.href=url;review.classList.remove('hidden')}}
    const h=hours?.filter(x=>x.is_open),hoursEl=document.querySelector('#public-hours');
    if(h?.length&&hoursEl){const names=['Dom','Seg','Ter','Qua','Qui','Sex','Sáb'];hoursEl.textContent=h.map(x=>`${names[x.weekday]} ${x.start_time.slice(0,5)}–${x.end_time.slice(0,5)}`).join(' · ')}
    const catalog=document.querySelector('#services-catalog');
    if(services?.length&&catalog){
      const categories=[['Lavagem','Para o cuidado de rotina do carro ou da moto.'],['Interior','Para cuidar das áreas de dentro do veículo.'],['Detalhes e acabamento','Para pintura, vidros, faróis e peças externas.']];
      catalog.innerHTML=categories.map(([category,intro])=>{
        const items=services.filter(x=>x.category===category);if(!items.length)return '';
        return `<div class="service-group"><div class="service-group-head"><div><span class="eyebrow">${esc(category)}</span><h3>${esc(category)}</h3></div><p>${esc(intro)}</p></div><div class="service-grid">${items.map((x,i)=>`<article class="service-card"><div class="service-img"><img src="${esc(safeUrl(x.image_url||'/assets/jeep.jpg'))}" alt="Veículo atendido pela Prime Lava Car JP" loading="lazy"><span class="service-no">${String(i+1).padStart(2,'0')}</span></div><div class="service-body"><h3>${esc(x.name)}</h3><p>${esc(x.description)}</p><div class="service-meta"><span>${x.duration_minutes?`${x.duration_minutes} min estimados`:'Duração a confirmar'}</span><span>${x.price!=null?Number(x.price).toLocaleString('pt-BR',{style:'currency',currency:'BRL'}):'Valor sob consulta'}</span></div><a href="/agendar/?servico=${encodeURIComponent(x.id)}">Pedir atendimento <span>↗</span></a></div></article>`).join('')}</div></div>`
      }).join('');
    }
    const reviews=document.querySelector('#testimonials-grid');if(reviews&&testimonials?.length){document.querySelector('#avaliacoes').classList.remove('hidden');reviews.innerHTML=testimonials.map(t=>`<article><p style="font-size:15px;line-height:1.7;color:#3b3e42">“${esc(t.quote)}”</p><h3 style="font-size:14px;margin:18px 0 0">${esc(t.customer_name)}</h3>${safeUrl(t.source_url)?`<a href="${esc(safeUrl(t.source_url))}" target="_blank" rel="noopener" style="font-size:11px;color:#ad2025">Ver origem ↗</a>`:''}</article>`).join('')}
  }catch(e){console.warn('Conteúdo público indisponível',e)}
}
