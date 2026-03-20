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

// RESPONS UNTUK RAILWAY HEALTHCHECK (SANGAT PENTING)
app.get('/', (req, res) => {
    res.status(200).send('OK');
});

let stats = {
    status: "Healthy", ping_count: 0, 
    targets_status: { Cloud: "ONLINE", Bot: "ACTIVE" },
    next_ping: 30, server_uptime: 0
};

setInterval(() => {
    stats.server_uptime += 1;
    io.emit('live_update', stats);
}, 1000);

io.on('connection', (socket) => {
  socket.setMaxListeners(0);
  let shell = null;
  socket.on('auth', (data) => {
    if (data.user === ADMIN_USER && data.pass === ADMIN_PASS) {
      socket.emit('authenticated', true);
      shell = spawn('bash', [], { cwd: process.cwd(), env: { ...process.env, TERM: 'xterm-256color' }, shell: true });
      shell.stdout.on('data', (d) => socket.emit('output', d.toString()));
      shell.stderr.on('data', (d) => socket.emit('output', d.toString()));
      socket.on('input', (i) => { if(shell) shell.stdin.write(i + '\n'); });
    }
  });
  socket.on('disconnect', () => { if(shell) shell.kill(); });
});

// Bind ke 0.0.0.0 agar terdeteksi jaringan luar
httpServer.listen(PORT, '0.0.0.0', () => {
    console.log(`✅ Server is running on port ${PORT}`);
});
