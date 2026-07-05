import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Users, FileSpreadsheet, Coins, Clock, ArrowUpRight, ArrowRight, RefreshCw, AlertTriangle } from 'lucide-react';
import api from '../api';

export default function DashboardHome() {
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const fetchSummary = async () => {
    setLoading(true);
    setError('');
    try {
      const response = await api.get('/api/dashboard/summary');
      setSummary(response.data);
    } catch (err) {
      console.error("Failed to load summary stats:", err);
      setError("Error connecting to server. Please check your database settings or backend server connection.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSummary();
  }, []);

  if (loading) {
    return (
      <div className="flex h-[calc(100vh-4rem)] items-center justify-center bg-[#0b0f19]">
        <div className="flex flex-col items-center space-y-4">
          <RefreshCw className="h-10 w-10 animate-spin text-blue-500" />
          <p className="text-slate-400 text-sm">Loading summary metrics...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8 bg-[#0b0f19]">
        <div className="rounded-xl border border-red-500/20 bg-red-500/5 p-6 text-center">
          <AlertTriangle className="mx-auto h-12 w-12 text-red-400 mb-4" />
          <h3 className="text-lg font-bold text-white mb-2">Connection Problem</h3>
          <p className="text-slate-400 max-w-md mx-auto mb-6">{error}</p>
          <button
            onClick={fetchSummary}
            className="inline-flex items-center space-x-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white shadow-lg shadow-blue-500/20 hover:bg-blue-500 transition-all"
          >
            <RefreshCw className="h-4 w-4" />
            <span>Retry Connection</span>
          </button>
        </div>
      </div>
    );
  }

  const { total_employees, submissions_today, total_pay_today, average_hours_today, recent_submissions } = summary;

  const cardData = [
    {
      title: 'Total Employees',
      value: total_employees,
      icon: Users,
      color: 'from-blue-600/20 to-cyan-600/20 text-blue-400 border-blue-500/10',
      label: 'Registered profiles'
    },
    {
      title: 'Submissions Today',
      value: submissions_today,
      icon: FileSpreadsheet,
      color: 'from-purple-600/20 to-pink-600/20 text-purple-400 border-purple-500/10',
      label: 'Forms processed'
    },
    {
      title: "Today's Total Pay",
      value: `₹${total_pay_today.toLocaleString('en-IN', { minimumFractionDigits: 2 })}`,
      icon: Coins,
      color: 'from-amber-600/20 to-orange-600/20 text-amber-400 border-amber-500/10',
      label: 'Hours x ₹250 rate'
    },
    {
      title: 'Avg Hours Today',
      value: `${average_hours_today} hrs`,
      icon: Clock,
      color: 'from-emerald-600/20 to-teal-600/20 text-emerald-400 border-emerald-500/10',
      label: 'Per employee submission'
    }
  ];

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      {/* Welcome Hero Banner */}
      <div className="relative mb-8 overflow-hidden rounded-2xl border border-slate-800 bg-gradient-to-r from-slate-900 via-slate-900 to-blue-950/20 p-8 shadow-xl">
        <div className="absolute top-0 right-0 h-full w-1/3 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-blue-600/15 via-indigo-600/0 to-transparent pointer-events-none" />
        <div className="max-w-2xl">
          <span className="inline-flex items-center rounded-full bg-blue-500/10 px-3 py-1 text-xs font-semibold text-blue-400">
            System Live & Syncing
          </span>
          <h1 className="mt-4 text-3xl font-extrabold tracking-tight text-white sm:text-4xl">
            Employee Daily Pay Automation
          </h1>
          <p className="mt-2 text-slate-400 leading-relaxed">
            Manage worker attendance submissions, calculate daily pay based on work hours, dispatch receipts to management on WhatsApp, and review payment audit reports.
          </p>
        </div>
      </div>

      {/* Grid Stats Cards */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4 mb-10">
        {cardData.map((card, i) => {
          const Icon = card.icon;
          return (
            <div
              key={i}
              className={`rounded-xl border bg-slate-900/50 p-6 backdrop-blur-sm shadow-md transition-all duration-300 hover:translate-y-[-2px] hover:shadow-lg ${card.color.split(' ')[2]}`}
            >
              <div className="flex items-center justify-between">
                <span className="text-sm font-semibold text-slate-400 uppercase tracking-wider">{card.title}</span>
                <div className={`flex h-10 w-10 items-center justify-center rounded-lg bg-gradient-to-br ${card.color.split(' ').slice(0,2).join(' ')}`}>
                  <Icon className="h-5 w-5" />
                </div>
              </div>
              <div className="mt-4">
                <span className="text-3xl font-extrabold text-white tracking-tight">{card.value}</span>
                <span className="block mt-1 text-xs text-slate-500">{card.label}</span>
              </div>
            </div>
          );
        })}
      </div>

      {/* Bottom Panel Grid */}
      <div className="grid gap-8 lg:grid-cols-3">
        {/* Recent Submissions Feed */}
        <div className="lg:col-span-2 rounded-xl border border-slate-800 bg-slate-950/20 p-6 backdrop-blur-sm shadow-sm">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-lg font-bold text-white">Recent Form Submissions</h2>
              <p className="text-xs text-slate-500">Live entries from the Google Form trigger</p>
            </div>
            <Link
              to="/submissions"
              className="flex items-center space-x-1.5 text-sm font-semibold text-blue-400 hover:text-blue-300 transition-colors"
            >
              <span>View All</span>
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>

          <div className="divide-y divide-slate-800">
            {recent_submissions.length === 0 ? (
              <div className="py-8 text-center text-slate-500 text-sm">
                No submissions received yet today.
              </div>
            ) : (
              recent_submissions.map((sub) => (
                <div key={sub.id} className="flex items-center justify-between py-4 transition-all hover:bg-slate-900/10 px-2 rounded-lg">
                  <div>
                    <span className="font-bold text-slate-200">{sub.employee_name}</span>
                    <div className="flex items-center space-x-3 mt-1 text-xs text-slate-500">
                      <span>{sub.work_hours.toFixed(2)} Hours</span>
                      <span>•</span>
                      <span>Claimed Exp: ₹{sub.expenditure.toLocaleString('en-IN')}</span>
                      <span>•</span>
                      <span>Invoice: ₹{sub.invoice_total.toLocaleString('en-IN')}</span>
                    </div>
                  </div>
                  <div className="text-right">
                    <span className="text-xs text-slate-400">
                      {new Date(sub.submitted_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                    <Link
                      to={`/timeline?sub_id=${sub.id}`}
                      className="block mt-1.5 text-xs font-semibold text-indigo-400 hover:text-indigo-300 transition-colors"
                    >
                      Track Pipeline ↗
                    </Link>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Quick Actions Panel */}
        <div className="rounded-xl border border-slate-800 bg-slate-950/20 p-6 backdrop-blur-sm shadow-sm flex flex-col justify-between">
          <div>
            <h2 className="text-lg font-bold text-white mb-1">Quick Actions</h2>
            <p className="text-xs text-slate-500 mb-6">Manage dashboard logs and verify pipeline reports</p>
            
            <div className="space-y-4">
              <Link
                to="/calculations"
                className="flex items-center justify-between rounded-lg border border-slate-800 bg-slate-900/30 p-4 transition-all hover:bg-slate-900 hover:border-slate-700"
              >
                <div>
                  <span className="block font-bold text-slate-200">Daily Pay Audit Log</span>
                  <span className="text-xs text-slate-500">Inspect worker earnings summaries</span>
                </div>
                <ArrowUpRight className="h-5 w-5 text-slate-400" />
              </Link>

              <Link
                to="/reports"
                className="flex items-center justify-between rounded-lg border border-slate-800 bg-slate-900/30 p-4 transition-all hover:bg-slate-900 hover:border-slate-700"
              >
                <div>
                  <span className="block font-bold text-slate-200">PDF Document Manager</span>
                  <span className="text-xs text-slate-500">Download files and resend to boss</span>
                </div>
                <ArrowUpRight className="h-5 w-5 text-slate-400" />
              </Link>
            </div>
          </div>
          
          <div className="mt-8 border-t border-slate-900 pt-6">
            <span className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-2">Calculator Config</span>
            <div className="rounded-lg bg-slate-900/40 p-4 border border-slate-850">
              <div className="flex items-center justify-between text-sm">
                <span className="text-slate-400">Default Base Rate:</span>
                <span className="font-bold text-blue-400">₹250.00 / hour</span>
              </div>
              <div className="flex items-center justify-between text-sm mt-2 pt-2 border-t border-slate-800">
                <span className="text-slate-400">Auto WhatsApp SMS:</span>
                <span className="font-bold text-emerald-400">Enabled</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
