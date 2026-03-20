import express from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';
import { spawn } from 'child_process';
import dotenv from 'dotenv';
dotenv.config();

const app = express();
const httpServer = createServer(app);
const io = new Server(httpServer, { cors: { origin: "*" } });

const ADMIN_USER = process.env.ADMIN_USER;
const ADMIN_PASS = process.env.ADMIN_PASS;
const PORT = process.env.PORT || 8080;

app.get('/', (req, res) => {
    res.send('<h1>✅ Winnux Cloud Engine: ONLINE</h1>');
});

let stats = {
    status: "Healthy (Cloud)", ping_count: 0, last_ping: "Railway 24/7",
    targets_status: { App: "ONLINE", Bridge: "ONLINE", API: "MERGED", SSH: "CLOUD" },
    next_ping: 30, server_uptime: 0
};

setInterval(() => {
    stats.server_uptime += 1;
    if (stats.next_ping > 0) stats.next_ping -= 1;
    else stats.next_ping = 30;
    io.emit('live_update', stats);
}, 1000);

io.on('connection', (socket) => {
  socket.setMaxListeners(0);
  let shell = null;
  
  socket.on('auth', (data) => {
    if (!ADMIN_USER || !ADMIN_PASS) {
      socket.emit('output', '\r\n❌ ERROR: ENV Kredensial tidak ditemukan!\r\n');
      return;
    }

    if (data.user === ADMIN_USER && data.pass === ADMIN_PASS) {
      socket.emit('output', '\r\n✅ LOGIN SUKSES! Sinkronisasi Folder...\r\n');
      
      // AUTO-DETECT: Mencari folder aktif saat ini agar tidak error getcwd()
      const rootDir = process.cwd();

      shell = spawn('bash', [], {
        cwd: rootDir,
        env: { ...process.env, TERM: 'xterm-256color' },
        shell: true
      });

      shell.stdout.on('data', (d) => socket.emit('output', d.toString()));
      shell.stderr.on('data', (d) => socket.emit('output', d.toString()));
      socket.on('input', (i) => { if(shell) shell.stdin.write(i + '\n'); });
      socket.emit('authenticated', true);
    } else {
      socket.emit('output', '\r\n❌ LOGIN GAGAL!\r\n');
    }
  });

  socket.on('disconnect', () => { if(shell) shell.kill(); });
});

httpServer.listen(PORT, () => console.log('🔐 Secured Bridge Finalized'));
