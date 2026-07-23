#!/usr/bin/env bash
# Backs up the SQLite database and ships it to the OneDrive personal account
# configured via rclone (see rclone-setup.md). Meant to run as root via the
# artesaunas-backup.timer systemd timer, but safe to run manually too.
set -euo pipefail

APP_DIR=/opt/artesaunas
DB_PATH="$APP_DIR/data/artesaunas.db"
BACKUP_DIR=/opt/artesaunas-backups
RCLONE_REMOTE="onedrive:ArteSaunas-Backups"
KEEP_DAYS=14

mkdir -p "$BACKUP_DIR"
TIMESTAMP=$(date +%Y%m%d-%H%M%S)
SNAPSHOT="$BACKUP_DIR/artesaunas-$TIMESTAMP.db"

echo "==> Snapshotting database (safe with the app running, via SQLite's online backup)"
sqlite3 "$DB_PATH" ".backup '$SNAPSHOT'"
gzip "$SNAPSHOT"

echo "==> Uploading to OneDrive ($RCLONE_REMOTE)"
rclone copy "${SNAPSHOT}.gz" "$RCLONE_REMOTE"

echo "==> Pruning local snapshots older than $KEEP_DAYS days"
find "$BACKUP_DIR" -name "artesaunas-*.db.gz" -mtime "+$KEEP_DAYS" -delete

echo "==> Pruning remote backups older than $KEEP_DAYS days"
rclone delete "$RCLONE_REMOTE" --min-age "${KEEP_DAYS}d" || true

echo "Backup complete: ${SNAPSHOT}.gz"
