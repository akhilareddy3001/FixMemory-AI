import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { 
  AlertTriangle, 
  CheckCircle2, 
  Clock, 
  Server, 
  Flame, 
  ArrowUpRight, 
  PlusCircle, 
  RefreshCw, 
  Repeat, 
  ShieldAlert, 
  Brain,
  Sparkles,
  Database,
  ArrowRight
} from 'lucide-react';
import { getAnalyticsOverview, checkBackendHealth } from '../services/api';

export default function DashboardPage() {
  const navigate = useNavigate();
  const [analytics, setAnalytics] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [healthStatus, setHealthStatus] = useState('checking');

  const loadData = async () => {
    try {
      setLoading(true);
      setError(null);
      const [analyticsRes, healthRes] = await Promise.allSettled([
        getAnalyticsOverview(),
        checkBackendHealth(),
      ]);

      if (analyticsRes.status === 'fulfilled' && analyticsRes.value?.success) {
        setAnalytics(analyticsRes.value.data);
      } else if (analyticsRes.status === 'rejected') {
        setError(analyticsRes.reason.message);
      }

      if (healthRes.status === 'fulfilled' && healthRes.value?.success) {
        setHealthStatus('online');
      } else {
        setHealthStatus('offline');
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  return (
    <div className="space-y-8 pb-16">
      {/* Top Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-6 rounded-2xl bg-gradient-to-r from-slate-900 via-sky-950/40 to-slate-900 border border-slate-800 shadow-xl">
        <div className="space-y-1">
          <div className="flex items-center space-x-2">
            <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-sky-500/10 text-sky-400 border border-sky-500/30 flex items-center gap-1">
              <Brain className="w-3.5 h-3.5" /> Hindsight Powered
            </span>
            <span className="text-xs text-slate-400 font-mono">Bank: fixmemory-main</span>
          </div>
          <h1 className="text-2xl md:text-3xl font-extrabold text-white tracking-tight">
            FixMemory Operations Center
          </h1>
          <p className="text-xs md:text-sm text-slate-300">
            Real-time incident triage, persistent memory recall, and anti-pattern avoidance telemetry.
          </p>
        </div>
        <div className="flex items-center space-x-3">
          <button
            onClick={loadData}
            disabled={loading}
            className="flex items-center space-x-2 px-3.5 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium border border-slate-700 transition-all disabled:opacity-50"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            <span>Refresh</span>
          </button>
          <button
            onClick={() => navigate('/create-incident')}
            className="flex items-center space-x-2 px-4 py-2 rounded-lg bg-sky-500 hover:bg-sky-400 text-white text-xs font-semibold shadow-lg shadow-sky-500/25 transition-all"
          >
            <PlusCircle className="w-4 h-4" />
            <span>Report Incident</span>
          </button>
        </div>
      </div>

      {/* Error Notice if database connection needed */}
      {error && (
        <div className="p-4 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-300 text-xs flex items-start space-x-3">
          <AlertTriangle className="w-5 h-5 shrink-0 mt-0.5 text-amber-400" />
          <div className="space-y-1">
            <p className="font-semibold">MongoDB Atlas Connection Notice</p>
            <p className="text-slate-300">{error}</p>
          </div>
        </div>
      )}

      {/* Core Incident KPIs */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Active Incidents */}
        <div className="p-5 rounded-xl bg-slate-900/70 border border-slate-800 shadow-sm space-y-2">
          <div className="flex items-center justify-between text-xs text-slate-400">
            <span>Active Incidents</span>
            <AlertTriangle className="w-4 h-4 text-amber-400" />
          </div>
          <div className="text-3xl font-extrabold text-white">
            {loading ? '...' : analytics?.activeIncidents ?? 0}
          </div>
          <div className="text-[11px] text-slate-400 flex items-center justify-between">
            <span>Triggered or Investigating</span>
            <span className="text-amber-400 font-medium">Needs Attention</span>
          </div>
        </div>

        {/* Resolved Incidents */}
        <div className="p-5 rounded-xl bg-slate-900/70 border border-slate-800 shadow-sm space-y-2">
          <div className="flex items-center justify-between text-xs text-slate-400">
            <span>Resolved Incidents</span>
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="text-3xl font-extrabold text-emerald-400">
            {loading ? '...' : analytics?.resolvedIncidents ?? 0}
          </div>
          <div className="text-[11px] text-slate-400 flex items-center justify-between">
            <span>Successfully Mitigated</span>
            <span className="text-emerald-400 font-medium">Archived</span>
          </div>
        </div>

        {/* Average MTTR */}
        <div className="p-5 rounded-xl bg-slate-900/70 border border-slate-800 shadow-sm space-y-2">
          <div className="flex items-center justify-between text-xs text-slate-400">
            <span>Average MTTR</span>
            <Clock className="w-4 h-4 text-sky-400" />
          </div>
          <div className="text-3xl font-extrabold text-sky-300">
            {loading ? '...' : `${analytics?.averageMttr ?? 0} min`}
          </div>
          <div className="text-[11px] text-slate-400 flex items-center justify-between">
            <span>Mean Time To Resolution</span>
            <span className="text-sky-400 font-medium">Across Resolved</span>
          </div>
        </div>

        {/* Recurring Incident Patterns */}
        <div className="p-5 rounded-xl bg-slate-900/70 border border-slate-800 shadow-sm space-y-2">
          <div className="flex items-center justify-between text-xs text-slate-400">
            <span>Recurring Incident Patterns</span>
            <Repeat className="w-4 h-4 text-indigo-400" />
          </div>
          <div className="text-3xl font-extrabold text-indigo-300">
            {loading ? '...' : analytics?.recurringIncidents?.uniquePatterns ?? 0}
          </div>
          <div className="text-[11px] text-slate-400 flex items-center justify-between">
            <span>Matched Signatures</span>
            <span className="text-indigo-400 font-medium">Hindsight Target</span>
          </div>
        </div>
      </div>

      {/* FixMemory Hindsight Learning Card (Phase 16) */}
      <div className="p-6 rounded-2xl bg-gradient-to-r from-slate-900 via-sky-950/30 to-slate-900 border border-sky-500/30 shadow-xl space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
              <Brain className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white flex items-center gap-2">
                FixMemory Learning Telemetry
              </h2>
              <p className="text-xs text-slate-300">
                Persistent memory efficiency metrics powered by Hindsight.
              </p>
            </div>
          </div>
          <button
            onClick={() => navigate('/memory')}
            className="flex items-center space-x-1.5 text-xs text-sky-400 hover:text-sky-300 font-semibold self-start sm:self-auto"
          >
            <span>Explore Memory Bank</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Memory Learning Stats Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="p-4 rounded-xl bg-slate-950/70 border border-slate-800 space-y-1">
            <span className="text-xs text-slate-400">Memory-Assisted Incidents</span>
            <div className="text-2xl font-extrabold text-sky-400">
              {loading ? '...' : analytics?.memoryAssistedIncidents ?? 0}
            </div>
            <p className="text-[11px] text-slate-500">
              Incidents where Hindsight recalled past experience
            </p>
          </div>

          <div className="p-4 rounded-xl bg-slate-950/70 border border-slate-800 space-y-1">
            <span className="text-xs text-slate-400">Memory Retentions</span>
            <div className="text-2xl font-extrabold text-emerald-400">
              {loading ? '...' : analytics?.memoryRetentionSuccesses ?? 0}
            </div>
            <p className="text-[11px] text-slate-500">
              Resolved postmortems retained into fixmemory-main
            </p>
          </div>

          <div className="p-4 rounded-xl bg-slate-950/70 border border-slate-800 space-y-1">
            <span className="text-xs text-slate-400">Failed Approaches Guarded</span>
            <div className="text-2xl font-extrabold text-amber-400">
              {loading ? '...' : analytics?.failedApproachesRecorded ?? 0}
            </div>
            <p className="text-[11px] text-slate-500">
              Anti-patterns recorded to prevent repeated mistakes
            </p>
          </div>
        </div>

        {/* Recent Learning Activity Feed */}
        {analytics?.recentLearningMemories?.length > 0 && (
          <div className="space-y-2 pt-2 border-t border-slate-800">
            <span className="text-xs font-semibold text-slate-300">Recently Retained Experiences:</span>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {analytics.recentLearningMemories.slice(0, 4).map((item) => (
                <div key={item._id} className="p-3 rounded-lg bg-slate-950/60 border border-slate-800 text-xs space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="font-mono text-sky-400 font-bold">{item.incidentNumber}</span>
                    <span className="text-[10px] text-slate-500 font-mono">
                      {new Date(item.retainedAt).toLocaleDateString()}
                    </span>
                  </div>
                  <p className="text-slate-200 font-medium truncate">{item.title}</p>
                  <p className="text-[11px] text-slate-400 truncate">
                    <strong className="text-emerald-400 font-normal">Root Cause: </strong>
                    {item.rootCause || 'Logged during postmortem'}
                  </p>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Middle Grid: Severity Distribution & Services Affected */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Incident Severity & Status Summary */}
        <div className="p-6 rounded-xl bg-slate-900/60 border border-slate-800 space-y-4">
          <h2 className="text-sm font-semibold text-white flex items-center justify-between">
            <span>Incident Breakdown by Severity</span>
            <span className="text-xs text-slate-400">Total: {analytics?.totalIncidents ?? 0}</span>
          </h2>

          <div className="space-y-3 pt-2">
            {[
              { level: 'CRITICAL', label: 'Critical (P1)', count: analytics?.incidentsBySeverity?.CRITICAL ?? 0, color: 'bg-rose-500', text: 'text-rose-400' },
              { level: 'HIGH', label: 'High (P2)', count: analytics?.incidentsBySeverity?.HIGH ?? 0, color: 'bg-amber-500', text: 'text-amber-400' },
              { level: 'MEDIUM', label: 'Medium (P3)', count: analytics?.incidentsBySeverity?.MEDIUM ?? 0, color: 'bg-sky-500', text: 'text-sky-400' },
              { level: 'LOW', label: 'Low (P4)', count: analytics?.incidentsBySeverity?.LOW ?? 0, color: 'bg-slate-500', text: 'text-slate-400' },
            ].map((item) => {
              const total = analytics?.totalIncidents || 1;
              const percent = Math.round((item.count / total) * 100);
              return (
                <div key={item.level} className="space-y-1">
                  <div className="flex items-center justify-between text-xs">
                    <span className={`font-medium ${item.text}`}>{item.label}</span>
                    <span className="text-slate-400">{item.count} ({percent}%)</span>
                  </div>
                  <div className="w-full h-2 rounded-full bg-slate-800 overflow-hidden">
                    <div className={`h-full ${item.color} rounded-full transition-all duration-500`} style={{ width: `${percent}%` }} />
                  </div>
                </div>
              );
            })}
          </div>

          <div className="pt-4 border-t border-slate-800 flex items-center justify-between text-xs text-slate-400">
            <span>Resolved Incidents: <strong className="text-emerald-400 font-semibold">{analytics?.resolvedIncidents ?? 0}</strong></span>
            <Link to="/incidents" className="text-sky-400 hover:text-sky-300 font-medium flex items-center gap-1">
              View all incidents <ArrowUpRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>

        {/* Microservices Incident Concentration */}
        <div className="p-6 rounded-xl bg-slate-900/60 border border-slate-800 space-y-4">
          <h2 className="text-sm font-semibold text-white flex items-center justify-between">
            <span>Incident Concentration by Service</span>
            <Link to="/services" className="text-xs text-sky-400 hover:text-sky-300">
              Manage Services
            </Link>
          </h2>

          <div className="space-y-3 pt-2">
            {(!analytics?.incidentsByService || analytics.incidentsByService.length === 0) ? (
              <div className="py-8 text-center text-xs text-slate-500">
                No incidents mapped to services yet.
              </div>
            ) : (
              analytics.incidentsByService.map((svc) => (
                <div key={svc.serviceId} className="flex items-center justify-between p-3 rounded-lg bg-slate-950/60 border border-slate-800">
                  <div className="flex items-center space-x-3">
                    <Server className="w-4 h-4 text-sky-400" />
                    <div>
                      <p className="text-xs font-semibold text-white">{svc.serviceName}</p>
                      <span className="text-[10px] text-slate-400">{svc.tier || 'TIER_1'}</span>
                    </div>
                  </div>
                  <span className="px-2 py-0.5 rounded text-xs font-semibold bg-slate-800 text-slate-200 border border-slate-700">
                    {svc.count} incident{svc.count !== 1 ? 's' : ''}
                  </span>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
