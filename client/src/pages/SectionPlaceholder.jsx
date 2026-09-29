import React from 'react';
import { useLocation, Link } from 'react-router-dom';
import { Construction, ArrowLeft } from 'lucide-react';

export default function SectionPlaceholder({ title, description, phase = 'Phase 2' }) {
  const location = useLocation();
  const displayTitle = title || location.pathname.replace('/', '').replace('-', ' ').toUpperCase();

  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] text-center p-8">
      <div className="w-16 h-16 rounded-2xl bg-sky-500/10 border border-sky-500/20 text-sky-400 flex items-center justify-center mb-6 shadow-lg shadow-sky-500/5">
        <Construction className="w-8 h-8 animate-bounce" />
      </div>
      <span className="text-xs font-semibold px-3 py-1 rounded-full bg-slate-800 text-sky-400 border border-slate-700 mb-3">
        Scheduled for {phase}
      </span>
      <h2 className="text-2xl font-bold text-white mb-2">{displayTitle}</h2>
      <p className="text-sm text-slate-400 max-w-md mb-6">
        {description || `This module will be connected and implemented in ${phase} following the approved phased roadmap.`}
      </p>
      <Link
        to="/"
        className="inline-flex items-center space-x-2 px-4 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium border border-slate-700 transition-all"
      >
        <ArrowLeft className="w-4 h-4" />
        <span>Return to Dashboard</span>
      </Link>
    </div>
  );
}
