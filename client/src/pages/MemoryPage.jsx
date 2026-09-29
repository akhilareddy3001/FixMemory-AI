import React, { useState, useEffect } from 'react';
import { 
  Brain, 
  Database, 
  History, 
  Search, 
  RefreshCw, 
  AlertTriangle, 
  CheckCircle2, 
  ShieldAlert, 
  X, 
  ExternalLink,
  Clock,
  Layers,
  Sparkles
} from 'lucide-react';
import { getMemoryOverview } from '../services/api';

export default function MemoryPage() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Filter & Search
  const [searchTerm, setSearchTerm] = useState('');
  const [activeTab, setActiveTab] = useState('stored'); // 'stored' | 'activity'

  // Selected Memory for Detail Modal (Phase 10)
  const [selectedMemory, setSelectedMemory] = useState(null);

  const fetchOverview = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await getMemoryOverview();
      if (res?.success) {
        setData(res.data);
      }
    } catch (err) {
      setError(err.message || 'Failed to load memory overview');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOverview();
  }, []);

  const storedMemories = data?.storedMemories || [];
  const recentActivity = data?.recentActivity || [];

  const filteredStored = storedMemories.filter((mem) => {
    if (!searchTerm.trim()) return true;
    const term = searchTerm.toLowerCase();
    return (
      mem.incidentNumber?.toLowerCase().includes(term) ||
      mem.title?.toLowerCase().includes(term) ||
      mem.rootCause?.toLowerCase().includes(term) ||
      mem.resolutionSummary?.toLowerCase().includes(term) ||
      mem.serviceName?.toLowerCase().includes(term)
    );
  });

  const filteredActivity = recentActivity.filter((act) => {
    if (!searchTerm.trim()) return true;
    const term = searchTerm.toLowerCase();
    return (
      act.operation?.toLowerCase().includes(term) ||
      act.queryPrompt?.toLowerCase().includes(term) ||
      act.incidentId?.incidentNumber?.toLowerCase().includes(term)
    );
  });

  return (
    <div className="space-y-6 pb-16">
      {/* Top Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-6 rounded-2xl bg-gradient-to-r from-slate-900 via-sky-950/40 to-slate-900 border border-slate-800 shadow-xl">
        <div className="space-y-1">
          <div className="flex items-center space-x-2">
            <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 flex items-center gap-1">
              <Database className="w-3 h-3" /> Hindsight Biomimetic Memory
            </span>
            <span className="text-xs text-slate-400 font-mono">
              Bank ID: <strong className="text-sky-300">{data?.bankId || 'fixmemory-main'}</strong>
            </span>
          </div>
          <h1 className="text-2xl md:text-3xl font-extrabold text-white tracking-tight flex items-center gap-2">
            <Brain className="w-7 h-7 text-emerald-400" /> Hindsight Memory Explorer
          </h1>
          <p className="text-xs text-slate-300">
            Inspect stored organizational incident experiences, recall audit trails, and learned anti-patterns.
          </p>
        </div>

        <button
          onClick={fetchOverview}
          disabled={loading}
          className="flex items-center space-x-2 px-3.5 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium border border-slate-700 transition-all self-start md:self-auto"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
          <span>Refresh Memory</span>
        </button>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {/* Total Stored Memories */}
        <div className="p-5 rounded-xl bg-slate-900/70 border border-slate-800 shadow-sm space-y-1">
          <div className="flex items-center justify-between text-xs text-slate-400">
            <span>Stored Incident Experiences</span>
            <Database className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="text-3xl font-extrabold text-emerald-400">
            {loading ? '...' : data?.totalRetainedMemories ?? 0}
          </div>
          <p className="text-[11px] text-slate-400">
            Retained in Hindsight bank fixmemory-main
          </p>
        </div>

        {/* Total Recall Operations */}
        <div className="p-5 rounded-xl bg-slate-900/70 border border-slate-800 shadow-sm space-y-1">
          <div className="flex items-center justify-between text-xs text-slate-400">
            <span>Recall Operations</span>
            <History className="w-4 h-4 text-sky-400" />
          </div>
          <div className="text-3xl font-extrabold text-sky-400">
            {loading ? '...' : data?.totalRecallEvents ?? 0}
          </div>
          <p className="text-[11px] text-slate-400">
            Semantic memory searches during incident investigations
          </p>
        </div>

        {/* Total Retain Operations */}
        <div className="p-5 rounded-xl bg-slate-900/70 border border-slate-800 shadow-sm space-y-1">
          <div className="flex items-center justify-between text-xs text-slate-400">
            <span>Retention Operations</span>
            <Sparkles className="w-4 h-4 text-amber-400" />
          </div>
          <div className="text-3xl font-extrabold text-amber-300">
            {loading ? '...' : data?.totalRetainEvents ?? 0}
          </div>
          <p className="text-[11px] text-slate-400">
            Postmortem lessons & anti-patterns permanently learned
          </p>
        </div>
      </div>

      {/* Controls & Search */}
      <div className="p-4 rounded-xl bg-slate-900/80 border border-slate-800 flex flex-wrap items-center justify-between gap-3">
        {/* Tab Selection: Stored vs Activity */}
        <div className="flex items-center space-x-2 bg-slate-950 p-1 rounded-lg border border-slate-800">
          <button
            onClick={() => setActiveTab('stored')}
            className={`px-3 py-1.5 rounded-md text-xs font-semibold transition-all ${
              activeTab === 'stored'
                ? 'bg-emerald-500 text-white shadow-sm'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Stored Hindsight Memories ({storedMemories.length})
          </button>
          <button
            onClick={() => setActiveTab('activity')}
            className={`px-3 py-1.5 rounded-md text-xs font-semibold transition-all ${
              activeTab === 'activity'
                ? 'bg-sky-500 text-white shadow-sm'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Memory Activity Logs ({recentActivity.length})
          </button>
        </div>

        {/* Search */}
        <div className="relative min-w-[240px]">
          <Search className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search memory text, root cause, or error..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-slate-950 border border-slate-800 rounded-lg pl-9 pr-4 py-1.5 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-sky-500"
          />
        </div>
      </div>

      {error && (
        <div className="p-4 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs">
          {error}
        </div>
      )}

      {/* ==================== VIEW 1: STORED HINDSIGHT MEMORIES ==================== */}
      {activeTab === 'stored' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between text-xs text-slate-400 px-1">
            <span>Showing verified persistent incident experiences in bank <code className="text-sky-300">fixmemory-main</code></span>
            <span>Click any card for full memory details</span>
          </div>

          {loading ? (
            <div className="p-12 text-center text-xs text-slate-400">
              <RefreshCw className="w-5 h-5 animate-spin mx-auto mb-2 text-emerald-400" />
              Loading stored memories...
            </div>
          ) : filteredStored.length === 0 ? (
            <div className="p-12 text-center text-xs text-slate-500 space-y-2">
              <Database className="w-8 h-8 mx-auto text-slate-600" />
              <p>No stored memories match your search query.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {filteredStored.map((mem) => (
                <div
                  key={mem._id}
                  onClick={() => setSelectedMemory(mem)}
                  className="p-5 rounded-xl bg-slate-900/70 border border-slate-800 hover:border-emerald-500/50 hover:bg-slate-850/80 transition-all cursor-pointer space-y-3 shadow-md group"
                >
                  <div className="flex items-center justify-between text-xs">
                    <div className="flex items-center space-x-2 font-mono">
                      <span className="font-bold text-sky-400">{mem.incidentNumber}</span>
                      <span className="text-[10px] px-2 py-0.5 rounded bg-slate-800 text-slate-300 border border-slate-700">
                        {mem.serviceName}
                      </span>
                    </div>
                    <span className="text-[10px] font-semibold px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">
                      RETAINED
                    </span>
                  </div>

                  <h3 className="text-sm font-bold text-white group-hover:text-emerald-300 transition-colors line-clamp-1">
                    {mem.title}
                  </h3>

                  <div className="space-y-1.5 text-xs">
                    <div className="text-slate-300 line-clamp-2 leading-relaxed">
                      <strong className="text-emerald-400 font-semibold">Root Cause: </strong>
                      {mem.rootCause}
                    </div>

                    <div className="text-slate-400 line-clamp-2 leading-relaxed">
                      <strong className="text-sky-300 font-semibold">Solution: </strong>
                      {mem.resolutionSummary}
                    </div>
                  </div>

                  {mem.failedApproaches && mem.failedApproaches.length > 0 && (
                    <div className="p-2 rounded bg-amber-950/20 border border-amber-900/30 text-[11px] text-amber-300 flex items-center gap-1.5">
                      <ShieldAlert className="w-3.5 h-3.5 shrink-0" />
                      <span>{mem.failedApproaches.length} Failed Approach(es) Preserved (Anti-Pattern)</span>
                    </div>
                  )}

                  <div className="pt-2 border-t border-slate-800/80 flex items-center justify-between text-[11px] text-slate-500 font-mono">
                    <span>MTTR: {mem.mttrMinutes ? `${mem.mttrMinutes}m` : 'N/A'}</span>
                    <span>{new Date(mem.retainedAt).toLocaleDateString()}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ==================== VIEW 2: MEMORY ACTIVITY AUDIT LOG ==================== */}
      {activeTab === 'activity' && (
        <div className="space-y-4">
          <div className="text-xs text-slate-400 px-1">
            Real-time audit log of <code className="text-sky-300">RECALL</code> and <code className="text-emerald-300">RETAIN</code> requests from MongoDB MemoryLog collection.
          </div>

          <div className="rounded-xl bg-slate-900/60 border border-slate-800 overflow-hidden">
            {loading ? (
              <div className="p-12 text-center text-xs text-slate-400">
                <RefreshCw className="w-5 h-5 animate-spin mx-auto mb-2 text-sky-400" />
                Loading memory audit logs...
              </div>
            ) : filteredActivity.length === 0 ? (
              <div className="p-12 text-center text-xs text-slate-500 space-y-2">
                <History className="w-8 h-8 mx-auto text-slate-600" />
                <p>No memory activity logs recorded yet.</p>
              </div>
            ) : (
              <div className="divide-y divide-slate-800/80">
                {filteredActivity.map((log) => (
                  <div key={log._id} className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
                    <div className="space-y-1">
                      <div className="flex items-center space-x-2">
                        <span
                          className={`font-mono text-[10px] font-bold px-2 py-0.5 rounded border ${
                            log.operation === 'RETAIN'
                              ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
                              : 'bg-sky-500/10 text-sky-400 border-sky-500/30'
                          }`}
                        >
                          {log.operation}
                        </span>
                        <span className="font-semibold text-white">
                          {log.incidentId?.incidentNumber ? `${log.incidentId.incidentNumber}: ` : ''}
                          {log.queryPrompt || 'System operation'}
                        </span>
                      </div>
                      {log.payload?.incidentNumber && (
                        <p className="text-[11px] text-slate-400 font-mono">
                          Target: {log.payload.incidentNumber}
                        </p>
                      )}
                    </div>

                    <div className="flex items-center space-x-3 shrink-0 text-slate-400 text-[11px]">
                      {log.retrievedCount !== undefined && log.operation === 'RECALL' && (
                        <span className="text-sky-300 font-semibold">
                          {log.retrievedCount} memories recalled
                        </span>
                      )}
                      {log.latencyMs !== undefined && (
                        <span className="text-slate-500 font-mono">{log.latencyMs}ms</span>
                      )}
                      <span className="text-slate-500">
                        {new Date(log.timestamp).toLocaleTimeString()}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* ==================== MEMORY DETAILS MODAL (Phase 10) ==================== */}
      {selectedMemory && (
        <div className="fixed inset-0 bg-slate-950/85 backdrop-blur-md z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-2xl max-h-[85vh] flex flex-col shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            {/* Header */}
            <div className="p-5 border-b border-slate-800 bg-slate-950/60 flex items-center justify-between">
              <div className="flex items-center space-x-2.5">
                <span className="font-mono text-sm font-bold text-sky-400">
                  {selectedMemory.incidentNumber}
                </span>
                <span className="text-[10px] font-semibold px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">
                  Persistent Memory
                </span>
                <span className="text-xs text-slate-400 font-mono">
                  Bank: {selectedMemory.bankId}
                </span>
              </div>
              <button
                onClick={() => setSelectedMemory(null)}
                className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Content */}
            <div className="p-6 overflow-y-auto space-y-5">
              <div>
                <h3 className="text-lg font-bold text-white mb-1">{selectedMemory.title}</h3>
                <p className="text-xs text-slate-400">Service: {selectedMemory.serviceName}</p>
              </div>

              {/* Full Memory Content Preview */}
              <div className="space-y-1.5">
                <span className="text-xs font-semibold text-slate-300">Retained Semantic Representation:</span>
                <pre className="p-3.5 rounded-lg bg-slate-950 text-slate-300 font-mono text-[11px] whitespace-pre-wrap leading-relaxed border border-slate-800 max-h-48 overflow-y-auto">
                  {selectedMemory.memoryText}
                </pre>
              </div>

              {/* Root Cause */}
              <div className="space-y-1">
                <span className="text-xs font-semibold text-emerald-400 flex items-center gap-1.5">
                  <CheckCircle2 className="w-3.5 h-3.5" /> Root Cause
                </span>
                <p className="text-xs text-slate-200 leading-relaxed bg-slate-950/50 p-3 rounded-lg border border-slate-800">
                  {selectedMemory.rootCause}
                </p>
              </div>

              {/* Resolution Summary */}
              <div className="space-y-1">
                <span className="text-xs font-semibold text-sky-400">Successful Solution</span>
                <p className="text-xs text-slate-200 leading-relaxed bg-slate-950/50 p-3 rounded-lg border border-slate-800">
                  {selectedMemory.resolutionSummary}
                </p>
              </div>

              {/* Failed Approaches (Anti-Patterns) */}
              {selectedMemory.failedApproaches && selectedMemory.failedApproaches.length > 0 && (
                <div className="space-y-2">
                  <span className="text-xs font-semibold text-amber-400 flex items-center gap-1.5">
                    <ShieldAlert className="w-3.5 h-3.5" /> Failed Approaches (Negative Knowledge)
                  </span>
                  <div className="space-y-2">
                    {selectedMemory.failedApproaches.map((fa, i) => (
                      <div key={i} className="p-3 rounded-lg bg-amber-950/20 border border-amber-900/30 text-xs space-y-1">
                        <p className="text-amber-300 font-semibold font-mono text-[11px]">
                          Attempted: {fa.actionTaken}
                        </p>
                        <p className="text-slate-300 text-[11px]">
                          Why it failed: {fa.whyItFailed}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Preventative Actions */}
              {selectedMemory.preventativeActions && selectedMemory.preventativeActions.length > 0 && (
                <div className="space-y-1.5">
                  <span className="text-xs font-semibold text-indigo-400">Preventative Actions</span>
                  <ul className="list-disc list-inside text-xs text-slate-300 space-y-1">
                    {selectedMemory.preventativeActions.map((pa, idx) => (
                      <li key={idx}>{pa}</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="p-4 border-t border-slate-800 bg-slate-950/60 flex items-center justify-between">
              <span className="text-[11px] text-slate-500 font-mono">
                Retained: {new Date(selectedMemory.retainedAt).toLocaleString()}
              </span>
              <button
                onClick={() => setSelectedMemory(null)}
                className="px-4 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
