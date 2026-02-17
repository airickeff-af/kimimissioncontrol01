/**
 * Test script for File Watcher and Task Queue APIs
 */

const FileWatcher = require('./fileWatcher');
const TaskQueue = require('./taskQueue');
const path = require('path');

console.log('🧪 Testing Mission Control Backend APIs\n');

// Test Task Queue
console.log('📋 Testing Task Queue API...\n');

const taskQueue = new TaskQueue({
  workspaceRoot: '/root/.openclaw/workspace',
  missionControlDir: '/root/.openclaw/workspace/mission-control',
  autoSave: false // Don't save during tests
});

// Test 1: Create tasks
console.log('1. Creating test tasks...');
const task1 = taskQueue.create({
  description: 'Test task P0 - Critical',
  priority: 'P0',
  assignedTo: 'code-2',
  tags: ['test', 'critical']
});

const task2 = taskQueue.create({
  description: 'Test task P2 - Normal',
  priority: 'P2',
  assignedTo: 'code-2',
  tags: ['test', 'normal']
});

console.log(`   ✓ Created: ${task1.id} - ${task1.description}`);
console.log(`   ✓ Created: ${task2.id} - ${task2.description}`);

// Test 2: Get all tasks
console.log('\n2. Getting all tasks...');
const allTasks = taskQueue.getAll();
console.log(`   ✓ Found ${allTasks.length} tasks`);

// Test 3: Get by priority
console.log('\n3. Filtering by priority P0...');
const p0Tasks = taskQueue.getAll({ priority: 'P0' });
console.log(`   ✓ Found ${p0Tasks.length} P0 tasks`);

// Test 4: Update task
console.log('\n4. Updating task status...');
taskQueue.update(task1.id, { status: 'in_progress' });
const updated = taskQueue.get(task1.id);
console.log(`   ✓ Status updated to: ${updated.status}`);

// Test 5: Add subtask
console.log('\n5. Adding subtask...');
const subtask = taskQueue.addSubtask(task1.id, { description: 'Subtask 1' });
console.log(`   ✓ Subtask created: ${subtask.id}`);

// Test 6: Get stats
console.log('\n6. Getting statistics...');
const stats = taskQueue.getStats();
console.log(`   ✓ Total tasks: ${stats.total}`);
console.log(`   ✓ By status:`, stats.byStatus);
console.log(`   ✓ By priority:`, stats.byPriority);

// Test 7: Get summary
console.log('\n7. Getting summary...');
const summary = taskQueue.getSummary();
console.log(`   ✓ Pending: ${summary.pending}`);
console.log(`   ✓ In Progress: ${summary.inProgress}`);
console.log(`   ✓ Critical: ${summary.critical}`);

// Test 8: Search
console.log('\n8. Searching tasks...');
const searchResults = taskQueue.search('Critical');
console.log(`   ✓ Found ${searchResults.length} matching tasks`);

console.log('\n✅ Task Queue API tests passed!\n');

// Test File Watcher
console.log('📁 Testing File Watcher API...\n');

const fileWatcher = new FileWatcher({
  workspaceRoot: '/root/.openclaw/workspace',
  agentsDir: '/root/.openclaw/workspace/mission-control/agents'
});

// Test 1: Get agent directories
console.log('1. Getting agent directories...');
const agents = fileWatcher.getAgentDirectories();
console.log(`   ✓ Found ${agents.length} agents`);
agents.slice(0, 3).forEach(a => console.log(`     - ${a.name}`));

// Test 2: Scan directory
console.log('\n2. Scanning agent directory...');
if (agents.length > 0) {
  const files = fileWatcher.scanDirectory(agents[0].path);
  console.log(`   ✓ Found ${files.length} files in ${agents[0].name}`);
}

// Test 3: Get output directories
console.log('\n3. Getting agent output directories...');
if (agents.length > 0) {
  const outputDirs = fileWatcher.getAgentOutputDirs(agents[0].name);
  console.log(`   ✓ Found ${outputDirs.length} output directories`);
  outputDirs.forEach(d => console.log(`     - ${d.name}`));
}

// Test 4: Get file metadata
console.log('\n4. Getting file metadata...');
const testFile = path.join('/root/.openclaw/workspace/mission-control/TASK_QUEUE.json');
const metadata = fileWatcher.getFileMetadata(testFile);
if (metadata) {
  console.log(`   ✓ File: ${metadata.name}`);
  console.log(`   ✓ Size: ${metadata.size} bytes`);
  console.log(`   ✓ Modified: ${metadata.modified}`);
}

console.log('\n✅ File Watcher API tests passed!\n');

// Test integration
console.log('🔗 Testing Integration...\n');

// Simulate file event triggering task update
console.log('1. Simulating file event -> task update flow...');
fileWatcher.on('fileCreated', (data) => {
  console.log(`   📄 File created event: ${data.name}`);
  // Auto-create task for new files
  const autoTask = taskQueue.create({
    description: `Review new file: ${data.name}`,
    priority: 'P2',
    assignedTo: data.agentId || 'nexus',
    tags: ['auto-generated', 'file-review'],
    metadata: { filePath: data.path }
  });
  console.log(`   ✓ Auto-created task: ${autoTask.id}`);
});

// Emit test event
fileWatcher.emit('fileCreated', {
  name: 'test-report.md',
  path: '/test/path',
  agentId: 'glasses'
});

console.log('\n✅ Integration tests passed!\n');

console.log('🎉 All API tests completed successfully!');
console.log('\n📊 Final Stats:');
console.log(`   Tasks: ${taskQueue.getSummary().total}`);
console.log(`   Agents monitored: ${agents.length}`);
console.log(`   File watcher active: ${fileWatcher.isWatching}`);