#!/usr/bin/env bash
# Run this INSIDE the LXC container (as root) to deploy new commits after
# the initial infra/app/setup.sh has already been run once.
set -euo pipefail

APP_DIR=/opt/artesaunas
APP_USER=artesaunas
BRANCH="main"

cd "$APP_DIR"

echo "==> Pulling latest code"
sudo -u "$APP_USER" git fetch origin "$BRANCH"
sudo -u "$APP_USER" git checkout "$BRANCH"
sudo -u "$APP_USER" git pull origin "$BRANCH"

echo "==> Installing dependencies"
# See the note in setup.sh: bump the container's RAM first (from the Proxmox
# host: pct set <CTID> --memory 2048) if this step runs out of memory, then
# scale it back down afterwards.
sudo -u "$APP_USER" npm ci

echo "==> Running database migrations"
sudo -u "$APP_USER" npx drizzle-kit migrate

echo "==> Building the app"
sudo -u "$APP_USER" npm run build
cp -r public .next/standalone/
cp -r .next/static .next/standalone/.next/
chown -R "$APP_USER:$APP_USER" .next

echo "==> Restarting service"
systemctl restart artesaunas.service
systemctl status artesaunas.service --no-pager
