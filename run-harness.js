const { spawn, execSync } = require('child_process');
const net = require('net');

const PORT = 8081;
const HOST = '127.0.0.1';

function isPortOpen(port, host) {
  return new Promise((resolve) => {
    const socket = new net.Socket();
    const onError = () => {
      socket.destroy();
      resolve(false);
    };
    socket.setTimeout(1000);
    socket.once('error', onError);
    socket.once('timeout', onError);
    socket.connect(port, host, () => {
      socket.end();
      resolve(true);
    });
  });
}

function delay(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function startServer() {
  console.log('Starting Expo Web dev server in the background...');
  // Start expo web on port 8081. Expo usually defaults to 8081, but we pass --port 8081 to be explicit.
  const serverProcess = spawn('npx', ['expo', 'start', '--web', '--port', PORT.toString(), '--clear'], {
    stdio: 'inherit',
    detached: false,
    shell: true,
  });

  // Wait for the port to open
  for (let i = 0; i < 30; i++) {
    await delay(1000);
    const success = await isPortOpen(PORT, HOST);
    if (success) {
      console.log('Expo Web dev server started successfully.');
      return serverProcess;
    }
  }

  throw new Error('Timeout waiting for Expo Web dev server to start.');
}

async function runTests() {
  console.log('Running Playwright tests...');
  return new Promise((resolve) => {
    const playwright = spawn('npx', ['playwright', 'test'], {
      stdio: 'inherit',
      shell: true,
    });

    playwright.on('exit', (code) => {
      resolve(code === 0);
    });
  });
}

async function main() {
  let serverProcess = null;
  try {
    console.log('Cleaning up port 8081...');
    try {
      execSync('lsof -t -i tcp:8081 | xargs kill -9 2>/dev/null || true');
    } catch (e) {}
    
    serverProcess = await startServer();
    const success = await runTests();
    if (success) {
      console.log('Harness check PASSED.');
      process.exit(0);
    } else {
      console.error('Harness check FAILED.');
      process.exit(1);
    }
  } catch (error) {
    console.error('Error running harness:', error);
    process.exit(1);
  }
}

main();
