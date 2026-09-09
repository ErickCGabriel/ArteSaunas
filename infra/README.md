# Infra

Scripts para colocar o app no ar num LXC do Proxmox. Veja o passo a passo
completo no README principal do repositório ("Implantação no Proxmox").

> **Nota:** o app está rodando temporariamente no Vercel + Supabase (ver
> README principal). Estes scripts assumem o app com SQLite local — só
> voltam a ser usados diretamente quando a migração de volta pro Proxmox
> acontecer (checklist em "Migrando de volta pro Proxmox" no README).

- `proxmox/create-lxc.sh` — roda no **host Proxmox**, cria o container.
- `app/setup.sh` — roda **dentro do container**, primeira configuração
  (Node.js, clone do repo, build, migrações, serviço systemd).
- `app/deploy.sh` — roda **dentro do container**, para deploys seguintes.
- `app/artesaunas.service` — unit systemd do app (copiado pelo `setup.sh`).
- `cloudflared/setup.sh` — roda **dentro do container**, configura o
  Cloudflare Tunnel.
- `backup/` — backup diário do SQLite para o OneDrive pessoal via
  `rclone` (veja `rclone-setup.md` para a configuração inicial).
