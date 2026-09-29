import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  AlertTriangle, 
  Search, 
  Filter, 
  PlusCircle, 
  Clock, 
  Server, 
  User, 
  ChevronRight, 
  CheckCircle2, 
  X, 
  ExternalLink,
  ShieldAlert,
  Flame,
  RefreshCw,
  Brain,
  Bot,
  MessageSquare,
  Sparkles,
  Plus,
  Trash2,
  Check
} from 'lucide-react';
import { 
  getIncidents, 
  getIncidentById,
  updateIncidentStatus, 
  getServices, 
  resolveIncident,
  analyzeIncident 
} from '../services/api';

export default function IncidentsPage() {
  const navigate = useNavigate();
  const [incidents, setIncidents] = useState([]);
  const [services, setServices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Filters
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [severityFilter, setSeverityFilter] = useState('ALL');
  const [serviceFilter, setServiceFilter] = useState('');

  // Selected Incident for Details Drawer
  const [selectedIncident, setSelectedIncident] = useState(null);
  const [updatingStatus, setUpdatingStatus] = useState(false);
  const [analyzing, setAnalyzing] = useState(false);

  // Resolution Modal State
  const [showResolveModal, setShowResolveModal] = useState(false);
  const [resolving, setResolving] = useState(false);
  const [resolutionMessage, setResolutionMessage] = useState(null);

  // Resolution Form Fields
  const [rootCause, setRootCause] = useState('');
  const [resolutionSummary, setResolutionSummary] = useState('');
  const [failedApproaches, setFailedApproaches] = useState([
    { actionTaken: '', whyItFailed: '' }
  ]);
  const [preventativeActions, setPreventativeActions] = useState(['']);

  const fetchIncidents = async () => {
    try {
      setLoading(true);
      setError(null);
      const params = {};
      if (search.trim()) params.search = search.trim();
      if (statusFilter !== 'ALL') params.status = statusFilter;
      if (severityFilter !== 'ALL') params.severity = severityFilter;
      if (serviceFilter) params.serviceId = serviceFilter;

      const [incRes, svcRes] = await Promise.allSettled([
        getIncidents(params),
        getServices(),
      ]);

      if (incRes.status === 'fulfilled' && incRes.value?.success) {
        setIncidents(incRes.value.data.incidents || []);
      } else if (incRes.status === 'rejected') {
        setError(incRes.reason.message);
      }

      if (svcRes.status === 'fulfilled' && svcRes.value?.success) {
        setServices(svcRes.value.data || []);
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchIncidents();
  }, [statusFilter, severityFilter, serviceFilter]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    fetchIncidents();
  };

  const handleStatusChange = async (incidentId, newStatus) => {
    try {
      setUpdatingStatus(true);
      await updateIncidentStatus(incidentId, newStatus, `Status updated to ${newStatus} from Incidents list`);
      await fetchIncidents();
      if (selectedIncident && selectedIncident._id === incidentId) {
        const refreshed = await getIncidentById(incidentId);
        if (refreshed?.success) setSelectedIncident(refreshed.data);
      }
    } catch (err) {
      alert(`Failed to update status: ${err.message}`);
    } finally {
      setUpdatingStatus(false);
    }
  };

  // Quick inline analyze from drawer
  const handleAnalyzeFromDrawer = async () => {
    if (!selectedIncident) return;
    try {
      setAnalyzing(true);
      const res = await analyzeIncident(selectedIncident._id);
      if (res?.success) {
        const refreshed = await getIncidentById(selectedIncident._id);
        if (refreshed?.success) setSelectedIncident(refreshed.data);
      }
    } catch (err) {
      alert(`Analysis failed: ${err.message}`);
    } finally {
      setAnalyzing(false);
    }
  };

  // Open Resolution Modal
  const openResolveDialog = () => {
    setRootCause('');
    setResolutionSummary('');
    setFailedApproaches([{ actionTaken: '', whyItFailed: '' }]);
    setPreventativeActions(['']);
    setShowResolveModal(true);
  };

  const addFailedApproachField = () => {
    setFailedApproaches([...failedApproaches, { actionTaken: '', whyItFailed: '' }]);
  };

  const updateFailedApproach = (index, field, value) => {
    const updated = [...failedApproaches];
    updated[index][field] = value;
    setFailedApproaches(updated);
  };

  const removeFailedApproach = (index) => {
    if (failedApproaches.length === 1) {
      setFailedApproaches([{ actionTaken: '', whyItFailed: '' }]);
    } else {
      setFailedApproaches(failedApproaches.filter((_, i) => i !== index));
    }
  };

  const addPreventativeActionField = () => {
    setPreventativeActions([...preventativeActions, '']);
  };

  const updatePreventativeAction = (index, value) => {
    const updated = [...preventativeActions];
    updated[index] = value;
    setPreventativeActions(updated);
  };

  const removePreventativeAction = (index) => {
    if (preventativeActions.length === 1) {
      setPreventativeActions(['']);
    } else {
      setPreventativeActions(preventativeActions.filter((_, i) => i !== index));
    }
  };

  const handleSubmitResolution = async (e) => {
    e.preventDefault();
    if (!rootCause.trim() || !resolutionSummary.trim()) {
      alert('Please fill in both Root Cause and Resolution Summary');
      return;
    }

    try {
      setResolving(true);
      const cleanFailed = failedApproaches.filter(
        (f) => f.actionTaken.trim() && f.whyItFailed.trim()
      );
      const cleanPrev = preventativeActions.filter((p) => p.trim());

      const res = await resolveIncident(selectedIncident._id, {
        rootCause: rootCause.trim(),
        resolutionSummary: resolutionSummary.trim(),
        failedApproaches: cleanFailed,
        preventativeActions: cleanPrev,
        actorName: 'Lead SRE',
      });

      if (res?.success) {
        setShowResolveModal(false);
        const retainedStatus = res.data?.hindsightContext?.retentionStatus;

        if (retainedStatus === 'RETAINED') {
          setResolutionMessage({
            type: 'success',
            text: 'Experience stored in FixMemory memory.',
          });
        } else {
          setResolutionMessage({
            type: 'warning',
            text: 'Incident resolved, but memory storage is temporarily unavailable.',
          });
        }

        setSelectedIncident(res.data);
        await fetchIncidents();
      }
    } catch (err) {
      alert(`Resolution failed: ${err.message}`);
    } finally {
      setResolving(false);
    }
  };

  const getSeverityBadge = (severity) => {
    switch (severity) {
      case 'CRITICAL':
        return 'bg-rose-500/10 text-rose-400 border-rose-500/30';
      case 'HIGH':
        return 'bg-amber-500/10 text-amber-400 border-amber-500/30';
      case 'MEDIUM':
        return 'bg-sky-500/10 text-sky-400 border-sky-500/30';
      default:
        return 'bg-slate-500/10 text-slate-400 border-slate-500/30';
    }
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case 'TRIGGERED':
        return 'bg-rose-950 text-rose-300 border-rose-800 animate-pulse';
      case 'INVESTIGATING':
        return 'bg-amber-950 text-amber-300 border-amber-800';
      case 'MITIGATED':
        return 'bg-sky-950 text-sky-300 border-sky-800';
      case 'RESOLVED':
        return 'bg-emerald-950 text-emerald-300 border-emerald-800';
      default:
        return 'bg-slate-900 text-slate-400 border-slate-800';
    }
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white tracking-tight">Incidents Management</h1>
          <p className="text-xs text-slate-400">
            Real-time catalog of production incidents retrieved from MongoDB Atlas with Hindsight Memory.
          </p>
        </div>
        <div className="flex items-center space-x-3">
          <button
            onClick={fetchIncidents}
            disabled={loading}
            className="flex items-center space-x-2 px-3 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium border border-slate-700 transition-all"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            <span>Refresh</span>
          </button>
          <button
            onClick={() => navigate('/create-incident')}
            className="flex items-center space-x-2 px-3.5 py-2 rounded-lg bg-sky-500 hover:bg-sky-400 text-white text-xs font-semibold shadow-md shadow-sky-500/20 transition-all"
          >
            <PlusCircle className="w-4 h-4" />
            <span>Create Incident</span>
          </button>
        </div>
      </div>

      {/* Resolution Notification Banner */}
      {resolutionMessage && (
        <div
          className={`p-4 rounded-xl flex items-center justify-between text-xs ${
            resolutionMessage.type === 'success'
              ? 'bg-emerald-500/10 border border-emerald-500/30 text-emerald-300'
              : 'bg-amber-500/10 border border-amber-500/30 text-amber-300'
          }`}
        >
          <div className="flex items-center space-x-2">
            <CheckCircle2 className="w-4 h-4 shrink-0" />
            <span className="font-semibold">{resolutionMessage.text}</span>
          </div>
          <button
            onClick={() => setResolutionMessage(null)}
            className="text-slate-400 hover:text-white"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Filter Bar */}
      <div className="p-4 rounded-xl bg-slate-900/80 border border-slate-800 flex flex-wrap items-center gap-3">
        <form onSubmit={handleSearchSubmit} className="relative flex-1 min-w-[200px]">
          <Search className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search by incident number, title, or error..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-slate-950 border border-slate-800 rounded-lg pl-9 pr-4 py-2 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-sky-500 focus:ring-1 focus:ring-sky-500"
          />
        </form>

        {/* Severity Filter */}
        <select
          value={severityFilter}
          onChange={(e) => setSeverityFilter(e.target.value)}
          className="bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-slate-300 focus:outline-none focus:border-sky-500"
        >
          <option value="ALL">All Severities</option>
          <option value="CRITICAL">Critical (P1)</option>
          <option value="HIGH">High (P2)</option>
          <option value="MEDIUM">Medium (P3)</option>
          <option value="LOW">Low (P4)</option>
        </select>

        {/* Status Filter */}
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-slate-300 focus:outline-none focus:border-sky-500"
        >
          <option value="ALL">All Statuses</option>
          <option value="TRIGGERED">Triggered</option>
          <option value="INVESTIGATING">Investigating</option>
          <option value="MITIGATED">Mitigated</option>
          <option value="RESOLVED">Resolved</option>
          <option value="CLOSED">Closed</option>
        </select>

        {/* Service Filter */}
        <select
          value={serviceFilter}
          onChange={(e) => setServiceFilter(e.target.value)}
          className="bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-slate-300 focus:outline-none focus:border-sky-500"
        >
          <option value="">All Services</option>
          {services.map((svc) => (
            <option key={svc._id} value={svc._id}>
              {svc.name}
            </option>
          ))}
        </select>
      </div>

      {/* Error Message */}
      {error && (
        <div className="p-4 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs">
          {error}
        </div>
      )}

      {/* Incidents Table / List */}
      <div className="rounded-xl bg-slate-900/60 border border-slate-800 overflow-hidden">
        {loading ? (
          <div className="p-12 text-center text-xs text-slate-400">
            <RefreshCw className="w-5 h-5 animate-spin mx-auto mb-2 text-sky-400" />
            Loading incidents from database...
          </div>
        ) : incidents.length === 0 ? (
          <div className="p-12 text-center text-xs text-slate-400 space-y-3">
            <AlertTriangle className="w-8 h-8 mx-auto text-slate-600" />
            <p>No incidents match the selected filters.</p>
          </div>
        ) : (
          <div className="divide-y divide-slate-800/80">
            {incidents.map((incident) => (
              <div
                key={incident._id}
                onClick={() => setSelectedIncident(incident)}
                className="p-4 md:p-5 hover:bg-slate-850/60 transition-colors cursor-pointer flex flex-col md:flex-row md:items-center justify-between gap-4 group"
              >
                {/* Left: Info & Title */}
                <div className="space-y-1.5 flex-1 min-w-0">
                  <div className="flex items-center space-x-2.5">
                    <span className="font-mono text-xs font-bold text-sky-400">
                      {incident.incidentNumber}
                    </span>
                    <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full border ${getSeverityBadge(incident.severity)}`}>
                      {incident.severity}
                    </span>
                    <span className={`text-[10px] font-semibold px-2 py-0.5 rounded border ${getStatusBadge(incident.status)}`}>
                      {incident.status}
                    </span>
                    {incident.serviceId && (
                      <span className="text-[11px] text-slate-400 flex items-center gap-1 font-mono">
                        <Server className="w-3 h-3 text-slate-500" />
                        {incident.serviceId.name || incident.serviceId}
                      </span>
                    )}
                    {incident.hindsightContext?.retentionStatus === 'RETAINED' && (
                      <span className="text-[10px] font-semibold px-1.5 py-0.2 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 flex items-center gap-1">
                        <Brain className="w-3 h-3" /> Retained
                      </span>
                    )}
                  </div>
                  <h3 className="text-sm font-semibold text-white group-hover:text-sky-300 transition-colors truncate">
                    {incident.title}
                  </h3>
                  {incident.errorMessage && (
                    <p className="text-[11px] font-mono text-slate-400 truncate max-w-2xl bg-slate-950/40 px-2 py-1 rounded border border-slate-800/50">
                      {incident.errorMessage}
                    </p>
                  )}
                </div>

                {/* Right: Assigned, MTTR, Action */}
                <div className="flex items-center space-x-4 shrink-0 text-xs text-slate-400">
                  {incident.assignedEngineerId && (
                    <div className="hidden sm:flex items-center space-x-1.5">
                      <User className="w-3.5 h-3.5 text-slate-500" />
                      <span>{incident.assignedEngineerId.name || 'Assigned'}</span>
                    </div>
                  )}

                  {incident.mttrMinutes && (
                    <div className="flex items-center space-x-1 text-emerald-400 font-medium">
                      <Clock className="w-3.5 h-3.5" />
                      <span>{incident.mttrMinutes}m MTTR</span>
                    </div>
                  )}

                  <div className="text-[11px] text-slate-500">
                    {new Date(incident.createdAt).toLocaleDateString()}
                  </div>

                  <ChevronRight className="w-4 h-4 text-slate-600 group-hover:text-slate-300 transition-transform group-hover:translate-x-1" />
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Incident Details Drawer / Modal */}
      {selectedIncident && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-40 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-4xl max-h-[90vh] flex flex-col shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            {/* Modal Header */}
            <div className="p-5 border-b border-slate-800 flex items-center justify-between bg-slate-950/60">
              <div className="flex items-center space-x-3">
                <span className="font-mono text-sm font-bold text-sky-400">
                  {selectedIncident.incidentNumber}
                </span>
                <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full border ${getSeverityBadge(selectedIncident.severity)}`}>
                  {selectedIncident.severity}
                </span>
                <span className={`text-[10px] font-semibold px-2 py-0.5 rounded border ${getStatusBadge(selectedIncident.status)}`}>
                  {selectedIncident.status}
                </span>
                {selectedIncident.hindsightContext?.retentionStatus === 'RETAINED' && (
                  <span className="text-[10px] font-semibold px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 flex items-center gap-1">
                    <Brain className="w-3 h-3" /> Hindsight Stored
                  </span>
                )}
              </div>
              <button
                onClick={() => setSelectedIncident(null)}
                className="p-1.5 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Content */}
            <div className="p-6 overflow-y-auto space-y-6">
              {/* Section 1: Incident Overview */}
              <div className="space-y-2">
                <h2 className="text-xl font-bold text-white">{selectedIncident.title}</h2>
                <p className="text-xs text-slate-300 leading-relaxed">{selectedIncident.description}</p>
                <div className="flex flex-wrap gap-4 pt-2 text-xs text-slate-400">
                  <div>
                    <span className="text-slate-500">Service:</span>{' '}
                    <span className="text-slate-200 font-mono">{selectedIncident.serviceId?.name || 'N/A'}</span>
                  </div>
                  <div>
                    <span className="text-slate-500">Tier:</span>{' '}
                    <span className="text-sky-300">{selectedIncident.serviceId?.tier || 'TIER_1'}</span>
                  </div>
                  <div>
                    <span className="text-slate-500">Assignee:</span>{' '}
                    <span className="text-slate-200">{selectedIncident.assignedEngineerId?.name || 'Unassigned'}</span>
                  </div>
                  {selectedIncident.mttrMinutes && (
                    <div>
                      <span className="text-slate-500">MTTR:</span>{' '}
                      <span className="text-emerald-400 font-semibold">{selectedIncident.mttrMinutes} min</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Action Buttons Bar */}
              <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 flex flex-wrap items-center justify-between gap-3">
                <div className="flex items-center space-x-2">
                  {/* Button 1: Analyze with FixMemory */}
                  <button
                    onClick={() => navigate(`/agent?incidentId=${selectedIncident._id}`)}
                    className="flex items-center space-x-2 px-3.5 py-1.5 rounded-lg bg-sky-500/20 hover:bg-sky-500/30 text-sky-300 text-xs font-semibold border border-sky-500/30 transition-all"
                  >
                    <Bot className="w-3.5 h-3.5" />
                    <span>Analyze with FixMemory</span>
                  </button>

                  {/* Button 2: Ask FixMemory */}
                  <button
                    onClick={() => navigate(`/agent?incidentId=${selectedIncident._id}&tab=ask`)}
                    className="flex items-center space-x-1.5 px-3 py-1.5 rounded-lg bg-indigo-500/10 hover:bg-indigo-500/20 text-indigo-300 text-xs font-medium border border-indigo-500/30 transition-all"
                  >
                    <MessageSquare className="w-3.5 h-3.5" />
                    <span>Ask FixMemory</span>
                  </button>
                </div>

                {/* Button 3: Resolve Incident (only if not resolved or closed) */}
                {selectedIncident.status !== 'RESOLVED' && selectedIncident.status !== 'CLOSED' && (
                  <button
                    onClick={openResolveDialog}
                    className="flex items-center space-x-1.5 px-4 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold shadow-md shadow-emerald-500/20 transition-all"
                  >
                    <CheckCircle2 className="w-4 h-4" />
                    <span>Resolve Incident</span>
                  </button>
                )}
              </div>

              {/* Status Update Quick Toggles */}
              <div className="p-3 rounded-lg bg-slate-950/80 border border-slate-800 flex items-center justify-between text-xs">
                <span className="text-slate-400">Quick Status Update:</span>
                <div className="flex space-x-1.5">
                  {['TRIGGERED', 'INVESTIGATING', 'MITIGATED', 'RESOLVED'].map((st) => (
                    <button
                      key={st}
                      disabled={updatingStatus || selectedIncident.status === st}
                      onClick={() => handleStatusChange(selectedIncident._id, st)}
                      className={`text-[10px] font-semibold px-2.5 py-1 rounded transition-all ${
                        selectedIncident.status === st
                          ? 'bg-sky-500 text-white shadow-sm'
                          : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                      }`}
                    >
                      {st}
                    </button>
                  ))}
                </div>
              </div>

              {/* Section 2: Symptoms & Error */}
              {selectedIncident.errorMessage && (
                <div className="space-y-2">
                  <h4 className="text-xs font-semibold text-slate-300 flex items-center gap-1.5">
                    <Flame className="w-3.5 h-3.5 text-rose-400" /> Symptoms & Error Payload
                  </h4>
                  <div className="p-3.5 rounded-lg bg-slate-950 font-mono text-xs text-rose-300 border border-rose-950/60 overflow-x-auto space-y-2">
                    <div>
                      <span className="text-slate-500">Error:</span> {selectedIncident.errorMessage}
                    </div>
                    {selectedIncident.errorSignature && (
                      <div className="text-[11px] text-slate-400">
                        <span className="text-slate-500">Signature:</span> {selectedIncident.errorSignature}
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Section 3: FixMemory Memory Status */}
              <div className="p-4 rounded-xl bg-slate-950/80 border border-slate-800 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-sky-400 flex items-center gap-1.5">
                    <Brain className="w-4 h-4 text-sky-400" /> FixMemory Organizational Memory
                  </span>
                  <span
                    className={`text-[10px] font-bold px-2 py-0.5 rounded border ${
                      selectedIncident.hindsightContext?.retentionStatus === 'RETAINED'
                        ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
                        : selectedIncident.hindsightContext?.retentionStatus === 'FAILED'
                        ? 'bg-rose-500/10 text-rose-400 border-rose-500/30'
                        : 'bg-slate-800 text-slate-400 border-slate-700'
                    }`}
                  >
                    Retention: {selectedIncident.hindsightContext?.retentionStatus || 'PENDING'}
                  </span>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                  <div className="p-2.5 rounded bg-slate-900 border border-slate-800">
                    <span className="text-slate-500 text-[10px]">Memory Used</span>
                    <p className="font-semibold text-white">
                      {(selectedIncident.hindsightContext?.recalledMemories?.length || 0) > 0 ? '✓ Yes' : 'No'}
                    </p>
                  </div>
                  <div className="p-2.5 rounded bg-slate-900 border border-slate-800">
                    <span className="text-slate-500 text-[10px]">Memories Retrieved</span>
                    <p className="font-semibold text-sky-400">
                      {selectedIncident.hindsightContext?.recalledMemories?.length || 0}
                    </p>
                  </div>
                  <div className="p-2.5 rounded bg-slate-900 border border-slate-800">
                    <span className="text-slate-500 text-[10px]">Retention Status</span>
                    <p className="font-semibold text-emerald-400">
                      {selectedIncident.hindsightContext?.retentionStatus || 'PENDING'}
                    </p>
                  </div>
                  <div className="p-2.5 rounded bg-slate-900 border border-slate-800">
                    <span className="text-slate-500 text-[10px]">Retained At</span>
                    <p className="font-semibold text-slate-300 text-[11px] truncate">
                      {selectedIncident.hindsightContext?.retainedAt
                        ? new Date(selectedIncident.hindsightContext.retainedAt).toLocaleDateString()
                        : 'Not yet retained'}
                    </p>
                  </div>
                </div>

                {/* Recalled Memories preview if available */}
                {selectedIncident.hindsightContext?.recalledMemories?.length > 0 && (
                  <div className="space-y-1.5 pt-2 border-t border-slate-800">
                    <span className="text-[11px] font-semibold text-slate-300">Recalled Historical Experiences:</span>
                    <div className="space-y-1.5 max-h-36 overflow-y-auto">
                      {selectedIncident.hindsightContext.recalledMemories.map((mem, idx) => (
                        <div key={idx} className="p-2 rounded bg-slate-900 text-[11px] text-slate-300 border border-slate-800">
                          {mem.text || JSON.stringify(mem)}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Section 4: Root Cause & Resolution */}
              {(selectedIncident.rootCause || selectedIncident.resolutionSummary) && (
                <div className="space-y-3 p-4 rounded-xl bg-slate-950/80 border border-slate-800">
                  {selectedIncident.rootCause && (
                    <div className="space-y-1">
                      <span className="text-xs font-semibold text-emerald-400 flex items-center gap-1.5">
                        <CheckCircle2 className="w-3.5 h-3.5" /> Root Cause Analysis
                      </span>
                      <p className="text-xs text-slate-200 leading-relaxed">{selectedIncident.rootCause}</p>
                    </div>
                  )}

                  {selectedIncident.resolutionSummary && (
                    <div className="space-y-1 pt-2 border-t border-slate-800">
                      <span className="text-xs font-semibold text-sky-400">Resolution Summary</span>
                      <p className="text-xs text-slate-300 leading-relaxed">{selectedIncident.resolutionSummary}</p>
                    </div>
                  )}
                </div>
              )}

              {/* Section 5: Failed Approaches (Anti-Patterns to Avoid) */}
              {selectedIncident.failedApproaches && selectedIncident.failedApproaches.length > 0 && (
                <div className="space-y-3 p-4 rounded-xl bg-amber-950/20 border border-amber-900/40">
                  <span className="text-xs font-semibold text-amber-400 flex items-center gap-1.5">
                    <ShieldAlert className="w-4 h-4" /> Recorded Failed Approaches (Anti-Patterns)
                  </span>
                  <div className="space-y-2">
                    {selectedIncident.failedApproaches.map((fa, i) => (
                      <div key={i} className="p-3 rounded-lg bg-slate-950/60 border border-amber-900/30 text-xs space-y-1">
                        <p className="text-amber-300 font-semibold text-[11px]">Attempted: {fa.actionTaken}</p>
                        <p className="text-slate-300 text-[11px]">Why it failed: {fa.whyItFailed}</p>
                        {fa.negativeImpact && (
                          <p className="text-rose-300 text-[10px]">Impact: {fa.negativeImpact}</p>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Section 6: Preventative Actions */}
              {selectedIncident.preventativeActions && selectedIncident.preventativeActions.length > 0 && (
                <div className="space-y-2 p-4 rounded-xl bg-slate-950/80 border border-slate-800">
                  <span className="text-xs font-semibold text-indigo-400">Preventative Actions</span>
                  <ul className="list-disc list-inside text-xs text-slate-300 space-y-1">
                    {selectedIncident.preventativeActions.map((pa, i) => (
                      <li key={i}>{pa}</li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Section 7: Investigation Timeline */}
              {selectedIncident.timeline && selectedIncident.timeline.length > 0 && (
                <div className="space-y-3">
                  <span className="text-xs font-semibold text-slate-300">Investigation Timeline</span>
                  <div className="space-y-2 border-l-2 border-slate-800 pl-4 ml-1">
                    {selectedIncident.timeline.map((evt, idx) => (
                      <div key={idx} className="space-y-0.5 relative">
                        <div className="w-2 h-2 rounded-full bg-sky-400 absolute -left-[21px] top-1" />
                        <div className="flex items-center justify-between text-[11px] text-slate-400">
                          <span className="font-semibold text-slate-200">{evt.action}</span>
                          <span>{new Date(evt.timestamp).toLocaleTimeString()}</span>
                        </div>
                        {evt.details && <p className="text-xs text-slate-300">{evt.details}</p>}
                        {evt.commandExecuted && (
                          <div className="p-2 rounded bg-slate-950 font-mono text-[10px] text-emerald-300 border border-slate-800 mt-1">
                            $ {evt.commandExecuted}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div className="p-4 border-t border-slate-800 bg-slate-950/60 flex items-center justify-between">
              <span className="text-[11px] text-slate-500 font-mono">
                Created: {new Date(selectedIncident.createdAt).toLocaleString()}
              </span>
              <button
                onClick={() => setSelectedIncident(null)}
                className="px-4 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* RESOLVE INCIDENT MODAL (Phase 4) */}
      {showResolveModal && selectedIncident && (
        <div className="fixed inset-0 bg-slate-950/85 backdrop-blur-md z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-2xl max-h-[90vh] flex flex-col shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            {/* Modal Header */}
            <div className="p-5 border-b border-slate-800 bg-slate-950/60 flex items-center justify-between">
              <div>
                <h3 className="text-base font-bold text-white flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                  Resolve Incident: {selectedIncident.incidentNumber}
                </h3>
                <p className="text-xs text-slate-400">
                  Document the root cause and successful resolution to retain into FixMemory.
                </p>
              </div>
              <button
                onClick={() => setShowResolveModal(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Form */}
            <form onSubmit={handleSubmitResolution} className="p-6 overflow-y-auto space-y-5 flex-1">
              {/* Root Cause */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-300">
                  Root Cause <span className="text-rose-400">*</span>
                </label>
                <textarea
                  required
                  rows={2}
                  placeholder="What was the actual underlying failure or trigger?"
                  value={rootCause}
                  onChange={(e) => setRootCause(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg p-3 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-sky-500"
                />
              </div>

              {/* Resolution Summary */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-300">
                  Resolution Summary <span className="text-rose-400">*</span>
                </label>
                <textarea
                  required
                  rows={2}
                  placeholder="How was the service recovered and stabilized?"
                  value={resolutionSummary}
                  onChange={(e) => setResolutionSummary(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg p-3 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-sky-500"
                />
              </div>

              {/* Failed Approaches (Anti-Patterns) */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-semibold text-amber-400 flex items-center gap-1.5">
                    <ShieldAlert className="w-3.5 h-3.5" /> Failed Approaches (Anti-Patterns to Retain)
                  </label>
                  <button
                    type="button"
                    onClick={addFailedApproachField}
                    className="flex items-center space-x-1 text-[11px] text-sky-400 hover:text-sky-300 font-medium"
                  >
                    <Plus className="w-3 h-3" /> <span>Add Another</span>
                  </button>
                </div>
                <p className="text-[11px] text-slate-400">
                  Recording what did NOT work teaches FixMemory to warn engineers against repeating the same mistake.
                </p>

                {failedApproaches.map((fa, idx) => (
                  <div key={idx} className="p-3 rounded-lg bg-slate-950/80 border border-slate-800 space-y-2 relative">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-semibold text-slate-400">Approach #{idx + 1}</span>
                      {failedApproaches.length > 1 && (
                        <button
                          type="button"
                          onClick={() => removeFailedApproach(idx)}
                          className="text-slate-500 hover:text-rose-400"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                    <input
                      type="text"
                      placeholder="Action Taken (e.g. Restarted frontend pod cluster)"
                      value={fa.actionTaken}
                      onChange={(e) => updateFailedApproach(idx, 'actionTaken', e.target.value)}
                      className="w-full bg-slate-900 border border-slate-800 rounded px-2.5 py-1.5 text-xs text-slate-200 placeholder-slate-600 focus:outline-none focus:border-sky-500"
                    />
                    <input
                      type="text"
                      placeholder="Why It Failed (e.g. Frontend was unrelated to database connection leak)"
                      value={fa.whyItFailed}
                      onChange={(e) => updateFailedApproach(idx, 'whyItFailed', e.target.value)}
                      className="w-full bg-slate-900 border border-slate-800 rounded px-2.5 py-1.5 text-xs text-slate-200 placeholder-slate-600 focus:outline-none focus:border-sky-500"
                    />
                  </div>
                ))}
              </div>

              {/* Preventative Actions */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-semibold text-slate-300">
                    Preventative Actions
                  </label>
                  <button
                    type="button"
                    onClick={addPreventativeActionField}
                    className="flex items-center space-x-1 text-[11px] text-sky-400 hover:text-sky-300 font-medium"
                  >
                    <Plus className="w-3 h-3" /> <span>Add Another</span>
                  </button>
                </div>

                {preventativeActions.map((pa, idx) => (
                  <div key={idx} className="flex items-center space-x-2">
                    <input
                      type="text"
                      placeholder="e.g. Add alert for connection pool > 80%"
                      value={pa}
                      onChange={(e) => updatePreventativeAction(idx, e.target.value)}
                      className="flex-1 bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-slate-200 placeholder-slate-600 focus:outline-none focus:border-sky-500"
                    />
                    {preventativeActions.length > 1 && (
                      <button
                        type="button"
                        onClick={() => removePreventativeAction(idx)}
                        className="text-slate-500 hover:text-rose-400"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                ))}
              </div>

              {/* Actions */}
              <div className="pt-4 border-t border-slate-800 flex items-center justify-between">
                <button
                  type="button"
                  onClick={() => setShowResolveModal(false)}
                  className="px-4 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-medium"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={resolving}
                  className="flex items-center space-x-2 px-5 py-2.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold shadow-lg shadow-emerald-500/20 disabled:opacity-50"
                >
                  <Check className="w-4 h-4" />
                  <span>{resolving ? 'Storing in Hindsight...' : 'Resolve & Retain in FixMemory'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
