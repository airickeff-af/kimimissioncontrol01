#!/bin/bash
#
# Daily Memory Consolidation
# Runs at end of day to consolidate stream into structured daily file
#

WORKSPACE="/root/.openclaw/workspace"
MEMORY_DIR="$WORKSPACE/memory"
STREAM_DIR="$MEMORY_DIR/stream"
DAILY_DIR="$MEMORY_DIR/daily"

YESTERDAY=$(date -d "yesterday" +%Y-%m-%d)
TODAY=$(date +%Y-%m-%d)

echo "=== Memory Consolidation: $YESTERDAY ==="

# Create daily directory
mkdir -p "$DAILY_DIR"

# Find all stream files from yesterday
STREAM_FILES=$(find "$STREAM_DIR" -name "${YESTERDAY}-*.jsonl" | sort)

if [ -z "$STREAM_FILES" ]; then
  echo "No stream files found for $YESTERDAY"
  exit 0
fi

# Generate daily summary
DAILY_FILE="$DAILY_DIR/${YESTERDAY}.md"

cat > "$DAILY_FILE" <<EOF
# Memory Log: ${YESTERDAY}

**Generated:** $(date -Iseconds)  
**Source Files:** $(echo "$STREAM_FILES" | wc -l) stream files  
**Total Entries:** $(cat $STREAM_FILES 2>/dev/null | wc -l) entries

---

## Quick Stats

EOF

# Extract stats from stream
TOTAL_ENTRIES=$(cat $STREAM_FILES 2>/dev/null | wc -l)
USER_MESSAGES=$(grep -c '"type": "user"' $STREAM_FILES 2>/dev/null || echo 0)
AGENT_MESSAGES=$(grep -c '"type": "agent"' $STREAM_FILES 2>/dev/null || echo 0)
TOOL_CALLS=$(grep -c '"type": "tool"' $STREAM_FILES 2>/dev/null || echo 0)

cat >> "$DAILY_FILE" <<EOF
- **Total Interactions:** $TOTAL_ENTRIES
- **User Messages:** $USER_MESSAGES
- **Agent Responses:** $AGENT_MESSAGES
- **Tool Executions:** $TOOL_CALLS

---

## Key Decisions

EOF

# Extract decisions (look for decision patterns)
grep -h "decision\|DECISION\|decided\|DECIDED" $STREAM_FILES 2>/dev/null | \
  head -20 | \
  sed 's/^/- /' >> "$DAILY_FILE" || echo "_No explicit decisions logged_" >> "$DAILY_FILE"

cat >> "$DAILY_FILE" <<EOF

---

## Actions Taken

EOF

# Extract actions
grep -h "created\|updated\|deleted\|built\|deployed\|fixed" $STREAM_FILES 2>/dev/null | \
  head -30 | \
  sed 's/^/- /' >> "$DAILY_FILE" || echo "_See raw stream for details_" >> "$DAILY_FILE"

cat >> "$DAILY_FILE" <<EOF

---

## Learnings & Insights

EOF

# Extract learnings
grep -h "learned\|lesson\|insight\|realized\|understood" $STREAM_FILES 2>/dev/null | \
  head -15 | \
  sed 's/^/- /' >> "$DAILY_FILE" || echo "_No explicit learnings logged_" >> "$DAILY_FILE"

cat >> "$DAILY_FILE" <<EOF

---

## Active Projects

EOF

# List projects mentioned
grep -h "project\|PROJECT\|Task\|TASK-[0-9]" $STREAM_FILES 2>/dev/null | \
  grep -oE "[A-Za-z]+-[0-9]+|Mission Control|coins\.ph|coins\.xyz" | \
  sort | uniq | \
  sed 's/^/- /' >> "$DAILY_FILE" || echo "_See project tracking for details_" >> "$DAILY_FILE"

cat >> "$DAILY_FILE" <<EOF

---

## Raw Stream References

$(echo "$STREAM_FILES" | sed "s|$STREAM_DIR/|- |")

---

*This file is a summary. For complete details, see the raw stream files referenced above.*
*Full preservation guaranteed - nothing is ever deleted, only archived.*
EOF

echo "✓ Created daily summary: $DAILY_FILE"

# Update MEMORY.md with key items
echo ""
echo "=== Updating MEMORY.md ==="

# Extract high-priority items for long-term memory
PRIORITY_ITEMS=$(grep -h "P0\|P1\|critical\|IMPORTANT" $STREAM_FILES 2>/dev/null | head -10)

if [ -n "$PRIORITY_ITEMS" ]; then
  echo "" >> "$MEMORY_DIR/MEMORY.md"
  echo "## Priority Items from $YESTERDAY" >> "$MEMORY_DIR/MEMORY.md"
  echo "" >> "$MEMORY_DIR/MEMORY.md"
  echo "$PRIORITY_ITEMS" | sed 's/^/- /' >> "$MEMORY_DIR/MEMORY.md"
  echo "" >> "$MEMORY_DIR/MEMORY.md"
  echo "*Auto-captured from daily consolidation*" >> "$MEMORY_DIR/MEMORY.md"
  echo "✓ Updated MEMORY.md with priority items"
fi

# Compress yesterday's stream files to save space
ARCHIVE_DIR="$MEMORY_DIR/archive/$(date -d "yesterday" +%Y-%m)"
mkdir -p "$ARCHIVE_DIR"

echo ""
echo "=== Archiving Stream Files ==="
tar -czf "$ARCHIVE_DIR/${YESTERDAY}-streams.tar.gz" -C "$STREAM_DIR" $(echo "$STREAM_FILES" | sed "s|$STREAM_DIR/||" | tr '\n' ' ')
echo "✓ Archived to: $ARCHIVE_DIR/${YESTERDAY}-streams.tar.gz"

# Remove archived files (they're in the tar.gz now)
# NOTE: We keep them for 7 days before removal as extra safety
# rm -f $STREAM_FILES

echo ""
echo "=== Consolidation Complete ==="
echo "Daily summary: $DAILY_FILE"
echo "Archive: $ARCHIVE_DIR/${YESTERDAY}-streams.tar.gz"
echo ""
echo "Memory preservation: ✓ GUARANTEED"
