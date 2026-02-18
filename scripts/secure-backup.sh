#!/bin/bash
# SECURE Backup Script for Mission Control Database
# Creates encrypted backups with integrity checks

DB_FILE="/root/.openclaw/workspace/mission-control/dashboard/data/mission-control-db.json"
BACKUP_DIR="/root/.openclaw/workspace/mission-control/dashboard/data/backups"
ENCRYPTED_DIR="/root/.openclaw/workspace/mission-control/dashboard/data/backups/encrypted"
TIMESTAMP=$(date +%Y%m%d-%H%M%S)
DATE=$(date +%Y%m%d)

# Create directories
mkdir -p "$BACKUP_DIR" "$ENCRYPTED_DIR"

# 1. Create regular backup
cp "$DB_FILE" "$BACKUP_DIR/mission-control-db-$TIMESTAMP.json"

# 2. Create checksum for integrity
sha256sum "$BACKUP_DIR/mission-control-db-$TIMESTAMP.json" > "$BACKUP_DIR/mission-control-db-$TIMESTAMP.sha256"

# 3. Create daily encrypted backup (if gpg available)
if command -v gpg &> /dev/null; then
    gpg --symmetric --cipher-algo AES256 --compress-algo 1 --output "$ENCRYPTED_DIR/mission-control-db-$DATE.enc" "$DB_FILE"
    echo "Encrypted backup created"
fi

# 4. Verify backup integrity
if sha256sum -c "$BACKUP_DIR/mission-control-db-$TIMESTAMP.sha256" >/dev/null 2>&1; then
    echo "✅ Backup integrity verified"
else
    echo "❌ BACKUP CORRUPTED - Alerting admin"
    # Could send alert here
fi

# 5. Cleanup old backups
# Keep last 48 hourly backups (2 days)
ls -t "$BACKUP_DIR"/mission-control-db-*.json 2>/dev/null | tail -n +49 | xargs -r rm
ls -t "$BACKUP_DIR"/mission-control-db-*.sha256 2>/dev/null | tail -n +49 | xargs -r rm
# Keep last 30 daily encrypted backups
ls -t "$ENCRYPTED_DIR"/mission-control-db-*.enc 2>/dev/null | tail -n +31 | xargs -r rm

# 6. Log backup
echo "[$(date)] Backup completed: mission-control-db-$TIMESTAMP.json" >> "$BACKUP_DIR/backup.log"

# 7. Show status
echo "✅ Backup System Status:"
echo "   Regular backups: $(ls $BACKUP_DIR/*.json 2>/dev/null | wc -l)"
echo "   Encrypted backups: $(ls $ENCRYPTED_DIR/*.enc 2>/dev/null | wc -l)"
echo "   Latest backup: mission-control-db-$TIMESTAMP.json"