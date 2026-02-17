# Agent Access Control Registry

## Active Agents
| Agent | Role | Status | Permissions | Last Verified |
|-------|------|--------|-------------|---------------|
| Cipher | Security | ACTIVE | Level 5 - Emergency override | 2026-02-17 07:09:00 |
| Nexus | Orchestrator | ACTIVE | Level 4 - Full system access | 2026-02-17 07:09:00 |
| Forge | Coder | ACTIVE | Level 3 - Execute commands | 2026-02-17 07:09:00 |
| Scout | Researcher | ACTIVE | Level 2 - Read/write workspace | 2026-02-17 07:09:00 |
| Buzz | Social | ACTIVE | Level 2 - Read/write workspace | 2026-02-17 07:09:00 |
| Gary | Specialist | ACTIVE | Level 2 - Read/write workspace | 2026-02-17 07:09:00 |
| Glasses | Specialist | ACTIVE | Level 2 - Read/write workspace | 2026-02-17 07:09:00 |
| Larry | Specialist | ACTIVE | Level 2 - Read/write workspace | 2026-02-17 07:09:00 |
| Pixel | Specialist | ACTIVE | Level 2 - Read/write workspace | 2026-02-17 07:09:00 |
| Quill | Specialist | ACTIVE | Level 2 - Read/write workspace | 2026-02-17 07:09:00 |
| Orchestrator | Coordinator | ACTIVE | Level 3 - Execute commands | 2026-02-17 07:09:00 |

## Permission Levels
- **Level 0:** Read-only system info
- **Level 1:** Read workspace files
- **Level 2:** Read/write workspace files
- **Level 3:** Execute commands (sandboxed)
- **Level 4:** Full system access (restricted)
- **Level 5:** Emergency override (Cipher only)

## Access Policies
1. All agent sessions must be authenticated
2. File access outside workspace requires justification
3. Privilege escalation is logged and audited
4. Emergency shutdown can be invoked by Cipher at any time
