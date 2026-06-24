const { spawn } = require('child_process');
const path = require('path');

console.log('\x1b[33m%s\x1b[0m', '🔥 PyroVision Single Server Launcher starting...');

// Paths
const apiDir = path.join(__dirname, '../../api');
const frontendDir = path.join(__dirname, '..');

// 1. Start Python API Backend
console.log('\x1b[36m%s\x1b[0m', '🚀 Launching ML API Backend...');
const apiProcess = spawn('python', ['unified_server.py'], {
  cwd: apiDir,
  shell: true,
  stdio: ['inherit', 'pipe', 'pipe'] 
});

function filterAndWrite(data) {
  let lines = data.toString().split('\n');
  for (const line of lines) {
    // Suppress the FastAPI/Uvicorn links entirely
    if (!line.includes('http://127.0.0.1:8000') && !line.includes('http://0.0.0.0:8000') && !line.includes('Uvicorn running on')) {
      if (line.trim()) {
        process.stdout.write(line + '\n');
      }
    }
  }
}

apiProcess.stdout.on('data', filterAndWrite);
apiProcess.stderr.on('data', filterAndWrite);

// 2. Start Next.js Frontend
console.log('\x1b[36m%s\x1b[0m', '🚀 Launching Next.js Frontend...');
const frontendProcess = spawn('npm', ['run', 'dev:next'], {
  cwd: frontendDir,
  shell: true,
  stdio: 'inherit'
});

// Clean up on exit
process.on('SIGINT', () => {
  apiProcess.kill();
  frontendProcess.kill();
  process.exit(0);
});

process.on('SIGTERM', () => {
  apiProcess.kill();
  frontendProcess.kill();
  process.exit(0);
});
