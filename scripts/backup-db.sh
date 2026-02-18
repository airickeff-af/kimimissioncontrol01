#!/bin/bash
# Backup script for Mission Control database
# Run every hour via cron

DB_FILE="/root/.openclaw/workspace/mission-control/dashboard/data/mission-control-db.json"
BACKUP_DIR="/root/.openclaw/workspace/mission-control/dashboard/data/backups"
TIMESTAMP=$(date +%Y%m%d-%H%M%S)

# Create backup directory if not exists
mkdir -p "$BACKUP_DIR"

# Create backup
cp "$DB_FILE" "$BACKUP_DIR/mission-control-db-$TIMESTAMP.json"

# Keep only last 24 backups (24 hours)
ls -t "$BACKUP_DIR"/mission-control-db-*.json | tail -n +25 | xargs -r rm

echo "Backup created: $BACKUP_DIR/mission-control-db-$TIMESTAMP.json"
echo "Total backups: $(ls $BACKUP_DIR/*.json 2>/dev/null | wc -l)"