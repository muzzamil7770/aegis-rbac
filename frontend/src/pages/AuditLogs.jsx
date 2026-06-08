import React, { useState, useEffect } from 'react';
import api from '../services/api';
import Header from '../components/Header';
import { 
  History, 
  Search, 
  ChevronDown, 
  ChevronUp, 
  Terminal, 
  Filter, 
  X,
  ArrowLeft,
  ArrowRight
} from 'lucide-react';

export default function AuditLogsPage() {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // Filters
  const [emailFilter, setEmailFilter] = useState('');
  const [actionFilter, setActionFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  
  // Pagination
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalRecords, setTotalRecords] = useState(0);

  // Accordion state
  const [expandedLogId, setExpandedLogId] = useState(null);

  useEffect(() => {
    fetchLogs();
  }, [page, actionFilter, statusFilter]); // fetch on page or strict filters change

  const fetchLogs = async () => {
    setLoading(true);
    try {
      const params = {
        page,
        limit: 15,
        action: actionFilter || undefined,
        status: statusFilter || undefined,
        email: emailFilter || undefined
      };
      
      const response = await api.get('/audit', { params });
      setLogs(response.data.logs);
      setTotalPages(response.data.pagination.pages);
      setTotalRecords(response.data.pagination.total);
    } catch (err) {
      console.error('Failed to load audit logs:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    setPage(1);
    fetchLogs();
  };

  const handleClearFilters = () => {
    setEmailFilter('');
    setActionFilter('');
    setStatusFilter('');
    setPage(1);
    // Directly fetch with clean parameters
    setLoading(true);
    api.get('/audit', { params: { page: 1, limit: 15 } })
      .then(res => {
        setLogs(res.data.logs);
        setTotalPages(res.data.pagination.pages);
        setTotalRecords(res.data.pagination.total);
      })
      .catch(err => console.error(err))
      .finally(() => setLoading(false));
  };

  const toggleRow = (id) => {
    setExpandedLogId(expandedLogId === id ? null : id);
  };

  return (
    <div className="flex-1 flex flex-col overflow-hidden bg-slate-950">
      <Header title="Security Audit Trails" />

      <main className="flex-1 overflow-y-auto p-8 space-y-6">
        {/* Filters Dashboard Panel */}
        <div className="p-6 rounded-2xl bg-slate-900 border border-slate-800 shadow-glass space-y-4">
          <div className="flex items-center gap-2 text-sm font-semibold text-slate-300">
            <Filter className="w-4.5 h-4.5 text-brand-400" />
            <span>Search & Filter Operations</span>
          </div>

          <form onSubmit={handleSearchSubmit} className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-4 items-end">
            {/* Actor Email Search */}
            <div>
              <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-2">User Email</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-500">
                  <Search className="w-4 h-4" />
                </div>
                <input
                  type="text"
                  placeholder="Filter by user email..."
                  value={emailFilter}
                  onChange={(e) => setEmailFilter(e.target.value)}
                  className="block w-full pl-9 pr-4 py-2 bg-slate-950 border border-slate-800 rounded-xl text-slate-200 placeholder-slate-600 focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-brand-500 text-xs font-semibold"
                />
              </div>
            </div>

            {/* Action Dropdown */}
            <div>
              <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-2">Operation Type</label>
              <select
                value={actionFilter}
                onChange={(e) => setActionFilter(e.target.value)}
                className="block w-full px-4 py-2 bg-slate-950 border border-slate-800 rounded-xl text-slate-200 focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-brand-500 text-xs font-semibold"
              >
                <option value="">All Operations</option>
                <option value="auth.login">auth.login</option>
                <option value="auth.register">auth.register</option>
                <option value="user.create">user.create</option>
                <option value="user.update">user.update</option>
                <option value="user.delete">user.delete</option>
                <option value="role.create">role.create</option>
                <option value="role.update">role.update</option>
                <option value="role.delete">role.delete</option>
              </select>
            </div>

            {/* Status Dropdown */}
            <div>
              <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-2">Outcome Status</label>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="block w-full px-4 py-2 bg-slate-950 border border-slate-800 rounded-xl text-slate-200 focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-brand-500 text-xs font-semibold"
              >
                <option value="">All Statuses</option>
                <option value="success">Success</option>
                <option value="failure">Failure</option>
              </select>
            </div>

            {/* Filter buttons */}
            <div className="flex gap-2">
              <button
                type="submit"
                className="flex-1 px-4 py-2 rounded-xl text-xs font-semibold text-white bg-brand-600 hover:bg-brand-500 transition-all duration-200"
              >
                Apply
              </button>
              <button
                type="button"
                onClick={handleClearFilters}
                className="px-3 py-2 rounded-xl text-xs font-semibold text-slate-400 hover:text-slate-200 bg-slate-800/60 border border-slate-800 hover:border-slate-700 transition-all"
                title="Reset Filters"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </form>
        </div>

        {/* Logs Table Panel */}
        <div className="rounded-2xl bg-slate-900 border border-slate-800 shadow-glass overflow-hidden">
          {loading ? (
            <div className="py-20 text-center text-slate-500">Querying security ledger...</div>
          ) : logs.length === 0 ? (
            <div className="py-20 text-center text-slate-500">
              <History className="w-12 h-12 text-slate-700 mx-auto mb-3" />
              <p className="font-semibold text-slate-400">No logs matching criteria</p>
              <p className="text-xs text-slate-600 mt-1">Try widening your search queries.</p>
            </div>
          ) : (
            <div>
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-slate-950/40 border-b border-slate-800 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                      <th className="w-8 px-6 py-4"></th>
                      <th className="px-6 py-4">Timestamp</th>
                      <th className="px-6 py-4">Actor Email</th>
                      <th className="px-6 py-4">Action</th>
                      <th className="px-6 py-4">Target Resource</th>
                      <th className="px-6 py-4">Client IP</th>
                      <th className="px-6 py-4">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/40 text-xs text-slate-300">
                    {logs.map((log) => {
                      const isExpanded = expandedLogId === log.id;
                      const logDate = new Date(log.created_at).toLocaleString();
                      
                      return (
                        <React.Fragment key={log.id}>
                          {/* Row Summary */}
                          <tr 
                            onClick={() => toggleRow(log.id)}
                            className="hover:bg-slate-800/10 cursor-pointer transition-colors"
                          >
                            <td className="px-6 py-4 text-center">
                              {isExpanded ? (
                                <ChevronUp className="w-4 h-4 text-brand-400" />
                              ) : (
                                <ChevronDown className="w-4 h-4 text-slate-500" />
                              )}
                            </td>
                            <td className="px-6 py-4 font-semibold whitespace-nowrap">{logDate}</td>
                            <td className="px-6 py-4 font-medium">{log.user_email || 'System'}</td>
                            <td className="px-6 py-4 font-mono font-bold text-brand-400">{log.action}</td>
                            <td className="px-6 py-4 font-mono text-slate-500 whitespace-nowrap">
                              {log.resource}{log.resource_id ? ` [${log.resource_id.substring(0, 8)}]` : ''}
                            </td>
                            <td className="px-6 py-4 font-mono text-slate-500">{log.ip_address}</td>
                            <td className="px-6 py-4">
                              <span className={`inline-flex px-2 py-0.5 rounded-full text-[10px] uppercase font-bold border ${
                                log.status === 'success' 
                                  ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' 
                                  : 'bg-rose-500/10 text-rose-400 border-rose-500/20'
                              }`}>
                                {log.status}
                              </span>
                            </td>
                          </tr>

                          {/* Row Expanded Details */}
                          {isExpanded && (
                            <tr className="bg-slate-950/40 border-y border-slate-800/80">
                              <td colSpan={7} className="px-8 py-4">
                                <div className="space-y-3">
                                  {/* Metadata */}
                                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                                    <div>
                                      <p className="text-slate-500 font-bold uppercase tracking-wider text-[10px]">Log Entry UUID</p>
                                      <p className="font-mono text-slate-300 mt-1 select-all">{log.id}</p>
                                    </div>
                                    <div>
                                      <p className="text-slate-500 font-bold uppercase tracking-wider text-[10px]">HTTP User Agent</p>
                                      <p className="text-slate-300 mt-1 truncate" title={log.user_agent}>{log.user_agent || 'N/A'}</p>
                                    </div>
                                  </div>

                                  {/* JSON Payload Code block */}
                                  <div>
                                    <p className="text-slate-500 font-bold uppercase tracking-wider text-[10px] flex items-center gap-1.5 mb-2">
                                      <Terminal className="w-3.5 h-3.5 text-brand-400" />
                                      <span>Execution Payload Metadata</span>
                                    </p>
                                    <pre className="p-4 rounded-xl bg-slate-950 border border-slate-800 text-[11px] font-mono text-brand-400 overflow-x-auto leading-relaxed shadow-inner">
                                      {JSON.stringify(log.payload || { message: "No execution payload recorded." }, null, 2)}
                                    </pre>
                                  </div>
                                </div>
                              </td>
                            </tr>
                          )}
                        </React.Fragment>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              {/* Pagination controls */}
              <div className="flex items-center justify-between px-6 py-4 bg-slate-950/20 border-t border-slate-800 text-xs font-semibold text-slate-400">
                <div>
                  Showing {logs.length} of <span className="text-slate-200">{totalRecords}</span> entries
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setPage(p => Math.max(p - 1, 1))}
                    disabled={page === 1}
                    className="p-1.5 rounded-lg border border-slate-800 bg-slate-900/50 hover:bg-slate-800/80 transition disabled:opacity-40 disabled:cursor-not-allowed text-slate-300"
                  >
                    <ArrowLeft className="w-4 h-4" />
                  </button>
                  <span>Page {page} of {totalPages || 1}</span>
                  <button
                    onClick={() => setPage(p => Math.min(p + 1, totalPages))}
                    disabled={page === totalPages || totalPages === 0}
                    className="p-1.5 rounded-lg border border-slate-800 bg-slate-900/50 hover:bg-slate-800/80 transition disabled:opacity-40 disabled:cursor-not-allowed text-slate-300"
                  >
                    <ArrowRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
