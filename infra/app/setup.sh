#!/usr/bin/env bash
# Run this INSIDE the LXC container (as root), on first-time setup only.
# For later deploys of new code, use infra/app/deploy.sh instead.
#
# Installs Node.js, clones the repo, builds it, runs migrations, seeds
# the first admin user, and installs a systemd service to keep it running.
set -euo pipefail

# ---- Adjust these -----------------------------------------------------------
REPO_URL="https://github.com/erickcgabriel/artesaunas.git"
BRANCH="main"
APP_DIR=/opt/artesaunas
APP_USER=artesaunas
NODE_MAJOR=22
# -----------------------------------------------------------------------------

if [ "$(id -u)" -ne 0 ]; then
  echo "Run this script as root." >&2
  exit 1
fi

echo "==> Installing base packages"
apt-get update
apt-get install -y curl ca-certificates git

if ! command -v node >/dev/null 2>&1; then
  echo "==> Installing Node.js $NODE_MAJOR.x"
  curl -fsSL "https://deb.nodesource.com/setup_${NODE_MAJOR}.x" | bash -
  apt-get install -y nodejs
fi

echo "==> Node/npm versions:"
node --version
npm --version

if ! id "$APP_USER" >/dev/null 2>&1; then
  echo "==> Creating system user $APP_USER"
  useradd --system --create-home --shell /usr/sbin/nologin "$APP_USER"
fi

if [ -d "$APP_DIR/.git" ]; then
  echo "==> Repo already exists at $APP_DIR, pulling latest"
  cd "$APP_DIR"
  sudo -u "$APP_USER" git fetch origin "$BRANCH"
  sudo -u "$APP_USER" git checkout "$BRANCH"
  sudo -u "$APP_USER" git pull origin "$BRANCH"
else
  echo "==> Cloning $REPO_URL into $APP_DIR"
  git clone --branch "$BRANCH" "$REPO_URL" "$APP_DIR"
  chown -R "$APP_USER:$APP_USER" "$APP_DIR"
fi

cd "$APP_DIR"
mkdir -p data
chown -R "$APP_USER:$APP_USER" data

if [ ! -f .env ]; then
  echo "==> Creating .env from .env.example — EDIT THIS before continuing!"
  cp .env.example .env
  AUTH_SECRET=$(node -e "console.log(require('crypto').randomBytes(32).toString('base64'))")
  sed -i "s|^AUTH_SECRET=.*|AUTH_SECRET=$AUTH_SECRET|" .env
  sed -i "s|^DATABASE_PATH=.*|DATABASE_PATH=$APP_DIR/data/artesaunas.db|" .env
  chown "$APP_USER:$APP_USER" .env
  chmod 600 .env
  echo
  echo "!!! Edit $APP_DIR/.env now to add Google OAuth credentials, then re-run"
  echo "!!! this script (it's safe to run again)."
  exit 0
fi

echo "==> Installing dependencies"
# `next build` (Turbopack) needs more headroom than the app uses at runtime.
# If this OOMs on a low-memory container, bump the RAM from the Proxmox host
# first (pct set <CTID> --memory 2048), run this script again, then scale
# back down (pct set <CTID> --memory 768) once the build succeeds — the
# built standalone output runs comfortably on much less than it takes to build.
sudo -u "$APP_USER" npm ci

echo "==> Running database migrations"
sudo -u "$APP_USER" npx drizzle-kit migrate

echo "==> Building the app"
sudo -u "$APP_USER" npm run build
cp -r public .next/standalone/
cp -r .next/static .next/standalone/.next/
chown -R "$APP_USER:$APP_USER" .next

echo "==> Installing systemd service"
cp infra/app/artesaunas.service /etc/systemd/system/artesaunas.service
systemctl daemon-reload
systemctl enable --now artesaunas.service

echo
echo "Done. Check status with: systemctl status artesaunas"
echo "Logs with: journalctl -u artesaunas -f"
echo "App should be listening on http://127.0.0.1:3000"
echo
echo "If this is the first run, create the first admin login (safe to re-run):"
echo "    cd $APP_DIR && sudo -u $APP_USER SEED_ADMIN_EMAIL=voce@exemplo.com SEED_ADMIN_PASSWORD='senha-forte' npm run db:seed"
