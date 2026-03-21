import React, { useState, useEffect, useRef } from 'react';
import { io } from 'socket.io-client';
import { Terminal as TerminalIcon, LayoutGrid, Activity, Clock, Zap, X, Lock, ShieldCheck, Search } from 'lucide-react';

const RAILWAY_URL = "https://codespaces-blank-production-b831.up.railway.app"; 

// Koneksi tunggal di luar komponen agar tidak berlipat ganda
const socket = io(RAILWAY_URL, { 
  transports: ['websocket'],
  reconnection: true,
  reconnectionAttempts: 10
});

export default function App() {
  const [activeApp, setActiveApp] = useState(null);
  const [isAuth, setIsAuth] = useState(false);
  const [health, setHealth] = useState({ status: "Syncing", server_uptime: 0, next_ping: 30, targets_status: {} });
  const [terminalHistory, setTerminalHistory] = useState(['--- Winnux Secure Cloud OS ---\n']);
  const [user, setUser] = useState('');
  const [pass, setPass] = useState('');
  const [cmdInput, setCmdInput] = useState('');
  const scrollRef = useRef();

  useEffect(() => {
    // Listen data kesehatan & terminal dalam satu jalur
    socket.on('live_update', (data) => setHealth(data));
    socket.on('output', (data) => setTerminalHistory(prev => [...prev, data]));
    socket.on('authenticated', () => setIsAuth(true));

    return () => {
      socket.off('live_update');
      socket.off('output');
      socket.off('authenticated');
    };
  }, []);

  useEffect(() => {
    if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
  }, [terminalHistory]);

  const handleLogin = () => socket.emit('auth', { user, pass });
  const sendCommand = (e) => {
    if (e.key === 'Enter') {
      socket.emit('input', cmdInput);
      setCmdInput('');
    }
  };

  const formatTime = (s) => `${Math.floor(s / 60)}:${s % 60 < 10 ? '0' : ''}${s % 60}`;

  return (
    <div className="h-screen w-screen overflow-hidden font-sans text-white bg-[url('https://images.wallpapersden.com/image/download/windows-11-dark-mode-blue_bG5lZ26UmZqaraWkpJRmbmdlrWZlbWU.jpg')] bg-cover bg-center">
      <div className="p-6 h-full relative">
        
        {/* LIVE MONITOR WIDGET */}
        <div className="absolute top-6 right-6 w-64 bg-black/70 backdrop-blur-3xl border border-white/10 rounded-3xl p-5 shadow-2xl border-t-4 border-t-blue-500 z-10">
          <div className="flex items-center justify-between mb-5">
            <div className="flex items-center gap-2">
              <Activity size={18} className="text-blue-400 animate-pulse" />
              <span className="text-[10px] font-black uppercase tracking-[0.2em]">Live Monitor</span>
            </div>
            <div className="flex gap-1">
               <div className={`h-2 w-2 rounded-full ${isAuth ? 'bg-green-500' : 'bg-yellow-500'}`}></div>
               <span className="text-[8px] font-bold text-gray-400">v5.1</span>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3 mb-4 text-center">
             <div className="bg-white/5 p-2 rounded-2xl border border-white/5">
                <div className="text-[7px] text-gray-500 uppercase mb-1">Heartbeat</div>
                <div className="text-lg font-mono font-black text-blue-400">{formatTime(health.next_ping)}</div>
             </div>
             <div className="bg-white/5 p-2 rounded-2xl border border-white/5">
                <div className="text-[7px] text-gray-500 uppercase mb-1">Uptime</div>
                <div className="text-lg font-mono font-black text-green-400">{health.server_uptime}s</div>
             </div>
          </div>
          <div className="space-y-1">
             {Object.entries(health.targets_status).map(([n, s]) => (
               <div key={n} className="flex justify-between items-center bg-white/5 px-3 py-1 rounded-lg">
                 <span className="text-[8px] text-gray-400 font-bold">{n}</span>
                 <span className="text-[8px] font-black text-green-400">{s}</span>
               </div>
             ))}
          </div>
        </div>

        {/* DESKTOP ICON */}
        <div className="flex flex-col items-center gap-1 w-24 cursor-pointer group" onClick={() => setActiveApp('terminal')}>
           <div className="p-4 rounded-3xl bg-white/10 border border-white/10 group-hover:bg-blue-500/20 transition-all shadow-xl backdrop-blur-md">
            <TerminalIcon size={40} className="text-blue-100" />
           </div>
           <span className="text-[11px] font-bold mt-2 drop-shadow-lg text-center leading-tight">Real Term<br/><span className="text-[8px] font-normal text-blue-300 opacity-80">Cloud Access</span></span>
        </div>
      </div>

      {/* TERMINAL WINDOW */}
      {activeApp === 'terminal' && (
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[95%] max-w-[700px] h-[500px] bg-black/90 backdrop-blur-3xl border border-white/20 rounded-3xl shadow-[0_0_50px_rgba(0,0,0,0.8)] flex flex-col z-50 overflow-hidden animate-in zoom-in-95 duration-300">
          <div className="h-12 bg-white/5 flex items-center justify-between px-6 border-b border-white/10">
            <div className="flex items-center gap-2"><ShieldCheck size={16} className="text-blue-400"/><span className="text-xs font-bold uppercase tracking-widest">Secure Terminal Session</span></div>
            <X size={20} onClick={() => setActiveApp(null)} className="cursor-pointer hover:bg-red-500 rounded-full p-1 transition-all" />
          </div>
          
          <div className="flex-1 p-4 overflow-hidden">
            {!isAuth ? (
              <div className="flex flex-col items-center justify-center h-full max-w-xs mx-auto text-center">
                <div className="p-4 bg-blue-500/10 rounded-full mb-4"><Lock size={32} className="text-blue-400" /></div>
                <h2 className="text-sm font-black mb-6 uppercase tracking-tighter">Identity Verification</h2>
                <input className="w-full bg-white/5 border border-white/10 rounded-xl p-3 mb-3 text-xs outline-none focus:border-blue-500 transition-all" placeholder="Username" onChange={(e) => setUser(e.target.value)} />
                <input type="password" className="w-full bg-white/5 border border-white/10 rounded-xl p-3 mb-6 text-xs outline-none focus:border-blue-500 transition-all" placeholder="Password" onChange={(e) => setPass(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && handleLogin()} />
                <button onClick={handleLogin} className="w-full bg-blue-600 hover:bg-blue-500 text-white font-black py-3 rounded-xl text-xs tracking-widest transition-all active:scale-95 shadow-lg shadow-blue-900/20">AUTHORIZE ACCESS</button>
              </div>
            ) : (
              <div className="text-green-400 font-mono text-[10px] h-full flex flex-col leading-relaxed">
                <div ref={scrollRef} className="flex-1 overflow-auto whitespace-pre-wrap">{terminalHistory.join('')}</div>
                <div className="flex border-t border-white/10 pt-3 mt-2">
                  <span className="text-blue-400 mr-2 font-bold">root@winnux:~$</span>
                  <input autoFocus className="bg-transparent border-none flex-1 text-white outline-none" value={cmdInput} onChange={(e) => setCmdInput(e.target.value)} onKeyDown={sendCommand} />
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* TASKBAR */}
      <div className="fixed bottom-4 left-1/2 -translate-x-1/2 h-14 px-6 bg-black/40 backdrop-blur-3xl flex items-center gap-6 border border-white/10 rounded-2xl z-50 shadow-2xl">
        <LayoutGrid size={24} className="text-blue-400 hover:scale-110 transition-transform cursor-pointer" />
        <div className="h-6 w-[1px] bg-white/10"></div>
        <Search size={22} className="text-gray-400" />
        <TerminalIcon size={22} className="text-white opacity-50" onClick={() => setActiveApp('terminal')} />
      </div>
    </div>
  );
}
