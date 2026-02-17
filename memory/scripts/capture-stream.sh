#!/bin/bash
#
# Real-Time Memory Stream Capture
# Appends every interaction to timestamped files
# Never loses data - append-only architecture
#

MEMORY_STREAM_DIR="/root/.openclaw/workspace/memory/stream"
mkdir -p "$MEMORY_STREAM_DIR"

# Current date for file naming
DATE_HOUR=$(date +%Y-%m-%d-%H)
STREAM_FILE="$MEMORY_STREAM_DIR/${DATE_HOUR}.jsonl"

# Create entry with timestamp
ENTRY=$(cat <<EOF
{
  "timestamp": "$(date -Iseconds)",
  "unix_ms": $(date +%s%3N),
  "session": "$OPENCLAW_SESSION_KEY",
  "type": "$1",
  "data": $2
}
EOF
)

# Append to stream file
echo "$ENTRY" >> "$STREAM_FILE"

# Ensure file is synced to disk
sync "$STREAM_FILE"

# Output confirmation for logging
echo "[MEMORY] Captured $1 at $(date +%H:%M:%S)"
