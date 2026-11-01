-- Execute no SQL Editor de um projeto Supabase novo.
-- Depois, crie um usuário em Authentication e cadastre seu UUID em admin_users.
create extension if not exists pgcrypto;

create table if not exists public.admin_users (
  id uuid primary key references auth.users(id) on delete cascade,
  created_at timestamptz not null default now()
);

create or replace function public.is_admin() returns boolean
language sql stable security definer set search_path = '' as $$
  select exists(select 1 from public.admin_users where id = auth.uid());
$$;

create table if not exists public.company_settings (
  id boolean primary key default true check (id),
  name text not null default 'Prime Lava Car JP',
  whatsapp text not null default '5583986201295',
  address text not null default 'Avenida Cidade de Nova Floresta, 251, João Pessoa - PB',
  instagram text,
  review_url text,
  logo_url text,
  about text,
  updated_at timestamptz not null default now()
);
insert into public.company_settings(id,name,whatsapp,address,instagram,about)
values(true,'Prime Lava Car JP','5583986201295','Avenida Cidade de Nova Floresta, 251, João Pessoa - PB','https://www.instagram.com/primelavacar.jp/','Cuidamos do seu veículo com qualidade, praticidade e atenção aos detalhes.')
on conflict(id) do nothing;

create table if not exists public.services (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique check (slug ~ '^[a-z0-9-]+$'),
  name text not null check(length(name) between 3 and 120),
  category text not null default 'Detalhes e acabamento',
  description text not null,
  benefits text[] not null default '{}',
  duration_minutes integer check(duration_minutes is null or (duration_minutes between 30 and 720 and duration_minutes % 30 = 0)),
  price numeric(12,2) check(price >= 0),
  image_url text,
  active boolean not null default true,
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
insert into public.services(slug,name,category,description,benefits,duration_minutes,price,image_url,sort_order) values
('lavagem-simples','Lavagem simples','Lavagem','Limpeza de rotina para renovar a aparência do veículo. Consulte o que está incluído antes de agendar.',array['Cuidado de rotina','Mais praticidade no dia a dia'],null,null,'/assets/jeep.jpg',1),
('lavagem-premium','Lavagem premium','Lavagem','Lavagem com atenção ampliada aos detalhes do veículo. Consulte o que está incluído antes de agendar.',array['Mais atenção aos detalhes','Atendimento a domicílio'],null,null,'/assets/honda.jpg',2),
('lavagem-de-motos','Lavagem de motos','Lavagem','Limpeza de motocicletas com cuidado nas superfícies e nos detalhes.',array['Cuidado com a moto','Atendimento conforme disponibilidade'],null,null,'/assets/logo-prime-small.png',3),
('higienizacao-de-estofados','Higienização de estofados','Interior','Tratamento de limpeza para os estofados do veículo, de acordo com o material e o estado das peças.',array['Cuidado com os bancos','Interior mais bem cuidado'],null,null,'/assets/geely.jpg',4),
('limpeza-interna-e-aspiracao','Limpeza interna e aspiração','Interior','Limpeza do interior com aspiração para remover sujeira solta das áreas acessíveis.',array['Interior organizado','Remoção de sujeira solta'],null,null,'/assets/honda.jpg',5),
('limpeza-de-teto','Limpeza de teto','Interior','Cuidado específico com o revestimento do teto do veículo, conforme seu material e condição.',array['Atenção ao revestimento','Cuidado localizado'],null,null,'/assets/geely.jpg',6),
('limpeza-de-rodas','Limpeza detalhada de rodas e caixas de rodas','Detalhes e acabamento','Limpeza das rodas e das caixas de rodas com atenção às áreas de maior acúmulo de sujeira.',array['Detalhes mais cuidados','Aparência renovada das rodas'],null,null,'/assets/rodas.jpg',7),
('cristalizacao-de-vidros','Remoção de chuva ácida e cristalização dos vidros','Detalhes e acabamento','Tratamento dos vidros para melhorar sua aparência, conforme o estado das superfícies.',array['Cuidado com os vidros','Tratamento conforme avaliação'],null,null,'/assets/pickup-detalhe.jpg',8),
('revitalizacao-de-plasticos','Revitalização dos plásticos externos','Detalhes e acabamento','Tratamento para melhorar a aparência dos plásticos externos desgastados.',array['Aparência renovada','Cuidado com os detalhes externos'],null,null,'/assets/pickup-detalhe.jpg',9),
('polimento-automotivo','Polimento automotivo','Detalhes e acabamento','Serviço para melhorar o brilho da pintura e reduzir imperfeições superficiais, conforme o estado do veículo.',array['Mais brilho','Acabamento mais uniforme'],null,null,'/assets/pickup-detalhe.jpg',10),
('vitrificacao-automotiva','Vitrificação automotiva','Detalhes e acabamento','Proteção especializada para a pintura que contribui para sua conservação e facilita a limpeza.',array['Ajuda a conservar a pintura','Facilita a limpeza'],null,null,'/assets/geely.jpg',11),
('restauracao-de-farois','Restauração de faróis','Detalhes e acabamento','Tratamento para recuperar a transparência de faróis desgastados e melhorar sua aparência.',array['Melhora a aparência das lentes','Transparência conforme avaliação'],null,null,'/assets/honda.jpg',12)
on conflict(slug) do nothing;

create table if not exists public.business_hours (
  weekday smallint primary key check(weekday between 0 and 6),
  is_open boolean not null default true,
  start_time time not null default '08:00',
  end_time time not null default '18:00',
  check(start_time < end_time)
);
insert into public.business_hours(weekday,is_open,start_time,end_time)
select d,false,'08:00'::time,'18:00'::time from generate_series(0,6) d
on conflict(weekday) do nothing;

create table if not exists public.blocked_slots (
  id uuid primary key default gen_random_uuid(),
  slot_date date not null,
  start_time time,
  end_time time,
  reason text,
  created_at timestamptz not null default now(),
  check((start_time is null and end_time is null) or (start_time is not null and end_time is not null and start_time < end_time))
);

create table if not exists public.clients (
  id uuid primary key default gen_random_uuid(),
  name text not null check(length(name) between 3 and 120),
  phone text not null unique check(phone ~ '^[0-9]{10,13}$'),
  address text not null,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.appointments (
  id uuid primary key default gen_random_uuid(),
  client_id uuid not null references public.clients(id),
  service_id uuid not null references public.services(id),
  starts_at timestamptz not null,
  ends_at timestamptz not null,
  status text not null default 'pendente' check(status in ('pendente','confirmado','em_andamento','concluido','cancelado')),
  quoted_price numeric(12,2) check(quoted_price >= 0),
  address text not null,
  notes text,
  consent_at timestamptz,
  whatsapp_opt_in boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check(starts_at < ends_at),
  constraint appointments_no_overlap exclude using gist (tstzrange(starts_at,ends_at,'[)') with &&) where (status <> 'cancelado')
);
create index if not exists appointments_starts_idx on public.appointments(starts_at);
create index if not exists appointments_client_idx on public.appointments(client_id);

-- Pedidos de atendimento não exigem preço, duração nem grade de horários.
-- A equipe combina esses detalhes antes de criar um agendamento confirmado.
create table if not exists public.appointment_requests (
  id uuid primary key default gen_random_uuid(),
  customer_name text not null check(length(customer_name) between 3 and 120),
  phone text not null check(phone ~ '^[0-9]{10,13}$'),
  service_id uuid not null references public.services(id),
  preferred_date date not null,
  preferred_period text not null check(preferred_period in ('manha','tarde','sem_preferencia')),
  address text not null check(length(address) between 10 and 300),
  notes text,
  status text not null default 'novo' check(status in ('novo','em_contato','agendado','cancelado')),
  consent_at timestamptz not null default now(),
  whatsapp_opt_in boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists appointment_requests_date_idx on public.appointment_requests(preferred_date);
create index if not exists appointment_requests_phone_idx on public.appointment_requests(phone);

create table if not exists public.quotes (
  id uuid primary key default gen_random_uuid(),
  quote_number bigint generated always as identity unique,
  customer_name text not null check(length(customer_name) between 3 and 120),
  customer_phone text check(customer_phone is null or customer_phone ~ '^[0-9]{10,13}$'),
  vehicle text,
  issued_on date not null default current_date,
  valid_until date check(valid_until is null or valid_until >= issued_on),
  items jsonb not null check(jsonb_typeof(items) = 'array'),
  total numeric(12,2) not null check(total >= 0),
  notes text,
  created_at timestamptz not null default now()
);
create index if not exists quotes_issued_idx on public.quotes(issued_on desc);

create table if not exists public.income (
  id uuid primary key default gen_random_uuid(),
  entry_date date not null,
  client_name text,
  service_id uuid references public.services(id),
  appointment_id uuid unique references public.appointments(id),
  amount numeric(12,2) not null check(amount > 0),
  payment_method text not null,
  notes text,
  created_at timestamptz not null default now()
);
create index if not exists income_date_idx on public.income(entry_date);

create table if not exists public.expenses (
  id uuid primary key default gen_random_uuid(),
  entry_date date not null,
  category text not null,
  description text not null,
  amount numeric(12,2) not null check(amount > 0),
  payment_method text not null,
  notes text,
  created_at timestamptz not null default now()
);
create index if not exists expenses_date_idx on public.expenses(entry_date);

create table if not exists public.message_delivery (
  request_id uuid primary key references public.appointment_requests(id) on delete cascade,
  status text not null check(status in ('processing','sent')),
  provider_message_id text,
  updated_at timestamptz not null default now()
);

create table if not exists public.testimonials (
  id uuid primary key default gen_random_uuid(),
  customer_name text not null,
  quote text not null,
  source_url text,
  published boolean not null default false,
  created_at timestamptz not null default now()
);

alter table public.admin_users enable row level security;
alter table public.company_settings enable row level security;
alter table public.services enable row level security;
alter table public.business_hours enable row level security;
alter table public.blocked_slots enable row level security;
alter table public.clients enable row level security;
alter table public.appointments enable row level security;
alter table public.appointment_requests enable row level security;
alter table public.quotes enable row level security;
alter table public.income enable row level security;
alter table public.expenses enable row level security;
alter table public.message_delivery enable row level security;
alter table public.testimonials enable row level security;

create policy "admin_users_read_self" on public.admin_users for select to authenticated using(id=auth.uid());
create policy "company_public_read" on public.company_settings for select to anon,authenticated using(true);
create policy "company_admin_write" on public.company_settings for all to authenticated using(public.is_admin()) with check(public.is_admin());
create policy "services_public_active" on public.services for select to anon,authenticated using(active or public.is_admin());
create policy "services_admin_write" on public.services for all to authenticated using(public.is_admin()) with check(public.is_admin());
create policy "hours_public_read" on public.business_hours for select to anon,authenticated using(true);
create policy "hours_admin_write" on public.business_hours for all to authenticated using(public.is_admin()) with check(public.is_admin());
create policy "blocks_admin_only" on public.blocked_slots for all to authenticated using(public.is_admin()) with check(public.is_admin());
create policy "clients_admin_only" on public.clients for all to authenticated using(public.is_admin()) with check(public.is_admin());
create policy "appointments_admin_only" on public.appointments for all to authenticated using(public.is_admin()) with check(public.is_admin());
create policy "appointment_requests_admin_only" on public.appointment_requests for all to authenticated using(public.is_admin()) with check(public.is_admin());
create policy "quotes_admin_only" on public.quotes for all to authenticated using(public.is_admin()) with check(public.is_admin());
create policy "income_admin_only" on public.income for all to authenticated using(public.is_admin()) with check(public.is_admin());
create policy "expenses_admin_only" on public.expenses for all to authenticated using(public.is_admin()) with check(public.is_admin());
create policy "delivery_admin_only" on public.message_delivery for all to authenticated using(public.is_admin()) with check(public.is_admin());
create policy "testimonials_public_read" on public.testimonials for select to anon,authenticated using(published or public.is_admin());
create policy "testimonials_admin_write" on public.testimonials for all to authenticated using(public.is_admin()) with check(public.is_admin());

create or replace function public.available_slots(p_service_id uuid,p_date date)
returns table(slot_time time) language plpgsql stable security definer set search_path = '' as $$
declare v_duration integer; v_start timestamptz; v_end timestamptz; v_hours public.business_hours%rowtype;
begin
  select duration_minutes into v_duration from public.services where id=p_service_id and active;
  if v_duration is null or p_date < (now() at time zone 'America/Fortaleza')::date or p_date > (now() at time zone 'America/Fortaleza')::date+90 then return; end if;
  select * into v_hours from public.business_hours where weekday=extract(dow from p_date)::smallint and is_open;
  if not found then return; end if;
  return query
  select gs::time from generate_series(p_date+v_hours.start_time,p_date+v_hours.end_time-make_interval(mins=>v_duration),interval '30 minutes') gs
  where (gs at time zone 'America/Fortaleza') > now()+interval '1 hour'
    and not exists(select 1 from public.blocked_slots b where b.slot_date=p_date and (b.start_time is null or (gs::time < b.end_time and (gs+make_interval(mins=>v_duration))::time>b.start_time)))
    and not exists(select 1 from public.appointments a where a.status<>'cancelado' and tstzrange(a.starts_at,a.ends_at,'[)') && tstzrange(gs at time zone 'America/Fortaleza',(gs+make_interval(mins=>v_duration)) at time zone 'America/Fortaleza','[)'));
end;$$;

create or replace function public.book_appointment(p_service_id uuid,p_date date,p_time time,p_name text,p_phone text,p_address text,p_notes text default null,p_consent boolean default false,p_whatsapp_opt_in boolean default false)
returns uuid language plpgsql security definer set search_path = '' as $$
declare v_service public.services%rowtype; v_client_id uuid; v_start timestamptz; v_id uuid;
begin
  if not public.is_admin() then raise exception 'Acesso negado.'; end if;
  if not p_consent then raise exception 'É necessário autorizar o uso dos dados.'; end if;
  if length(trim(p_name))<3 or length(trim(p_name))>120 or p_phone !~ '^[0-9]{10,13}$' or length(trim(p_address))<10 or length(trim(p_address))>300 or length(coalesce(p_notes,''))>1000 then raise exception 'Dados do agendamento inválidos.'; end if;
  select * into v_service from public.services where id=p_service_id and active;
  if not found or v_service.duration_minutes is null then raise exception 'Serviço ainda não disponível para agendamento online.'; end if;
  if not exists(select 1 from public.available_slots(p_service_id,p_date) where slot_time=p_time) then raise exception 'Horário indisponível.'; end if;
  v_start:=(p_date+p_time) at time zone 'America/Fortaleza';
  insert into public.clients(name,phone,address) values(trim(p_name),p_phone,trim(p_address))
  on conflict(phone) do update set name=excluded.name,address=excluded.address,updated_at=now() returning id into v_client_id;
  insert into public.appointments(client_id,service_id,starts_at,ends_at,status,quoted_price,address,notes,consent_at,whatsapp_opt_in)
  values(v_client_id,p_service_id,v_start,v_start+make_interval(mins=>v_service.duration_minutes),'pendente',v_service.price,trim(p_address),nullif(trim(coalesce(p_notes,'')),''),now(),p_whatsapp_opt_in) returning id into v_id;
  return v_id;
exception when exclusion_violation then raise exception 'Horário indisponível.';
end;$$;

create or replace function public.request_appointment(p_service_id uuid,p_date date,p_period text,p_name text,p_phone text,p_address text,p_notes text default null,p_consent boolean default false,p_whatsapp_opt_in boolean default false)
returns uuid language plpgsql security definer set search_path = '' as $$
declare v_id uuid;
begin
  if not p_consent then raise exception 'É necessário autorizar o uso dos dados.'; end if;
  if length(trim(coalesce(p_name,'')))<3 or length(trim(p_name))>120 or coalesce(p_phone,'') !~ '^[0-9]{10,13}$' or length(trim(coalesce(p_address,'')))<10 or length(trim(p_address))>300 or length(coalesce(p_notes,''))>1000 then
    raise exception 'Dados do pedido inválidos.';
  end if;
  if coalesce(p_period,'') not in ('manha','tarde','sem_preferencia') or p_date is null or p_date < (now() at time zone 'America/Fortaleza')::date or p_date > (now() at time zone 'America/Fortaleza')::date+90 then
    raise exception 'Escolha uma data e um período válidos.';
  end if;
  if not exists(select 1 from public.services where id=p_service_id and active) then raise exception 'Serviço indisponível.'; end if;
  insert into public.appointment_requests(customer_name,phone,service_id,preferred_date,preferred_period,address,notes,whatsapp_opt_in)
  values(trim(p_name),p_phone,p_service_id,p_date,p_period,trim(p_address),nullif(trim(coalesce(p_notes,'')),''),p_whatsapp_opt_in) returning id into v_id;
  return v_id;
end;$$;

revoke all on function public.is_admin() from public,anon,authenticated;
grant execute on function public.is_admin() to anon,authenticated;
revoke all on function public.available_slots(uuid,date) from public,anon,authenticated;
grant execute on function public.available_slots(uuid,date) to anon,authenticated;
revoke all on function public.book_appointment(uuid,date,time,text,text,text,text,boolean,boolean) from public,anon,authenticated;
grant execute on function public.book_appointment(uuid,date,time,text,text,text,text,boolean,boolean) to authenticated;
revoke all on function public.request_appointment(uuid,date,text,text,text,text,text,boolean,boolean) from public,anon,authenticated;
grant execute on function public.request_appointment(uuid,date,text,text,text,text,text,boolean,boolean) to anon,authenticated;

revoke all on public.admin_users,public.company_settings,public.services,public.business_hours,public.blocked_slots,public.clients,public.appointments,public.appointment_requests,public.quotes,public.income,public.expenses,public.message_delivery,public.testimonials from anon,authenticated;
grant select on public.company_settings,public.services,public.business_hours,public.testimonials to anon;
grant select on public.admin_users to authenticated;
grant select,insert,update,delete on public.company_settings,public.services,public.business_hours,public.blocked_slots,public.clients,public.appointments,public.appointment_requests,public.quotes,public.income,public.expenses,public.testimonials to authenticated;

-- Opcional: upload de fotos pelo painel (bucket público, escrita apenas por administradores).
insert into storage.buckets(id,name,public) values('service-images','service-images',true) on conflict(id) do nothing;
create policy "service_images_public_read" on storage.objects for select to anon,authenticated using(bucket_id='service-images');
create policy "service_images_admin_insert" on storage.objects for insert to authenticated with check(bucket_id='service-images' and public.is_admin());
create policy "service_images_admin_update" on storage.objects for update to authenticated using(bucket_id='service-images' and public.is_admin()) with check(bucket_id='service-images' and public.is_admin());
create policy "service_images_admin_delete" on storage.objects for delete to authenticated using(bucket_id='service-images' and public.is_admin());
