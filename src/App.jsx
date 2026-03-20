import React, { useState, useEffect, useRef } from 'react';
import { io } from 'socket.io-client';
import { Terminal as TerminalIcon, LayoutGrid, Activity, Clock, Zap, X, Lock } from 'lucide-react';

const RAILWAY_URL = "https://codespaces-blank-production-b831.up.railway.app"; 

const TerminalContent = () => {
  const [history, setHistory] = useState(['--- Secure Winnux ---\n']);
  const [input, setInput] = useState('');
  const [isAuth, setIsAuth] = useState(false);
  const [user, setUser] = useState('');
  const [pass, setPass] = useState('');
  const socketRef = useRef();
  const scrollRef = useRef();

  useEffect(() => {
    socketRef.current = io(RAILWAY_URL, { transports: ['websocket'] });
    socketRef.current.on('output', (data) => setHistory(prev => [...prev, data]));
    socketRef.current.on('authenticated', () => setIsAuth(true));
    return () => socketRef.current.disconnect();
  }, []);

  const handleLogin = () => socketRef.current.emit('auth', { user, pass });
  const handleCmd = (e) => { if (e.key === 'Enter') { socketRef.current.emit('input', input); setInput(''); } };

  if (!isAuth) return (
    <div className="flex flex-col items-center justify-center h-full p-4 bg-gray-900">
      <Lock size={30} className="mb-4 text-blue-400" />
      <input className="w-full mb-2 p-2 bg-black text-white text-xs border border-gray-700" placeholder="Username" onChange={(e)=>setUser(e.target.value)} />
      <input type="password" className="w-full mb-4 p-2 bg-black text-white text-xs border border-gray-700" placeholder="Password" onChange={(e)=>setPass(e.target.value)} />
      <button className="bg-blue-600 px-4 py-2 text-xs font-bold" onClick={handleLogin}>LOGIN</button>
    </div>
  );

  return (
    <div className="text-green-400 font-mono text-[10px] h-full flex flex-col p-2">
      <div ref={scrollRef} className="flex-1 overflow-auto whitespace-pre-wrap">{history.join('')}</div>
      <input autoFocus className="bg-transparent border-t border-gray-800 text-white outline-none" value={input} onChange={(e)=>setInput(e.target.value)} onKeyDown={handleCmd} />
    </div>
  );
};

export default function App() {
  const [activeApp, setActiveApp] = useState(null);
  const [health, setHealth] = useState({ server_uptime: 0, targets_status: {} });
  const socketRef = useRef();

  useEffect(() => {
    socketRef.current = io(RAILWAY_URL, { transports: ['websocket'] });
    socketRef.current.on('live_update', (data) => setHealth(data));
    return () => socketRef.current.disconnect();
  }, []);

  return (
    <div className="h-screen w-screen bg-slate-950 text-white overflow-hidden p-6 font-sans">
      <div className="absolute top-6 right-6 w-48 bg-black/80 border border-white/10 rounded-2xl p-4 shadow-2xl">
        <div className="flex items-center gap-2 mb-2"><Activity size={16} className="text-blue-400" /><span className="text-[10px] font-bold uppercase">Monitor</span></div>
        <div className="text-[10px] text-gray-400">Uptime: {health.server_uptime}s</div>
      </div>
      <div className="w-20 cursor-pointer text-center" onClick={()=>setActiveApp('terminal')}>
        <div className="p-4 bg-white/5 rounded-2xl border border-white/10"><TerminalIcon size={40} /></div>
        <span className="text-[10px] mt-1 block">Terminal</span>
      </div>
      {activeApp && (
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[90%] h-[400px] bg-black border border-white/20 rounded-xl overflow-hidden z-50 flex flex-col">
          <div className="h-8 bg-white/10 flex justify-between items-center px-4">
            <span className="text-xs font-bold">Terminal</span>
            <X size={16} onClick={()=>setActiveApp(null)} />
          </div>
          <div className="flex-1 overflow-hidden"><TerminalContent /></div>
        </div>
      )}
    </div>
  );
}
