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

io.on('connection', (socket) => {
  // Mencegah error MaxListeners
  socket.setMaxListeners(0);
  let shell = null;

  socket.on('auth', (data) => {
    if (data.user === ADMIN_USER && data.pass === ADMIN_PASS) {
      socket.emit('output', '\r\n✅ LOGIN BERHASIL. Memulai Bash...\r\n');
      shell = spawn('bash', [], { env: { ...process.env, TERM: 'xterm-256color' }, shell: true });
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
httpServer.listen(3001, () => console.log('🔐 Bridge Secure Active'));
