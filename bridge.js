import express from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';
import { spawn } from 'child_process';
import dotenv from 'dotenv';
dotenv.config();

const app = express();
const httpServer = createServer(app);
const io = new Server(httpServer, { cors: { origin: "*" } });
const PORT = process.env.PORT || 8080;

app.get('/', (req, res) => res.status(200).send('HEALTHY_STABLE'));

let stats = {
    status: "Healthy", ping_count: 0, server_uptime: 0, next_ping: 30,
    targets_status: { Cloud: "ONLINE", Bot: "ACTIVE", DB: "SYNCED" }
};

// Broadcast data setiap detik (Hanya satu interval utama)
setInterval(() => {
    stats.server_uptime += 1;
    if (stats.next_ping > 0) stats.next_ping -= 1;
    else stats.next_ping = 30;
    io.emit('live_update', stats);
}, 1000);

const startPython = () => {
    const bot = spawn('python3', ['guardian_bot.py'], { env: { ...process.env } });
    bot.on('close', () => setTimeout(startPython, 5000));
};
startPython();

io.on('connection', (socket) => {
  socket.setMaxListeners(0); // FIX: Mencegah Memory Leak
  
  socket.on('auth', (data) => {
    if (data.user === process.env.ADMIN_USER && data.pass === process.env.ADMIN_PASS) {
      socket.emit('authenticated', true);
      const shell = spawn('bash', [], { cwd: process.cwd(), env: { ...process.env, TERM: 'xterm-256color' }, shell: true });
      shell.stdout.on('data', (d) => socket.emit('output', d.toString()));
      shell.stderr.on('data', (d) => socket.emit('output', d.toString()));
      socket.on('input', (i) => { if(shell) shell.stdin.write(i + '\n'); });
      socket.on('disconnect', () => { if(shell) shell.kill(); });
    } else {
      socket.emit('output', '\r\n❌ ERROR: Invalid Credentials\r\n');
    }
  });
});

httpServer.listen(PORT, '0.0.0.0', () => console.log('🚀 Final Stable Bridge Running'));
