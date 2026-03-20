import express from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';
import { spawn } from 'child_process';
import dotenv from 'dotenv';
dotenv.config();

const app = express();
const httpServer = createServer(app);
const io = new Server(httpServer, { cors: { origin: "*" } });

// Railway memberikan port lewat ENV, jika tidak ada pakai 8080
const PORT = process.env.PORT || 8080;

// RESPONS WAJIB UNTUK PROXY RAILWAY
app.get('/', (req, res) => {
    res.status(200).send('SERVER ONLINE');
});

// ENGINE LIVE MONITOR (Data yang dikirim ke Vercel)
let stats = {
    status: "Healthy", ping_count: 0, 
    targets_status: { Cloud: "ONLINE", Bot: "ACTIVE" },
    next_ping: 30, server_uptime: 0
};
setInterval(() => {
    stats.server_uptime += 1;
    io.emit('live_update', stats);
}, 1000);

// MENYALAKAN PYTHON (Budak)
const startPython = () => {
    console.log("Starting Python Guardian...");
    const bot = spawn('python3', ['guardian_bot.py'], { env: { ...process.env } });
    bot.stdout.on('data', (d) => console.log(`[Python]: ${d}`));
    bot.stderr.on('data', (d) => console.error(`[Python Error]: ${d}`));
    bot.on('close', () => setTimeout(startPython, 5000));
};
startPython();

// TERMINAL SOCKET
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

// PENTING: Gunakan '0.0.0.0' agar terdeteksi Railway
httpServer.listen(PORT, '0.0.0.0', () => {
    console.log(`🚀 MASTER BRIDGE ONLINE AT 0.0.0.0:${PORT}`);
});
