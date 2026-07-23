# Configurando o backup para o OneDrive pessoal

Isso só precisa ser feito uma vez, dentro do container (como root).

## 1. Instalar o rclone

```bash
apt-get update && apt-get install -y rclone sqlite3 gzip
```

## 2. Autorizar a conta Microsoft (OneDrive pessoal)

Como o container não tem navegador, use o fluxo de autorização remota do
rclone: rode `rclone authorize` numa máquina QUALQUER que tenha navegador
(seu notebook, por exemplo, com o rclone instalado por lá também), e cole o
resultado de volta aqui no container.

Dentro do container:

```bash
rclone config
```

Siga o assistente:

- `n` (new remote)
- Nome: `onedrive`
- Storage: procure e escolha `onedrive` (Microsoft OneDrive)
- Client ID / Secret: deixe em branco (usa o padrão do rclone)
- Region: `global` (padrão, a menos que a conta seja de outra região)
- Quando perguntar "Use auto config?": responda **não** (`n`), já que é
  headless
- Ele vai mostrar um comando `rclone authorize "onedrive" ...` — copie esse
  comando

Na sua máquina com navegador (com rclone instalado: `brew install rclone` /
`sudo apt install rclone` / etc):

```bash
rclone authorize "onedrive" "<o resto do comando mostrado acima>"
```

Isso abre o navegador, você faz login com a conta Microsoft pessoal
(a mesma usada no OneDrive/SharePoint) e autoriza. O terminal mostra um
token — copie e cole de volta no prompt do `rclone config` dentro do
container.

- Quando perguntar o tipo de conta OneDrive, escolha "OneDrive Personal"
- Confirme a pasta raiz (padrão é a raiz do OneDrive) e finalize (`y`, `q`)

## 3. Testar

```bash
rclone mkdir onedrive:ArteSaunas-Backups
rclone lsd onedrive:
```

Se aparecer a pasta `ArteSaunas-Backups` na listagem, está funcionando.

## 4. Ativar o backup automático

```bash
cp /opt/artesaunas/infra/backup/artesaunas-backup.service /etc/systemd/system/
cp /opt/artesaunas/infra/backup/artesaunas-backup.timer /etc/systemd/system/
systemctl daemon-reload
systemctl enable --now artesaunas-backup.timer
```

Isso roda o backup todo dia às 3h da manhã (ajuste o horário em
`artesaunas-backup.timer` se quiser). Para rodar uma vez manualmente e
conferir que está tudo certo:

```bash
systemctl start artesaunas-backup.service
journalctl -u artesaunas-backup.service -n 50
```
