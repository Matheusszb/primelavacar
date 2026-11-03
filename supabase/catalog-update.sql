-- Execute no SQL Editor após schema.sql (projeto novo) ou isoladamente (projeto existente).
-- Atualiza somente o catálogo e os horários; preserva pedidos e agendamentos.
begin;
insert into public.services(slug,name,category,description,benefits,duration_minutes,price,image_url,sort_order,active) values
('lavagem-simples','Lavagem Simples','Lavagem','Pré-lavagem, lavagem com Snow Foam, limpeza de rodas, pneus e caixas de roda e aspiração interna.',array['Pré-lavagem','Lavagem com Snow Foam','Limpeza de rodas, pneus e caixas de roda','Aspiração interna'],null,69.9,'/assets/jeep.jpg',1,true),
('lavagem-premium','Lavagem Premium','Lavagem','Lavagem com Snow Foam, limpeza de rodas, pneus e caixas de roda, aspiração geral, limpeza interna e cera com proteção de até 1 mês.',array['Pré-lavagem','Lavagem com Snow Foam','Limpeza de rodas, pneus e caixas de roda','Aspiração geral','Limpeza dos plásticos e painel internos','Aplicação de cera com proteção de até 1 mês'],null,104.9,'/assets/honda.jpg',2,true),
('lavagem-premium-completa','Lavagem Premium Completa','Lavagem','Lavagem detalhada com Snow Foam, selante nos pneus, limpeza interna e cera com proteção de até 4 meses.',array['Pré-lavagem','Lavagem com Snow Foam','Limpeza detalhada de rodas, pneus e caixas de roda','Aplicação de selante nos pneus','Aspiração geral','Limpeza dos plásticos e painel internos','Aplicação de cera com proteção de até 4 meses'],null,134.9,'/assets/pickup.jpg',3,true),
('lavagem-premium-couro','Lavagem Premium + Higienização e Hidratação dos Bancos de Couro','Lavagem','Lavagem premium completa com higienização e hidratação dos bancos de couro.',array['Pré-lavagem','Lavagem com Snow Foam','Limpeza detalhada de rodas, pneus e caixas de roda','Aplicação de selante nos pneus','Aspiração geral','Limpeza dos plásticos e painel internos','Aplicação de cera com proteção de até 4 meses','Higienização dos bancos de couro','Hidratação do couro'],null,144.9,'/assets/geely.jpg',4,true),
('lavagem-premium-tecido','Lavagem Premium + Higienização dos Bancos de Tecido','Lavagem','Lavagem premium completa com higienização dos bancos de tecido com extratora.',array['Pré-lavagem','Lavagem com Snow Foam','Limpeza detalhada de rodas, pneus e caixas de roda','Aplicação de selante nos pneus','Aspiração geral','Limpeza dos plásticos e painel internos','Aplicação de cera com proteção de até 4 meses','Higienização dos bancos de tecido com extratora','Remoção de sujeiras profundas, auxiliando na redução de fungos e bactérias'],null,164.9,'/assets/honda.jpg',5,true),
('lavagem-de-motos','Lavagem de Moto','Lavagem','Lavagem externa da motocicleta.',array['Lavagem externa da motocicleta'],null,49.9,'/assets/logo-prime-small.png',6,true),
('higienizacao-de-estofados','Higienização de estofados','Interior','Tratamento de limpeza para os estofados do veículo, de acordo com o material e o estado das peças.',array['Cuidado com os bancos','Interior mais bem cuidado'],null,null,'/assets/antes-depois/estofados.png',7,true),
('limpeza-interna-e-aspiracao','Limpeza interna e aspiração','Interior','Limpeza do interior com aspiração para remover sujeira solta das áreas acessíveis.',array['Interior organizado','Remoção de sujeira solta'],null,null,'/assets/honda.jpg',8,true),
('limpeza-de-teto','Limpeza de teto','Interior','Cuidado específico com o revestimento do teto do veículo, conforme seu material e condição.',array['Atenção ao revestimento','Cuidado localizado'],null,null,'/assets/antes-depois/teto.png',9,true),
('limpeza-de-rodas','Limpeza detalhada de rodas e caixas de rodas','Detalhes e acabamento','Limpeza das rodas e das caixas de rodas com atenção às áreas de maior acúmulo de sujeira.',array['Detalhes mais cuidados','Aparência renovada das rodas'],null,null,'/assets/rodas.jpg',10,true),
('cristalizacao-de-vidros','Remoção de chuva ácida e cristalização dos vidros','Detalhes e acabamento','Tratamento dos vidros para melhorar sua aparência, conforme o estado das superfícies.',array['Cuidado com os vidros','Tratamento conforme avaliação'],null,null,'/assets/antes-depois/vidros.png',11,true),
('revitalizacao-de-plasticos','Revitalização dos plásticos externos','Detalhes e acabamento','Tratamento para melhorar a aparência dos plásticos externos desgastados.',array['Aparência renovada','Cuidado com os detalhes externos'],null,null,'/assets/antes-depois/plasticos.png',12,true),
('polimento-automotivo','Polimento Comercial','Detalhes e acabamento','Realce do brilho da pintura com efeito espelhado e correção de imperfeições superficiais e microrriscos.',array['Realce do brilho da pintura','Acabamento com efeito espelhado','Correção de imperfeições superficiais','Redução de microrriscos'],null,299.9,'/assets/antes-depois/polimento.png',13,true),
('vitrificacao-automotiva','Vitrificação da Pintura','Detalhes e acabamento','Descontaminação e polimento da pintura, seguidos da aplicação de vitrificador com proteção de até 2 anos conforme o uso e a manutenção.',array['Descontaminação da pintura','Polimento para correção da pintura','Aplicação de vitrificador automotivo','Proteção com durabilidade de até 2 anos, conforme as condições de uso e manutenção'],null,719.9,'/assets/geely.jpg',14,true),
('restauracao-de-farois','Restauração de Faróis','Detalhes e acabamento','Restauração da transparência, redução do aspecto amarelado e opaco e melhoria da aparência dos faróis. Valor por par.',array['Restauração da transparência dos faróis','Remoção ou redução do aspecto amarelado e opaco','Melhoria da aparência dos faróis'],null,149,'/assets/antes-depois/farois.png',15,true)
on conflict(slug) do update set name=excluded.name,category=excluded.category,description=excluded.description,benefits=excluded.benefits,price=excluded.price,image_url=excluded.image_url,sort_order=excluded.sort_order,active=true,updated_at=now();
insert into public.business_hours(weekday,is_open,start_time,end_time) values
(0,false,'08:00','17:00'),(1,true,'08:00','17:00'),(2,true,'08:00','17:00'),(3,true,'08:00','17:00'),(4,true,'08:00','17:00'),(5,true,'08:00','17:00'),(6,true,'08:00','17:00')
on conflict(weekday) do update set is_open=excluded.is_open,start_time=excluded.start_time,end_time=excluded.end_time;
create or replace function public.available_slots(p_service_id uuid,p_date date)
returns table(slot_time time) language plpgsql stable security definer set search_path = '' as $$
declare v_duration integer; v_start timestamptz; v_end timestamptz; v_hours public.business_hours%rowtype;
begin
  select duration_minutes into v_duration from public.services where id=p_service_id and active;
  if v_duration is null or p_date < (now() at time zone 'America/Fortaleza')::date or p_date > (now() at time zone 'America/Fortaleza')::date+90 then return; end if;
  select * into v_hours from public.business_hours where weekday=extract(dow from p_date)::smallint and is_open;
  if not found then return; end if;
  return query
  select gs::time from generate_series(p_date+time '08:00',p_date+time '17:00',interval '1 hour') gs
  where gs::time between v_hours.start_time and v_hours.end_time
    and ((extract(dow from p_date) between 1 and 5 and (gs::time between time '08:00' and time '11:00' or gs::time between time '14:00' and time '17:00'))
      or (extract(dow from p_date)=6 and gs::time in (time '08:00',time '10:00',time '14:00',time '16:00')))
    and (gs at time zone 'America/Fortaleza') > now()+interval '1 hour'
    and not exists(select 1 from public.blocked_slots b where b.slot_date=p_date and (b.start_time is null or (gs::time < b.end_time and (gs+make_interval(mins=>v_duration))::time>b.start_time)))
    and not exists(select 1 from public.appointments a where a.status<>'cancelado' and tstzrange(a.starts_at,a.ends_at,'[)') && tstzrange(gs at time zone 'America/Fortaleza',(gs+make_interval(mins=>v_duration)) at time zone 'America/Fortaleza','[)'));
end;$$;
commit;
