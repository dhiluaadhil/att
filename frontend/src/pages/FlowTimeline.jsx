import React, { useState, useEffect } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { GitBranch, ClipboardCheck, Calculator, FileText, Send, CheckCircle2, AlertCircle, Clock, RefreshCw, Download } from 'lucide-react';
import api from '../api';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

export default function FlowTimeline() {
  const [searchParams, setSearchParams] = useSearchParams();
  const subId = searchParams.get('sub_id');
  
  const [submissionsList, setSubmissionsList] = useState([]);
  const [selectedSubId, setSelectedSubId] = useState(subId || '');
  const [timelineData, setTimelineData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [listLoading, setListLoading] = useState(true);
  const [error, setError] = useState('');

  // 1. Fetch recent submissions list for dropdown selector
  const fetchSubmissionsList = async () => {
    try {
      const response = await api.get('/api/submissions?limit=20');
      setSubmissionsList(response.data.data);
      if (response.data.data.length > 0 && !subId) {
        // Default to the first submission in the list if no sub_id in URL
        setSelectedSubId(response.data.data[0].id);
        setSearchParams({ sub_id: response.data.data[0].id });
      }
    } catch (err) {
      console.error("Failed to load submissions dropdown:", err);
    } finally {
      setListLoading(false);
    }
  };

  // 2. Fetch specific timeline details (Submission, Calculation, Report)
  const fetchTimelineDetails = async (id) => {
    if (!id) return;
    setLoading(true);
    setError('');
    setTimelineData(null);
    try {
      // We will make two parallel calls: calculations and reports logs, and filter for our submission ID
      const [calcRes, repRes, subRes] = await Promise.all([
        api.get('/api/calculations?limit=1000'),
        api.get('/api/reports'),
        api.get(`/api/submissions`)
      ]);
      
      const submission = subRes.data.data.find(s => s.id === parseInt(id));
      
      if (!submission) {
        setError(`Submission #${id} not found in database logs.`);
        setLoading(false);
        return;
      }
      
      const calculation = calcRes.data.data.find(c => c.submission_id === parseInt(id));
      const report = calculation ? repRes.data.find(r => r.calculation_id === calculation.id) : null;
      
      setTimelineData({
        submission,
        calculation,
        report
      });
    } catch (err) {
      console.error("Failed to compile timeline:", err);
      setError("Failed to fetch timeline tracking details.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSubmissionsList();
  }, []);

  useEffect(() => {
    if (selectedSubId) {
      fetchTimelineDetails(selectedSubId);
    }
  }, [selectedSubId]);

  // Sync state if search params change
  useEffect(() => {
    if (subId && subId !== selectedSubId) {
      setSelectedSubId(subId);
    }
  }, [subId]);

  const handleSelectChange = (e) => {
    const val = e.target.value;
    setSelectedSubId(val);
    if (val) {
      setSearchParams({ sub_id: val });
    }
  };

  return (
    <div className="mx-auto max-w-4xl px-4 py-8 sm:px-6 lg:px-8">
      {/* Header */}
      <div className="border-b border-slate-900 pb-5 mb-8">
        <h1 className="text-2xl font-extrabold tracking-tight text-white sm:text-3xl flex items-center gap-2">
          <GitBranch className="h-7 w-7 text-blue-500" />
          <span>Workflow Pipeline Tracker</span>
        </h1>
        <p className="mt-2 text-sm text-slate-400">
          Visualize real-time operations running through the Google Forms ➔ Pay Calculators ➔ WhatsApp messaging flow
        </p>
      </div>

      {/* Select Submission Dropdown */}
      <div className="rounded-xl border border-slate-800 bg-slate-900/10 p-5 mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="space-y-1">
          <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest">Select Attendance Submission</label>
          <p className="text-xs text-slate-500">Track pipeline for different workers</p>
        </div>
        
        <div className="w-full sm:max-w-xs">
          {listLoading ? (
            <div className="h-10 rounded-lg border border-slate-800 bg-slate-950 flex items-center justify-center">
              <RefreshCw className="h-4.5 w-4.5 animate-spin text-slate-500" />
            </div>
          ) : (
            <select
              value={selectedSubId}
              onChange={handleSelectChange}
              className="block w-full rounded-lg border border-slate-800 bg-slate-950 px-3 py-2 text-sm text-slate-205 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
            >
              <option value="" disabled>-- Choose a Submission --</option>
              {submissionsList.map(s => (
                <option key={s.id} value={s.id}>
                  {s.employee_name} ({s.submission_date}) - ID #{s.id}
                </option>
              ))}
            </select>
          )}
        </div>
      </div>

      {/* Loading & Error States */}
      {loading && (
        <div className="flex justify-center py-20">
          <div className="flex flex-col items-center space-y-4">
            <RefreshCw className="h-10 w-10 animate-spin text-blue-500" />
            <p className="text-slate-400 text-sm">Compiling flow timeline...</p>
          </div>
        </div>
      )}

      {error && (
        <div className="rounded-xl border border-red-500/20 bg-red-500/5 p-6 text-center text-red-400">
          <AlertCircle className="mx-auto h-10 w-10 mb-2" />
          <h4 className="font-bold">Timeline Compilation Failed</h4>
          <p className="text-sm text-slate-500 mt-1">{error}</p>
        </div>
      )}

      {/* Visual Vertical Timeline */}
      {!loading && !error && timelineData && (
        <div className="relative border-l border-slate-800 ml-6 pl-10 space-y-12 py-4">
          
          {/* STEP 1: Form Submitted */}
          <div className="relative">
            {/* Timeline node */}
            <span className="absolute -left-[54px] top-1.5 flex h-7 w-7 items-center justify-center rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">
              <ClipboardCheck className="h-4 w-4" />
            </span>
            <div>
              <div className="flex items-center gap-3">
                <h3 className="text-lg font-bold text-white">1. Attendance Form Received</h3>
                <span className="inline-flex items-center rounded-full bg-emerald-500/10 px-2 py-0.5 text-[10px] font-bold text-emerald-400 uppercase">
                  Trigger Succeeded
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-1 flex items-center gap-1">
                <Clock className="h-3.5 w-3.5" />
                <span>{new Date(timelineData.submission.submitted_at).toLocaleString()}</span>
              </p>
              
              <div className="mt-4 rounded-xl border border-slate-800 bg-slate-900/30 p-4 max-w-xl">
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="block text-xs font-semibold text-slate-500">Employee</span>
                    <span className="font-bold text-slate-350">{timelineData.submission.employee_name}</span>
                  </div>
                  <div>
                    <span className="block text-xs font-semibold text-slate-500">Work Hours</span>
                    <span className="font-mono text-slate-350">{timelineData.submission.work_hours.toFixed(2)} hrs</span>
                  </div>
                  <div>
                    <span className="block text-xs font-semibold text-slate-500">Expenditure</span>
                    <span className="font-mono text-slate-350">₹{timelineData.submission.expenditure.toLocaleString('en-IN')}</span>
                  </div>
                  <div>
                    <span className="block text-xs font-semibold text-slate-500">Invoice Total</span>
                    <span className="font-mono text-slate-350">₹{timelineData.submission.invoice_total.toLocaleString('en-IN')}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* STEP 2: Calculated */}
          <div className="relative">
            <span className="absolute -left-[54px] top-1.5 flex h-7 w-7 items-center justify-center rounded-full bg-blue-500/10 text-blue-400 border border-blue-500/30">
              <Calculator className="h-4 w-4" />
            </span>
            <div>
              <div className="flex items-center gap-3">
                <h3 className="text-lg font-bold text-white">2. Daily Pay Calculated</h3>
                {timelineData.calculation ? (
                  <span className="inline-flex items-center rounded-full bg-blue-500/10 px-2 py-0.5 text-[10px] font-bold text-blue-400 uppercase">
                    Pay Computed
                  </span>
                ) : (
                  <span className="inline-flex items-center rounded-full bg-slate-500/10 px-2 py-0.5 text-[10px] font-bold text-slate-400 uppercase">
                    Pending
                  </span>
                )}
              </div>
              {timelineData.calculation && (
                <p className="text-xs text-slate-500 mt-1 flex items-center gap-1">
                  <Clock className="h-3.5 w-3.5" />
                  <span>{new Date(timelineData.calculation.calculated_at).toLocaleString()}</span>
                </p>
              )}
              
              {timelineData.calculation ? (
                <div className="mt-4 rounded-xl border border-slate-800 bg-slate-900/30 p-4 max-w-xl border-l-2 border-l-blue-500">
                  <div className="flex items-center justify-between">
                    <div>
                      <span className="block text-xs font-semibold text-slate-500">Calculation Formula</span>
                      <span className="text-sm font-mono text-slate-350">
                        {timelineData.calculation.work_hours.toFixed(2)} hrs × ₹{timelineData.calculation.hourly_rate}
                      </span>
                    </div>
                    <div className="text-right">
                      <span className="block text-xs font-semibold text-slate-500">Calculated Earnings</span>
                      <span className="text-lg font-extrabold text-blue-450 font-mono">
                        ₹{timelineData.calculation.daily_pay.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                      </span>
                    </div>
                  </div>
                </div>
              ) : (
                <p className="text-sm text-slate-500 mt-2">Waiting for calculation record to sync...</p>
              )}
            </div>
          </div>

          {/* STEP 3: PDF Generated */}
          <div className="relative">
            <span className="absolute -left-[54px] top-1.5 flex h-7 w-7 items-center justify-center rounded-full bg-purple-500/10 text-purple-400 border border-purple-500/30">
              <FileText className="h-4 w-4" />
            </span>
            <div>
              <div className="flex items-center gap-3">
                <h3 className="text-lg font-bold text-white">3. Report PDF Rendered</h3>
                {timelineData.report ? (
                  <span className="inline-flex items-center rounded-full bg-purple-500/10 px-2 py-0.5 text-[10px] font-bold text-purple-400 uppercase">
                    PDF Rendered
                  </span>
                ) : (
                  <span className="inline-flex items-center rounded-full bg-slate-500/10 px-2 py-0.5 text-[10px] font-bold text-slate-400 uppercase">
                    Pending
                  </span>
                )}
              </div>
              {timelineData.report && (
                <p className="text-xs text-slate-500 mt-1 flex items-center gap-1">
                  <Clock className="h-3.5 w-3.5" />
                  <span>{new Date(timelineData.report.created_at).toLocaleString()}</span>
                </p>
              )}
              
              {timelineData.report ? (
                <div className="mt-4 rounded-xl border border-slate-800 bg-slate-900/30 p-4 max-w-xl">
                  <div className="flex items-center justify-between">
                    <div className="overflow-hidden mr-4">
                      <span className="block text-xs font-semibold text-slate-500">Receipt Document File</span>
                      <span className="text-xs font-mono text-slate-400 block truncate" title={timelineData.report.pdf_path}>
                        {timelineData.report.pdf_name}
                      </span>
                    </div>
                    <div>
                      <a
                        href={`${API_BASE_URL}/api/reports/download/${timelineData.report.id}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center space-x-1 rounded-lg bg-slate-900 px-3 py-1.5 text-xs font-semibold text-blue-400 border border-slate-800 hover:bg-slate-800 transition-colors"
                      >
                        <Download className="h-3.5 w-3.5" />
                        <span>Download</span>
                      </a>
                    </div>
                  </div>
                </div>
              ) : (
                <p className="text-sm text-slate-500 mt-2">Waiting for PDF generation logs...</p>
              )}
            </div>
          </div>

          {/* STEP 4: WhatsApp Sent */}
          <div className="relative">
            {timelineData.report?.sent_to_boss ? (
              <span className="absolute -left-[54px] top-1.5 flex h-7 w-7 items-center justify-center rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">
                <Send className="h-4 w-4" />
              </span>
            ) : (
              <span className="absolute -left-[54px] top-1.5 flex h-7 w-7 items-center justify-center rounded-full bg-red-500/10 text-red-400 border border-red-500/30">
                <Send className="h-4 w-4" />
              </span>
            )}
            <div>
              <div className="flex items-center gap-3">
                <h3 className="text-lg font-bold text-white">4. Meta WhatsApp Dispatch</h3>
                {timelineData.report ? (
                  timelineData.report.sent_to_boss ? (
                    <span className="inline-flex items-center rounded-full bg-emerald-500/10 px-2 py-0.5 text-[10px] font-bold text-emerald-400 uppercase">
                      Delivered to Boss
                    </span>
                  ) : (
                    <span className="inline-flex items-center rounded-full bg-red-500/10 px-2 py-0.5 text-[10px] font-bold text-red-400 uppercase">
                      Delivery Failed
                    </span>
                  )
                ) : (
                  <span className="inline-flex items-center rounded-full bg-slate-500/10 px-2 py-0.5 text-[10px] font-bold text-slate-400 uppercase">
                    Pending
                  </span>
                )}
              </div>
              {timelineData.report && timelineData.report.sent_at && (
                <p className="text-xs text-slate-500 mt-1 flex items-center gap-1">
                  <Clock className="h-3.5 w-3.5" />
                  <span>{new Date(timelineData.report.sent_at).toLocaleString()}</span>
                </p>
              )}
              
              {timelineData.report ? (
                <div className={`mt-4 rounded-xl border p-4 max-w-xl ${
                  timelineData.report.sent_to_boss 
                    ? 'border-emerald-500/20 bg-emerald-500/5 text-emerald-400' 
                    : 'border-red-500/20 bg-red-500/5 text-red-400'
                }`}>
                  <div className="flex items-center space-x-2 text-sm font-semibold">
                    {timelineData.report.sent_to_boss ? (
                      <>
                        <CheckCircle2 className="h-4.5 w-4.5 shrink-0" />
                        <span>PDF and earnings summary sent successfully to +918925245191.</span>
                      </>
                    ) : (
                      <>
                        <AlertCircle className="h-4.5 w-4.5 shrink-0" />
                        <span>Meta API returned authorization error (expired Sandbox Token or unapproved test number).</span>
                      </>
                    )}
                  </div>
                  
                  {!timelineData.report.sent_to_boss && (
                    <div className="mt-3 flex gap-2">
                      <Link
                        to="/reports"
                        className="inline-flex items-center space-x-1 rounded bg-red-500/10 border border-red-500/25 px-2.5 py-1 text-xs font-semibold hover:bg-red-500/20 transition-all text-red-400"
                      >
                        Manually Resend Report via Dashboard ➔
                      </Link>
                    </div>
                  )}
                </div>
              ) : (
                <p className="text-sm text-slate-500 mt-2">Waiting for WhatsApp dispatch report...</p>
              )}
            </div>
          </div>

        </div>
      )}
    </div>
  );
}
