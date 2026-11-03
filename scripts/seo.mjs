import {readFile,writeFile} from 'node:fs/promises';
import {dirname,join} from 'node:path';
import {fileURLToPath} from 'node:url';

const root=join(dirname(fileURLToPath(import.meta.url)),'..');
const dist=join(root,'dist');
const origin='https://www.primelavacarjp.com.br';
const businessId=`${origin}/#empresa`;
const services=JSON.parse(await readFile(join(root,'data','services.json'),'utf8'));
const landing={
  slug:'lavagem-automotiva',
  name:'Lavagem automotiva',
  description:'Conheça as opções de lavagem de carro a domicílio em João Pessoa e escolha o cuidado para seu veículo.',
  image:'jeep.jpg'
};

const html=value=>String(value).replace(/[&<>"']/g,char=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[char]));
const xml=html;
const json=value=>JSON.stringify(value).replace(/</g,'\\u003c');
const absolute=path=>`${origin}${path}`;
const address={
  '@type':'PostalAddress',
  streetAddress:'Avenida Cidade de Nova Floresta, 251',
  addressLocality:'João Pessoa',
  addressRegion:'PB',
  postalCode:'58083-576',
  addressCountry:'BR'
};
const business={
  '@type':'AutoWash',
  '@id':businessId,
  name:'Prime Lava Car JP',
  url:absolute('/'),
  description:'Lavagem e estética automotiva a domicílio em João Pessoa, Paraíba.',
  telephone:'+55 83 98620-1295',
  image:absolute('/assets/jeep.jpg'),
  logo:absolute('/assets/logo-prime-small.png'),
  address,
  areaServed:{'@type':'City',name:'João Pessoa',address:{'@type':'PostalAddress',addressLocality:'João Pessoa',addressRegion:'PB',addressCountry:'BR'}},
  sameAs:['https://www.instagram.com/primelavacar.jp/'],
  openingHoursSpecification:[
    {'@type':'OpeningHoursSpecification',dayOfWeek:['Monday','Tuesday','Wednesday','Thursday','Friday'],opens:'08:00',closes:'11:00'},
    {'@type':'OpeningHoursSpecification',dayOfWeek:['Monday','Tuesday','Wednesday','Thursday','Friday'],opens:'14:00',closes:'17:00'},
    {'@type':'OpeningHoursSpecification',dayOfWeek:'Saturday',opens:'08:00',closes:'17:00'}
  ]
};

function head({title,description,path,image='jeep.jpg',graph,noindex=false,verification=false}){
  const url=absolute(path);
  const imageUrl=absolute(`/assets/${image}`);
  const tags=[
    '<meta charset="utf-8">',
    '<meta name="viewport" content="width=device-width,initial-scale=1">',
    verification?'<meta name="google-site-verification" content="ypDmqtU1j7EbdnDYrfbWVgIP3rSGgAknXqT9yAom1ZU">':null,
    '<meta name="theme-color" content="#0a0b0d">',
    noindex?'<meta name="robots" content="noindex,follow">':null,
    `<title>${html(title)}</title>`,
    `<meta name="description" content="${html(description)}">`,
    `<link rel="canonical" href="${url}">`,
    '<meta property="og:type" content="website">',
    '<meta property="og:locale" content="pt_BR">',
    '<meta property="og:site_name" content="Prime Lava Car JP">',
    `<meta property="og:url" content="${url}">`,
    `<meta property="og:title" content="${html(title)}">`,
    `<meta property="og:description" content="${html(description)}">`,
    `<meta property="og:image" content="${imageUrl}">`,
    `<meta property="og:image:alt" content="${html(`Prime Lava Car JP: ${title}`)}">`,
    '<meta name="twitter:card" content="summary_large_image">',
    '<link rel="icon" href="/assets/logo-prime-small.png">',
    '<link rel="stylesheet" href="/styles.css">',
    graph?`<script type="application/ld+json">${json({'@context':'https://schema.org','@graph':graph})}</script>`:null
  ];
  return `<head>${tags.filter(Boolean).join('')}</head>`;
}

async function replaceHead(path,metadata){
  const file=join(dist,...path.split('/').filter(Boolean),'index.html');
  const source=await readFile(file,'utf8');
  const matches=source.match(/<head>[\s\S]*?<\/head>/g);
  if(matches?.length!==1)throw new Error(`Head ausente ou duplicado: ${path}`);
  await writeFile(file,source.replace(matches[0],head(metadata)),'utf8');
}

const homeTitle='Lavagem Automotiva a Domicílio em João Pessoa | Prime Lava Car JP';
const homeDescription='Lavagem automotiva a domicílio em João Pessoa, PB. Conheça lavagem, polimento, vitrificação e restauração de faróis e peça atendimento.';
await replaceHead('/',{
  title:homeTitle,description:homeDescription,path:'/',verification:true,
  graph:[
    business,
    {'@type':'WebSite','@id':absolute('/#website'),url:absolute('/'),name:'Prime Lava Car JP',inLanguage:'pt-BR',publisher:{'@id':businessId}},
    {'@type':'WebPage','@id':absolute('/#webpage'),url:absolute('/'),name:homeTitle,description:homeDescription,inLanguage:'pt-BR',isPartOf:{'@id':absolute('/#website')},about:{'@id':businessId}}
  ]
});

for(const service of [landing,...services]){
  const path=`/servicos/${service.slug}/`;
  const title=`${service.name} em João Pessoa | Prime Lava Car JP`;
  const description=`${service.name} em João Pessoa, PB, com atendimento a domicílio. ${service.description}`;
  const url=absolute(path);
  const serviceNode={
    '@type':'Service','@id':`${url}#servico`,name:service.name,
    description:service.description,url,
    provider:{'@id':businessId},
    areaServed:{'@type':'City',name:'João Pessoa'}
  };
  if(service.price!=null)serviceNode.offers={'@type':'Offer',url,price:service.price,priceCurrency:'BRL'};
  await replaceHead(path,{
    title,description,path,image:service.image,
    graph:[
      business,
      serviceNode,
      {'@type':'WebPage','@id':`${url}#webpage`,url,name:title,description,inLanguage:'pt-BR',about:{'@id':`${url}#servico`}},
      {'@type':'BreadcrumbList','@id':`${url}#breadcrumb`,itemListElement:[
        {'@type':'ListItem',position:1,name:'Início',item:absolute('/')},
        {'@type':'ListItem',position:2,name:service.name,item:url}
      ]}
    ]
  });
}

await replaceHead('/agendar/',{
  title:'Pedir atendimento de estética automotiva | Prime Lava Car JP',
  description:'Escolha o serviço e indique o dia de preferência para pedir atendimento a domicílio em João Pessoa. A equipe confirma os detalhes com você.',
  path:'/agendar/',noindex:true
});

const pages=['/',...([landing,...services].map(service=>`/servicos/${service.slug}/`))];
const imagePages=[{path:'/',image:'jeep.jpg'},...([landing,...services].map(service=>({path:`/servicos/${service.slug}/`,image:service.image})))];
const declaration='<?xml version="1.0" encoding="UTF-8"?>\n';
await writeFile(join(dist,'sitemap.xml'),declaration+
  `<sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n`+
  ['sitemap-pages.xml','sitemap-images.xml'].map(name=>`  <sitemap><loc>${absolute(`/${name}`)}</loc></sitemap>`).join('\n')+
  '\n</sitemapindex>\n','utf8');
await writeFile(join(dist,'sitemap-pages.xml'),declaration+
  `<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n`+
  pages.map(path=>`  <url><loc>${xml(absolute(path))}</loc></url>`).join('\n')+
  '\n</urlset>\n','utf8');
await writeFile(join(dist,'sitemap-images.xml'),declaration+
  `<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:image="http://www.google.com/schemas/sitemap-image/1.1">\n`+
  imagePages.map(({path,image})=>`  <url><loc>${xml(absolute(path))}</loc><image:image><image:loc>${xml(absolute(`/assets/${image}`))}</image:loc></image:image></url>`).join('\n')+
  '\n</urlset>\n','utf8');
await writeFile(join(dist,'robots.txt'),`User-agent: *\nAllow: /\nDisallow: /admin/\nSitemap: ${absolute('/sitemap.xml')}\n`,'utf8');
