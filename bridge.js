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

// 1. RESPONS INSTAN UNTUK RAILWAY HEALTHCHECK
app.get('/', (req, res) => { res.status(200).send('HEALTHY'); });

// 2. LIVE MONITOR DATA
let stats = {
    status: "Healthy", ping_count: 0, 
    targets_status: { Cloud: "ONLINE", Bot: "STARTING" },
    next_ping: 30, server_uptime: 0
};
setInterval(() => { stats.server_uptime += 1; io.emit('live_update', stats); }, 1000);

// 3. MENYALAKAN PYTHON SEBAGAI CHILD PROCESS (SLAVE)
const startPythonBot = () => {
    const bot = spawn('python3', ['guardian_bot.py']);
    bot.stdout.on('data', (data) => console.log(`[Python]: ${data}`));
    bot.stderr.on('data', (data) => console.error(`[Python Error]: ${data}`));
    bot.on('close', (code) => {
        console.log(`Python bot exited with code ${code}. Restarting...`);
        setTimeout(startPythonBot, 5000);
    });
};
startPythonBot();

// 4. TERMINAL SOCKET ENGINE
io.on('connection', (socket) => {
  socket.setMaxListeners(0);
  let shell = null;
  socket.on('auth', (data) => {
    if (data.user === process.env.ADMIN_USER && data.pass === process.env.ADMIN_PASS) {
      socket.emit('authenticated', true);
      shell = spawn('bash', [], { cwd: process.cwd(), env: { ...process.env, TERM: 'xterm-256color' }, shell: true });
      shell.stdout.on('data', (d) => socket.emit('output', d.toString()));
      shell.stderr.on('data', (d) => socket.emit('output', d.toString()));
      socket.on('input', (i) => { if(shell) shell.stdin.write(i + '\n'); });
    }
  });
  socket.on('disconnect', () => { if(shell) shell.kill(); });
});

httpServer.listen(PORT, '0.0.0.0', () => {
    console.log(`🚀 Master Bridge active on port ${PORT}`);
});
