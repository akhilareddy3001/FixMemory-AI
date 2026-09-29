import React, { useState, useEffect } from 'react';
import { BookOpen, Search, Copy, Check, AlertTriangle, ShieldCheck, Terminal, RefreshCw } from 'lucide-react';
import { getRunbooks, matchRunbooks } from '../services/api';

export default function RunbooksPage() {
  const [runbooks, setRunbooks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [testErrorInput, setTestErrorInput] = useState('');
  const [matching, setMatching] = useState(false);
  const [copiedCmd, setCopiedCmd] = useState(null);

  const loadRunbooks = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await getRunbooks();
      if (res && res.success) {
        setRunbooks(res.data || []);
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadRunbooks();
  }, []);

  const handleTestMatch = async (e) => {
    e.preventDefault();
    if (!testErrorInput.trim()) {
      loadRunbooks();
      return;
    }

    try {
      setMatching(true);
      setError(null);
      const res = await matchRunbooks(testErrorInput.trim());
      if (res && res.success) {
        setRunbooks(res.data || []);
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setMatching(false);
    }
  };

  const copyToClipboard = (cmd) => {
    navigator.clipboard.writeText(cmd);
    setCopiedCmd(cmd);
    setTimeout(() => setCopiedCmd(null), 2000);
  };

  const getDangerBadge = (level) => {
    switch (level) {
      case 'SAFE_READONLY':
        return 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30';
      case 'CAUTION_MUTATING':
        return 'bg-amber-500/10 text-amber-400 border-amber-500/30';
      case 'HIGH_RISK':
        return 'bg-rose-500/10 text-rose-400 border-rose-500/30';
      default:
        return 'bg-slate-500/10 text-slate-400 border-slate-500/30';
    }
  };

  return (
    <div className="space-y-6 pb-16">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white tracking-tight">Runbooks & Standard Procedures</h1>
          <p className="text-xs text-slate-400">
            Executable SOPs catalog. AI suggests commands for human copy/run; mutating actions require confirmation.
          </p>
        </div>
        <button
          onClick={loadRunbooks}
          disabled={loading}
          className="flex items-center space-x-2 px-3.5 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium border border-slate-700 transition-all self-start md:self-auto"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
          <span>Reset / View All</span>
        </button>
      </div>

      {/* Keyword Matching Diagnostic Bar */}
      <form onSubmit={handleTestMatch} className="p-4 rounded-xl bg-slate-900/80 border border-slate-800 flex items-center gap-3">
        <div className="relative flex-1">
          <Terminal className="w-4 h-4 text-sky-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Simulate error signature matching (e.g. 'connection pool', 'rediserror', 'commitfailedexception')..."
            value={testErrorInput}
            onChange={(e) => setTestErrorInput(e.target.value)}
            className="w-full bg-slate-950 border border-slate-800 rounded-lg pl-9 pr-4 py-2 font-mono text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-sky-500"
          />
        </div>
        <button
          type="submit"
          disabled={matching}
          className="px-4 py-2 rounded-lg bg-sky-500 hover:bg-sky-400 text-white text-xs font-semibold shadow-md shadow-sky-500/20 transition-all shrink-0"
        >
          {matching ? 'Matching...' : 'Match Runbooks'}
        </button>
      </form>

      {error && (
        <div className="p-4 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs">
          {error}
        </div>
      )}

      {loading ? (
        <div className="p-12 text-center text-xs text-slate-400">
          <RefreshCw className="w-5 h-5 animate-spin mx-auto mb-2 text-sky-400" />
          Loading SOP runbooks from MongoDB...
        </div>
      ) : runbooks.length === 0 ? (
        <div className="p-12 text-center text-xs text-slate-400">
          No runbooks found.
        </div>
      ) : (
        <div className="space-y-5">
          {runbooks.map((rb) => (
            <div
              key={rb._id}
              className="p-6 rounded-2xl bg-slate-900/70 border border-slate-800 space-y-4 hover:border-slate-700/80 transition-all"
            >
              <div className="flex flex-col md:flex-row md:items-start justify-between gap-2">
                <div className="space-y-1">
                  <div className="flex items-center space-x-2">
                    <span className="font-mono text-xs font-bold text-sky-400">{rb.slug}</span>
                    {rb.serviceId && (
                      <span className="text-[10px] px-2 py-0.5 rounded bg-slate-800 text-slate-300 border border-slate-700">
                        {rb.serviceId.name || 'Service'}
                      </span>
                    )}
                    {rb.matchScore && (
                      <span className="text-[10px] font-semibold px-2 py-0.5 rounded bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                        Match Score: {rb.matchScore}
                      </span>
                    )}
                  </div>
                  <h3 className="text-base font-bold text-white">{rb.title}</h3>
                  <p className="text-xs text-slate-300">{rb.summary}</p>
                </div>
                <span className="text-[11px] text-slate-500 self-start">Author: {rb.author}</span>
              </div>

              {/* Trigger Keywords */}
              {rb.triggerKeywords && rb.triggerKeywords.length > 0 && (
                <div className="flex flex-wrap items-center gap-1.5 pt-1">
                  <span className="text-[10px] text-slate-500 uppercase font-semibold mr-1">Triggers:</span>
                  {rb.triggerKeywords.map((kw, idx) => (
                    <span
                      key={idx}
                      className="px-2 py-0.5 rounded text-[10px] font-mono bg-slate-950 text-slate-400 border border-slate-800"
                    >
                      {kw}
                    </span>
                  ))}
                </div>
              )}

              {/* Action Steps with Copy Buttons */}
              {rb.actionSteps && rb.actionSteps.length > 0 && (
                <div className="space-y-2.5 pt-2 border-t border-slate-800/80">
                  <span className="text-xs font-semibold text-slate-300">Diagnostic & Remediation Steps:</span>
                  <div className="space-y-2">
                    {rb.actionSteps.map((step) => (
                      <div
                        key={step.stepNumber}
                        className="p-3 rounded-lg bg-slate-950 border border-slate-800 space-y-2"
                      >
                        <div className="flex items-center justify-between text-xs">
                          <span className="font-semibold text-slate-200">
                            Step {step.stepNumber}: {step.instruction}
                          </span>
                          <span className={`text-[10px] font-semibold px-2 py-0.5 rounded border ${getDangerBadge(step.dangerLevel)}`}>
                            {step.dangerLevel}
                          </span>
                        </div>

                        {step.cliCommand && (
                          <div className="flex items-center justify-between bg-slate-900 rounded p-2 border border-slate-800/80 font-mono text-[11px] text-sky-300">
                            <span className="truncate mr-3">$ {step.cliCommand}</span>
                            <button
                              type="button"
                              onClick={() => copyToClipboard(step.cliCommand)}
                              className="px-2.5 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-sans flex items-center gap-1 shrink-0 border border-slate-700 transition-colors"
                              title="Copy command to clipboard"
                            >
                              {copiedCmd === step.cliCommand ? (
                                <>
                                  <Check className="w-3 h-3 text-emerald-400" />
                                  <span className="text-emerald-400">Copied!</span>
                                </>
                              ) : (
                                <>
                                  <Copy className="w-3 h-3 text-slate-400" />
                                  <span>Copy</span>
                                </>
                              )}
                            </button>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
