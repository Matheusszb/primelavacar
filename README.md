# Prime Lava Car JP

Site estático responsivo com agendamento e gestão conectados ao Supabase. A pasta `dist/` pode ser servida diretamente por um servidor HTTP ou publicada na Vercel. A versão Sites é uma prévia privada.

## Ativar agendamento e painel

1. Crie um projeto no Supabase e execute [`supabase/schema.sql`](supabase/schema.sql) no SQL Editor de um projeto novo. A migração cria serviços iniciais sem preços, horários de atendimento editáveis, RLS, funções de agendamento e tabelas financeiras.
2. Em **Authentication > Users**, crie a conta do administrador. Copie o UUID desse usuário e execute no SQL Editor:

   ```sql
   insert into public.admin_users(id) values ('UUID_DO_USUARIO');
   ```

3. Em [`dist/js/config.js`](dist/js/config.js), informe a URL do projeto e a chave **publishable** ou **anon** do Supabase. Essa chave é pública. **Nunca** coloque a `service_role`, uma secret key ou o token do WhatsApp no site.
4. Sirva `dist/` por HTTP e teste um agendamento, a disponibilidade e o login em `/admin/`. Cadastre os preços no painel conforme sua tabela real.

Os registros privados só são acessíveis por usuários cadastrados em `admin_users`. A função de agendamento valida os dados no banco e a restrição de intervalo impede sobreposição mesmo em solicitações simultâneas. A receita do dashboard contabiliza apenas entradas lançadas, nunca agendamentos futuros.

## WhatsApp automático (opcional)

O botão de WhatsApp funciona sem integração. Para enviar confirmação automática ao cliente, configure a [Edge Function](supabase/functions/booking-confirmation/index.ts) e um webhook de banco no evento `INSERT` da tabela `public.appointments`. A função só envia quando o cliente marcou a opção específica de contato por WhatsApp.

Configure `PRIME_WEBHOOK_SECRET`, `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`, `WHATSAPP_ACCESS_TOKEN`, `WHATSAPP_PHONE_NUMBER_ID`, `WHATSAPP_TEMPLATE_NAME` e `WHATSAPP_GRAPH_VERSION` **nos segredos da Edge Function**, e passe `PRIME_WEBHOOK_SECRET` no cabeçalho `x-prime-webhook-secret` do webhook. O modelo aprovado no WhatsApp Business deve ser `pt_BR` e ter cinco parâmetros no corpo: nome, data, horário, serviço e endereço. O arquivo [`supabase/config.toml`](supabase/config.toml) desliga a verificação JWT apenas nessa função; ela verifica o segredo do webhook antes de processar a solicitação. Faça um envio de teste antes de ativar o webhook em produção.

## Publicação

- Na Vercel, use a pasta `site/` como raiz do projeto. [`vercel.json`](vercel.json) aponta a saída para `dist/` e dispensa build.
- Ao usar um domínio próprio, substitua a origem canônica em `dist/index.html`, `dist/agendar/index.html` e `scripts/generate-pages.mjs`; execute novamente o gerador para atualizar páginas de serviço, `sitemap.xml` e `robots.txt`.
- O Google Search Console e o Perfil da Empresa no Google exigem contas e verificação do proprietário. O link “Avaliar no Google” pode ser cadastrado no painel. Depoimentos só aparecem após cadastro manual de avaliações reais.

As fotos fornecidas estão em `dist/assets/`. O logotipo foi reduzido para 320 px para melhorar o carregamento. As páginas de serviços têm título, descrição e dados estruturados próprios. A versão publicada em Sites começa privada; para SEO público, publique no domínio definitivo e confirme o acesso público.
