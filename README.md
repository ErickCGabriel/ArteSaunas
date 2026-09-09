# Arte Saunas — Sistema de Gestão

Aplicativo web interno para a Arte Saunas: orçamentos, contatos (CRM) e
agenda integrada ao Google Calendar.

> **Estado atual (temporário): Vercel + Supabase.** O plano original era
> self-hosted (Proxmox + SQLite + arquivos em disco), que é o destino final.
> Para dar tempo de estabilizar a homelab, o app está rodando por um período
> de teste no Vercel com Postgres/Storage no Supabase. Veja
> "Migrando de volta pro Proxmox" no fim deste README para o checklist de
> quando for a hora de voltar.

## Stack

- **Next.js** (App Router) + TypeScript + Tailwind + shadcn/ui (tema escuro/premium)
- **Postgres** (Supabase, por enquanto) via Drizzle ORM
- Autenticação por sessão (cookie assinado, sistema próprio — **não** usa
  Supabase Auth), papéis **Admin** e **Operador**
- **PDF** de orçamento via `@react-pdf/renderer`
- Integração **Google Calendar** via OAuth2 (a conta conectada é a fonte de
  verdade dos eventos — o app só cria/edita/apaga, não faz sync de dois lados)
- **Arquivos por contato** (plantas, fotos, documentos que o cliente manda),
  guardados no Supabase Storage (bucket privado, acessado só via server-side
  com a service role key — nunca exposto ao navegador)

## Rodando localmente

Precisa de um projeto Postgres (Supabase ou outro) acessível — não tem mais
um banco local zero-config como no SQLite.

```bash
npm install
cp .env.example .env
# preencha DATABASE_URL, SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY no .env

# gere um AUTH_SECRET aleatório:
node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"
# cole o resultado em AUTH_SECRET no .env

npx drizzle-kit migrate
SEED_ADMIN_EMAIL=voce@exemplo.com SEED_ADMIN_USERNAME=seu.usuario SEED_ADMIN_PASSWORD="senha-forte" npm run db:seed

npm run dev
```

Abra http://localhost:3000 e entre com o usuário/senha do seed.

### Variáveis de ambiente

Veja `.env.example` para a lista completa e onde encontrar cada valor no
painel do Supabase. As essenciais:

- `DATABASE_URL` — connection string do Postgres (use o "Transaction
  pooler", porta 6543, em produção/serverless)
- `SUPABASE_URL` / `SUPABASE_SERVICE_ROLE_KEY` — para o Storage dos
  arquivos de contato
- `AUTH_SECRET` — string aleatória para assinar os cookies de sessão

Para a integração com o Google Calendar (pode ser configurada depois, direto
pela tela Admin/Calendário assim que estiver rodando):

- `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`, `GOOGLE_REDIRECT_URI` — veja
  "Configurando o Google Calendar" abaixo
- `GOOGLE_CALENDAR_ID` — normalmente `primary`, ou o ID de um calendário
  compartilhado específico

### Scripts úteis

| Comando | O que faz |
|---|---|
| `npm run dev` | Servidor de desenvolvimento |
| `npm run build` | Build de produção |
| `npm run start` | Roda o build de produção |
| `npm run db:generate` | Gera uma nova migração a partir do schema |
| `npm run db:migrate` | Aplica migrações pendentes |
| `npm run db:studio` | Abre o Drizzle Studio para inspecionar o banco |
| `npm run db:seed` | Cria o usuário admin inicial (`SEED_ADMIN_EMAIL`/`SEED_ADMIN_USERNAME`/`SEED_ADMIN_PASSWORD`) |

## Configurando o Google Calendar

1. Crie um projeto em [console.cloud.google.com](https://console.cloud.google.com/).
2. Ative a **Google Calendar API** (APIs e serviços → Biblioteca).
3. Configure a tela de consentimento OAuth (APIs e serviços → Tela de
   consentimento OAuth). Tipo "Interno" se for Google Workspace, ou
   "Externo" + adicionar os e-mails da equipe como usuários de teste caso
   seja uma conta Gmail comum.
4. Crie uma credencial **OAuth client ID** (tipo "Web application") em
   "Credenciais". Em "URIs de redirecionamento autorizados", adicione a URL
   do seu deploy no Vercel, ex: `https://artesaunas.vercel.app/api/google/callback`
   (use `http://localhost:3000/api/google/callback` também se for testar local).
5. Copie o **Client ID** e **Client Secret** para `GOOGLE_CLIENT_ID` e
   `GOOGLE_CLIENT_SECRET`, e o redirect URI usado para `GOOGLE_REDIRECT_URI`.
6. Faça login como Admin, vá em **Calendário** e clique em "Conectar Google
   Calendar".

## Implantação no Vercel (atual)

1. Projeto Vercel conectado a este repositório/branch.
2. Configure as env vars do `.env.example` diretamente no painel do Vercel
   (Project Settings → Environment Variables) — nunca cole segredos em chat
   ou commite no repo.
3. Deploy automático a cada push.
4. Depois do primeiro deploy, rode a migração e o seed apontando pro banco
   do Supabase (`DATABASE_URL` do `.env` local com o mesmo valor configurado
   no Vercel):
   ```bash
   npx drizzle-kit migrate
   SEED_ADMIN_EMAIL=voce@exemplo.com SEED_ADMIN_USERNAME=seu.usuario SEED_ADMIN_PASSWORD="senha-forte" npm run db:seed
   ```
5. Atualize o `GOOGLE_REDIRECT_URI` no Google Cloud Console e no `.env` do
   Vercel com a URL final do deploy.

## Migrando de volta pro Proxmox

Quando a homelab estiver pronta, o caminho é reverter esta ponte temporária
para o self-hosted original (SQLite + Supabase Storage → disco local):

1. `git log` para achar o commit anterior à migração pro Supabase (mensagem
   "Migrate to Supabase...") e reverter `src/db/schema.ts`, `src/db/index.ts`,
   `drizzle.config.ts` e `src/lib/storage.ts` para as versões SQLite/disco
   local de antes (estão preservadas no histórico do git).
2. Escrever um script pontual de export/import: ler todas as linhas de cada
   tabela do Postgres (Supabase) e inserir no SQLite novo, e baixar os
   arquivos do bucket `contact-files` do Supabase Storage para
   `data/uploads/<contactId>/`.
3. Seguir o passo a passo de "Implantação no Proxmox" (scripts em `infra/`,
   já prontos e testados) para colocar o LXC no ar.
4. Atualizar o `GOOGLE_REDIRECT_URI` de volta para o domínio do Proxmox.
5. Cancelar/pausar o projeto no Vercel e (se não for mais usar) apagar o
   projeto no Supabase.

Os scripts em `infra/` (Proxmox/Cloudflare Tunnel/backup rclone) já estão
prontos desde antes dessa ponte temporária — não precisam de mudança, só
esperam o app voltar a rodar com SQLite local.
