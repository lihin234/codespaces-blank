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

app.get('/', (req, res) => { res.status(200).send('HEALTHY'); });

// --- SMART ORCHESTRATOR ---
const startPython = () => {
    console.log("🛡️ Initializing Guardian Slave...");
    const bot = spawn('python3', ['guardian_bot.py'], { env: { ...process.env } });
    
    bot.stdout.on('data', (d) => console.log(`[Python]: ${d}`));
    bot.stderr.on('data', (d) => {
        const err = d.toString();
        if (err.includes("Conflict")) {
            console.error("⚠️ CONFLICT DETECTED. Killing process to prevent loop.");
            bot.kill();
        }
        console.error(`[Python Err]: ${err}`);
    });

    bot.on('close', (code) => {
        // JEDA 15 DETIK: Memberikan waktu bagi Telegram API untuk menutup sesi lama
        console.log(`System: Python exited (${code}). Waiting 15s for session cleanup...`);
        setTimeout(startPython, 15000);
    });
};
startPython();

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

httpServer.listen(PORT, '0.0.0.0', () => console.log(`🚀 Master Online on ${PORT}`));
