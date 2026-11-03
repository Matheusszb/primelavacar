import {readFile,writeFile,readdir} from 'node:fs/promises';
import {join,dirname} from 'node:path';
import {fileURLToPath} from 'node:url';

const root=join(dirname(fileURLToPath(import.meta.url)),'..');
const dist=join(root,'dist');
const previousOrigin='https://prime-lava-car-jp-2026.mtsartslogotipo.chatgpt.site';
const siteUrl='https://www.primelavacarjp.com.br';
const supabaseUrl=(process.env.SUPABASE_URL || '').replace(/\/$/,'');
const anonKey=process.env.SUPABASE_ANON_KEY || '';

if(supabaseUrl && !/^https:\/\/[a-z0-9-]+\.supabase\.co$/.test(supabaseUrl)){
  throw new Error('SUPABASE_URL precisa ser a URL HTTPS do projeto Supabase.');
}
if(/service_role|sb_secret_/i.test(anonKey)){
  throw new Error('Use apenas a chave pública do Supabase em SUPABASE_ANON_KEY.');
}

await import('./generate-pages.mjs');
await writeFile(join(dist,'js','config.js'),`// Gerado no build. Apenas valores públicos.\nexport const SUPABASE_URL = ${JSON.stringify(supabaseUrl)};\nexport const SUPABASE_ANON_KEY = ${JSON.stringify(anonKey)};\n`);

async function rewrite(dir){
  for(const entry of await readdir(dir,{withFileTypes:true})){
    const path=join(dir,entry.name);
    if(entry.isDirectory())await rewrite(path);
    else if(/\.(html|xml|txt)$/.test(entry.name)){
      const content=await readFile(path,'utf8');
      await writeFile(path,content.replaceAll(previousOrigin,siteUrl),'utf8');
    }
  }
}
await rewrite(dist);
await import('./seo.mjs');
console.log(`Build pronto para ${siteUrl}. Supabase ${supabaseUrl?'configurado':'pendente'}.`);
