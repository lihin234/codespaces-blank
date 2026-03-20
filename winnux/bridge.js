import express from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';
import { spawn } from 'child_process';

const app = express();
const httpServer = createServer(app);
const io = new Server(httpServer, { cors: { origin: "*" } });

io.on('connection', (socket) => {
  const shell = spawn('bash', [], {
    env: { ...process.env, TERM: 'xterm-256color' },
    shell: true
  });
  shell.stdout.on('data', (data) => socket.emit('output', data.toString()));
  shell.stderr.on('data', (data) => socket.emit('output', data.toString()));
  socket.on('input', (input) => shell.stdin.write(input + '\n'));
  socket.on('disconnect', () => shell.kill());
});

httpServer.listen(3001, () => console.log('🚀 Terminal Bridge on 3001'));
