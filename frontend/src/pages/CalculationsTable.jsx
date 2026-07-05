import React, { useState, useEffect } from 'react';
import { Search, Calendar, Calculator, RefreshCw, AlertCircle, ChevronLeft, ChevronRight, Download, Link2 } from 'lucide-react';
import { Link } from 'react-router-dom';
import api from '../api';

export default function CalculationsTable() {
  const [data, setData] = useState([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  
  // Search & Filter state
  const [nameQuery, setNameQuery] = useState('');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [page, setPage] = useState(1);
  const limit = 15;

  const fetchCalculations = async () => {
    setLoading(true);
    setError('');
    try {
      const offset = (page - 1) * limit;
      const params = {
        limit,
        offset,
        employee_name: nameQuery || undefined,
        date_from: dateFrom || undefined,
        date_to: dateTo || undefined,
      };
      
      const response = await api.get('/api/calculations', { params });
      setData(response.data.data);
      setTotal(response.data.total);
    } catch (err) {
      console.error("Failed to load calculations:", err);
      setError("Failed to fetch calculation audit data.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCalculations();
  }, [page]);

  const handleSearch = (e) => {
    e.preventDefault();
    setPage(1);
    fetchCalculations();
  };

  const handleClearFilters = () => {
    setNameQuery('');
    setDateFrom('');
    setDateTo('');
    setPage(1);
    // Directly fetch with cleared values since state updates asynchronously
    setLoading(true);
    api.get('/api/calculations', { params: { limit, offset: 0 } })
      .then(res => {
        setData(res.data.data);
        setTotal(res.data.total);
        setLoading(false);
      })
      .catch(() => {
        setError("Failed to fetch calculations.");
        setLoading(false);
      });
  };

  const exportToCSV = () => {
    if (data.length === 0) return;
    
    const headers = ['ID', 'Employee Name', 'Calculated At', 'Work Hours', 'Hourly Rate', 'Daily Pay (INR)', 'Expenditure (INR)', 'Invoice Total (INR)'];
    const rows = data.map(calc => [
      calc.id,
      calc.employee_name,
      calc.calculated_at,
      calc.work_hours,
      calc.hourly_rate,
      calc.daily_pay,
      calc.expenditure,
      calc.invoice_total
    ]);
    
    const csvContent = [headers, ...rows]
      .map(e => e.map(val => `"${String(val).replace(/"/g, '""')}"`).join(","))
      .join("\n");
      
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `calculations_export_${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const totalPages = Math.ceil(total / limit) || 1;

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      {/* Header Panel */}
      <div className="flex flex-col justify-between gap-4 border-b border-slate-900 pb-5 sm:flex-row sm:items-center">
        <div>
          <h1 className="text-2xl font-extrabold tracking-tight text-white sm:text-3xl">
            Calculated Earnings
          </h1>
          <p className="mt-2 text-sm text-slate-400">
            Workers pay calculations (Work Hours × ₹250 hourly rate) mapped with daily budgets
          </p>
        </div>
        
        <div className="flex items-center gap-3">
          <button
            onClick={exportToCSV}
            disabled={data.length === 0}
            className="inline-flex items-center space-x-1.5 rounded-lg border border-slate-800 bg-slate-900 px-3 py-2 text-sm font-semibold text-slate-300 hover:bg-slate-800 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            <Download className="h-4 w-4" />
            <span>Export CSV</span>
          </button>
          
          <button
            onClick={fetchCalculations}
            className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-slate-800 bg-slate-900 text-slate-400 hover:text-slate-200 transition-colors"
            title="Refresh Logs"
          >
            <RefreshCw className={`h-4.5 w-4.5 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {/* Advanced Filters */}
      <form onSubmit={handleSearch} className="mt-6 rounded-xl border border-slate-800 bg-slate-900/20 p-5 backdrop-blur-sm shadow-sm grid gap-4 md:grid-cols-4 items-end">
        <div className="space-y-1.5">
          <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider">Employee Name</label>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 flex items-center pl-3 text-slate-500 pointer-events-none">
              <Search className="h-4 w-4" />
            </div>
            <input
              type="text"
              value={nameQuery}
              onChange={(e) => setNameQuery(e.target.value)}
              placeholder="Filter by name..."
              className="block w-full rounded-lg border border-slate-800 bg-slate-950/40 py-2 pl-9 pr-3 text-sm text-slate-202 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
            />
          </div>
        </div>

        <div className="space-y-1.5">
          <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider">Date From</label>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 flex items-center pl-3 text-slate-500 pointer-events-none">
              <Calendar className="h-4 w-4" />
            </div>
            <input
              type="date"
              value={dateFrom}
              onChange={(e) => setDateFrom(e.target.value)}
              className="block w-full rounded-lg border border-slate-800 bg-slate-950/40 py-2 pl-9 pr-3 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 scheme-dark"
            />
          </div>
        </div>

        <div className="space-y-1.5">
          <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider">Date To</label>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 flex items-center pl-3 text-slate-500 pointer-events-none">
              <Calendar className="h-4 w-4" />
            </div>
            <input
              type="date"
              value={dateTo}
              onChange={(e) => setDateTo(e.target.value)}
              className="block w-full rounded-lg border border-slate-800 bg-slate-950/40 py-2 pl-9 pr-3 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 scheme-dark"
            />
          </div>
        </div>

        <div className="flex gap-2">
          <button
            type="submit"
            className="flex-1 rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white shadow-lg shadow-blue-500/10 hover:bg-blue-500 transition-colors"
          >
            Apply Filters
          </button>
          
          <button
            type="button"
            onClick={handleClearFilters}
            className="rounded-lg border border-slate-850 bg-slate-900/50 px-3 py-2 text-sm font-semibold text-slate-400 hover:text-slate-200 transition-colors"
          >
            Clear
          </button>
        </div>
      </form>

      {/* Main Datatable Container */}
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
                <th className="px-6 py-3.5">Calc ID</th>
                <th className="px-6 py-3.5">Employee Name</th>
                <th className="px-6 py-3.5">Calculation Date</th>
                <th className="px-6 py-3.5">Work Hours</th>
                <th className="px-6 py-3.5">Hourly Rate</th>
                <th className="px-6 py-3.5 text-right text-blue-400 bg-blue-900/5">Daily Pay</th>
                <th className="px-6 py-3.5 text-right">Expenditure</th>
                <th className="px-6 py-3.5 text-right">Invoice Total</th>
                <th className="px-6 py-3.5 text-center">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-850 bg-slate-900/5">
              {loading ? (
                <tr>
                  <td colSpan="9" className="px-6 py-20 text-center text-slate-500">
                    <RefreshCw className="mx-auto h-8 w-8 animate-spin text-blue-500 mb-2" />
                    <span>Computing statistics...</span>
                  </td>
                </tr>
              ) : data.length === 0 ? (
                <tr>
                  <td colSpan="9" className="px-6 py-12 text-center text-slate-500">
                    No calculations found matching the criteria.
                  </td>
                </tr>
              ) : (
                data.map((row) => (
                  <tr key={row.id} className="hover:bg-slate-900/20 transition-colors">
                    <td className="px-6 py-4 font-mono text-xs text-slate-500">#{row.id}</td>
                    <td className="px-6 py-4 font-bold text-slate-200">{row.employee_name}</td>
                    <td className="px-6 py-4">
                      {new Date(row.calculated_at).toLocaleDateString([], { year: 'numeric', month: 'short', day: 'numeric' })}
                    </td>
                    <td className="px-6 py-4 font-mono">{row.work_hours.toFixed(2)} hrs</td>
                    <td className="px-6 py-4 font-mono">₹{row.hourly_rate}</td>
                    <td className="px-6 py-4 text-right font-mono font-extrabold text-blue-400 bg-blue-900/10 border-x border-slate-900">
                      ₹{row.daily_pay.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                    </td>
                    <td className="px-6 py-4 text-right font-mono">₹{row.expenditure.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</td>
                    <td className="px-6 py-4 text-right font-mono">₹{row.invoice_total.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</td>
                    <td className="px-6 py-4 text-center">
                      <Link
                        to={`/timeline?sub_id=${row.submission_id}`}
                        className="inline-flex items-center space-x-1 text-xs font-semibold text-indigo-400 hover:text-indigo-300 transition-colors"
                      >
                        <Link2 className="h-3 w-3" />
                        <span>Track Flow</span>
                      </Link>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Paging Footer */}
        <div className="flex items-center justify-between border-t border-slate-900 bg-slate-900/30 px-6 py-4">
          <span className="text-xs text-slate-500">
            Showing <span className="font-semibold text-slate-400">{data.length}</span> of{' '}
            <span className="font-semibold text-slate-400">{total}</span> calculations
          </span>

          <div className="flex gap-2">
            <button
              onClick={() => setPage(p => Math.max(p - 1, 1))}
              disabled={page === 1 || loading}
              className="flex h-9 w-9 items-center justify-center rounded-lg border border-slate-800 bg-slate-900/50 text-slate-400 hover:text-slate-200 disabled:opacity-30 disabled:hover:text-slate-400 transition-colors"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>

            <span className="flex items-center px-3 text-sm text-slate-400">
              Page {page} of {totalPages}
            </span>

            <button
              onClick={() => setPage(p => Math.min(p + 1, totalPages))}
              disabled={page === totalPages || loading}
              className="flex h-9 w-9 items-center justify-center rounded-lg border border-slate-800 bg-slate-900/50 text-slate-400 hover:text-slate-200 disabled:opacity-30 disabled:hover:text-slate-400 transition-colors"
            >
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
