import React, { useState, useEffect } from 'react';
import { 
  BarChart3, 
  Clock, 
  Repeat, 
  Flame, 
  RefreshCw, 
  AlertTriangle, 
  ShieldCheck,
  Brain,
  CheckCircle2,
  XCircle,
  Database,
  Server,
  Layers
} from 'lucide-react';
import { getAnalyticsOverview } from '../services/api';

export default function AnalyticsPage() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const loadAnalytics = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await getAnalyticsOverview();
      if (res && res.success) {
        setData(res.data);
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAnalytics();
  }, []);

  return (
    <div className="space-y-6 pb-16">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white tracking-tight">Operations & Memory Analytics</h1>
          <p className="text-xs text-slate-400">
            Real MongoDB aggregations: MTTR metrics, Hindsight memory-assisted triage, and severity distributions.
          </p>
        </div>
        <button
          onClick={loadAnalytics}
          disabled={loading}
          className="flex items-center space-x-2 px-3.5 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium border border-slate-700 transition-all self-start md:self-auto"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
          <span>Refresh Analytics</span>
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
          Calculating metrics from MongoDB Atlas...
        </div>
      ) : (
        <div className="space-y-6">
          {/* Key Metric Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="p-5 rounded-xl bg-slate-900/70 border border-slate-800 space-y-1">
              <span className="text-xs text-slate-400">Total Recorded Incidents</span>
              <div className="text-3xl font-extrabold text-white">{data?.totalIncidents ?? 0}</div>
              <p className="text-[11px] text-slate-500">Historical database log</p>
            </div>

            <div className="p-5 rounded-xl bg-slate-900/70 border border-slate-800 space-y-1">
              <span className="text-xs text-slate-400">Mean Time to Resolution</span>
              <div className="text-3xl font-extrabold text-emerald-400">{data?.averageMttr ?? 0} min</div>
              <p className="text-[11px] text-slate-500">Resolved incidents average</p>
            </div>

            <div className="p-5 rounded-xl bg-slate-900/70 border border-slate-800 space-y-1">
              <span className="text-xs text-slate-400">Memory-Assisted Incidents</span>
              <div className="text-3xl font-extrabold text-sky-400">
                {data?.memoryAssistedIncidents ?? 0}
              </div>
              <p className="text-[11px] text-slate-500">Aided by Hindsight Recall</p>
            </div>

            <div className="p-5 rounded-xl bg-slate-900/70 border border-slate-800 space-y-1">
              <span className="text-xs text-slate-400">Failed Approaches Recorded</span>
              <div className="text-3xl font-extrabold text-amber-400">
                {data?.failedApproachesRecorded ?? 0}
              </div>
              <p className="text-[11px] text-slate-500">Anti-patterns guarded in memory</p>
            </div>
          </div>

          {/* Memory Performance Breakdown Card */}
          <div className="p-6 rounded-2xl bg-gradient-to-r from-slate-900 via-sky-950/20 to-slate-900 border border-sky-500/30 space-y-4">
            <h2 className="text-sm font-bold text-white flex items-center gap-2">
              <Brain className="w-4 h-4 text-emerald-400" />
              FixMemory Retention & Recall Performance
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
              <div className="p-4 rounded-xl bg-slate-950/60 border border-slate-800 space-y-1">
                <span className="text-slate-400">Retention Successes</span>
                <p className="text-2xl font-bold text-emerald-400">{data?.memoryRetentionSuccesses ?? 0}</p>
                <p className="text-[11px] text-slate-500">Stored into bank fixmemory-main</p>
              </div>

              <div className="p-4 rounded-xl bg-slate-950/60 border border-slate-800 space-y-1">
                <span className="text-slate-400">Retention Failures</span>
                <p className="text-2xl font-bold text-slate-400">{data?.memoryRetentionFailures ?? 0}</p>
                <p className="text-[11px] text-slate-500">Offline fallback recorded</p>
              </div>

              <div className="p-4 rounded-xl bg-slate-950/60 border border-slate-800 space-y-1">
                <span className="text-slate-400">Resolved Incidents</span>
                <p className="text-2xl font-bold text-sky-400">{data?.resolvedIncidents ?? 0}</p>
                <p className="text-[11px] text-slate-500">Of {data?.totalIncidents ?? 0} total logged</p>
              </div>
            </div>
          </div>

          {/* Breakdown Grid: Severity & Service */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Severity Distribution */}
            <div className="p-6 rounded-xl bg-slate-900/70 border border-slate-800 space-y-4">
              <h2 className="text-sm font-bold text-white flex items-center justify-between">
                <span>Incidents by Severity</span>
                <span className="text-xs text-slate-400">Total: {data?.totalIncidents ?? 0}</span>
              </h2>

              <div className="space-y-3 pt-2">
                {[
                  { level: 'CRITICAL', label: 'Critical (P1)', count: data?.incidentsBySeverity?.CRITICAL ?? 0, color: 'bg-rose-500', text: 'text-rose-400' },
                  { level: 'HIGH', label: 'High (P2)', count: data?.incidentsBySeverity?.HIGH ?? 0, color: 'bg-amber-500', text: 'text-amber-400' },
                  { level: 'MEDIUM', label: 'Medium (P3)', count: data?.incidentsBySeverity?.MEDIUM ?? 0, color: 'bg-sky-500', text: 'text-sky-400' },
                  { level: 'LOW', label: 'Low (P4)', count: data?.incidentsBySeverity?.LOW ?? 0, color: 'bg-slate-500', text: 'text-slate-400' },
                ].map((item) => {
                  const total = data?.totalIncidents || 1;
                  const percent = Math.round((item.count / total) * 100);
                  return (
                    <div key={item.level} className="space-y-1 text-xs">
                      <div className="flex items-center justify-between">
                        <span className={`font-semibold ${item.text}`}>{item.label}</span>
                        <span className="text-slate-400">{item.count} ({percent}%)</span>
                      </div>
                      <div className="w-full h-2 rounded-full bg-slate-800 overflow-hidden">
                        <div className={`h-full ${item.color} rounded-full`} style={{ width: `${percent}%` }} />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Status Distribution */}
            <div className="p-6 rounded-xl bg-slate-900/70 border border-slate-800 space-y-4">
              <h2 className="text-sm font-bold text-white">Incident Breakdown by Status</h2>
              <div className="space-y-3 pt-2">
                {[
                  { status: 'TRIGGERED', label: 'Triggered (Active Alert)', count: data?.incidentsByStatus?.TRIGGERED ?? 0, color: 'text-rose-400' },
                  { status: 'INVESTIGATING', label: 'Under SRE Investigation', count: data?.incidentsByStatus?.INVESTIGATING ?? 0, color: 'text-amber-400' },
                  { status: 'MITIGATED', label: 'Mitigated (Traffic Stabilized)', count: data?.incidentsByStatus?.MITIGATED ?? 0, color: 'text-sky-400' },
                  { status: 'RESOLVED', label: 'Resolved (Root Cause Solved)', count: data?.incidentsByStatus?.RESOLVED ?? 0, color: 'text-emerald-400' },
                  { status: 'CLOSED', label: 'Closed & Postmortem Complete', count: data?.incidentsByStatus?.CLOSED ?? 0, color: 'text-slate-400' },
                ].map((item) => (
                  <div key={item.status} className="flex items-center justify-between p-3 rounded-lg bg-slate-950/60 border border-slate-800 text-xs">
                    <span className={`font-semibold ${item.color}`}>{item.label}</span>
                    <span className="px-2.5 py-0.5 rounded font-mono font-bold bg-slate-900 text-slate-200 border border-slate-800">
                      {item.count}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Recurring Patterns Detailed Card */}
          <div className="p-6 rounded-xl bg-slate-900/70 border border-slate-800 space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-bold text-white flex items-center gap-2">
                <Repeat className="w-4 h-4 text-indigo-400" />
                <span>Detected Recurring Failure Signatures (Hindsight Memory Target)</span>
              </h2>
              <span className="text-xs text-slate-400 font-mono">
                {data?.recurringIncidents?.uniquePatterns || 0} unique patterns
              </span>
            </div>

            {(!data?.recurringIncidents?.patterns || data.recurringIncidents.patterns.length === 0) ? (
              <p className="text-xs text-slate-500 py-4">No recurring incident patterns identified yet.</p>
            ) : (
              <div className="space-y-2">
                {data.recurringIncidents.patterns.map((pat, idx) => (
                  <div key={idx} className="p-3 rounded-lg bg-slate-950 border border-slate-800 flex items-center justify-between text-xs">
                    <span className="font-mono text-slate-300 text-[11px] truncate max-w-xl">
                      {pat._id}
                    </span>
                    <span className="px-2.5 py-0.5 rounded-full bg-indigo-500/20 text-indigo-300 font-semibold border border-indigo-500/30">
                      Repeated {pat.count} times
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
