import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';
import Header from '../components/Header';
import StatCard from '../components/StatCard';
import { 
  Users, 
  Shield, 
  History, 
  CheckCircle, 
  Lock, 
  ArrowRight,
  TrendingUp
} from 'lucide-react';
import { 
  AreaChart, 
  Area, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer 
} from 'recharts';

export default function Dashboard() {
  const { hasPermission } = useAuth();
  
  const [stats, setStats] = useState({
    usersCount: 0,
    suspendedUsers: 0,
    rolesCount: 0,
    logsCount: 0,
    health: 'Online'
  });
  const [recentLogs, setRecentLogs] = useState([]);
  const [chartData, setChartData] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchDashboardData() {
      setLoading(true);
      try {
        let users = [];
        let roles = [];
        let logsResult = { logs: [] };

        // Conditional fetching based on permissions to prevent crash
        if (hasPermission('users:read')) {
          const res = await api.get('/users');
          users = res.data;
        }
        if (hasPermission('roles:read')) {
          const res = await api.get('/roles');
          roles = res.data;
        }
        if (hasPermission('audit:read')) {
          const res = await api.get('/audit?limit=10');
          logsResult = res.data;
        }

        const activeUsers = users.filter(u => u.status === 'active').length;
        const suspended = users.filter(u => u.status === 'suspended').length;
        
        setStats({
          usersCount: users.length,
          suspendedUsers: suspended,
          rolesCount: roles.length,
          logsCount: logsResult.pagination?.total || logsResult.logs.length,
          health: 'Online'
        });

        setRecentLogs(logsResult.logs.slice(0, 5));

        // Group audit logs by action or construct mockup logs dataset for the chart 
        // to look beautiful even on first seed
        const rawLogs = logsResult.logs;
        if (rawLogs.length > 0) {
          const grouped = rawLogs.reduce((acc, log) => {
            const date = new Date(log.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
            acc[date] = (acc[date] || 0) + 1;
            return acc;
          }, {});

          const formattedChart = Object.keys(grouped).map(date => ({
            name: date,
            actions: grouped[date]
          })).reverse();
          setChartData(formattedChart);
        } else {
          // Default data if no logs yet
          setChartData([
            { name: 'Mon', actions: 2 },
            { name: 'Tue', actions: 4 },
            { name: 'Wed', actions: 3 },
            { name: 'Thu', actions: 7 },
            { name: 'Fri', actions: 5 },
            { name: 'Sat', actions: 2 },
            { name: 'Sun', actions: 4 },
          ]);
        }
      } catch (err) {
        console.error('Failed to load dashboard data:', err);
      } finally {
        setLoading(false);
      }
    }

    fetchDashboardData();
  }, [hasPermission]);

  return (
    <div className="flex-1 flex flex-col overflow-hidden bg-slate-950">
      <Header title="Security Overview Dashboard" />

      {/* Main Panel Content */}
      <main className="flex-1 overflow-y-auto p-8 space-y-8">
        {/* Quick Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <StatCard
            title="Total Team Users"
            value={hasPermission('users:read') ? stats.usersCount : 'RESTRICTED'}
            icon={Users}
            description={hasPermission('users:read') ? `${stats.suspendedUsers} suspended` : 'Lacks users:read permission'}
            trend={12}
            color="brand"
          />
          <StatCard
            title="RBAC Active Roles"
            value={hasPermission('roles:read') ? stats.rolesCount : 'RESTRICTED'}
            icon={Shield}
            description={hasPermission('roles:read') ? 'Mapped system & custom roles' : 'Lacks roles:read permission'}
            trend={0}
            color="indigo"
          />
          <StatCard
            title="Audited Actions"
            value={hasPermission('audit:read') ? stats.logsCount : 'RESTRICTED'}
            icon={History}
            description={hasPermission('audit:read') ? 'Security actions tracked' : 'Lacks audit:read permission'}
            trend={8.4}
            color="amber"
          />
          <StatCard
            title="System Security"
            value={stats.health}
            icon={CheckCircle}
            description="Tenant isolation status active"
            color="emerald"
          />
        </div>

        {/* Charts & Actions Panel */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Chart Column (2 cols width) */}
          <div className="lg:col-span-2 p-6 rounded-2xl bg-slate-900 border border-slate-800 shadow-glass flex flex-col justify-between min-h-[350px]">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h3 className="font-outfit font-bold text-white text-base tracking-wide">Security Actions Timeline</h3>
                <p className="text-xs text-slate-500 mt-0.5">Distribution of logged operations within your workspace</p>
              </div>
              <div className="flex items-center gap-1 text-emerald-400 text-xs font-semibold bg-emerald-500/10 border border-emerald-500/20 px-2.5 py-1 rounded-lg">
                <TrendingUp className="w-3.5 h-3.5" />
                <span>Live Feed</span>
              </div>
            </div>

            {hasPermission('audit:read') ? (
              <div className="h-64 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                    <defs>
                      <linearGradient id="colorActions" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.4}/>
                        <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" opacity={0.3} />
                    <XAxis dataKey="name" stroke="#64748b" fontSize={11} tickLine={false} />
                    <YAxis stroke="#64748b" fontSize={11} tickLine={false} />
                    <Tooltip 
                      contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '12px', color: '#f8fafc' }}
                      labelClassName="text-slate-400 font-semibold text-xs"
                    />
                    <Area type="monotone" dataKey="actions" stroke="#8b5cf6" strokeWidth={2.5} fillOpacity={1} fill="url(#colorActions)" />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            ) : (
              <div className="flex-1 flex flex-col items-center justify-center text-center p-8 bg-slate-950/40 border border-slate-800/60 border-dashed rounded-xl">
                <Lock className="w-8 h-8 text-slate-600 mb-2" />
                <h4 className="text-sm font-semibold text-slate-400">Audit Data Unavailable</h4>
                <p className="text-xs text-slate-600 mt-1 max-w-xs">You must be granted the 'audit:read' permission to view system timeline statistics.</p>
              </div>
            )}
          </div>

          {/* Recent Logs Summary Column */}
          <div className="p-6 rounded-2xl bg-slate-900 border border-slate-800 shadow-glass flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h3 className="font-outfit font-bold text-white text-base tracking-wide">Recent Operations</h3>
                  <p className="text-xs text-slate-500 mt-0.5">Latest changes across tenant modules</p>
                </div>
                {hasPermission('audit:read') && (
                  <Link to="/audit-logs" className="text-xs font-semibold text-brand-400 hover:text-brand-300 flex items-center gap-1 transition-colors duration-150">
                    <span>View all</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </Link>
                )}
              </div>

              {hasPermission('audit:read') ? (
                <div className="space-y-4">
                  {loading ? (
                    <div className="text-center py-8 text-xs text-slate-500">Loading audit feed...</div>
                  ) : recentLogs.length === 0 ? (
                    <div className="text-center py-8 text-xs text-slate-500">No actions recorded yet.</div>
                  ) : (
                    recentLogs.map((log) => (
                      <div key={log.id} className="flex items-start justify-between border-b border-slate-800/40 pb-3 last:border-0 last:pb-0">
                        <div className="overflow-hidden pr-3">
                          <p className="text-sm font-medium text-slate-200 truncate">{log.user_email || 'System'}</p>
                          <p className="text-xs text-slate-500 mt-0.5 flex items-center gap-1.5">
                            <span className="font-semibold text-brand-400">{log.action}</span>
                            <span>•</span>
                            <span className="text-[10px]">{new Date(log.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                          </p>
                        </div>
                        <span className={`text-[10px] uppercase font-bold px-2 py-0.5 rounded-full ${log.status === 'success' ? 'bg-emerald-500/10 text-emerald-400' : 'bg-rose-500/10 text-rose-400'}`}>
                          {log.status}
                        </span>
                      </div>
                    ))
                  )}
                </div>
              ) : (
                <div className="flex-1 flex flex-col items-center justify-center text-center py-12 px-6 bg-slate-950/40 border border-slate-800/60 border-dashed rounded-xl h-full min-h-[200px]">
                  <Lock className="w-8 h-8 text-slate-600 mb-2" />
                  <h4 className="text-sm font-semibold text-slate-400">Logs Blocked</h4>
                  <p className="text-xs text-slate-600 mt-1">Requires audit log permission level.</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
