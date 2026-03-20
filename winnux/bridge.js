import express from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';
import { spawn } from 'child_process';
import dotenv from 'dotenv';

// Load file .env
dotenv.config();

const app = express();
const httpServer = createServer(app);
const io = new Server(httpServer, { cors: { origin: "*" } });

// Ambil dari .env, jika tidak ada pakai default (untuk keamanan)
const ADMIN_USER = process.env.ADMIN_USER || "superadmin_secret_123";
const ADMIN_PASS = process.env.ADMIN_PASS || "password_rahasia_banget_99";

io.on('connection', (socket) => {
  let shell = null;

  socket.on('auth', (data) => {
    if (data.user === ADMIN_USER && data.pass === ADMIN_PASS) {
      socket.emit('output', '\r\n✅ LOGIN BERHASIL. Memulai Bash...\r\n');
      
      shell = spawn('bash', [], {
        env: { ...process.env, TERM: 'xterm-256color' },
        shell: true
      });

      shell.stdout.on('data', (data) => socket.emit('output', data.toString()));
      shell.stderr.on('data', (data) => socket.emit('output', data.toString()));
      
      socket.on('input', (input) => {
        if (shell) shell.stdin.write(input + '\n');
      });

      socket.emit('authenticated', true);
    } else {
      socket.emit('output', '\r\n❌ LOGIN GAGAL. Akses Ditolak!\r\n');
      socket.disconnect();
    }
  });

  socket.on('disconnect', () => {
    if (shell) shell.kill();
  });
});

httpServer.listen(3001, () => console.log('🔐 Secured Bridge with ENV Active'));
