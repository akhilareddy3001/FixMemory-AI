import React, { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { 
  Bot, 
  Brain, 
  Sparkles, 
  AlertTriangle, 
  CheckCircle2, 
  ShieldAlert, 
  Terminal, 
  Copy, 
  Check, 
  ChevronRight, 
  RefreshCw, 
  MessageSquare, 
  Send, 
  ArrowRight,
  ThumbsUp,
  ThumbsDown,
  Clock,
  Layers,
  HelpCircle,
  ShieldCheck,
  X
} from 'lucide-react';
import { 
  getIncidents, 
  analyzeIncident, 
  askFixMemory, 
  submitIncidentFeedback,
  getIncidentById
} from '../services/api';

export default function AgentPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();

  // Incidents List for dropdown
  const [incidents, setIncidents] = useState([]);
  const [loadingIncidents, setLoadingIncidents] = useState(true);

  // Selected Incident State
  const [selectedId, setSelectedId] = useState(searchParams.get('incidentId') || '');
  const [activeIncident, setActiveIncident] = useState(null);

  // Analysis State
  const [analyzing, setAnalyzing] = useState(false);
  const [analysisResult, setAnalysisResult] = useState(null);
  const [analysisError, setAnalysisError] = useState(null);

  // Ask FixMemory Tab & State (Phase 14)
  const [activeTab, setActiveTab] = useState(searchParams.get('tab') || 'war-room');
  const [askQuestion, setAskQuestion] = useState('');
  const [asking, setAsking] = useState(false);
  const [askHistory, setAskHistory] = useState([]);

  // Feedback Loop State (Phase 15)
  const [submittingFeedback, setSubmittingFeedback] = useState(false);
  const [feedbackSuccess, setFeedbackSuccess] = useState(null);
  const [failedFeedbackModal, setFailedFeedbackModal] = useState(false);
  const [failedActionTaken, setFailedActionTaken] = useState('');
  const [failedWhy, setFailedWhy] = useState('');

  // Copied CLI command state
  const [copiedCmd, setCopiedCmd] = useState(null);

  // Load Incidents
  useEffect(() => {
    const fetchIncidentsList = async () => {
      try {
        setLoadingIncidents(true);
        const res = await getIncidents({ limit: 50 });
        if (res?.success) {
          const incList = res.data.incidents || [];
          setIncidents(incList);
          
          // Select default incident
          if (!selectedId && incList.length > 0) {
            setSelectedId(incList[0]._id);
          }
        }
      } catch (err) {
        console.error('Failed to load incidents', err);
      } finally {
        setLoadingIncidents(false);
      }
    };

    fetchIncidentsList();
  }, []);

  // Fetch full details of selected incident
  useEffect(() => {
    if (!selectedId) return;

    const loadSelectedIncident = async () => {
      try {
        const res = await getIncidentById(selectedId);
        if (res?.success) {
          setActiveIncident(res.data);
          // Auto-load existing recalled memories if already present
          if (res.data.hindsightContext?.recalledMemories?.length > 0) {
            setAnalysisResult({
              incidentId: res.data._id,
              incidentNumber: res.data.incidentNumber,
              title: res.data.title,
              memoryUsed: true,
              memoriesRetrieved: res.data.hindsightContext.recalledMemories.length,
              memories: res.data.hindsightContext.recalledMemories,
              recommendation: {
                action: res.data.resolutionSummary || 'Investigate according to recalled incident memory',
                reason: res.data.rootCause
                  ? `Past incident root cause: ${res.data.rootCause}`
                  : 'Recalled from Hindsight organizational memory',
                avoid: res.data.failedApproaches?.map((f) => `${f.actionTaken} (${f.whyItFailed})`) || [],
                suggestedNextSteps: [
                  '1. Review recalled memories and root causes below.',
                  '2. Verify socket pools and client configurations.',
                  '3. Resolve and retain new experiences to FixMemory.',
                ],
              },
            });
          } else {
            setAnalysisResult(null);
          }
        }
      } catch (err) {
        console.error('Error fetching incident', err);
      }
    };

    loadSelectedIncident();
  }, [selectedId]);

  // Execute Analysis
  const handleAnalyze = async () => {
    if (!selectedId) return;
    try {
      setAnalyzing(true);
      setAnalysisError(null);
      setFeedbackSuccess(null);
      const res = await analyzeIncident(selectedId);
      if (res?.success) {
        setAnalysisResult(res.data);
        const refreshed = await getIncidentById(selectedId);
        if (refreshed?.success) setActiveIncident(refreshed.data);
      } else {
        setAnalysisError(res?.message || 'Analysis failed');
      }
    } catch (err) {
      setAnalysisError(err.message || 'Error communicating with analysis service');
    } finally {
      setAnalyzing(false);
    }
  };

  // Submit Feedback (Worked / Partially Worked)
  const handleQuickFeedback = async (outcome) => {
    if (!activeIncident) return;
    if (outcome === 'FAILED') {
      setFailedActionTaken('');
      setFailedWhy('');
      setFailedFeedbackModal(true);
      return;
    }

    try {
      setSubmittingFeedback(true);
      const res = await submitIncidentFeedback(activeIncident._id, {
        outcome,
        notes: `Responder reported recommendation was: ${outcome}`,
      });
      if (res?.success) {
        setFeedbackSuccess(`Feedback "${outcome}" recorded in incident timeline.`);
      }
    } catch (err) {
      alert(`Failed to save feedback: ${err.message}`);
    } finally {
      setSubmittingFeedback(false);
    }
  };

  // Submit Failed Feedback (Preserves Negative Knowledge in Hindsight)
  const handleSubmitFailedFeedback = async (e) => {
    e.preventDefault();
    if (!failedActionTaken.trim() || !failedWhy.trim()) {
      alert('Please explain what action was attempted and why it failed.');
      return;
    }

    try {
      setSubmittingFeedback(true);
      const res = await submitIncidentFeedback(activeIncident._id, {
        outcome: 'FAILED',
        actionTaken: failedActionTaken.trim(),
        whyItFailed: failedWhy.trim(),
        notes: 'Negative knowledge preserved from SRE Feedback Loop.',
      });
      if (res?.success) {
        setFailedFeedbackModal(false);
        setFeedbackSuccess(
          'Failed approach preserved into FixMemory negative knowledge so future incidents avoid it.'
        );
        const refreshed = await getIncidentById(activeIncident._id);
        if (refreshed?.success) setActiveIncident(refreshed.data);
      }
    } catch (err) {
      alert(`Error recording feedback: ${err.message}`);
    } finally {
      setSubmittingFeedback(false);
    }
  };

  // Submit Question to Ask FixMemory
  const handleAskSubmit = async (e) => {
    e?.preventDefault();
    if (!askQuestion.trim()) return;

    const q = askQuestion.trim();
    setAskQuestion('');
    setAsking(true);

    try {
      const res = await askFixMemory(q, activeIncident?._id);
      if (res?.success) {
        setAskHistory((prev) => [res.data, ...prev]);
      }
    } catch (err) {
      alert(`Query failed: ${err.message}`);
    } finally {
      setAsking(false);
    }
  };

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text);
    setCopiedCmd(text);
    setTimeout(() => setCopiedCmd(null), 2000);
  };

  const getDangerBadge = (dangerLevel) => {
    switch (dangerLevel) {
      case 'SAFE_READONLY':
        return 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30';
      case 'CAUTION_MUTATING':
        return 'bg-amber-500/10 text-amber-400 border-amber-500/30';
      case 'DANGEROUS_DESTRUCTIVE':
        return 'bg-rose-500/10 text-rose-400 border-rose-500/30';
      default:
        return 'bg-slate-500/10 text-slate-400 border-slate-500/30';
    }
  };

  return (
    <div className="space-y-6 pb-16">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-6 rounded-2xl bg-gradient-to-r from-slate-900 via-sky-950/40 to-slate-900 border border-slate-800 shadow-xl">
        <div className="space-y-1">
          <div className="flex items-center space-x-2">
            <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-sky-500/10 text-sky-400 border border-sky-500/30 flex items-center gap-1">
              <Sparkles className="w-3 h-3 text-sky-400" /> Hindsight Memory Agent
            </span>
            <span className="text-xs text-slate-400">Memory Bank: <strong className="text-sky-300 font-mono">fixmemory-main</strong></span>
          </div>
          <h1 className="text-2xl md:text-3xl font-extrabold text-white tracking-tight flex items-center gap-2">
            <Bot className="w-7 h-7 text-sky-400" /> FixMemory Incident War-Room
          </h1>
          <p className="text-xs text-slate-300">
            Persistent incident recall, root cause pattern recognition, and negative knowledge avoidance.
          </p>
        </div>

        {/* Tab Controls */}
        <div className="flex items-center space-x-2 bg-slate-950 p-1.5 rounded-xl border border-slate-800 self-start md:self-auto">
          <button
            onClick={() => setActiveTab('war-room')}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all ${
              activeTab === 'war-room'
                ? 'bg-sky-500 text-white shadow-sm'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Incident War-Room
          </button>
          <button
            onClick={() => setActiveTab('ask')}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all ${
              activeTab === 'ask'
                ? 'bg-sky-500 text-white shadow-sm'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <MessageSquare className="w-3.5 h-3.5" />
            <span>Ask FixMemory</span>
          </button>
        </div>
      </div>

      {/* Incident Selector Bar */}
      <div className="p-4 rounded-xl bg-slate-900/80 border border-slate-800 flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center space-x-3 flex-1 min-w-[280px]">
          <span className="text-xs text-slate-400 shrink-0 font-medium">Select Incident:</span>
          <select
            value={selectedId}
            onChange={(e) => {
              setSelectedId(e.target.value);
              setSearchParams({ incidentId: e.target.value });
            }}
            disabled={loadingIncidents}
            className="flex-1 bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-sky-500"
          >
            {incidents.map((inc) => (
              <option key={inc._id} value={inc._id}>
                {inc.incidentNumber} - {inc.title} ({inc.status} / {inc.severity})
              </option>
            ))}
          </select>
        </div>

        {activeIncident && (
          <div className="flex items-center space-x-3">
            <button
              onClick={handleAnalyze}
              disabled={analyzing}
              className="flex items-center space-x-2 px-5 py-2 rounded-lg bg-sky-500 hover:bg-sky-400 text-white text-xs font-semibold shadow-lg shadow-sky-500/20 transition-all disabled:opacity-50"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${analyzing ? 'animate-spin' : ''}`} />
              <span>{analyzing ? 'Recalling Hindsight...' : 'Analyze with FixMemory'}</span>
            </button>
          </div>
        )}
      </div>

      {analysisError && (
        <div className="p-4 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs">
          {analysisError}
        </div>
      )}

      {feedbackSuccess && (
        <div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-xs flex items-center justify-between">
          <span className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4" /> {feedbackSuccess}
          </span>
          <button onClick={() => setFeedbackSuccess(null)} className="text-slate-400 hover:text-white">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* ===================== TAB 1: INCIDENT WAR-ROOM ===================== */}
      {activeTab === 'war-room' && (
        <div className="space-y-6">
          {/* Active Incident Context Card */}
          {activeIncident && (
            <div className="p-5 rounded-xl bg-slate-900/60 border border-slate-800 space-y-3">
              <div className="flex items-center justify-between text-xs">
                <div className="flex items-center space-x-2.5">
                  <span className="font-mono font-bold text-sky-400 text-sm">{activeIncident.incidentNumber}</span>
                  <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-slate-800 text-slate-300 border border-slate-700">
                    {activeIncident.severity}
                  </span>
                  <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-slate-800 text-slate-300 border border-slate-700">
                    {activeIncident.status}
                  </span>
                  <span className="text-slate-400 font-mono">{activeIncident.serviceId?.name}</span>
                </div>
                <button
                  onClick={() => navigate('/incidents')}
                  className="text-xs text-sky-400 hover:underline"
                >
                  View in Incidents list &rarr;
                </button>
              </div>

              <h2 className="text-lg font-bold text-white">{activeIncident.title}</h2>
              <p className="text-xs text-slate-300 leading-relaxed">{activeIncident.description}</p>

              {activeIncident.errorMessage && (
                <div className="p-2.5 rounded bg-slate-950 font-mono text-[11px] text-rose-300 border border-rose-950/40">
                  {activeIncident.errorMessage}
                </div>
              )}
            </div>
          )}

          {/* Analysis Results / War-Room Display */}
          {analysisResult ? (
            <div className="space-y-6">
              {/* Memory Status KPI Bar */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="p-4 rounded-xl bg-slate-900/70 border border-slate-800 space-y-1">
                  <span className="text-slate-500 text-xs font-medium">Memory Status</span>
                  <div className="flex items-center space-x-2">
                    <span className="text-lg font-bold text-emerald-400">
                      {analysisResult.memoryUsed ? '✓ Memory Used' : '○ New Pattern'}
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-400">
                    {analysisResult.memoryUsed
                      ? 'Historical incidents matched in Hindsight'
                      : 'No prior pattern found in memory bank'}
                  </p>
                </div>

                <div className="p-4 rounded-xl bg-slate-900/70 border border-slate-800 space-y-1">
                  <span className="text-slate-500 text-xs font-medium">Memories Retrieved</span>
                  <div className="text-2xl font-extrabold text-white">
                    {analysisResult.memoriesRetrieved || 0}
                  </div>
                  <p className="text-[11px] text-slate-400">Bank: fixmemory-main</p>
                </div>

                <div className="p-4 rounded-xl bg-slate-900/70 border border-slate-800 space-y-1">
                  <span className="text-slate-500 text-xs font-medium">Recommendation Confidence</span>
                  <div className="text-lg font-bold text-sky-400">
                    {analysisResult.recommendation?.confidence || 'HIGH'}
                  </div>
                  <p className="text-[11px] text-slate-400">
                    Source: {analysisResult.recommendation?.recommendationSource || 'HINDSIGHT'}
                  </p>
                </div>
              </div>

              {/* Contextual AI Recommendation Box (Phase 8) */}
              {analysisResult.recommendation && (
                <div className="p-6 rounded-2xl bg-gradient-to-br from-slate-900 via-sky-950/30 to-slate-900 border border-sky-500/30 space-y-5 shadow-2xl">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <Sparkles className="w-5 h-5 text-amber-400 animate-pulse" />
                      <h3 className="text-base font-bold text-white tracking-tight">
                        FixMemory AI Contextual Recommendation
                      </h3>
                    </div>
                    <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-sky-500/20 text-sky-300 border border-sky-500/30">
                      Grounded in Past Experience
                    </span>
                  </div>

                  {/* Recommended Action */}
                  <div className="p-4 rounded-xl bg-slate-950/80 border border-sky-500/20 space-y-1.5">
                    <span className="text-[11px] font-bold text-emerald-400 uppercase tracking-wider flex items-center gap-1.5">
                      <CheckCircle2 className="w-4 h-4 text-emerald-400" /> Recommended Action
                    </span>
                    <p className="text-sm font-semibold text-white leading-relaxed">
                      {analysisResult.recommendation.action}
                    </p>
                  </div>

                  {/* Why it was recommended */}
                  <div className="space-y-1 text-xs">
                    <span className="text-slate-400 font-semibold uppercase tracking-wider text-[10px]">
                      Why this action was recommended:
                    </span>
                    <p className="text-slate-200 leading-relaxed bg-slate-950/40 p-3 rounded-lg border border-slate-800">
                      {analysisResult.recommendation.reason}
                    </p>
                  </div>

                  {/* Negative Knowledge Guard (Avoid) */}
                  {analysisResult.recommendation.avoid?.length > 0 && (
                    <div className="p-4 rounded-xl bg-amber-950/20 border border-amber-900/40 space-y-2">
                      <span className="text-xs font-bold text-amber-400 flex items-center gap-1.5">
                        <ShieldAlert className="w-4 h-4 text-amber-400" />
                        Negative Knowledge Guard — Actions to Avoid
                      </span>
                      <p className="text-[11px] text-slate-400">
                        Based on previous failures recorded in FixMemory, avoid doing the following:
                      </p>
                      <ul className="space-y-1.5">
                        {analysisResult.recommendation.avoid.map((item, idx) => (
                          <li key={idx} className="text-xs text-amber-200 font-mono flex items-start gap-2">
                            <span className="text-rose-400 font-bold shrink-0">✗</span>
                            <span>{item}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {/* Suggested Next Steps */}
                  {analysisResult.recommendation.suggestedNextSteps?.length > 0 && (
                    <div className="space-y-2 text-xs">
                      <span className="text-slate-400 font-semibold uppercase tracking-wider text-[10px]">
                        Suggested Step-by-Step Triage:
                      </span>
                      <div className="space-y-1.5">
                        {analysisResult.recommendation.suggestedNextSteps.map((step, idx) => (
                          <div key={idx} className="p-2.5 rounded bg-slate-950/50 border border-slate-800 text-slate-300">
                            {step}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Feedback Loop (Phase 15) */}
                  <div className="pt-4 border-t border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <span className="text-xs text-slate-400 font-medium">
                      Did this recommendation work for your incident?
                    </span>
                    <div className="flex items-center space-x-2">
                      <button
                        onClick={() => handleQuickFeedback('WORKED')}
                        disabled={submittingFeedback}
                        className="flex items-center space-x-1.5 px-3 py-1.5 rounded-lg bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 text-xs font-semibold border border-emerald-500/30 transition-all"
                      >
                        <Check className="w-3.5 h-3.5" />
                        <span>Worked</span>
                      </button>

                      <button
                        onClick={() => handleQuickFeedback('PARTIALLY_WORKED')}
                        disabled={submittingFeedback}
                        className="flex items-center space-x-1.5 px-3 py-1.5 rounded-lg bg-sky-500/20 hover:bg-sky-500/30 text-sky-300 text-xs font-semibold border border-sky-500/30 transition-all"
                      >
                        <span>Partially Worked</span>
                      </button>

                      <button
                        onClick={() => handleQuickFeedback('FAILED')}
                        disabled={submittingFeedback}
                        className="flex items-center space-x-1.5 px-3 py-1.5 rounded-lg bg-rose-500/20 hover:bg-rose-500/30 text-rose-300 text-xs font-semibold border border-rose-500/30 transition-all"
                      >
                        <X className="w-3.5 h-3.5" />
                        <span>Failed</span>
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {/* Matched SOP Runbook (Phase 13) */}
              {analysisResult.recommendedRunbook && (
                <div className="p-6 rounded-2xl bg-slate-900/80 border border-slate-800 space-y-4">
                  <div className="flex items-center justify-between">
                    <h3 className="text-sm font-bold text-white flex items-center gap-2">
                      <Terminal className="w-4 h-4 text-sky-400" />
                      Recommended SOP Runbook: {analysisResult.recommendedRunbook.title}
                    </h3>
                    <span className="text-[10px] text-slate-400 font-mono">
                      Author: {analysisResult.recommendedRunbook.author}
                    </span>
                  </div>

                  <p className="text-xs text-slate-300">
                    {analysisResult.recommendedRunbook.summary}
                  </p>

                  {/* Safety Warning */}
                  <div className="p-3 rounded-lg bg-amber-500/10 border border-amber-500/30 text-amber-300 text-[11px] flex items-center gap-2">
                    <ShieldAlert className="w-4 h-4 shrink-0" />
                    <span>
                      <strong>Safety Guard:</strong> FixMemory never auto-executes commands. Review CLI instructions below before executing in your terminal.
                    </span>
                  </div>

                  {/* Action Steps */}
                  <div className="space-y-3">
                    {analysisResult.recommendedRunbook.actionSteps?.map((step) => (
                      <div key={step.stepNumber} className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 space-y-2">
                        <div className="flex items-center justify-between text-xs">
                          <span className="font-semibold text-slate-200">
                            Step {step.stepNumber}: {step.instruction}
                          </span>
                          <span className={`text-[10px] font-semibold px-2 py-0.5 rounded border ${getDangerBadge(step.dangerLevel)}`}>
                            {step.dangerLevel}
                          </span>
                        </div>

                        {step.cliCommand && (
                          <div className="flex items-center justify-between bg-slate-900 p-2.5 rounded-lg border border-slate-800 font-mono text-xs text-emerald-300 overflow-x-auto">
                            <code>$ {step.cliCommand}</code>
                            <button
                              onClick={() => copyToClipboard(step.cliCommand)}
                              className="ml-3 p-1 rounded hover:bg-slate-800 text-slate-400 hover:text-white shrink-0"
                              title="Copy command"
                            >
                              {copiedCmd === step.cliCommand ? (
                                <Check className="w-4 h-4 text-emerald-400" />
                              ) : (
                                <Copy className="w-4 h-4" />
                              )}
                            </button>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Recalled Memory Cards */}
              {analysisResult.memories?.length > 0 && (
                <div className="space-y-3">
                  <h3 className="text-sm font-bold text-white flex items-center gap-2">
                    <Brain className="w-4 h-4 text-sky-400" /> Recalled Memories from Hindsight
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {analysisResult.memories.map((mem, i) => (
                      <div key={i} className="p-4 rounded-xl bg-slate-900/60 border border-slate-800 space-y-2">
                        <div className="flex items-center justify-between text-[11px]">
                          <span className="font-mono text-sky-400 font-semibold">Memory #{i + 1}</span>
                          {mem.score && (
                            <span className="text-emerald-400 font-semibold">
                              Relevance: {Math.round(mem.score * 100)}%
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-slate-300 leading-relaxed font-mono whitespace-pre-wrap max-h-48 overflow-y-auto">
                          {mem.text || JSON.stringify(mem)}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="p-16 rounded-2xl bg-slate-900/40 border border-slate-800 text-center space-y-3">
              <Bot className="w-12 h-12 text-slate-600 mx-auto" />
              <h3 className="text-base font-semibold text-white">No active memory analysis yet</h3>
              <p className="text-xs text-slate-400 max-w-md mx-auto">
                Click "Analyze with FixMemory" above to query Hindsight memory bank <code className="text-sky-300">fixmemory-main</code> for matching past incident patterns and resolution SOPs.
              </p>
            </div>
          )}
        </div>
      )}

      {/* ===================== TAB 2: ASK FIXMEMORY ===================== */}
      {activeTab === 'ask' && (
        <div className="space-y-6">
          {/* Ask Input Box */}
          <div className="p-6 rounded-2xl bg-slate-900/80 border border-slate-800 space-y-4 shadow-xl">
            <div className="flex items-center space-x-2">
              <MessageSquare className="w-5 h-5 text-indigo-400" />
              <h2 className="text-base font-bold text-white">Ask FixMemory Anything</h2>
            </div>
            <p className="text-xs text-slate-300">
              Query organizational knowledge retained across past postmortems, root cause analyses, and anti-patterns.
            </p>

            <form onSubmit={handleAskSubmit} className="flex gap-2">
              <input
                type="text"
                placeholder="e.g. How did we resolve similar PostgreSQL connection pool timeouts?"
                value={askQuestion}
                onChange={(e) => setAskQuestion(e.target.value)}
                className="flex-1 bg-slate-950 border border-slate-800 rounded-lg px-4 py-3 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-sky-500"
              />
              <button
                type="submit"
                disabled={asking || !askQuestion.trim()}
                className="flex items-center space-x-2 px-5 py-3 rounded-lg bg-sky-500 hover:bg-sky-400 text-white text-xs font-semibold shadow-lg shadow-sky-500/20 disabled:opacity-50"
              >
                <Send className="w-3.5 h-3.5" />
                <span>{asking ? 'Searching Memory...' : 'Ask'}</span>
              </button>
            </form>

            {/* Quick Sample Queries */}
            <div className="flex flex-wrap items-center gap-2 pt-2 text-xs">
              <span className="text-slate-500 text-[11px]">Quick Queries:</span>
              {[
                'Have we seen this issue before?',
                'How did we solve similar PostgreSQL pool exhausts?',
                'What failed approaches should I avoid?',
                'How was Redis max clients resolved?',
              ].map((queryText, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => {
                    setAskQuestion(queryText);
                  }}
                  className="px-2.5 py-1 rounded bg-slate-950 border border-slate-800 text-slate-300 hover:text-white hover:border-slate-700 text-[11px] transition-all"
                >
                  {queryText}
                </button>
              ))}
            </div>
          </div>

          {/* Answers Feed */}
          <div className="space-y-4">
            {askHistory.length === 0 ? (
              <div className="p-12 text-center text-xs text-slate-500 space-y-2">
                <HelpCircle className="w-8 h-8 mx-auto text-slate-600" />
                <p>Submit a question above to recall memories from FixMemory.</p>
              </div>
            ) : (
              askHistory.map((item, idx) => (
                <div key={idx} className="p-5 rounded-xl bg-slate-900/60 border border-slate-800 space-y-3">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-semibold text-white">Q: {item.question}</span>
                    <span className="text-[10px] text-slate-400 font-mono">{item.source}</span>
                  </div>

                  <div className="p-3.5 rounded-lg bg-slate-950/80 border border-slate-800 text-xs text-slate-200 leading-relaxed">
                    {item.answer}
                  </div>

                  {item.memorySources?.length > 0 && (
                    <div className="flex items-center space-x-2 text-[11px] text-slate-400">
                      <span>Citations:</span>
                      {item.memorySources.map((src, sIdx) => (
                        <span key={sIdx} className="px-2 py-0.5 rounded bg-slate-800 text-sky-400 font-mono">
                          {src}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* FAILED APPROACH FEEDBACK MODAL (Preserves Negative Knowledge) */}
      {failedFeedbackModal && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-lg p-6 space-y-5 shadow-2xl">
            <div className="flex items-center justify-between">
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <ShieldAlert className="w-5 h-5 text-amber-400" /> Record Failed Approach
              </h3>
              <button onClick={() => setFailedFeedbackModal(false)} className="text-slate-400 hover:text-white">
                <X className="w-4 h-4" />
              </button>
            </div>

            <p className="text-xs text-slate-300 leading-relaxed">
              Recording what failed protects other on-call engineers from repeating this attempt in future incidents.
            </p>

            <form onSubmit={handleSubmitFailedFeedback} className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-300">Action Attempted *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Restarted order-processor container pods"
                  value={failedActionTaken}
                  onChange={(e) => setFailedActionTaken(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-xs text-slate-200 focus:outline-none focus:border-sky-500"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-300">Why It Failed / Negative Impact *</label>
                <textarea
                  required
                  rows={3}
                  placeholder="e.g. Did not release leaked socket connections and caused client connection timeout storm."
                  value={failedWhy}
                  onChange={(e) => setFailedWhy(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-xs text-slate-200 focus:outline-none focus:border-sky-500"
                />
              </div>

              <div className="pt-2 flex items-center justify-between">
                <button
                  type="button"
                  onClick={() => setFailedFeedbackModal(false)}
                  className="px-4 py-2 rounded-lg bg-slate-800 text-slate-300 text-xs"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submittingFeedback}
                  className="px-4 py-2 rounded-lg bg-amber-600 hover:bg-amber-500 text-white text-xs font-semibold"
                >
                  {submittingFeedback ? 'Retaining...' : 'Retain Negative Knowledge'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
