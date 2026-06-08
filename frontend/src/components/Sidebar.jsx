import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { 
  LayoutDashboard, 
  Users, 
  ShieldCheck, 
  History, 
  LogOut, 
  Building2, 
  UserCircle 
} from 'lucide-react';

export default function Sidebar() {
  const { user, tenant, logout, hasPermission } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const navItems = [
    {
      to: '/dashboard',
      label: 'Dashboard',
      icon: LayoutDashboard,
      show: true
    },
    {
      to: '/users',
      label: 'Users Management',
      icon: Users,
      show: hasPermission('users:read')
    },
    {
      to: '/roles',
      label: 'Roles & Permissions',
      icon: ShieldCheck,
      show: hasPermission('roles:read')
    },
    {
      to: '/audit-logs',
      label: 'Security Audit Logs',
      icon: History,
      show: hasPermission('audit:read')
    }
  ];

  return (
    <aside className="w-64 flex flex-col h-full bg-slate-900 border-r border-slate-800 text-slate-300">
      {/* Header / Brand Logo */}
      <div className="h-16 flex items-center px-6 border-b border-slate-800 gap-3 bg-slate-900/50">
        <div className="p-2 rounded-lg bg-brand-600 text-white shadow-glow">
          <ShieldCheck className="w-6 h-6" />
        </div>
        <div>
          <h1 className="font-outfit font-bold text-white text-lg tracking-wide leading-none">AEGIS</h1>
          <span className="text-[10px] uppercase font-semibold text-brand-400 tracking-widest">RBAC engine</span>
        </div>
      </div>

      {/* Tenant Indicator */}
      <div className="p-4 mx-4 my-3 rounded-xl bg-slate-950/40 border border-slate-800/60 flex items-center gap-3">
        <Building2 className="w-5 h-5 text-brand-400 flex-shrink-0" />
        <div className="overflow-hidden">
          <p className="text-xs text-slate-500 font-semibold uppercase tracking-wider leading-none">Organization</p>
          <p className="text-sm font-semibold text-slate-200 truncate mt-1">{tenant?.name}</p>
        </div>
      </div>

      {/* Navigation Links */}
      <nav className="flex-1 px-4 py-3 space-y-1 overflow-y-auto">
        {navItems.map((item) => {
          if (!item.show) return null;
          const Icon = item.icon;
          return (
            <NavLink
              key={item.to}
              to={item.to}
              className={({ isActive }) => `
                flex items-center gap-3 px-4 py-3 rounded-xl font-medium text-sm transition-all duration-200
                ${isActive 
                  ? 'bg-brand-600/15 text-brand-400 border-l-4 border-brand-500 shadow-glow pl-3' 
                  : 'hover:bg-slate-800/50 hover:text-slate-100'}
              `}
            >
              <Icon className="w-5 h-5 flex-shrink-0" />
              <span>{item.label}</span>
            </NavLink>
          );
        })}
      </nav>

      {/* User Card & Logout */}
      <div className="p-4 border-t border-slate-800 bg-slate-900/50 flex flex-col gap-3">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-slate-800 flex items-center justify-center text-brand-400 border border-slate-700">
            <UserCircle className="w-6 h-6" />
          </div>
          <div className="overflow-hidden">
            <p className="text-sm font-semibold text-slate-100 truncate">{user?.name}</p>
            <p className="text-xs text-slate-500 truncate mt-0.5">{user?.email}</p>
          </div>
        </div>

        <button
          onClick={handleLogout}
          className="flex items-center justify-center gap-2 w-full py-2.5 px-4 rounded-xl text-sm font-medium text-red-400 bg-red-500/5 border border-red-500/10 hover:bg-red-500/15 hover:text-red-300 transition-all duration-200"
        >
          <LogOut className="w-4 h-4" />
          <span>Sign Out</span>
        </button>
      </div>
    </aside>
  );
}
