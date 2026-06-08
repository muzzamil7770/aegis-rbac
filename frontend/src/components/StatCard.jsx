import React from 'react';

export default function StatCard({ title, value, icon: Icon, description, trend, color = 'brand' }) {
  const colorMap = {
    brand: {
      bg: 'bg-brand-500/10',
      text: 'text-brand-400',
      border: 'border-brand-500/20',
      glow: 'shadow-brand-500/5'
    },
    emerald: {
      bg: 'bg-emerald-500/10',
      text: 'text-emerald-400',
      border: 'border-emerald-500/20',
      glow: 'shadow-emerald-500/5'
    },
    amber: {
      bg: 'bg-amber-500/10',
      text: 'text-amber-400',
      border: 'border-amber-500/20',
      glow: 'shadow-amber-500/5'
    },
    rose: {
      bg: 'bg-rose-500/10',
      text: 'text-rose-400',
      border: 'border-rose-500/20',
      glow: 'shadow-rose-500/5'
    },
    indigo: {
      bg: 'bg-indigo-500/10',
      text: 'text-indigo-400',
      border: 'border-indigo-500/20',
      glow: 'shadow-indigo-500/5'
    }
  };

  const currentColors = colorMap[color] || colorMap.brand;

  return (
    <div className={`p-6 rounded-2xl bg-slate-900 border border-slate-800 shadow-glass flex flex-col justify-between hover:border-slate-700/80 hover:shadow-glow transition-all duration-300 relative overflow-hidden group`}>
      {/* Decorative Gradient Background overlay */}
      <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-br from-brand-600/5 to-transparent rounded-bl-full pointer-events-none group-hover:from-brand-600/10 transition-all duration-300" />

      <div className="flex items-center justify-between mb-4">
        <span className="text-sm font-semibold text-slate-400 tracking-wide">{title}</span>
        <div className={`p-3 rounded-xl ${currentColors.bg} ${currentColors.text} border ${currentColors.border} transition-transform duration-300 group-hover:scale-110`}>
          <Icon className="w-5 h-5" />
        </div>
      </div>

      <div>
        <h3 className="text-3xl font-bold font-outfit text-white tracking-tight leading-none mb-2">{value}</h3>
        <div className="flex items-center gap-2">
          {trend !== undefined && (
            <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${trend >= 0 ? 'bg-emerald-500/10 text-emerald-400' : 'bg-rose-500/10 text-rose-400'}`}>
              {trend >= 0 ? `+${trend}%` : `${trend}%`}
            </span>
          )}
          <span className="text-xs text-slate-500 font-medium">{description}</span>
        </div>
      </div>
    </div>
  );
}
