import assert from 'node:assert/strict';
import {access,readFile} from 'node:fs/promises';
import {dirname,join} from 'node:path';
import {fileURLToPath} from 'node:url';

const root=join(dirname(fileURLToPath(import.meta.url)),'..');
const dist=join(root,'dist');
const origin='https://www.primelavacarjp.com.br';
const services=JSON.parse(await readFile(join(root,'data','services.json'),'utf8'));
const paths=['/', '/servicos/lavagem-automotiva/', ...services.map(service=>`/servicos/${service.slug}/`)];
const read=path=>readFile(join(dist,...path.split('/').filter(Boolean),'index.html'),'utf8');

for(const path of paths){
  const page=await read(path);
  const url=`${origin}${path}`;
  assert.match(page,new RegExp(`<link rel="canonical" href="${url.replace(/[.*+?^${}()|[\]\\]/g,'\\$&')}">`));
  assert.equal((page.match(/<meta name="description"/g)||[]).length,1,`Descrição: ${path}`);
  assert.equal((page.match(/<script type="application\/ld\+json">/g)||[]).length,1,`JSON-LD: ${path}`);
  const schema=JSON.parse(page.match(/<script type="application\/ld\+json">([^<]+)<\/script>/)?.[1]||'null');
  assert.equal(schema['@graph']?.some(node=>node['@type']==='AutoWash'),true,`Empresa: ${path}`);
  if(path.startsWith('/servicos/'))assert.equal(schema['@graph']?.some(node=>node['@type']==='Service'),true,`Serviço: ${path}`);
  assert.doesNotMatch(page,/prime-lava-car-jp-2026\.mtsartslogotipo\.chatgpt\.site|<meta name="robots" content="noindex/,`Indexação: ${path}`);
}

const booking=await read('/agendar/');
assert.match(booking,/<meta name="robots" content="noindex,follow">/);
const admin=await read('/admin/');
assert.match(admin,/<meta name="robots" content="noindex,nofollow">/);
const home=await read('/');
assert.match(home,/<meta name="google-site-verification" content="ypDmqtU1j7EbdnDYrfbWVgIP3rSGgAknXqT9yAom1ZU">/);

const index=await readFile(join(dist,'sitemap.xml'),'utf8');
for(const file of ['sitemap-pages.xml','sitemap-images.xml']){
  assert.match(index,new RegExp(`${origin}/${file}`));
}
const pages=await readFile(join(dist,'sitemap-pages.xml'),'utf8');
const images=await readFile(join(dist,'sitemap-images.xml'),'utf8');
for(const path of paths){
  assert.match(pages,new RegExp(`<loc>${origin}${path}</loc>`));
  assert.match(images,new RegExp(`<loc>${origin}${path}</loc>`));
}
assert.equal((pages.match(/<url>/g)||[]).length,paths.length);
assert.equal((images.match(/<image:image>/g)||[]).length,paths.length);
assert.doesNotMatch(pages,/\/agendar\/|\/admin\/|vercel\.app|chatgpt\.site/);
for(const image of images.matchAll(/<image:loc>https:\/\/www\.primelavacarjp\.com\.br(\/assets\/[^<]+)<\/image:loc>/g)){
  await access(join(dist,...image[1].split('/').filter(Boolean)));
}
const robots=await readFile(join(dist,'robots.txt'),'utf8');
assert.match(robots,new RegExp(`Sitemap: ${origin}/sitemap\\.xml`));
assert.match(robots,/Disallow: \/admin\//);
console.log(`SEO válido: ${paths.length} páginas e ${paths.length} imagens nos sitemaps.`);
