import express from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';
import { spawn } from 'child_process';
import dotenv from 'dotenv';
dotenv.config();

const app = express();
const httpServer = createServer(app);
const io = new Server(httpServer, { cors: { origin: "*" } });

// RAILWAY MEMBERIKAN PORT LEWAT ENV
const PORT = process.env.PORT || 8080;

app.get('/', (req, res) => { res.send('HEALTHY'); });

io.on('connection', (socket) => {
  socket.on('auth', (data) => {
    if (data.user === process.env.ADMIN_USER && data.pass === process.env.ADMIN_PASS) {
      socket.emit('authenticated', true);
      const shell = spawn('bash', [], { env: { ...process.env, TERM: 'xterm-256color' }, shell: true });
      shell.stdout.on('data', (d) => socket.emit('output', d.toString()));
      shell.stderr.on('data', (d) => socket.emit('output', d.toString()));
      socket.on('input', (i) => { if(shell) shell.stdin.write(i + '\n'); });
    }
  });
});

// WAJIB BIND KE 0.0.0.0 AGAR TERDETEKSI RAILWAY
httpServer.listen(PORT, '0.0.0.0', () => {
  console.log('Server online on port ' + PORT);
});
