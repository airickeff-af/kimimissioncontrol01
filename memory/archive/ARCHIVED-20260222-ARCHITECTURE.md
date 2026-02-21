---
ARCHIVED: 2026-02-22T03:00:01+08:00
ORIGINAL: ARCHITECTURE.md
TOKENS_EST: 693
ARCHIVED_BY: archive-old-sessions.sh
---

# Memory Preservation Architecture

## Problem Statement
- Main session context approaches 90% capacity (235k/262k tokens)
- Risk of losing important information during compression/archival
- Need to preserve EVERYTHING while optimizing storage

## Solution: Multi-Layer Memory System

### Layer 1: Real-Time Memory Capture (Immediate)
- Every message auto-saved to `memory/stream/YYYY-MM-DD-HH-MM-SS.jsonl`
- No filtering, no summarization - raw preservation
- Append-only, never overwrite

### Layer 2: Daily Consolidation (End of Day)
- Daily files in `memory/daily/YYYY-MM-DD.md`
- Structured: decisions, actions, learnings, todos
- Links to raw stream files

### Layer 3: Topic-Based Archives (Persistent)
- `memory/topics/agents.md` - Agent configurations, relationships
- `memory/topics/projects.md` - Active projects, milestones
- `memory/topics/decisions.md` - Key decisions with rationale
- `memory/topics/lessons.md` - Learnings, mistakes, insights
- `memory/topics/preferences.md` - EricF preferences, patterns

### Layer 4: Searchable Vector Index (Retrieval)
- Semantic search across all memory layers
- Configurable via `memory/config/vector-config.json`
- Cross-reference linking

### Layer 5: Cold Storage Backup (Disaster Recovery)
- Compressed archives: `memory/archive/YYYY-MM.tar.gz`
- Git repository with full history
- Optional: Remote backup to S3/cloud

## Implementation Priority

### P0 (Immediate - Today)
1. Create real-time stream capture
2. Set up topic-based archive structure
3. Configure automatic daily consolidation

### P1 (This Week)
4. Implement vector search indexing
5. Set up git-based versioning
6. Create memory query interface

### P2 (Next Week)
7. Automated compression of old streams
8. Cross-reference linking system
9. Memory health monitoring dashboard

## Key Principles

1. **Never Delete** - Only archive/compress, never remove
2. **Always Accessible** - Any memory retrievable within 10 seconds
3. **Self-Healing** - Automatic detection and repair of gaps
4. **Transparent** - EricF can see exactly what's stored where
5. **Redundant** - Critical info exists in 2+ locations

## Storage Optimization Without Loss

| Data Type | Hot Storage | Warm Storage | Cold Storage |
|-----------|-------------|--------------|--------------|
| Current Day | Full text | - | - |
| Last 7 Days | Summary + refs | Full text | - |
| Last 30 Days | Index only | Summary + refs | Full text |
| 30+ Days | Index only | Index only | Full text (compressed) |

## Query Interface

```bash
# Search all memory
nexus memory search "lead scoring algorithm"

# Get today's activity
nexus memory today

# Get specific date
nexus memory date 2026-02-17

# Get topic
nexus memory topic projects

# Get decision history
nexus memory decisions
```
