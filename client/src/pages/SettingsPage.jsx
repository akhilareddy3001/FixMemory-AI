import React, { useState, useEffect } from 'react';
import { 
  Settings as SettingsIcon, 
  Database, 
  Brain, 
  Sparkles, 
  CheckCircle2, 
  XCircle, 
  RefreshCw, 
  ShieldCheck, 
  Lock,
  ExternalLink,
  Layers,
  Server
} from 'lucide-react';
import { getSettings, getSystemHealth } from '../services/api';

export default function SettingsPage() {
  const [health, setHealth] = useState(null);
  const [settingsList, setSettingsList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [checking, setChecking] = useState(false);
  const [error, setError] = useState(null);

  const fetchStatus = async () => {
    try {
      setChecking(true);
      setError(null);
      const [healthRes, settingsRes] = await Promise.allSettled([
        getSystemHealth(),
        getSettings(),
      ]);

      if (healthRes.status === 'fulfilled' && healthRes.value?.success) {
        setHealth(healthRes.value.data);
      }
      if (settingsRes.status === 'fulfilled' && settingsRes.value?.success) {
        setSettingsList(settingsRes.value.data || []);
      }
    } catch (err) {
      setError(err.message || 'Error fetching system status');
    } finally {
      setChecking(false);
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStatus();
  }, []);

  return (
    <div className="space-y-6 pb-16 max-w-4xl">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-6 rounded-2xl bg-gradient-to-r from-slate-900 via-sky-950/40 to-slate-900 border border-slate-800 shadow-xl">
        <div className="space-y-1">
          <div className="flex items-center space-x-2">
            <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-sky-500/10 text-sky-400 border border-sky-500/30 flex items-center gap-1">
              <ShieldCheck className="w-3 h-3" /> System Configuration
            </span>
            <span className="text-xs text-slate-400 font-mono">Protected Zero-Trust</span>
          </div>
          <h1 className="text-2xl font-extrabold text-white tracking-tight flex items-center gap-2">
            <SettingsIcon className="w-7 h-7 text-sky-400" /> System Settings & Health
          </h1>
          <p className="text-xs text-slate-300">
            Real-time connection verification for MongoDB Atlas, Hindsight API, and AI models.
          </p>
        </div>

        <button
          onClick={fetchStatus}
          disabled={checking}
          className="flex items-center space-x-2 px-3.5 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium border border-slate-700 transition-all self-start md:self-auto"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${checking ? 'animate-spin' : ''}`} />
          <span>Verify Connectivity</span>
        </button>
      </div>

      {error && (
        <div className="p-4 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs">
          {error}
        </div>
      )}

      {/* Connectivity Status Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* MongoDB Atlas Status */}
        <div className="p-5 rounded-xl bg-slate-900/70 border border-slate-800 space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-400 flex items-center gap-1.5">
              <Database className="w-4 h-4 text-emerald-400" /> MongoDB Atlas
            </span>
            {health?.mongodb?.status === 'CONNECTED' ? (
              <span className="flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">
                <CheckCircle2 className="w-3 h-3" /> Connected
              </span>
            ) : (
              <span className="flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded bg-rose-500/10 text-rose-400 border border-rose-500/30">
                <XCircle className="w-3 h-3" /> Disconnected
              </span>
            )}
          </div>
          <div>
            <p className="text-sm font-bold text-white">Database: {health?.mongodb?.database || 'fixmemory'}</p>
            <p className="text-[11px] text-slate-400 mt-1">
              Stores operational data, incidents, services, and audit logs.
            </p>
          </div>
        </div>

        {/* Hindsight Engine Status */}
        <div className="p-5 rounded-xl bg-slate-900/70 border border-slate-800 space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-400 flex items-center gap-1.5">
              <Brain className="w-4 h-4 text-sky-400" /> Hindsight Memory
            </span>
            {health?.hindsight?.status === 'CONNECTED' ? (
              <span className="flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">
                <CheckCircle2 className="w-3 h-3" /> Connected
              </span>
            ) : (
              <span className="flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded bg-amber-500/10 text-amber-400 border border-amber-500/30">
                <XCircle className="w-3 h-3" /> Disconnected
              </span>
            )}
          </div>
          <div>
            <p className="text-sm font-bold text-white font-mono">Bank: {health?.hindsight?.bankId || 'fixmemory-main'}</p>
            <p className="text-[11px] text-slate-400 mt-1">
              Local Biomimetic Memory API (port 8888).
            </p>
          </div>
        </div>

        {/* AI Model Status */}
        <div className="p-5 rounded-xl bg-slate-900/70 border border-slate-800 space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-400 flex items-center gap-1.5">
              <Sparkles className="w-4 h-4 text-amber-400" /> AI LLM Engine
            </span>
            <span className="flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">
              <CheckCircle2 className="w-3 h-3" /> Configured
            </span>
          </div>
          <div>
            <p className="text-sm font-bold text-white font-mono">{health?.ai?.model || 'gemini-3.5-flash-lite'}</p>
            <p className="text-[11px] text-slate-400 mt-1">
              Provider: {health?.ai?.provider || 'Google Gemini'}
            </p>
          </div>
        </div>
      </div>

      {/* Safe Configuration Table */}
      <div className="p-6 rounded-2xl bg-slate-900/60 border border-slate-800 space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-sm font-bold text-white">System Settings Roster</h2>
            <p className="text-xs text-slate-400">
              Persistent runtime configurations. Secrets and sensitive keys are masked.
            </p>
          </div>
          <span className="text-xs text-slate-500 flex items-center gap-1">
            <Lock className="w-3.5 h-3.5" /> Zero-Trust Masked
          </span>
        </div>

        <div className="divide-y divide-slate-800/80 rounded-xl bg-slate-950/60 border border-slate-800 overflow-hidden">
          {settingsList.length === 0 ? (
            <div className="p-8 text-center text-xs text-slate-500">
              Loading settings from database...
            </div>
          ) : (
            settingsList.map((setting) => (
              <div key={setting.key} className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
                <div className="space-y-0.5">
                  <span className="font-mono text-sky-400 font-semibold">{setting.key}</span>
                  {setting.description && (
                    <p className="text-[11px] text-slate-400">{setting.description}</p>
                  )}
                </div>
                <span className="px-3 py-1 rounded bg-slate-900 font-mono text-slate-200 border border-slate-800 self-start sm:self-auto">
                  {typeof setting.value === 'boolean'
                    ? setting.value
                      ? 'true'
                      : 'false'
                    : String(setting.value)}
                </span>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
