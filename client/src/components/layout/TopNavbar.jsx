import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Search, 
  PlusCircle, 
  Activity, 
  ShieldCheck, 
  Wifi, 
  WifiOff, 
  Radio
} from 'lucide-react';
import { checkBackendHealth } from '../../services/api';

export default function TopNavbar() {
  const navigate = useNavigate();
  const [backendStatus, setBackendStatus] = useState('checking'); // 'online' | 'offline' | 'checking'
  const [healthInfo, setHealthInfo] = useState(null);

  const fetchHealth = async () => {
    try {
      setBackendStatus('checking');
      const data = await checkBackendHealth();
      if (data && data.success) {
        setBackendStatus('online');
        setHealthInfo(data);
      } else {
        setBackendStatus('offline');
      }
    } catch {
      setBackendStatus('offline');
    }
  };

  useEffect(() => {
    fetchHealth();
    const interval = setInterval(fetchHealth, 15000);
    return () => clearInterval(interval);
  }, []);

  return (
    <header className="h-16 bg-slate-900/60 border-b border-slate-800 px-6 flex items-center justify-between backdrop-blur-md sticky top-0 z-30">
      {/* Search and context */}
      <div className="flex items-center space-x-4 flex-1 max-w-md">
        <div className="relative w-full">
          <Search className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search incidents, errors, runbooks, memories..."
            className="w-full bg-slate-950/80 border border-slate-800 rounded-lg pl-9 pr-4 py-1.5 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-sky-500 focus:ring-1 focus:ring-sky-500 transition-all"
            readOnly
            title="Global search available in Phase 2"
          />
        </div>
      </div>

      {/* Right Action & Status Bar */}
      <div className="flex items-center space-x-4">
        {/* On-Call Badge */}
        <div className="hidden md:flex items-center space-x-2 px-3 py-1.5 rounded-lg bg-slate-800/40 border border-slate-700/60 text-xs">
          <Radio className="w-3.5 h-3.5 text-emerald-400 animate-pulse" />
          <span className="text-slate-400">On-Call:</span>
          <span className="font-medium text-slate-200">DevOps Primary</span>
        </div>

        {/* Backend API Health Status */}
        <button
          onClick={fetchHealth}
          className={`flex items-center space-x-2 px-3 py-1.5 rounded-lg border text-xs font-medium transition-all ${
            backendStatus === 'online'
              ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30 hover:bg-emerald-500/20'
              : backendStatus === 'offline'
              ? 'bg-rose-500/10 text-rose-400 border-rose-500/30 hover:bg-rose-500/20'
              : 'bg-amber-500/10 text-amber-400 border-amber-500/30'
          }`}
          title="Click to re-check backend connection"
        >
          {backendStatus === 'online' ? (
            <>
              <Wifi className="w-3.5 h-3.5" />
              <span>Backend Online</span>
            </>
          ) : backendStatus === 'offline' ? (
            <>
              <WifiOff className="w-3.5 h-3.5" />
              <span>Backend Disconnected</span>
            </>
          ) : (
            <>
              <Activity className="w-3.5 h-3.5 animate-spin" />
              <span>Connecting...</span>
            </>
          )}
        </button>

        {/* New Incident Trigger Button */}
        <button
          onClick={() => navigate('/create-incident')}
          className="flex items-center space-x-2 px-3.5 py-1.5 rounded-lg bg-sky-500 hover:bg-sky-400 text-white text-xs font-semibold shadow-md shadow-sky-500/20 transition-all active:scale-95"
        >
          <PlusCircle className="w-4 h-4" />
          <span>New Incident</span>
        </button>
      </div>
    </header>
  );
}
