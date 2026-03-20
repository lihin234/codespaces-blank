import React, { useState, useEffect, useRef } from 'react';
import { io } from 'socket.io-client';
import { Terminal as TerminalIcon, LayoutGrid, Activity, Clock, Zap, X } from 'lucide-react';

// --- KONFIGURASI MESIN CODESPACE ANDA ---
const CODESPACE_URL = "redesigned-fiesta-g5pvr5g9q5wcw7qv"; 

const TerminalContent = () => {
  const [history, setHistory] = useState(['--- Winnux Kernel v1.0.0 ---\n']);
  const [input, setInput] = useState('');
  const socketRef = useRef();
  const scrollRef = useRef();

  useEffect(() => {
    const backendUrl = `https://${CODESPACE_URL}-3001.app.github.dev`;
    socketRef.current = io(backendUrl, { transports: ['websocket'] });
    socketRef.current.on('output', (data) => setHistory(prev => [...prev, data]));
    return () => socketRef.current.disconnect();
  }, []);

  useEffect(() => {
    if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
  }, [history]);

  const handleCmd = (e) => {
    if (e.key === 'Enter') {
      socketRef.current.emit('input', input);
      setInput('');
    }
  };

  return (
    <div className="text-green-400 font-mono text-[10px] h-full flex flex-col overflow-hidden bg-black/20 p-2">
      <div ref={scrollRef} className="flex-1 overflow-auto whitespace-pre-wrap mb-2 leading-tight">{history.join('')}</div>
      <div className="flex border-t border-white/10 pt-2 shrink-0">
        <span className="text-blue-400 mr-2">linux@winnux:~$</span>
        <input autoFocus className="bg-transparent outline-none border-none flex-1 text-white" 
          value={input} onChange={(e) => setInput(e.target.value)} onKeyDown={handleCmd} />
      </div>
    </div>
  );
};

export default function App() {
  const [activeApp, setActiveApp] = useState(null);
  const [health, setHealth] = useState({ status: "Connecting", ping_count: 0, last_ping: "-", targets_status: {}, next_ping: 0, server_uptime: 0 });
  const socketRef = useRef();

  useEffect(() => {
    const apiUrl = `https://${CODESPACE_URL}-3002.app.github.dev`;
    socketRef.current = io(apiUrl, { transports: ['websocket'] });
    socketRef.current.on('live_update', (data) => setHealth(data));
    return () => socketRef.current.disconnect();
  }, []);

  const formatTime = (s) => {
    const mins = Math.floor(s / 60);
    const secs = s % 60;
    return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
  };

  return (
    <div className="h-screen w-screen overflow-hidden font-sans text-white bg-slate-950">
      <div className="p-6 h-full relative">
        <div className="absolute top-6 right-6 w-60 bg-black/80 backdrop-blur-3xl border border-white/10 rounded-3xl p-5 shadow-2xl border-t-4 border-t-blue-500 z-10">
          <div className="flex items-center justify-between mb-5">
            <div className="flex items-center gap-2">
              <Activity size={20} className="text-blue-400 animate-pulse" />
              <span className="text-[10px] font-black uppercase tracking-widest text-blue-100">Live Monitor</span>
            </div>
            <span className="text-[9px] bg-blue-500/20 text-blue-400 px-2 py-0.5 rounded-full font-bold text-white">VERCEL</span>
          </div>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div className="bg-white/5 p-3 rounded-2xl border border-white/5 text-center">
                <div className="text-[8px] text-gray-500 uppercase">Next Check</div>
                <div className="text-lg font-mono font-black text-blue-400">{formatTime(health.next_ping)}</div>
              </div>
              <div className="bg-white/5 p-3 rounded-2xl border border-white/5 text-center">
                <div className="text-[8px] text-gray-500 uppercase">Uptime</div>
                <div className="text-lg font-mono font-black text-green-400">{health.server_uptime}s</div>
              </div>
            </div>
            <div className="flex justify-between gap-2">
              {Object.entries(health.targets_status).map(([name, status]) => (
                <div key={name} className="flex-1 flex flex-col items-center py-2 bg-white/5 rounded-xl border border-white/5">
                  <span className="text-[7px] text-gray-500 font-bold">{name}</span>
                  <span className={`text-[8px] font-black ${status === "ONLINE" ? "text-green-400" : "text-red-500"}`}>{status}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
        <div className="flex flex-col items-center gap-1 w-20 cursor-pointer group" onClick={() => setActiveApp('terminal')}>
           <div className="p-4 rounded-3xl bg-white/5 border border-white/10 group-hover:bg-blue-500/20 transition-all">
            <TerminalIcon size={40} className="text-blue-100" />
           </div>
           <span className="text-[10px] font-bold mt-2 tracking-wide">Real Term</span>
        </div>
      </div>
      {activeApp === 'terminal' && (
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[95%] max-w-[700px] h-[450px] bg-black/90 backdrop-blur-3xl border border-white/20 rounded-xl shadow-2xl flex flex-col z-50 overflow-hidden">
          <div className="h-10 bg-white/5 flex items-center justify-between px-4 border-b border-white/10">
            <span className="text-xs font-bold">Bash Terminal (Remote)</span>
            <X size={18} onClick={() => setActiveApp(null)} className="cursor-pointer hover:text-red-500" />
          </div>
          <div className="flex-1 p-2 overflow-hidden"><TerminalContent /></div>
        </div>
      )}
      <div className="fixed bottom-0 w-full h-14 bg-black/60 backdrop-blur-3xl flex items-center justify-center border-t border-white/10 z-50">
        <LayoutGrid size={28} className="text-blue-400 hover:scale-110 transition-transform cursor-pointer" />
      </div>
    </div>
  );
}
