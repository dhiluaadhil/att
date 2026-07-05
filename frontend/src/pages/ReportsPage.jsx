import React, { useState, useEffect } from 'react';
import { Search, FileText, Download, Send, RefreshCw, AlertCircle, CheckCircle2, XCircle } from 'lucide-react';
import api from '../api';

export default function ReportsPage() {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [resendingId, setResendingId] = useState(null);
  const [feedback, setFeedback] = useState({ type: '', message: '' });
  const [nameQuery, setNameQuery] = useState('');

  const fetchReports = async () => {
    setLoading(true);
    setError('');
    try {
      const params = nameQuery ? { employee_name: nameQuery } : {};
      const response = await api.get('/api/reports', { params });
      setData(response.data);
    } catch (err) {
      console.error("Failed to load reports:", err);
      setError("Failed to fetch generated PDF reports log from database.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReports();
  }, []);

  const handleSearch = (e) => {
    e.preventDefault();
    fetchReports();
  };

  const handleResend = async (id) => {
    setResendingId(id);
    setFeedback({ type: '', message: '' });
    try {
      const response = await api.post(`/api/reports/${id}/resend`);
      const { status, whatsapp_status } = response.data;
      
      if (status === 'success') {
        setFeedback({
          type: 'success',
          message: 'Report PDF resent to boss successfully!'
        });
      } else {
        setFeedback({
          type: 'error',
          message: `Resend failed: ${whatsapp_status}`
        });
      }
      
      // Refresh report list to update sent timestamps
      fetchReports();
    } catch (err) {
      console.error("Failed to resend report:", err);
      const errMsg = err.response?.data?.detail || "Connection error during WhatsApp dispatch.";
      setFeedback({
        type: 'error',
        message: errMsg
      });
    } finally {
      setResendingId(null);
    }
  };

  // Base API url for direct downloads
  const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      {/* Header */}
      <div className="flex flex-col justify-between gap-4 border-b border-slate-900 pb-5 sm:flex-row sm:items-center">
        <div>
          <h1 className="text-2xl font-extrabold tracking-tight text-white sm:text-3xl">
            PDF Document Logs
          </h1>
          <p className="mt-2 text-sm text-slate-400">
            Audit trailing of generated payslips and Meta WhatsApp dispatch reports
          </p>
        </div>
        
        <div>
          <button
            onClick={fetchReports}
            className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-slate-800 bg-slate-900 text-slate-400 hover:text-slate-200 transition-colors"
            title="Refresh Logs"
          >
            <RefreshCw className={`h-4.5 w-4.5 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {/* Info Notifications */}
      {feedback.message && (
        <div className={`mt-6 flex items-center space-x-3 rounded-lg border p-4 text-sm ${
          feedback.type === 'success' 
            ? 'border-emerald-500/20 bg-emerald-500/5 text-emerald-400' 
            : 'border-red-500/20 bg-red-500/5 text-red-400'
        }`}>
          {feedback.type === 'success' ? (
            <CheckCircle2 className="h-5 w-5 shrink-0" />
          ) : (
            <AlertCircle className="h-5 w-5 shrink-0" />
          )}
          <span className="font-semibold">{feedback.message}</span>
        </div>
      )}

      {/* Filter Form */}
      <form onSubmit={handleSearch} className="mt-6 rounded-xl border border-slate-800 bg-slate-900/20 p-5 backdrop-blur-sm shadow-sm flex gap-4 max-w-md">
        <div className="flex-1 relative">
          <div className="absolute inset-y-0 left-0 flex items-center pl-3 text-slate-500 pointer-events-none">
            <Search className="h-4 w-4" />
          </div>
          <input
            type="text"
            value={nameQuery}
            onChange={(e) => setNameQuery(e.target.value)}
            placeholder="Search by worker name..."
            className="block w-full rounded-lg border border-slate-800 bg-slate-950/40 py-2 pl-9 pr-3 text-sm text-slate-200 placeholder-slate-500 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
          />
        </div>
        <button
          type="submit"
          className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white shadow-lg shadow-blue-500/10 hover:bg-blue-500 transition-colors whitespace-nowrap"
        >
          Search
        </button>
      </form>

      {/* Table grid */}
      <div className="mt-8 rounded-xl border border-slate-800 bg-slate-950/20 overflow-hidden shadow-md">
        {error && (
          <div className="flex items-center space-x-2 border-b border-red-500/20 bg-red-500/5 p-4 text-sm text-red-400">
            <AlertCircle className="h-5 w-5 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-slate-800 text-left text-sm text-slate-300">
            <thead className="bg-slate-900/55 text-xs font-semibold text-slate-400 uppercase tracking-wider">
              <tr>
                <th className="px-6 py-3.5">Report ID</th>
                <th className="px-6 py-3.5">Worker Profile</th>
                <th className="px-6 py-3.5">Generated At</th>
                <th className="px-6 py-3.5">Work Hours</th>
                <th className="px-6 py-3.5">Total Pay</th>
                <th className="px-6 py-3.5">WhatsApp Send Status</th>
                <th className="px-6 py-3.5">Transmitted Time</th>
                <th className="px-6 py-3.5 text-center">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-850 bg-slate-900/5">
              {loading ? (
                <tr>
                  <td colSpan="8" className="px-6 py-20 text-center text-slate-500">
                    <RefreshCw className="mx-auto h-8 w-8 animate-spin text-blue-500 mb-2" />
                    <span>Loading documents...</span>
                  </td>
                </tr>
              ) : data.length === 0 ? (
                <tr>
                  <td colSpan="8" className="px-6 py-12 text-center text-slate-500">
                    No generated reports logs found.
                  </td>
                </tr>
              ) : (
                data.map((row) => (
                  <tr key={row.id} className="hover:bg-slate-900/20 transition-colors">
                    <td className="px-6 py-4 font-mono text-xs text-slate-500">#{row.id}</td>
                    <td className="px-6 py-4 font-bold text-slate-200">{row.employee_name}</td>
                    <td className="px-6 py-4">
                      {new Date(row.created_at).toLocaleDateString([], { year: 'numeric', month: 'short', day: 'numeric' })}
                    </td>
                    <td className="px-6 py-4 font-mono">{row.work_hours.toFixed(2)} hrs</td>
                    <td className="px-6 py-4 font-mono font-semibold">₹{row.daily_pay.toLocaleString('en-IN')}</td>
                    <td className="px-6 py-4">
                      {row.sent_to_boss ? (
                        <span className="inline-flex items-center space-x-1 rounded-full bg-emerald-500/10 px-2.5 py-0.5 text-xs font-semibold text-emerald-450">
                          <CheckCircle2 className="h-3 w-3 mr-1" />
                          Delivered
                        </span>
                      ) : (
                        <span className="inline-flex items-center space-x-1 rounded-full bg-red-500/10 px-2.5 py-0.5 text-xs font-semibold text-red-400">
                          <XCircle className="h-3 w-3 mr-1" />
                          Failed
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4 text-xs text-slate-400 font-mono">
                      {row.sent_at 
                        ? new Date(row.sent_at).toLocaleString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }) 
                        : 'N/A'}
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center justify-center gap-3">
                        {/* Download link */}
                        <a
                          href={`${API_BASE_URL}/api/reports/download/${row.id}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex h-8 w-8 items-center justify-center rounded-lg border border-slate-800 bg-slate-900/50 text-slate-400 hover:text-blue-400 hover:border-blue-500/20 transition-all"
                          title="Download PDF"
                        >
                          <Download className="h-4 w-4" />
                        </a>
                        
                        {/* Resend button */}
                        <button
                          onClick={() => handleResend(row.id)}
                          disabled={resendingId !== null}
                          className="flex h-8 w-8 items-center justify-center rounded-lg border border-slate-800 bg-slate-900/50 text-slate-400 hover:text-indigo-400 hover:border-indigo-500/20 disabled:opacity-50 transition-all"
                          title="Resend to Boss"
                        >
                          {resendingId === row.id ? (
                            <RefreshCw className="h-4 w-4 animate-spin text-indigo-500" />
                          ) : (
                            <Send className="h-4 w-4" />
                          )}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
