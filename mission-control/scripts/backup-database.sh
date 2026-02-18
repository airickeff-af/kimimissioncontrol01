#!/bin/bash
# Secure Database Backup Script
# With integrity checks and encryption

set -e

BACKUP_DIR="/root/.openclaw/workspace/mission-control/data/backups"
DB_FILE="/root/.openclaw/workspace/mission-control/dashboard/data/mission-control-db.json"
TIMESTAMP=$(date +"%Y%m%d_%H%M%S")
BACKUP_FILE="$BACKUP_DIR/backup_$TIMESTAMP.json"
ENCRYPTED_FILE="$BACKUP_DIR/backup_$TIMESTAMP.json.gpg"
CHECKSUM_FILE="$BACKUP_DIR/backup_$TIMESTAMP.sha256"

# Create backup directory if needed
mkdir -p "$BACKUP_DIR"

# Check if database exists
if [ ! -f "$DB_FILE" ]; then
    echo "❌ Database file not found: $DB_FILE"
    exit 1
fi

# Create backup
echo "📦 Creating backup..."
cp "$DB_FILE" "$BACKUP_FILE"

# Generate SHA256 checksum
echo "🔐 Generating checksum..."
sha256sum "$BACKUP_FILE" > "$CHECKSUM_FILE"

# Encrypt with GPG (if key exists)
if gpg --list-keys "Mission Control" >/dev/null 2>&1; then
    echo "🔒 Encrypting backup..."
    gpg --encrypt --recipient "Mission Control" --trust-model always \
        --output "$ENCRYPTED_FILE" "$BACKUP_FILE"
    rm "$BACKUP_FILE"  # Remove unencrypted version
    echo "✅ Encrypted backup: $ENCRYPTED_FILE"
else
    echo "⚠️  No GPG key found, keeping unencrypted backup"
    echo "✅ Backup: $BACKUP_FILE"
fi

# Verify integrity
echo "✓ Verifying integrity..."
sha256sum -c "$CHECKSUM_FILE"

# Cleanup old backups (keep last 24)
echo "🧹 Cleaning old backups..."
cd "$BACKUP_DIR"
ls -t backup_*.json* 2>/dev/null | tail -n +25 | xargs -r rm -f
ls -t backup_*.sha256 2>/dev/null | tail -n +25 | xargs -r rm -f

# Report
BACKUP_COUNT=$(ls -1 "$BACKUP_DIR"/backup_*.json* 2>/dev/null | wc -l)
echo ""
echo "✅ BACKUP COMPLETE"
echo "📁 Location: $BACKUP_DIR"
echo "📊 Total backups: $BACKUP_COUNT"
echo "🔒 Integrity: Verified"
echo "⏰ Next backup: $(date -d '+1 hour' +'%Y-%m-%d %H:%M')"
