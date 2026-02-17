#!/bin/bash
#
# Data Integrity Check - Validate Data File Checksums
# TASK-CI-008: Error Recovery System
#
# This script validates data files against stored checksums and
# automatically restores from backup if corruption is detected.
#

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
WORKSPACE_DIR="$(dirname "$SCRIPT_DIR")"
DATA_DIR="${WORKSPACE_DIR}/data"
BACKUP_DIR="${DATA_DIR}/backups"
LOG_DIR="${WORKSPACE_DIR}/logs"

CHECKSUM_FILE="${DATA_DIR}/.checksums.json"
CHECKSUM_ALGO="sha256"
AUTO_RESTORE="${AUTO_RESTORE:-true}"
ALERT_WEBHOOK="${ALERT_WEBHOOK:-}"
ADMIN_CONTACT="${ADMIN_CONTACT:-EricF}"

mkdir -p "$DATA_DIR" "$BACKUP_DIR" "$LOG_DIR"

LOG_FILE="${LOG_DIR}/integrity-check.log"

log() {
    local level="$1"
    local message="$2"
    local timestamp
    timestamp=$(date -Iseconds)
    echo "[$timestamp] [$level] $message" | tee -a "$LOG_FILE"
}

info() { log "INFO" "$1"; }
warn() { log "WARN" "$1"; }
error() { log "ERROR" "$1"; }
alert() {
    local level="$1"
    local message="$2"
    log "ALERT" "[$level] $message"
    if [[ -n "$ALERT_WEBHOOK" ]]; then
        curl -s -X POST -H "Content-Type: application/json" \
            -d "{\"level\":\"$level\",\"message\":\"$message\",\"timestamp\":\"$(date -Iseconds)\",\"source\":\"data-integrity-check\"}" \
            "$ALERT_WEBHOOK" 2>/dev/null || true
    fi
    if [[ "$level" == "CRITICAL" ]]; then
        echo "🚨 CRITICAL: $message" >&2
    fi
}

calculate_checksum() {
    local file="$1"
    if [[ -f "$file" ]]; then
        sha256sum "$file" | awk '{print $1}'
    else
        echo ""
    fi
}

generate_checksums() {
    local dir="${1:-$DATA_DIR}"
    
    python3 - "$dir" "$CHECKSUM_ALGO" << 'PYEOF' 2>/dev/null
import os
import sys
import json
import hashlib

data_dir = sys.argv[1]
algo = sys.argv[2]
checksums = {}

for root, dirs, files in os.walk(data_dir):
    # Skip hidden and backup directories
    dirs[:] = [d for d in dirs if not d.startswith('.') and d != 'backups']
    
    for filename in files:
        if filename.startswith('.') or filename == '.checksums.json':
            continue
        
        filepath = os.path.join(root, filename)
        relpath = os.path.relpath(filepath, data_dir)
        
        try:
            with open(filepath, 'rb') as f:
                file_hash = hashlib.sha256(f.read()).hexdigest()
            checksums[relpath] = {
                'checksum': file_hash,
                'algorithm': algo,
                'timestamp': int(os.path.getmtime(filepath))
            }
        except Exception as e:
            pass

print(json.dumps(checksums, indent=2))
PYEOF
}

save_checksums() {
    local checksums="$1"
    echo "$checksums" > "$CHECKSUM_FILE"
}

load_checksums() {
    if [[ -f "$CHECKSUM_FILE" ]]; then
        cat "$CHECKSUM_FILE"
    else
        echo "{}"
    fi
}

create_backup() {
    local file="$1"
    local full_path="${DATA_DIR}/${file}"
    
    if [[ ! -f "$full_path" ]]; then
        warn "Cannot backup non-existent file: $file"
        return 1
    fi
    
    local backup_subdir
    backup_subdir="${BACKUP_DIR}/$(dirname "$file")"
    mkdir -p "$backup_subdir"
    
    local timestamp
    timestamp=$(date +%Y%m%d-%H%M%S)
    local backup_path="${backup_subdir}/$(basename "$file").${timestamp}.bak"
    
    cp "$full_path" "$backup_path"
    info "Backup created: $file -> $backup_path"
    
    # Keep only last 10 backups per file
    local pattern
    pattern="${backup_subdir}/$(basename "$file").*.bak"
    ls -t $pattern 2>/dev/null | tail -n +11 | xargs -r rm -f
    
    echo "$backup_path"
}

restore_from_backup() {
    local file="$1"
    local backup_pattern
    backup_pattern="${BACKUP_DIR}/${file}.*.bak"
    
    local latest_backup
    latest_backup=$(ls -t $backup_pattern 2>/dev/null | head -1 || true)
    
    if [[ -z "$latest_backup" ]]; then
        warn "No backup found for: $file"
        return 1
    fi
    
    local target_path="${DATA_DIR}/${file}"
    mkdir -p "$(dirname "$target_path")"
    
    cp "$latest_backup" "$target_path"
    info "Restored from backup: $latest_backup -> $file"
    
    return 0
}

validate_integrity() {
    local auto_restore="${1:-$AUTO_RESTORE}"
    
    if [[ ! -f "$CHECKSUM_FILE" ]]; then
        warn "No checksums found. Run 'init' first."
        return 1
    fi
    
    info "Starting data integrity validation"
    
    python3 - "$DATA_DIR" "$CHECKSUM_FILE" "$auto_restore" "$BACKUP_DIR" << 'PYEOF'
import os
import sys
import json
import hashlib

data_dir = sys.argv[1]
checksum_file = sys.argv[2]
auto_restore = sys.argv[3] == 'true'
backup_dir = sys.argv[4]

results = {
    'timestamp': '',
    'valid': [],
    'corrupted': [],
    'missing': [],
    'new': [],
    'restored': [],
    'errors': []
}

# Load stored checksums
with open(checksum_file, 'r') as f:
    stored = json.load(f)

# Check stored files
for rel_path, stored_info in stored.items():
    full_path = os.path.join(data_dir, rel_path)
    
    if not os.path.exists(full_path):
        results['missing'].append(rel_path)
        if auto_restore:
            # Try to restore
            import glob
            pattern = os.path.join(backup_dir, rel_path + '.*.bak')
            backups = sorted(glob.glob(pattern), reverse=True)
            if backups:
                os.makedirs(os.path.dirname(full_path), exist_ok=True)
                import shutil
                shutil.copy2(backups[0], full_path)
                results['restored'].append(rel_path)
        continue
    
    try:
        with open(full_path, 'rb') as f:
            current_checksum = hashlib.sha256(f.read()).hexdigest()
        
        if current_checksum != stored_info['checksum']:
            results['corrupted'].append({
                'file': rel_path,
                'expected': stored_info['checksum'],
                'actual': current_checksum
            })
            if auto_restore:
                import glob
                pattern = os.path.join(backup_dir, rel_path + '.*.bak')
                backups = sorted(glob.glob(pattern), reverse=True)
                if backups:
                    import shutil
                    shutil.copy2(backups[0], full_path)
                    results['restored'].append(rel_path)
        else:
            results['valid'].append(rel_path)
    except Exception as e:
        results['errors'].append({'file': rel_path, 'error': str(e)})

# Find new files
for root, dirs, files in os.walk(data_dir):
    dirs[:] = [d for d in dirs if not d.startswith('.') and d != 'backups']
    for filename in files:
        if filename.startswith('.') or filename == '.checksums.json':
            continue
        filepath = os.path.join(root, filename)
        rel_path = os.path.relpath(filepath, data_dir)
        if rel_path not in stored:
            results['new'].append(rel_path)

print(json.dumps(results, indent=2))

# Exit with error if issues remain
if results['corrupted'] or results['missing']:
    sys.exit(1)
PYEOF
}

cmd_init() {
    info "Initializing data integrity system"
    
    if [[ -f "$CHECKSUM_FILE" ]]; then
        cp "$CHECKSUM_FILE" "${CHECKSUM_FILE}.$(date +%Y%m%d-%H%M%S).bak"
    fi
    
    local checksums
    checksums=$(generate_checksums 2>/dev/null)
    save_checksums "$checksums"
    
    local count
    count=$(echo "$checksums" | python3 -c "import sys, json; print(len(json.load(sys.stdin)))")
    info "Initialized checksums for $count files"
}

cmd_check() {
    validate_integrity "$AUTO_RESTORE"
}

cmd_backup() {
    local file="${1:-}"
    
    if [[ -n "$file" ]]; then
        create_backup "$file"
    else
        local stored_checksums
        stored_checksums=$(load_checksums)
        
        local files
        files=$(echo "$stored_checksums" | python3 -c "import sys, json; d=json.load(sys.stdin); print('\\n'.join(d.keys()))")
        
        while IFS= read -r f; do
            if [[ -n "$f" && -f "${DATA_DIR}/${f}" ]]; then
                create_backup "$f"
            fi
        done <<< "$files"
    fi
}

cmd_restore() {
    local file="$1"
    
    if [[ -z "$file" ]]; then
        echo "Usage: $0 restore <file-path>"
        exit 1
    fi
    
    restore_from_backup "$file"
}

cmd_status() {
    echo "Data Integrity Check Status"
    echo "==========================="
    echo ""
    echo "Configuration:"
    echo "  Data Directory: $DATA_DIR"
    echo "  Backup Directory: $BACKUP_DIR"
    echo "  Checksum File: $CHECKSUM_FILE"
    echo "  Algorithm: $CHECKSUM_ALGO"
    echo "  Auto-restore: $AUTO_RESTORE"
    echo ""
    
    if [[ -f "$CHECKSUM_FILE" ]]; then
        local count
        count=$(load_checksums | python3 -c "import sys, json; print(len(json.load(sys.stdin)))")
        local last_update
        last_update=$(stat -c %y "$CHECKSUM_FILE" 2>/dev/null || stat -f %Sm "$CHECKSUM_FILE" 2>/dev/null || echo "unknown")
        
        echo "Checksum Database:"
        echo "  Files tracked: $count"
        echo "  Last updated: $last_update"
    else
        echo "Checksum Database: Not initialized"
    fi
    
    echo ""
    echo "Backups:"
    local backup_count
    backup_count=$(find "$BACKUP_DIR" -type f 2>/dev/null | wc -l)
    echo "  Total backups: $backup_count"
}

cmd_update() {
    info "Updating checksums for modified files"
    
    local stored_checksums
    stored_checksums=$(load_checksums)
    
    python3 - "$DATA_DIR" "$stored_checksums" "$CHECKSUM_ALGO" << 'PYEOF'
import os
import sys
import json
import hashlib

data_dir = sys.argv[1]
stored = json.loads(sys.argv[2])
algo = sys.argv[3]
updated = dict(stored)

for rel_path, info in stored.items():
    full_path = os.path.join(data_dir, rel_path)
    if os.path.exists(full_path):
        with open(full_path, 'rb') as f:
            current = hashlib.sha256(f.read()).hexdigest()
        if current != info['checksum']:
            print(f"Updating checksum for: {rel_path}", file=sys.stderr)
            updated[rel_path] = {
                'checksum': current,
                'algorithm': algo,
                'timestamp': int(os.path.getmtime(full_path))
            }

print(json.dumps(updated, indent=2))
PYEOF
}

main() {
    local cmd="${1:-help}"
    
    case "$cmd" in
        init)
            cmd_init
            ;;
        check)
            cmd_check
            ;;
        backup)
            cmd_backup "$2"
            ;;
        restore)
            cmd_restore "$2"
            ;;
        status)
            cmd_status
            ;;
        update)
            cmd_update
            ;;
        help|--help|-h)
            cat << 'EOF'
Data Integrity Check - Validate Data File Checksums
TASK-CI-008: Error Recovery System

Usage: ./data-integrity-check.sh <command> [options]

Commands:
  init                    Initialize checksum database
  check                   Validate all files against checksums
  backup [file]           Create backup of specific or all files
  restore <file>          Restore file from backup
  status                  Show integrity system status
  update                  Update checksums for modified files
  help                    Show this help message

Environment Variables:
  AUTO_RESTORE            Auto-restore corrupted files (default: true)
  ALERT_WEBHOOK           Webhook URL for alerts
  ADMIN_CONTACT           Admin contact for escalations (default: EricF)

Examples:
  ./data-integrity-check.sh init
  ./data-integrity-check.sh check
  ./data-integrity-check.sh backup important-data.json
  ./data-integrity-check.sh restore important-data.json

Cron Setup:
  0 * * * * /path/to/data-integrity-check.sh check
EOF
            ;;
        *)
            error "Unknown command: $cmd"
            echo "Use '$0 help' for usage information"
            exit 1
            ;;
    esac
}

main "$@"
