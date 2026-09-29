import React, { useState, useEffect } from 'react';
import { Server, Activity, ShieldCheck, RefreshCw, AlertTriangle, Layers } from 'lucide-react';
import { getServices } from '../services/api';

export default function ServicesPage() {
  const [services, setServices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const loadServices = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await getServices();
      if (res && res.success) {
        setServices(res.data || []);
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadServices();
  }, []);

  const getHealthBadge = (status) => {
    switch (status) {
      case 'HEALTHY':
        return 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30';
      case 'DEGRADED':
        return 'bg-amber-500/10 text-amber-400 border-amber-500/30';
      case 'OUTAGE':
        return 'bg-rose-500/10 text-rose-400 border-rose-500/30';
      default:
        return 'bg-slate-500/10 text-slate-400 border-slate-500/30';
    }
  };

  return (
    <div className="space-y-6 pb-12">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white tracking-tight">Microservices Inventory</h1>
          <p className="text-xs text-slate-400">
            Catalog of guarded services, dependencies, and real-time incident incident metrics.
          </p>
        </div>
        <button
          onClick={loadServices}
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
          Loading services from MongoDB Atlas...
        </div>
      ) : services.length === 0 ? (
        <div className="p-12 text-center text-xs text-slate-400">
          No services registered yet.
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {services.map((svc) => (
            <div
              key={svc._id}
              className="p-5 rounded-xl bg-slate-900/70 border border-slate-800 space-y-4 hover:border-slate-700 transition-all"
            >
              <div className="flex items-start justify-between">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 rounded-xl bg-sky-500/10 border border-sky-500/20 text-sky-400 flex items-center justify-center">
                    <Server className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-white">{svc.name}</h3>
                    <p className="text-[11px] text-slate-400">{svc.ownerTeam || 'Platform Team'}</p>
                  </div>
                </div>
                <span className={`text-[10px] font-semibold px-2 py-0.5 rounded border ${getHealthBadge(svc.healthStatus)}`}>
                  {svc.healthStatus}
                </span>
              </div>

              <p className="text-xs text-slate-300 leading-relaxed min-h-[32px]">
                {svc.description || 'No description provided.'}
              </p>

              <div className="pt-3 border-t border-slate-800/80 flex items-center justify-between text-xs">
                <div className="flex items-center space-x-2">
                  <span className="text-[10px] font-semibold px-2 py-0.5 rounded bg-slate-800 text-slate-300 border border-slate-700">
                    {svc.tier}
                  </span>
                  <span className="text-[10px] font-mono text-slate-400">
                    Bank: {svc.hindsightBankId || 'main'}
                  </span>
                </div>

                <div className="flex items-center space-x-3 text-slate-400">
                  <span>
                    Total: <strong className="text-slate-200">{svc.incidentStats?.total || 0}</strong>
                  </span>
                  <span>
                    Active: <strong className={svc.incidentStats?.active > 0 ? 'text-amber-400' : 'text-slate-400'}>
                      {svc.incidentStats?.active || 0}
                    </strong>
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
