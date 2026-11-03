import {readFile,writeFile} from 'node:fs/promises';
import {join,dirname} from 'node:path';
import {fileURLToPath} from 'node:url';

const root=join(dirname(fileURLToPath(import.meta.url)),'..');
const services=JSON.parse(await readFile(join(root,'data','services.json'),'utf8'));
const schema=await readFile(join(root,'supabase','schema.sql'),'utf8');
const slotsFunction=schema.match(/create or replace function public\.available_slots[\s\S]*?end;\$\$;/)?.[0];
if(!slotsFunction)throw new Error('Função available_slots não encontrada em schema.sql.');
const q=value=>`'${String(value).replaceAll("'","''")}'`;
const rows=services.map((service,index)=>`(${q(service.slug)},${q(service.name)},${q(service.category)},${q(service.description)},array[${service.benefits.map(q).join(',')}],null,${service.price??'null'},${q(`/assets/${service.image}`)},${index+1},true)`).join(',\n');
const sql=`-- Execute no SQL Editor após schema.sql (projeto novo) ou isoladamente (projeto existente).\n-- Atualiza somente o catálogo e os horários; preserva pedidos e agendamentos.\nbegin;\ninsert into public.services(slug,name,category,description,benefits,duration_minutes,price,image_url,sort_order,active) values\n${rows}\non conflict(slug) do update set name=excluded.name,category=excluded.category,description=excluded.description,benefits=excluded.benefits,price=excluded.price,image_url=excluded.image_url,sort_order=excluded.sort_order,active=true,updated_at=now();\ninsert into public.business_hours(weekday,is_open,start_time,end_time) values\n(0,false,'08:00','17:00'),(1,true,'08:00','17:00'),(2,true,'08:00','17:00'),(3,true,'08:00','17:00'),(4,true,'08:00','17:00'),(5,true,'08:00','17:00'),(6,true,'08:00','17:00')\non conflict(weekday) do update set is_open=excluded.is_open,start_time=excluded.start_time,end_time=excluded.end_time;\n${slotsFunction}\ncommit;\n`;
await writeFile(join(root,'supabase','catalog-update.sql'),sql,'utf8');
console.log('supabase/catalog-update.sql atualizado.');
