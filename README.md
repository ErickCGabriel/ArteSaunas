# Arte Saunas — Sistema de Gestão

Aplicativo web interno para a Arte Saunas: orçamentos, contatos (CRM) e
agenda integrada ao Google Calendar. Feito para rodar self-hosted, com os
dados guardados em SQLite dentro do próprio servidor (Proxmox/LXC), sem
depender de nenhum serviço de nuvem para os dados do negócio.

## Stack

- **Next.js** (App Router) + TypeScript + Tailwind + shadcn/ui (tema escuro/premium)
- **SQLite** via Drizzle ORM (arquivo único, fácil de fazer backup)
- Autenticação por sessão (cookie assinado), papéis **Admin** e **Operador**
- **PDF** de orçamento via `@react-pdf/renderer`
- Integração **Google Calendar** via OAuth2 (a conta conectada é a fonte de
  verdade dos eventos — o app só cria/edita/apaga, não faz sync de dois lados)

## Rodando localmente

```bash
npm install
cp .env.example .env
# gere um AUTH_SECRET aleatório:
node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"
# cole o resultado em AUTH_SECRET no .env

npx drizzle-kit migrate
SEED_ADMIN_EMAIL=voce@exemplo.com SEED_ADMIN_PASSWORD="senha-forte" npm run db:seed

npm run dev
```

Abra http://localhost:3000 e entre com o e-mail/senha do seed.

### Variáveis de ambiente

Veja `.env.example` para a lista completa. As essenciais para rodar local:

- `DATABASE_PATH` — caminho do arquivo SQLite
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
| `npm run build` | Build de produção (standalone) |
| `npm run start` | Roda o build de produção |
| `npm run db:generate` | Gera uma nova migração a partir do schema |
| `npm run db:migrate` | Aplica migrações pendentes |
| `npm run db:studio` | Abre o Drizzle Studio para inspecionar o banco |
| `npm run db:seed` | Cria o usuário admin inicial (`SEED_ADMIN_EMAIL`/`SEED_ADMIN_PASSWORD`) |

## Configurando o Google Calendar

1. Crie um projeto em [console.cloud.google.com](https://console.cloud.google.com/).
2. Ative a **Google Calendar API** (APIs e serviços → Biblioteca).
3. Configure a tela de consentimento OAuth (APIs e serviços → Tela de
   consentimento OAuth). Tipo "Interno" se for Google Workspace, ou
   "Externo" + adicionar os e-mails da equipe como usuários de teste caso
   seja uma conta Gmail comum.
4. Crie uma credencial **OAuth client ID** (tipo "Web application") em
   "Credenciais". Em "URIs de redirecionamento autorizados", adicione:
   `https://gestao.artesaunas.com.br/api/google/callback` (troque pelo seu
   domínio real; use `http://localhost:3000/api/google/callback` também se
   for testar local).
5. Copie o **Client ID** e **Client Secret** para `GOOGLE_CLIENT_ID` e
   `GOOGLE_CLIENT_SECRET` no `.env`, e o redirect URI usado para
   `GOOGLE_REDIRECT_URI`.
6. Reinicie o app, faça login como Admin, vá em **Calendário** e clique em
   "Conectar Google Calendar".

## Implantação no Proxmox (homelab)

Os scripts em `infra/` automatizam a criação do container e a configuração
de cada peça. Passo a passo:

1. **Criar o LXC** — no host Proxmox (via SSH):
   ```bash
   # copie infra/proxmox/create-lxc.sh para o host, ajuste as variáveis no
   # topo do arquivo (CTID, storage, rede) e rode:
   bash create-lxc.sh
   ```
2. **Configurar o app** — dentro do container (`pct enter <CTID>`), copie a
   pasta `infra/` (ou clone o repo direto) e rode:
   ```bash
   bash infra/app/setup.sh
   ```
   Na primeira execução ele cria o `.env` e pede para você editá-lo (chave
   `AUTH_SECRET` já vem gerada; preencha as credenciais do Google se for
   configurar agora). Rode o script de novo depois de editar — ele instala
   dependências, builda, roda migrações e sobe o serviço systemd
   `artesaunas`.

   > Se `npm run build` ficar sem memória no container pequeno, aumente a
   > RAM temporariamente pelo host (`pct set <CTID> --memory 2048`), rode o
   > setup de novo, e depois volte para o valor baixo (`pct set <CTID>
   > --memory 768`) — o app rodando consome bem menos do que o build.

3. **Expor via Cloudflare Tunnel** — dentro do container:
   ```bash
   bash infra/cloudflared/setup.sh
   ```
   Pré-requisito: o domínio `artesaunas.com.br` precisa estar com o DNS
   gerenciado pela Cloudflare. O script instala o `cloudflared`, pede login
   interativo (abre uma URL para autorizar) e configura tudo como serviço.

4. **Backup automático pro OneDrive** — siga
   `infra/backup/rclone-setup.md` (configuração interativa única do
   `rclone`), depois ative o timer:
   ```bash
   systemctl enable --now artesaunas-backup.timer
   ```

5. **Deploys seguintes** — depois que o setup inicial estiver feito, para
   subir código novo:
   ```bash
   bash infra/app/deploy.sh
   ```

### Por que esse formato

- **LXC, não VM**: bem mais leve, sem overhead de virtualizar hardware —
  importante já que o objetivo é sobrar recurso pro resto da homelab.
- **Sem Docker**: Node.js + systemd direto, evitando a sobrecarga do
  daemon do Docker. `output: "standalone"` no `next.config.ts` mantém o
  `node_modules` copiado enxuto (só o necessário para rodar).
- **SQLite**: sem processo de banco separado; backup é só copiar um arquivo.
- **Cloudflare Tunnel**: nenhuma porta aberta no roteador, HTTPS automático.
