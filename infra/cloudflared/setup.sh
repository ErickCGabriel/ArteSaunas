#!/usr/bin/env bash
# Run this INSIDE the LXC container (as root).
#
# Prerequisite: gestao.artesaunas.com.br (or whichever subdomain you pick)
# needs its DNS managed by Cloudflare — i.e. artesaunas.com.br's nameservers
# must point to Cloudflare. If you haven't done that yet, do it first in the
# Cloudflare dashboard before running this script.
#
# This script installs cloudflared, walks you through the one-time
# interactive login, creates a tunnel, points it at the app, and installs
# it as a systemd service so it survives reboots.
set -euo pipefail

HOSTNAME_FQDN="gestao.artesaunas.com.br"   # adjust if you picked a different subdomain
TUNNEL_NAME="artesaunas"
LOCAL_URL="http://127.0.0.1:3000"

echo "==> Installing cloudflared"
if ! command -v cloudflared >/dev/null 2>&1; then
  ARCH=$(dpkg --print-architecture)
  curl -fsSL -o /tmp/cloudflared.deb \
    "https://github.com/cloudflare/cloudflared/releases/latest/download/cloudflared-linux-${ARCH}.deb"
  dpkg -i /tmp/cloudflared.deb
  rm /tmp/cloudflared.deb
fi
cloudflared --version

echo
echo "==> Step 1: log in to Cloudflare"
echo "This opens a URL you need to paste into a browser on ANY device (it"
echo "doesn't have to be on this headless container) and authorize the"
echo "artesaunas.com.br zone."
cloudflared tunnel login

echo
echo "==> Step 2: creating tunnel '$TUNNEL_NAME' (skips if it already exists)"
if ! cloudflared tunnel list | grep -q "$TUNNEL_NAME"; then
  cloudflared tunnel create "$TUNNEL_NAME"
fi

TUNNEL_ID=$(cloudflared tunnel list | awk -v name="$TUNNEL_NAME" '$2==name {print $1}')
CRED_FILE="/root/.cloudflared/${TUNNEL_ID}.json"

echo "==> Step 3: writing /etc/cloudflared/config.yml"
mkdir -p /etc/cloudflared
cat > /etc/cloudflared/config.yml <<EOF
tunnel: ${TUNNEL_ID}
credentials-file: ${CRED_FILE}

ingress:
  - hostname: ${HOSTNAME_FQDN}
    service: ${LOCAL_URL}
  - service: http_status:404
EOF

echo "==> Step 4: routing DNS ${HOSTNAME_FQDN} -> tunnel"
cloudflared tunnel route dns "$TUNNEL_NAME" "$HOSTNAME_FQDN"

echo "==> Step 5: installing cloudflared as a system service"
cloudflared service install
systemctl enable --now cloudflared

echo
echo "Done. https://${HOSTNAME_FQDN} should reach the app in a minute or two."
echo "Check status with: systemctl status cloudflared"
echo "Logs with: journalctl -u cloudflared -f"
