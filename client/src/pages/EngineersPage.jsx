import React, { useState, useEffect } from 'react';
import { Users, User, Radio, RefreshCw, CheckCircle2, Shield, Wrench } from 'lucide-react';
import { getEngineers, updateEngineer } from '../services/api';

export default function EngineersPage() {
  const [engineers, setEngineers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [updatingId, setUpdatingId] = useState(null);

  const loadEngineers = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await getEngineers();
      if (res && res.success) {
        setEngineers(res.data || []);
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadEngineers();
  }, []);

  const toggleOnCall = async (eng) => {
    try {
      setUpdatingId(eng._id);
      await updateEngineer(eng._id, { isOnCall: !eng.isOnCall });
      await loadEngineers();
    } catch (err) {
      alert(`Failed to update on-call status: ${err.message}`);
    } finally {
      setUpdatingId(null);
    }
  };

  return (
    <div className="space-y-6 pb-12">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white tracking-tight">On-Call Engineers Directory</h1>
          <p className="text-xs text-slate-400">
            SRE and DevOps responders, rotation assignments, and specialized domain knowledge.
          </p>
        </div>
        <button
          onClick={loadEngineers}
          disabled={loading}
          className="flex items-center space-x-2 px-3.5 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium border border-slate-700 transition-all self-start md:self-auto"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
          <span>Refresh</span>
        </button>
      </div>

      {error && (
        <div className="p-4 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs">
          {error}
        </div>
      )}

      {loading ? (
        <div className="p-12 text-center text-xs text-slate-400">
          <RefreshCw className="w-5 h-5 animate-spin mx-auto mb-2 text-sky-400" />
          Loading engineers from MongoDB Atlas...
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          {engineers.map((eng) => (
            <div
              key={eng._id}
              className={`p-5 rounded-xl border transition-all space-y-4 ${
                eng.isOnCall
                  ? 'bg-slate-900/90 border-emerald-500/40 shadow-lg shadow-emerald-950/20'
                  : 'bg-slate-900/60 border-slate-800'
              }`}
            >
              <div className="flex items-start justify-between">
                <div className="flex items-center space-x-3">
                  <div className="w-11 h-11 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center text-sky-400 font-bold text-sm overflow-hidden">
                    {eng.avatarUrl ? (
                      <img src={eng.avatarUrl} alt={eng.name} className="w-full h-full object-cover" />
                    ) : (
                      eng.name.slice(0, 2).toUpperCase()
                    )}
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-white">{eng.name}</h3>
                    <p className="text-[11px] text-slate-400">{eng.role}</p>
                    <p className="text-[10px] text-slate-500">{eng.email}</p>
                  </div>
                </div>

                <button
                  onClick={() => toggleOnCall(eng)}
                  disabled={updatingId === eng._id}
                  className={`px-2.5 py-1 rounded-full text-[10px] font-semibold flex items-center gap-1 border transition-all ${
                    eng.isOnCall
                      ? 'bg-emerald-500/15 text-emerald-400 border-emerald-500/40 hover:bg-emerald-500/25'
                      : 'bg-slate-800 text-slate-400 border-slate-700 hover:text-slate-200'
                  }`}
                  title="Click to toggle on-call status"
                >
                  <Radio className={`w-3 h-3 ${eng.isOnCall ? 'text-emerald-400 animate-pulse' : ''}`} />
                  <span>{eng.isOnCall ? 'On-Call' : 'Standby'}</span>
                </button>
              </div>

              {/* Specialties */}
              <div className="space-y-1.5">
                <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider">
                  Domain Specialties
                </span>
                <div className="flex flex-wrap gap-1.5">
                  {eng.specialties?.map((spec, i) => (
                    <span
                      key={i}
                      className="px-2 py-0.5 rounded text-[10px] font-medium bg-slate-950 text-slate-300 border border-slate-800"
                    >
                      {spec}
                    </span>
                  ))}
                </div>
              </div>

              {/* Stats */}
              <div className="pt-3 border-t border-slate-800/80 flex items-center justify-between text-xs text-slate-400">
                <span>Active Triage Load</span>
                <span className="font-semibold text-slate-200">
                  {eng.currentAssignedIncidents || 0} incident{eng.currentAssignedIncidents !== 1 ? 's' : ''}
                </span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
