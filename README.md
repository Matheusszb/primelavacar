# Prime Lava Car JP

Site estático para Vercel, com catálogo, pedidos de atendimento e painel ligados ao Supabase. O formulário do cliente tem três passos: serviço, dia e período preferidos, contato. A pasta `dist/` contém a saída publicada; `npm run build` gera as páginas de serviços, o catálogo e a configuração pública do Supabase.

## 1. Configurar Supabase

1. Crie um projeto Supabase e execute [`supabase/schema.sql`](supabase/schema.sql) no SQL Editor de um projeto novo. O arquivo cadastra os 12 serviços da arte e do briefing em três grupos, sem inventar preços, tempos ou horários. O formulário de pedidos funciona sem esses dados.
2. Em **Authentication > Users**, crie a conta do administrador. Copie o UUID do usuário e execute:

   ```sql
   insert into public.admin_users(id) values ('UUID_DO_USUARIO');
   ```

3. Acesse `/admin/` após configurar o site. Na aba **Agenda**, acompanhe os pedidos, entre em contato com os clientes e atualize cada status. A preferência informada pelo cliente não é uma reserva. Quando você tiver durações e horários reais, poderá cadastrar agendamentos com horário no painel. O preço pode continuar em branco e aparecerá como “sob consulta”.

O banco usa RLS para proteger clientes, pedidos, agendamentos e finanças. A função de pedido valida os dados no banco. Agendamentos com horário têm uma restrição contra sobreposição. O painel soma apenas entradas recebidas e despesas registradas.

## Orçamentos em PDF

Na aba **Orçamentos** do painel, informe cliente, veículo, serviços, quantidades e valores. O orçamento é salvo no Supabase e aparece no histórico para reabrir. O botão **Salvar e abrir PDF** mostra uma página pronta para impressão; escolha **Salvar como PDF** na janela de impressão do navegador. O arquivo PDF fica no dispositivo de quem o salvar; o banco guarda os dados do orçamento para gerar outra cópia. Esse recurso funciona após conectar o Supabase e executar o schema acima.

## 2. Publicar na Vercel

Ao importar este repositório na Vercel, deixe **Root Directory** na raiz do repositório (`./`). O [`vercel.json`](vercel.json) executa `npm run build` e publica `dist/`. Configure estas variáveis de ambiente no projeto Vercel:

| Variável | Valor |
| --- | --- |
| `SUPABASE_URL` | URL HTTPS do projeto Supabase |
| `SUPABASE_ANON_KEY` | Chave pública **publishable** ou **anon** |
| `SITE_URL` | URL pública final do site, por exemplo `https://seudominio.com.br` |

O build grava apenas URL e chave pública em `dist/js/config.js`. Nunca configure `service_role`, secret key ou token do WhatsApp nessas variáveis públicas. Em prévias sem `SITE_URL`, o build usa a URL da implantação Vercel nos metadados canônicos. Depois de conectar o domínio, defina `SITE_URL` e faça uma nova implantação.

Para testar localmente, configure as mesmas variáveis no ambiente, execute `npm run build` e sirva a pasta `dist/` por HTTP. Os arquivos de fotos já estão em `dist/assets/`.

## 3. WhatsApp automático (opcional)

O contato manual pelo WhatsApp funciona sem integração adicional. Para enviar um aviso automático de **pedido recebido**, publique a [Edge Function](supabase/functions/booking-confirmation/index.ts) e crie um Database Webhook para `INSERT` em `public.appointment_requests`. A função envia somente quando o cliente autorizou esse contato. O aviso deve deixar claro que dia, período, disponibilidade e valor ainda serão confirmados pela equipe.

Configure `PRIME_WEBHOOK_SECRET`, `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`, `WHATSAPP_ACCESS_TOKEN`, `WHATSAPP_PHONE_NUMBER_ID`, `WHATSAPP_TEMPLATE_NAME` e `WHATSAPP_GRAPH_VERSION` **nos segredos da Edge Function**. Passe o segredo no cabeçalho `x-prime-webhook-secret` do webhook. O modelo aprovado em `pt_BR` deve ter cinco parâmetros no corpo: nome, data preferida, período preferido, serviço e endereço. Teste antes de ativar em produção.

## Conteúdo e SEO

[`data/services.json`](data/services.json) é a lista de referência para as páginas estáticas e o catálogo inicial. O painel altera o catálogo lido do Supabase. Cada serviço tem página, título e descrição próprios; o build gera `sitemap.xml` e `robots.txt`. Cadastre apenas avaliações reais no painel. Quando o site estiver no domínio final, confirme o acesso público e conecte o Google Search Console.
