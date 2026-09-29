import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  AlertTriangle, 
  Send, 
  ArrowLeft, 
  Server, 
  User, 
  Sparkles,
  Layers,
  Terminal
} from 'lucide-react';
import { createIncident, getServices, getEngineers } from '../services/api';

export default function CreateIncidentPage() {
  const navigate = useNavigate();
  const [services, setServices] = useState([]);
  const [engineers, setEngineers] = useState([]);
  const [loadingLookups, setLoadingLookups] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);

  // Form State
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [serviceId, setServiceId] = useState('');
  const [assignedEngineerId, setAssignedEngineerId] = useState('');
  const [severity, setSeverity] = useState('HIGH');
  const [errorMessage, setErrorMessage] = useState('');
  const [stackTrace, setStackTrace] = useState('');
  const [rawLogs, setRawLogs] = useState('');

  useEffect(() => {
    const fetchOptions = async () => {
      try {
        setLoadingLookups(true);
        const [servicesRes, engineersRes] = await Promise.allSettled([
          getServices(),
          getEngineers(),
        ]);

        if (servicesRes.status === 'fulfilled' && servicesRes.value?.success) {
          setServices(servicesRes.value.data || []);
          if (servicesRes.value.data?.length > 0) {
            setServiceId(servicesRes.value.data[0]._id);
          }
        }

        if (engineersRes.status === 'fulfilled' && engineersRes.value?.success) {
          setEngineers(engineersRes.value.data || []);
        }
      } catch (err) {
        console.error('Failed to load form lookups', err);
      } finally {
        setLoadingLookups(false);
      }
    };

    fetchOptions();
  }, []);

  // Quick preset loader for fast testing
  const loadPreset = (presetType) => {
    if (presetType === 'postgres') {
      setTitle('PostgreSQL connection pool exhausted during batch calculation');
      setDescription('Order writes failing with 500 error code. Pool reached 50/50 max connections with 120 client requests queued.');
      setSeverity('CRITICAL');
      setErrorMessage('SequelizeConnectionAcquireTimeoutError: ResourceRequest timed out after 10000ms');
      setStackTrace(`SequelizeConnectionAcquireTimeoutError: ResourceRequest timed out after 10000ms\n    at Timeout._onTimeout (/app/node_modules/sequelize-pool/lib/Pool.js:231:19)\n    at async OrderService.createOrder (/app/src/services/order.js:112:20)`);
      const orderService = services.find((s) => s.slug === 'order-processor');
      if (orderService) setServiceId(orderService._id);
    } else if (presetType === 'redis') {
      setTitle('Redis maximum connection limit reached in auth session cache');
      setDescription('Session token validations failing. Redis server rejecting new TCP handshakes with max clients reached.');
      setSeverity('HIGH');
      setErrorMessage('RedisError: Max client connections reached: 10000 clients');
      setStackTrace(`RedisError: Max client connections reached: 10000 clients\n    at Redis.sendCommand (/app/node_modules/ioredis/lib/redis.js:410:14)`);
      const authService = services.find((s) => s.slug === 'auth-service');
      if (authService) setServiceId(authService._id);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!title.trim() || !description.trim() || !serviceId) {
      setError('Please fill in title, description, and affected service');
      return;
    }

    try {
      setSubmitting(true);
      setError(null);

      const payload = {
        title: title.trim(),
        description: description.trim(),
        serviceId,
        assignedEngineerId: assignedEngineerId || undefined,
        severity,
        errorMessage: errorMessage.trim(),
        stackTrace: stackTrace.trim(),
        rawLogs: rawLogs.trim(),
        errorSignature: errorMessage.slice(0, 100).trim(),
      };

      const res = await createIncident(payload);
      if (res && res.success) {
        navigate('/incidents');
      } else {
        setError(res?.message || 'Failed to create incident');
      }
    } catch (err) {
      setError(err.message || 'Error communicating with server');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto space-y-6 pb-16">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="space-y-1">
          <button
            onClick={() => navigate('/incidents')}
            className="inline-flex items-center text-xs text-slate-400 hover:text-white transition-colors mb-1 gap-1"
          >
            <ArrowLeft className="w-3.5 h-3.5" /> Back to Incidents
          </button>
          <h1 className="text-2xl font-bold text-white tracking-tight">Create New Incident</h1>
          <p className="text-xs text-slate-400">
            Log an active production disruption into MongoDB Atlas and initiate triage tracking.
          </p>
        </div>

        {/* Quick Testing Presets */}
        <div className="flex items-center space-x-2">
          <span className="text-[11px] text-slate-400 font-medium">Test Presets:</span>
          <button
            type="button"
            onClick={() => loadPreset('postgres')}
            className="px-2.5 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-mono border border-slate-700"
          >
            Postgres Pool
          </button>
          <button
            type="button"
            onClick={() => loadPreset('redis')}
            className="px-2.5 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-mono border border-slate-700"
          >
            Redis MaxClients
          </button>
        </div>
      </div>

      {error && (
        <div className="p-4 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs">
          {error}
        </div>
      )}

      {/* Incident Form */}
      <form onSubmit={handleSubmit} className="p-6 rounded-2xl bg-slate-900/80 border border-slate-800 space-y-5 shadow-xl">
        {/* Title */}
        <div className="space-y-1.5">
          <label className="text-xs font-semibold text-slate-300">
            Incident Title <span className="text-rose-400">*</span>
          </label>
          <input
            type="text"
            required
            placeholder="e.g. 504 Gateway Timeout during checkout on payment-service"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3.5 py-2.5 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-sky-500 focus:ring-1 focus:ring-sky-500"
          />
        </div>

        {/* Description */}
        <div className="space-y-1.5">
          <label className="text-xs font-semibold text-slate-300">
            Description & Symptoms <span className="text-rose-400">*</span>
          </label>
          <textarea
            required
            rows={3}
            placeholder="Describe the observed symptoms, impacted users, and initial context..."
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            className="w-full bg-slate-950 border border-slate-800 rounded-lg p-3 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-sky-500 focus:ring-1 focus:ring-sky-500"
          />
        </div>

        {/* Grid: Service, Severity, Assignee */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Affected Service */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-slate-300 flex items-center gap-1.5">
              <Server className="w-3.5 h-3.5 text-sky-400" />
              Affected Service <span className="text-rose-400">*</span>
            </label>
            <select
              required
              value={serviceId}
              onChange={(e) => setServiceId(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-sky-500"
            >
              {services.map((svc) => (
                <option key={svc._id} value={svc._id}>
                  {svc.name} ({svc.tier || 'TIER_1'})
                </option>
              ))}
            </select>
          </div>

          {/* Severity */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-slate-300 flex items-center gap-1.5">
              <AlertTriangle className="w-3.5 h-3.5 text-amber-400" />
              Severity Level
            </label>
            <select
              value={severity}
              onChange={(e) => setSeverity(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-sky-500"
            >
              <option value="CRITICAL">CRITICAL (P1 — Outage)</option>
              <option value="HIGH">HIGH (P2 — Degraded)</option>
              <option value="MEDIUM">MEDIUM (P3 — Impaired)</option>
              <option value="LOW">LOW (P4 — Minor)</option>
            </select>
          </div>

          {/* Assignee */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-slate-300 flex items-center gap-1.5">
              <User className="w-3.5 h-3.5 text-slate-400" />
              Assign Engineer
            </label>
            <select
              value={assignedEngineerId}
              onChange={(e) => setAssignedEngineerId(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-sky-500"
            >
              <option value="">Unassigned (On-call triage)</option>
              {engineers.map((eng) => (
                <option key={eng._id} value={eng._id}>
                  {eng.name} {eng.isOnCall ? '⚡ (On-Call)' : ''}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Error Message */}
        <div className="space-y-1.5">
          <label className="text-xs font-semibold text-slate-300 flex items-center gap-1.5">
            <Terminal className="w-3.5 h-3.5 text-rose-400" />
            Error Message / Alert Signature
          </label>
          <input
            type="text"
            placeholder="e.g. SequelizeConnectionAcquireTimeoutError: ResourceRequest timed out after 10000ms"
            value={errorMessage}
            onChange={(e) => setErrorMessage(e.target.value)}
            className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3.5 py-2.5 font-mono text-xs text-rose-300 placeholder-slate-600 focus:outline-none focus:border-sky-500"
          />
        </div>

        {/* Stack Trace */}
        <div className="space-y-1.5">
          <label className="text-xs font-semibold text-slate-300">
            Stack Trace / Log Snippet
          </label>
          <textarea
            rows={4}
            placeholder="Paste application stack trace or error log frames here..."
            value={stackTrace}
            onChange={(e) => setStackTrace(e.target.value)}
            className="w-full bg-slate-950 border border-slate-800 rounded-lg p-3 font-mono text-xs text-slate-300 placeholder-slate-600 focus:outline-none focus:border-sky-500"
          />
        </div>

        {/* Form Actions */}
        <div className="pt-4 border-t border-slate-800 flex items-center justify-between">
          <button
            type="button"
            onClick={() => navigate('/incidents')}
            className="px-4 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-medium"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={submitting}
            className="flex items-center space-x-2 px-5 py-2.5 rounded-lg bg-sky-500 hover:bg-sky-400 text-white text-xs font-semibold shadow-lg shadow-sky-500/20 transition-all disabled:opacity-50"
          >
            <Send className="w-3.5 h-3.5" />
            <span>{submitting ? 'Creating in MongoDB...' : 'Trigger Incident'}</span>
          </button>
        </div>
      </form>
    </div>
  );
}
