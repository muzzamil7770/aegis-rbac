import React from 'react';
import { useAuth } from '../context/AuthContext';
import { Calendar, ShieldAlert } from 'lucide-react';

export default function Header({ title }) {
  const { roles } = useAuth();
  
  // Format current date
  const today = new Date().toLocaleDateString('en-US', {
    weekday: 'short',
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  });

  return (
    <header className="h-16 flex items-center justify-between px-8 bg-slate-900/40 border-b border-slate-800 backdrop-blur-md">
      {/* Title / Section */}
      <div>
        <h2 className="text-xl font-bold font-outfit text-white tracking-wide">{title}</h2>
      </div>

      {/* Info Badges */}
      <div className="flex items-center gap-4">
        {/* Date Display */}
        <div className="hidden sm:flex items-center gap-2 text-xs text-slate-400 bg-slate-800/40 border border-slate-800 px-3 py-1.5 rounded-lg">
          <Calendar className="w-3.5 h-3.5 text-brand-400" />
          <span>{today}</span>
        </div>

        {/* Roles Indicator */}
        <div className="flex items-center gap-1.5 text-xs font-semibold text-brand-400 bg-brand-500/10 border border-brand-500/20 px-3 py-1.5 rounded-lg">
          <ShieldAlert className="w-3.5 h-3.5" />
          <span className="capitalize">{roles.join(', ')}</span>
        </div>

        {/* Environment Badge */}
        <span className="hidden md:inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
          Dev Mode
        </span>
      </div>
    </header>
  );
}
