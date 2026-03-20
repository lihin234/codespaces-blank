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

app.get('/', (req, res) => { res.send('OK'); });

// --- LIVE MONITOR ENGINE ---
let stats = {
    status: "Healthy", ping_count: 0, 
    targets_status: { App: "ONLINE", Bridge: "ONLINE", API: "ONLINE", SSH: "ONLINE" },
    next_ping: 30, server_uptime: 0
};
setInterval(() => {
    stats.server_uptime += 1;
    io.emit('live_update', stats);
}, 1000);

// --- POWERFUL PYTHON SPANNER ---
const startPythonBot = () => {
    console.log("Attempting to start Python Bot...");
    // Menggunakan 'python3' dan meneruskan semua variabel ENV
    const bot = spawn('python3', ['guardian_bot.py'], {
        env: { ...process.env } 
    });

    bot.stdout.on('data', (data) => console.log(`[Python]: ${data}`));
    bot.stderr.on('data', (data) => console.error(`[Python Err]: ${data}`));

    bot.on('close', (code) => {
        console.log(`Python process exited with code ${code}. Restarting in 5s...`);
        setTimeout(startPythonBot, 5000);
    });
};

startPythonBot();

io.on('connection', (socket) => {
  socket.on('auth', (data) => {
    if (data.user === process.env.ADMIN_USER && data.pass === process.env.ADMIN_PASS) {
      socket.emit('authenticated', true);
      const shell = spawn('bash', [], { cwd: process.cwd(), env: { ...process.env, TERM: 'xterm-256color' }, shell: true });
      shell.stdout.on('data', (d) => socket.emit('output', d.toString()));
      shell.stderr.on('data', (d) => socket.emit('output', d.toString()));
      socket.on('input', (i) => { if(shell) shell.stdin.write(i + '\n'); });
    }
  });
});

httpServer.listen(PORT, '0.0.0.0', () => console.log('Master Bridge Online on ' + PORT));
