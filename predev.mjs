// predev.mjs — runs automatically before `npm run dev`
// Kills any process occupying port 3000 so the dev server can always start cleanly.
import net from 'net';
import { execSync } from 'child_process';

const PORT = 3000;

function checkPort(port) {
  return new Promise((resolve) => {
    const tester = net.createServer()
      .once('error', (err) => {
        if (err.code === 'EADDRINUSE') {
          resolve(true);
        } else {
          resolve(false);
        }
      })
      .once('listening', () => {
        tester.once('close', () => resolve(false)).close();
      })
      .listen(port);
  });
}

async function main() {
  try {
    const inUse = await checkPort(PORT);
    if (!inUse) {
      console.log(`[predev] Port ${PORT} is free.`);
      return;
    }

    // Port is in use, find and kill the process on Windows
    try {
      const output = execSync(
        `powershell -NoProfile -Command "try { (Get-NetTCPConnection -LocalPort ${PORT} -ErrorAction Stop | Select-Object -ExpandProperty OwningProcess -Unique) } catch { '' }"`,
        { encoding: 'utf8' }
      ).trim();

      if (output) {
        const pids = output.split(/\r?\n/).map(p => p.trim()).filter(Boolean);
        for (const pid of pids) {
          try {
            execSync(`powershell -NoProfile -Command "Stop-Process -Id ${pid} -Force -ErrorAction SilentlyContinue"`);
            console.log(`[predev] Killed PID ${pid} on port ${PORT}`);
          } catch {}
        }
      }
    } catch {}
  } catch (err) {
    console.log(`[predev] Port check skipped: ${err.message}`);
  }
}

main();
