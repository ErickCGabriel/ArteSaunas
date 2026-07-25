#!/usr/bin/env bash
# Backs up the SQLite database and ships it to the OneDrive personal account
# configured via rclone (see rclone-setup.md). Meant to run as root via the
# artesaunas-backup.timer systemd timer, but safe to run manually too.
set -euo pipefail

APP_DIR=/opt/artesaunas
DB_PATH="$APP_DIR/data/artesaunas.db"
UPLOADS_DIR="$APP_DIR/data/uploads"
BACKUP_DIR=/opt/artesaunas-backups
# Two separate remote subfolders: "banco" holds daily DB snapshots (pruned
# after KEEP_DAYS), "arquivos" mirrors client files and is never pruned
# automatically here.
RCLONE_REMOTE_DB="onedrive:ArteSaunas-Backups/banco"
RCLONE_REMOTE_FILES="onedrive:ArteSaunas-Backups/arquivos"
KEEP_DAYS=14

mkdir -p "$BACKUP_DIR"
TIMESTAMP=$(date +%Y%m%d-%H%M%S)
SNAPSHOT="$BACKUP_DIR/artesaunas-$TIMESTAMP.db"

echo "==> Snapshotting database (safe with the app running, via SQLite's online backup)"
sqlite3 "$DB_PATH" ".backup '$SNAPSHOT'"
gzip "$SNAPSHOT"

echo "==> Uploading database snapshot to OneDrive ($RCLONE_REMOTE_DB)"
rclone copy "${SNAPSHOT}.gz" "$RCLONE_REMOTE_DB"

# Files clients send (house plans, photos, etc), stored under data/uploads/.
# Copy-only (never deletes remote files, even if removed locally) so an
# accidental local delete doesn't take out the only remaining copy.
if [ -d "$UPLOADS_DIR" ]; then
  echo "==> Uploading client files to OneDrive ($RCLONE_REMOTE_FILES)"
  rclone copy "$UPLOADS_DIR" "$RCLONE_REMOTE_FILES"
fi

echo "==> Pruning local snapshots older than $KEEP_DAYS days"
find "$BACKUP_DIR" -name "artesaunas-*.db.gz" -mtime "+$KEEP_DAYS" -delete

echo "==> Pruning remote database snapshots older than $KEEP_DAYS days"
rclone delete "$RCLONE_REMOTE_DB" --min-age "${KEEP_DAYS}d" || true

echo "Backup complete: ${SNAPSHOT}.gz (+ client files synced)"
