import React, { useState, useEffect } from 'react';
import { 
  Brain, 
  AlertTriangle, 
  CheckCircle2, 
  ShieldAlert, 
  Activity, 
  ArrowRight, 
  Server, 
  Cpu, 
  RefreshCw,
  Terminal,
  Zap,
  Sparkles
} from 'lucide-react';
import { checkBackendHealth } from '../services/api';

export default function DashboardPlaceholder() {
  const [healthData, setHealthData] = useState(null);
  const [loadingHealth, setLoadingHealth] = useState(false);
  const [error, setError] = useState(null);

  const testHealth = async () => {
    try {
      setLoadingHealth(true);
      setError(null);
      const res = await checkBackendHealth();
      setHealthData(res);
    } catch (err) {
      setError(err.message || 'Failed to connect to backend server');
    } finally {
      setLoadingHealth(false);
    }
  };

  useEffect(() => {
    testHealth();
  }, []);

  return (
    <div className="space-y-8 pb-12">
      {/* Hero Welcome Banner */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-sky-950/70 via-indigo-950/50 to-slate-900 border border-sky-800/40 p-6 md:p-8 shadow-2xl">
        <div className="relative z-10 max-w-3xl space-y-3">
          <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-sky-500/10 border border-sky-500/30 text-sky-400 text-xs font-semibold">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Phase 1: Environment & Foundation Initialized</span>
          </div>
          <h1 className="text-3xl md:text-4xl font-extrabold tracking-tight text-white">
            FixMemory <span className="text-transparent bg-clip-text bg-gradient-to-r from-sky-400 to-cyan-300">AI</span>
          </h1>
          <p className="text-sm md:text-base text-slate-300 leading-relaxed">
            Autonomous incident resolution agent for software engineering & DevOps teams, powered by persistent memory with <strong className="text-sky-300">Hindsight</strong>. It retains previous root causes, successful fixes, and critical anti-patterns so teams never repeat mistakes.
          </p>
        </div>
        <div className="absolute right-0 top-0 bottom-0 w-96 bg-gradient-to-l from-sky-500/10 to-transparent pointer-events-none" />
      </div>

      {/* Backend Connectivity Status Card */}
      <div className="rounded-xl bg-slate-900/80 border border-slate-800 p-6 space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center space-x-3">
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${
              healthData?.success ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' : 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
            }`}>
              <Activity className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-semibold text-white">Backend Health Status (`GET /api/health`)</h2>
              <p className="text-xs text-slate-400">Verifying REST communication between React (Port 5173) and Express (Port 5000)</p>
            </div>
          </div>
          <button
            onClick={testHealth}
            disabled={loadingHealth}
            className="inline-flex items-center space-x-2 px-4 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium border border-slate-700 transition-all disabled:opacity-50"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loadingHealth ? 'animate-spin' : ''}`} />
            <span>Test Backend Health</span>
          </button>
        </div>

        {/* Response preview */}
        <div className="rounded-lg bg-slate-950 p-4 border border-slate-800 font-mono text-xs overflow-x-auto">
          {loadingHealth && <span className="text-sky-400">Pinging backend endpoint http://localhost:5000/api/health...</span>}
          {!loadingHealth && healthData && (
            <div className="space-y-1">
              <div className="flex items-center text-emerald-400 gap-2 mb-2 font-sans font-semibold">
                <CheckCircle2 className="w-4 h-4" />
                <span>Backend Connected Successfully!</span>
              </div>
              <pre className="text-slate-300">{JSON.stringify(healthData, null, 2)}</pre>
            </div>
          )}
          {!loadingHealth && error && (
            <div className="text-rose-400 space-y-1">
              <div className="flex items-center gap-2 font-semibold font-sans">
                <AlertTriangle className="w-4 h-4" />
                <span>Connection Error</span>
              </div>
              <p>{error}</p>
              <p className="text-[11px] text-slate-500 font-sans mt-1">Make sure the backend is running (`cd server && npm start` or `npm run dev`)</p>
            </div>
          )}
        </div>
      </div>

      {/* Operational Metric Placeholders */}
      <div>
        <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3">Planned Operational Metrics (Phase 2+)</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="rounded-xl bg-slate-900/60 border border-slate-800/80 p-5 space-y-2">
            <div className="flex items-center justify-between text-slate-400 text-xs">
              <span>Active Incidents</span>
              <AlertTriangle className="w-4 h-4 text-amber-400" />
            </div>
            <div className="text-2xl font-bold text-white">0</div>
            <p className="text-[11px] text-slate-400">Waiting for incident creation</p>
          </div>

          <div className="rounded-xl bg-slate-900/60 border border-slate-800/80 p-5 space-y-2">
            <div className="flex items-center justify-between text-slate-400 text-xs">
              <span>Hindsight Memory Hit Rate</span>
              <Brain className="w-4 h-4 text-sky-400" />
            </div>
            <div className="text-2xl font-bold text-sky-400">-- %</div>
            <p className="text-[11px] text-slate-400">Biomimetic recall readiness</p>
          </div>

          <div className="rounded-xl bg-slate-900/60 border border-slate-800/80 p-5 space-y-2">
            <div className="flex items-center justify-between text-slate-400 text-xs">
              <span>Average MTTR</span>
              <Activity className="w-4 h-4 text-emerald-400" />
            </div>
            <div className="text-2xl font-bold text-emerald-400">-- min</div>
            <p className="text-[11px] text-slate-400">Mean time to resolution</p>
          </div>

          <div className="rounded-xl bg-slate-900/60 border border-slate-800/80 p-5 space-y-2">
            <div className="flex items-center justify-between text-slate-400 text-xs">
              <span>Microservices Monitored</span>
              <Server className="w-4 h-4 text-indigo-400" />
            </div>
            <div className="text-2xl font-bold text-indigo-300">--</div>
            <p className="text-[11px] text-slate-400">Configured in catalog</p>
          </div>
        </div>
      </div>

      {/* Core Architectural Pillars */}
      <div>
        <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3">FixMemory Architecture Pillars</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          <div className="rounded-xl bg-slate-900/50 border border-slate-800 p-5 space-y-3">
            <div className="w-8 h-8 rounded-lg bg-sky-500/10 border border-sky-500/20 text-sky-400 flex items-center justify-center">
              <Brain className="w-4 h-4" />
            </div>
            <h4 className="text-sm font-semibold text-white">Hindsight Persistent Memory</h4>
            <p className="text-xs text-slate-400 leading-relaxed">
              Structured into World Facts, Incident Experiences, and Mental Models. Retains not just code solutions, but root causes and temporal trajectories.
            </p>
          </div>

          <div className="rounded-xl bg-slate-900/50 border border-slate-800 p-5 space-y-3">
            <div className="w-8 h-8 rounded-lg bg-amber-500/10 border border-amber-500/20 text-amber-400 flex items-center justify-center">
              <ShieldAlert className="w-4 h-4" />
            </div>
            <h4 className="text-sm font-semibold text-white">Negative Knowledge Guard</h4>
            <p className="text-xs text-slate-400 leading-relaxed">
              Remembers failed approaches and anti-patterns. AI-suggested commands are never auto-executed; mutating commands require explicit human confirmation.
            </p>
          </div>

          <div className="rounded-xl bg-slate-900/50 border border-slate-800 p-5 space-y-3">
            <div className="w-8 h-8 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 flex items-center justify-center">
              <Cpu className="w-4 h-4" />
            </div>
            <h4 className="text-sm font-semibold text-white">AI Incident War-Room</h4>
            <p className="text-xs text-slate-400 leading-relaxed">
              Interactive triage agent that evaluates live hypotheses against historical memory and suggests safe, copyable diagnostic CLI commands.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
