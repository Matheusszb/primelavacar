import {mkdir,readFile,writeFile} from 'node:fs/promises';
import {fileURLToPath} from 'node:url';
import {dirname,join} from 'node:path';

const siteRoot=join(dirname(fileURLToPath(import.meta.url)),'..');
const dist=join(siteRoot,'dist');
const origin='https://prime-lava-car-jp-2026.mtsartslogotipo.chatgpt.site';
const services=JSON.parse(await readFile(join(siteRoot,'data','services.json'),'utf8'));
const landing={slug:'lavagem-automotiva',name:'Lavagem automotiva',category:'Lavagem',description:'Lavagem de carro a domicílio em João Pessoa. Conheça as opções da Prime Lava Car JP e escolha o cuidado para seu veículo.',benefits:['Atendimento no endereço combinado','Opções de lavagem para diferentes necessidades'],image:'jeep.jpg',question:'O que preciso disponibilizar para a lavagem?',answer:'Uma torneira de água e um ponto de energia elétrica no endereço do atendimento.'};
const esc=value=>String(value??'').replace(/[&<>"']/g,char=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[char]));
const money=value=>Number(value).toLocaleString('pt-BR',{style:'currency',currency:'BRL'});

function servicePage(service){
  const url=`${origin}/servicos/${service.slug}/`;
  const book=service.slug==='lavagem-automotiva'?'/agendar/':`/agendar/?servico=${encodeURIComponent(service.slug)}`;
  const title=`${service.name} em João Pessoa | Prime Lava Car JP`;
  const imageAlt=service.image.includes('logo')?'Logo Prime Lava Car JP':service.image.startsWith('antes-depois/')?`Comparativo ilustrativo antes e depois: ${service.name}`:'Veículo atendido pela Prime Lava Car JP';
  const schema=JSON.stringify({'@context':'https://schema.org','@graph':[
    {'@type':'Service',name:service.name,description:service.description,provider:{'@type':'AutoWash',name:'Prime Lava Car JP',telephone:'+55 83 98620-1295',address:{'@type':'PostalAddress',streetAddress:'Avenida Cidade de Nova Floresta, 251',addressLocality:'João Pessoa',addressRegion:'PB',postalCode:'58083-576',addressCountry:'BR'}},areaServed:{'@type':'City',name:'João Pessoa'}},
    {'@type':'BreadcrumbList',itemListElement:[{'@type':'ListItem',position:1,name:'Início',item:`${origin}/`},{'@type':'ListItem',position:2,name:'Serviços',item:`${origin}/#servicos`},{'@type':'ListItem',position:3,name:service.name,item:url}]}
  ]});
  return `<!doctype html><html lang="pt-BR"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="theme-color" content="#0a0b0d"><title>${esc(title)}</title><meta name="description" content="${esc(service.description)}"><link rel="canonical" href="${url}"><meta property="og:type" content="website"><meta property="og:title" content="${esc(title)}"><meta property="og:description" content="${esc(service.description)}"><meta property="og:image" content="${origin}/assets/${service.image}"><link rel="icon" href="/assets/logo-prime-small.png"><link rel="stylesheet" href="/styles.css"><script type="application/ld+json">${schema}</script></head><body>
  <header class="header"><div class="container nav"><a class="brand" href="/"><img src="/assets/logo-prime-small.png" alt="Logo Prime Lava Car JP"><span>PRIME LAVA CAR<small>Estética automotiva · JP</small></span></a><nav class="navlinks" id="navlinks" aria-label="Navegação"><a href="/">Início</a><a href="/#servicos">Serviços</a><a href="/agendar/">Pedir atendimento</a><a href="/#contato">Contato</a></nav><div class="nav-actions"><a class="btn btn-red btn-small" href="/agendar/">Pedir atendimento ↗</a><button class="menu-btn" id="menu-btn" aria-label="Abrir menu" aria-expanded="false">☰</button></div></div></header>
  <main><div class="page-hero" style="background:linear-gradient(90deg,#0b0c0ef7,#0b0c0ea8),url('/assets/${service.image}') center/cover"><div class="container"><div class="breadcrumb"><a href="/">Início</a> / <a href="/#servicos">Serviços</a> / ${esc(service.name)}</div><h1>${esc(service.name)} em João Pessoa.</h1><p>${esc(service.description)}</p><a class="btn btn-red" href="${book}">Escolher este serviço ↗</a></div></div>
  <section class="section cream"><div class="container intro-grid"><div><div class="eyebrow">${esc(service.category)}</div><h2>O que você precisa saber</h2><p style="line-height:1.85;color:#62666b">${esc(service.description)}</p>${service.price!=null?`<p class="service-page-price">${money(service.price)}${service.priceNote?` <small>(${esc(service.priceNote)})</small>`:''}</p>`:''}<p style="line-height:1.85;color:#62666b">Atendemos a domicílio em João Pessoa e região, conforme disponibilidade. Precisamos apenas de uma torneira de água e de energia elétrica no local.</p><p style="line-height:1.85;color:#62666b">Informe o dia e período de preferência; a equipe confirma a disponibilidade e a duração com você.</p><a class="btn btn-dark" href="${book}">Pedir atendimento ↗</a></div><img src="/assets/${service.image}" alt="${imageAlt}" style="width:100%;height:480px;object-fit:cover;border-radius:8px" loading="lazy"></div></section>
  <section class="section"><div class="container"><div class="eyebrow">${service.price!=null?'Itens incluídos':'Benefícios'}</div><h2 style="margin:14px 0 35px">Cuidado para cada detalhe.</h2><div class="service-includes">${service.benefits.map(benefit=>`<div>✓ ${esc(benefit)}</div>`).join('')}</div></div></section>
  <section class="section cream"><div class="container faq-grid"><div><div class="eyebrow">Dúvida frequente</div><h2>Antes de agendar</h2><p>Se preferir, fale diretamente com a equipe.</p></div><div class="faq"><details open><summary>${esc(service.question)}</summary><p>${esc(service.answer)}</p></details><details><summary>Como peço atendimento?</summary><p>Escolha o serviço, indique um dia e período de preferência e informe seu contato. A equipe confirma os detalhes com você.</p></details></div></div></section>
  <section class="cta"><div class="container"><div><h2>Vamos cuidar do seu veículo?</h2><p>Peça atendimento ou tire sua dúvida pelo WhatsApp.</p></div><a class="btn" href="${book}">Pedir atendimento ↗</a></div></section></main>
  <footer class="footer"><div class="container footer-bottom" style="margin-top:0"><span>© Prime Lava Car JP · João Pessoa, PB</span><a href="/">Voltar ao início</a></div></footer><a class="whatsapp-float" href="https://wa.me/5583986201295" target="_blank" rel="noopener" aria-label="Conversar no WhatsApp">✆</a><div class="mobile-book"><a href="/agendar/" class="btn btn-red">Pedir atendimento ↗</a></div><script type="module" src="/js/public.js"></script></body></html>`;
}

for(const service of [landing,...services]){
  const dir=join(dist,'servicos',service.slug);
  await mkdir(dir,{recursive:true});
  await writeFile(join(dir,'index.html'),servicePage(service),'utf8');
}

const grouped=[['Lavagem','Para carros e motocicletas.'],['Interior','Limpeza e cuidado da parte interna do veículo.'],['Detalhes e acabamento','Para pintura, vidros, faróis e peças externas.']];
const catalog=grouped.map(([category,intro])=>`<div class="service-group"><div class="service-group-head"><div><span class="eyebrow">${esc(category)}</span><h3>${esc(category)}</h3></div><p>${esc(intro)}</p></div><div class="service-grid">${services.filter(s=>s.category===category).map((s,index)=>`<article class="service-card"><div class="service-img"><img src="/assets/${s.image}" alt="${s.image.includes('logo')?'Logo Prime Lava Car JP':s.image.startsWith('antes-depois/')?`Comparativo ilustrativo antes e depois: ${esc(s.name)}`:'Veículo atendido pela Prime Lava Car JP'}" ${s.image.startsWith('antes-depois/')?'class="comparison-image"':''} loading="lazy"><span class="service-no">${String(index+1).padStart(2,'0')}</span></div><div class="service-body"><h3><a class="service-title-link" href="/servicos/${s.slug}/">${esc(s.name)}</a></h3><p>${esc(s.description)}</p><div class="service-meta"><span>Duração a confirmar</span><span>${s.price!=null?`${money(s.price)}${s.priceNote?` (${esc(s.priceNote)})`:''}`:'Valor sob consulta'}</span></div><a href="/agendar/?servico=${encodeURIComponent(s.slug)}">Pedir atendimento <span>↗</span></a></div></article>`).join('')}</div></div>`).join('');
const homePath=join(dist,'index.html');
const home=await readFile(homePath,'utf8');
if(!home.includes('<!-- CATALOG_START -->')||!home.includes('<!-- CATALOG_END -->'))throw new Error('Marcadores do catálogo ausentes na página inicial.');
await writeFile(homePath,home.replace(/<!-- CATALOG_START -->[\s\S]*?<!-- CATALOG_END -->/,`<!-- CATALOG_START -->${catalog}<!-- CATALOG_END -->`),'utf8');

const urls=['/','/agendar/',...([landing,...services].map(s=>`/servicos/${s.slug}/`))];
await writeFile(join(dist,'sitemap.xml'),`<?xml version="1.0" encoding="UTF-8"?><urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">${urls.map(path=>`<url><loc>${origin}${path}</loc></url>`).join('')}</urlset>`,'utf8');
await writeFile(join(dist,'robots.txt'),`User-agent: *\nAllow: /\nDisallow: /admin/\nSitemap: ${origin}/sitemap.xml\n`,'utf8');
