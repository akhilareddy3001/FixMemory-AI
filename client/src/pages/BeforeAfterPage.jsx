import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  ArrowRight, 
  CheckCircle2, 
  XCircle, 
  Brain, 
  Sparkles, 
  Clock, 
  Flame, 
  Repeat, 
  ShieldAlert, 
  Database, 
  Server, 
  Bot,
  Zap
} from 'lucide-react';

export default function BeforeAfterPage() {
  const navigate = useNavigate();
  const [selectedScenario, setSelectedScenario] = useState('postgres');

  const scenarios = {
    postgres: {
      name: 'PostgreSQL Connection Saturation',
      service: 'order-processor',
      incident: 'INC-1003',
      symptoms: 'SequelizeConnectionAcquireTimeoutError: ResourceRequest timed out after 10000ms',
      before: {
        steps: [
          {
            title: '1. Incident Alerts Fired',
            desc: '500 Internal Server Errors spike across order checkout ledger.',
            time: '0m',
          },
          {
            title: '2. Trial-and-Error Troubleshooting',
            desc: 'New engineer suspects database memory issue and increases max_connections to 500.',
            time: '15m',
            isFailure: true,
          },
          {
            title: '3. Cascading Failure Outage',
            desc: 'Database primary runs out of RAM and crashes (OOMKilled). Outage worsens.',
            time: '30m',
            isFailure: true,
          },
          {
            title: '4. Slow Manual Debugging',
            desc: 'Senior engineer joins call, discovers promo discount loop had unclosed transaction leak.',
            time: '45m',
          },
          {
            title: '5. Manual Resolution without Memory',
            desc: 'Leak patched. Knowledge remains trapped in personal Slack messages and forgotten next month.',
            time: '60m MTTR',
          },
        ],
        totalMttr: '60+ minutes',
        risk: 'High Risk (Repeated Outages & Wasted On-Call Hours)',
      },
      after: {
        steps: [
          {
            title: '1. Incident Alerts Fired',
            desc: 'Order processor checkout latency spikes with SequelizeConnectionAcquireTimeoutError.',
            time: '0m',
          },
          {
            title: '2. FixMemory Hindsight Recall (Automatic)',
            desc: 'FixMemory recalls INC-1003 experience: Identifies transaction leak pattern in 2 seconds.',
            time: '1m',
            isSuccess: true,
          },
          {
            title: '3. Negative Knowledge Guard Activated',
            desc: 'Alerts engineer: "DO NOT increase max_connections (led to database OOM in past incident)."',
            time: '2m',
            isSuccess: true,
          },
          {
            title: '4. Grounded SOP Execution',
            desc: 'Matched runbook: Safe read-only pg_stat_activity inspection kills leaked transaction.',
            time: '5m',
            isSuccess: true,
          },
          {
            title: '5. Hindsight Retain Closes Loop',
            desc: 'Resolution details and preventative action retained permanently into bank fixmemory-main.',
            time: '8m MTTR',
            isSuccess: true,
          },
        ],
        totalMttr: '8 minutes (85% reduction)',
        risk: 'Zero Repeated Mistakes (Biomimetic Memory Guard)',
      },
    },
    redis: {
      name: 'Redis Client Socket Exhaustion',
      service: 'auth-service',
      incident: 'INC-1004',
      symptoms: 'RedisError: Max client connections reached: 10000 clients',
      before: {
        steps: [
          {
            title: '1. Auth Token Degradation',
            desc: 'User logins failing with Redis connection saturation.',
            time: '0m',
          },
          {
            title: '2. Dangerous Blind Action Taken',
            desc: 'Responder executes FLUSHALL to reset Redis cache.',
            time: '10m',
            isFailure: true,
          },
          {
            title: '3. Disaster Multiplied',
            desc: 'All 50,000 active sessions terminated globally. Triggers massive auth login thundering herd.',
            time: '20m',
            isFailure: true,
          },
          {
            title: '4. Delayed Recovery',
            desc: 'Takes 45 minutes to stabilize the auth servers and recover session keys.',
            time: '45m MTTR',
          },
        ],
        totalMttr: '45+ minutes',
        risk: 'Destructive Anti-Patterns Executed',
      },
      after: {
        steps: [
          {
            title: '1. Auth Token Degradation',
            desc: 'Redis client connection limit reached.',
            time: '0m',
          },
          {
            title: '2. FixMemory Hindsight Recall',
            desc: 'Instantly surfaces past experience: "Zombie TCP sockets accumulated due to missing SIGTERM wrapper."',
            time: '1m',
            isSuccess: true,
          },
          {
            title: '3. Negative Knowledge Warning',
            desc: '"AVOID FLUSHALL: Previously created global session drops and auth storm."',
            time: '2m',
            isSuccess: true,
          },
          {
            title: '4. Targeted Surgical Fix',
            desc: 'Killed only idle sockets (>600s) and set tcp-keepalive without dropping active users.',
            time: '5m MTTR',
            isSuccess: true,
          },
        ],
        totalMttr: '5 minutes',
        risk: 'Safe Non-Destructive Resolution',
      },
    },
  };

  const current = scenarios[selectedScenario];

  return (
    <div className="space-y-8 pb-16">
      {/* Header */}
      <div className="p-6 rounded-2xl bg-gradient-to-r from-slate-900 via-sky-950/40 to-slate-900 border border-slate-800 shadow-xl space-y-2">
        <div className="flex items-center space-x-2">
          <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-indigo-500/10 text-indigo-400 border border-indigo-500/30">
            Interactive Hackathon Comparison
          </span>
        </div>
        <h1 className="text-2xl md:text-3xl font-extrabold text-white tracking-tight">
          Before vs. After FixMemory AI
        </h1>
        <p className="text-xs md:text-sm text-slate-300">
          How persistent Hindsight Recall & Retain transforms tribal knowledge into an immutable organizational brain.
        </p>
      </div>

      {/* Scenario Selector */}
      <div className="flex items-center space-x-3 bg-slate-900/60 p-3 rounded-xl border border-slate-800">
        <span className="text-xs text-slate-400 font-medium">Demonstration Scenario:</span>
        <button
          onClick={() => setSelectedScenario('postgres')}
          className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
            selectedScenario === 'postgres'
              ? 'bg-sky-500 text-white shadow-md'
              : 'bg-slate-950 text-slate-400 hover:text-white'
          }`}
        >
          PostgreSQL Pool Saturation (order-processor)
        </button>
        <button
          onClick={() => setSelectedScenario('redis')}
          className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
            selectedScenario === 'redis'
              ? 'bg-sky-500 text-white shadow-md'
              : 'bg-slate-950 text-slate-400 hover:text-white'
          }`}
        >
          Redis MaxClients Limit (auth-service)
        </button>
      </div>

      {/* Side-by-Side Comparison */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* BEFORE FIXMEMORY */}
        <div className="p-6 rounded-2xl bg-slate-900/70 border border-rose-950/60 space-y-5">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <div className="space-y-0.5">
              <span className="text-[10px] font-bold uppercase tracking-wider text-rose-400">
                Traditional DevOps Response
              </span>
              <h2 className="text-base font-extrabold text-white flex items-center gap-2">
                <XCircle className="w-5 h-5 text-rose-500" /> BEFORE FixMemory
              </h2>
            </div>
            <span className="text-xs font-semibold px-2.5 py-1 rounded bg-rose-500/10 text-rose-300 border border-rose-500/30">
              No Organizational Memory
            </span>
          </div>

          <div className="space-y-4">
            {current.before.steps.map((st, i) => (
              <div
                key={i}
                className={`p-3.5 rounded-xl border space-y-1 text-xs ${
                  st.isFailure
                    ? 'bg-rose-950/20 border-rose-900/50'
                    : 'bg-slate-950/60 border-slate-800'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className={`font-semibold ${st.isFailure ? 'text-rose-300' : 'text-slate-200'}`}>
                    {st.title}
                  </span>
                  <span className="text-[11px] font-mono text-slate-500">{st.time}</span>
                </div>
                <p className="text-slate-400 text-[11px] leading-relaxed">{st.desc}</p>
              </div>
            ))}
          </div>

          <div className="p-4 rounded-xl bg-slate-950 border border-rose-950/50 flex items-center justify-between text-xs">
            <div>
              <span className="text-slate-500">Average MTTR:</span>
              <p className="text-rose-400 font-extrabold text-base">{current.before.totalMttr}</p>
            </div>
            <div className="text-right">
              <span className="text-slate-500">Risk Profile:</span>
              <p className="text-rose-300 font-medium text-[11px]">{current.before.risk}</p>
            </div>
          </div>
        </div>

        {/* AFTER FIXMEMORY */}
        <div className="p-6 rounded-2xl bg-gradient-to-b from-slate-900 via-sky-950/20 to-slate-900 border border-sky-500/40 space-y-5 shadow-2xl">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <div className="space-y-0.5">
              <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-400">
                Memory-Augmented SRE
              </span>
              <h2 className="text-base font-extrabold text-white flex items-center gap-2">
                <CheckCircle2 className="w-5 h-5 text-emerald-400" /> AFTER FixMemory
              </h2>
            </div>
            <span className="text-xs font-semibold px-2.5 py-1 rounded bg-emerald-500/10 text-emerald-300 border border-emerald-500/30 flex items-center gap-1">
              <Brain className="w-3.5 h-3.5" /> Hindsight Recall & Retain
            </span>
          </div>

          <div className="space-y-4">
            {current.after.steps.map((st, i) => (
              <div
                key={i}
                className="p-3.5 rounded-xl bg-slate-950/80 border border-sky-500/20 space-y-1 text-xs"
              >
                <div className="flex items-center justify-between">
                  <span className="font-semibold text-sky-300 flex items-center gap-1.5">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" /> {st.title}
                  </span>
                  <span className="text-[11px] font-mono text-emerald-400">{st.time}</span>
                </div>
                <p className="text-slate-300 text-[11px] leading-relaxed">{st.desc}</p>
              </div>
            ))}
          </div>

          <div className="p-4 rounded-xl bg-slate-950 border border-sky-500/30 flex items-center justify-between text-xs">
            <div>
              <span className="text-slate-500">Average MTTR:</span>
              <p className="text-emerald-400 font-extrabold text-base">{current.after.totalMttr}</p>
            </div>
            <div className="text-right">
              <span className="text-slate-500">Protection:</span>
              <p className="text-sky-300 font-medium text-[11px]">{current.after.risk}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Flywheel Architecture Diagram Card */}
      <div className="p-6 rounded-2xl bg-slate-900/60 border border-slate-800 space-y-4">
        <h3 className="text-sm font-bold text-white flex items-center gap-2">
          <Zap className="w-4 h-4 text-amber-400" /> The Continuous FixMemory Learning Flywheel
        </h3>
        <p className="text-xs text-slate-300 leading-relaxed">
          Every time an on-call engineer resolves an incident and records root cause analysis or failed attempts, FixMemory retains that knowledge in Hindsight. The next time any engineer faces an analogous failure signature, the collective organizational memory is recalled instantly.
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 pt-2 text-xs">
          <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 space-y-1">
            <span className="font-mono text-[10px] text-sky-400 font-bold">Step 1: Ingest</span>
            <p className="font-semibold text-white">Incident Triggered</p>
            <p className="text-[11px] text-slate-400">Captured in MongoDB Atlas with stack trace.</p>
          </div>

          <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 space-y-1">
            <span className="font-mono text-[10px] text-emerald-400 font-bold">Step 2: Recall</span>
            <p className="font-semibold text-white">Hindsight Recall</p>
            <p className="text-[11px] text-slate-400">Semantic retrieval matches past postmortems & failed attempts.</p>
          </div>

          <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 space-y-1">
            <span className="font-mono text-[10px] text-amber-400 font-bold">Step 3: Guard</span>
            <p className="font-semibold text-white">Anti-Pattern Defense</p>
            <p className="text-[11px] text-slate-400">Engineers warned against previously failed actions.</p>
          </div>

          <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 space-y-1">
            <span className="font-mono text-[10px] text-indigo-400 font-bold">Step 4: Retain</span>
            <p className="font-semibold text-white">Hindsight Retain</p>
            <p className="text-[11px] text-slate-400">Verified solution stored permanently in fixmemory-main.</p>
          </div>
        </div>

        <div className="pt-2 flex justify-end">
          <button
            onClick={() => navigate('/agent')}
            className="flex items-center space-x-1.5 px-4 py-2 rounded-lg bg-sky-500 hover:bg-sky-400 text-white text-xs font-semibold shadow-md shadow-sky-500/20"
          >
            <span>Try in War-Room</span> <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
}
