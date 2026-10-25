import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../../services/api';
import { DashboardStats, Form, FormResponse } from '../../types/form';
import {
  FileSpreadsheet,
  CheckCircle2,
  FileEdit,
  Inbox,
  Clock,
  Calendar,
  Sparkles,
  PlusCircle,
  ArrowRight,
  TrendingUp,
  ExternalLink,
  ChevronRight,
} from 'lucide-react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';
import { Button } from '../../components/ui/Button';
import { CardSkeleton } from '../../components/ui/Skeleton';

export const Dashboard: React.FC = () => {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [recentForms, setRecentForms] = useState<Form[]>([]);
  const [recentResponses, setRecentResponses] = useState<FormResponse[]>([]);
  const [timeline, setTimeline] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchDashboard = async () => {
      try {
        const res = await api.getDashboardStats();
        setStats(res.stats);
        setRecentForms(res.recentForms);
        setRecentResponses(res.recentResponses);
        setTimeline(res.timeline);
      } catch (err) {
        console.error('Failed to load dashboard:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchDashboard();
  }, []);

  if (loading) {
    return (
      <div className="p-8 space-y-6">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <CardSkeleton />
          <CardSkeleton />
          <CardSkeleton />
          <CardSkeleton />
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 sm:p-8 space-y-8 max-w-7xl mx-auto w-full">
      {/* Header & Quick Action */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-gray-900 tracking-tight">FormCraft Overview</h1>
          <p className="text-xs text-gray-500 mt-1">
            Real-time analytics, response trends, and form management
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Link to="/admin/forms/new">
            <Button variant="primary" icon={<PlusCircle className="w-4 h-4" />}>
              Create New Form
            </Button>
          </Link>
          <Link to="/admin/responses">
            <Button variant="outline" icon={<Inbox className="w-4 h-4" />}>
              View Responses
            </Button>
          </Link>
        </div>
      </div>

      {/* Metrics Row 1: Forms & Status */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-2xl border border-gray-200/80 shadow-sm flex items-center justify-between">
          <div>
            <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider block">
              Total Forms
            </span>
            <span className="text-2xl font-bold text-gray-900 mt-1 block">
              {stats?.totalForms || 0}
            </span>
          </div>
          <div className="w-10 h-10 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
            <FileSpreadsheet className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-gray-200/80 shadow-sm flex items-center justify-between">
          <div>
            <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider block">
              Published Forms
            </span>
            <span className="text-2xl font-bold text-emerald-600 mt-1 block">
              {stats?.publishedForms || 0}
            </span>
          </div>
          <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
            <CheckCircle2 className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-gray-200/80 shadow-sm flex items-center justify-between">
          <div>
            <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider block">
              Draft Forms
            </span>
            <span className="text-2xl font-bold text-amber-600 mt-1 block">
              {stats?.draftForms || 0}
            </span>
          </div>
          <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center">
            <FileEdit className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-gray-200/80 shadow-sm flex items-center justify-between">
          <div>
            <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider block">
              Total Responses
            </span>
            <span className="text-2xl font-bold text-indigo-600 mt-1 block">
              {stats?.totalResponses || 0}
            </span>
          </div>
          <div className="w-10 h-10 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
            <Inbox className="w-5 h-5" />
          </div>
        </div>
      </div>

      {/* Metrics Row 2: Response Timings */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white p-4 rounded-xl border border-gray-200/70 shadow-sm flex items-center gap-4">
          <div className="w-9 h-9 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center flex-shrink-0">
            <Clock className="w-4 h-4" />
          </div>
          <div>
            <p className="text-xs text-gray-400 font-medium">Responses Today</p>
            <p className="text-lg font-bold text-gray-900">{stats?.responsesToday || 0}</p>
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-gray-200/70 shadow-sm flex items-center gap-4">
          <div className="w-9 h-9 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center flex-shrink-0">
            <Calendar className="w-4 h-4" />
          </div>
          <div>
            <p className="text-xs text-gray-400 font-medium">Responses This Week</p>
            <p className="text-lg font-bold text-gray-900">{stats?.responsesThisWeek || 0}</p>
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-gray-200/70 shadow-sm flex items-center gap-4">
          <div className="w-9 h-9 rounded-lg bg-violet-50 text-violet-600 flex items-center justify-center flex-shrink-0">
            <Sparkles className="w-4 h-4" />
          </div>
          <div>
            <p className="text-xs text-gray-400 font-medium">Responses This Month</p>
            <p className="text-lg font-bold text-gray-900">{stats?.responsesThisMonth || 0}</p>
          </div>
        </div>
      </div>

      {/* Response Activity Chart */}
      <div className="bg-white p-6 rounded-2xl border border-gray-200/80 shadow-sm space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <TrendingUp className="w-4 h-4 text-indigo-600" />
            <h2 className="text-sm font-bold text-gray-900">Submission Activity (Last 14 Days)</h2>
          </div>
          <span className="text-xs font-semibold text-gray-500">Submissions Trend</span>
        </div>

        <div className="h-60 w-full pt-2">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={timeline}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
              <XAxis dataKey="displayDate" stroke="#94a3b8" fontSize={11} tickLine={false} />
              <YAxis stroke="#94a3b8" fontSize={11} allowDecimals={false} tickLine={false} />
              <Tooltip
                contentStyle={{
                  backgroundColor: '#0f172a',
                  border: 'none',
                  borderRadius: '12px',
                  color: '#fff',
                  fontSize: '12px',
                }}
              />
              <Line
                type="monotone"
                dataKey="submissions"
                stroke="#4f46e5"
                strokeWidth={3}
                dot={{ r: 4, fill: '#4f46e5' }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Recent Forms & Recent Responses Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Forms Card */}
        <div className="bg-white p-6 rounded-2xl border border-gray-200/80 shadow-sm flex flex-col justify-between">
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-gray-900">Recent Forms</h3>
              <Link
                to="/admin/forms"
                className="text-xs font-semibold text-indigo-600 hover:text-indigo-800 flex items-center gap-1"
              >
                <span>Manage All</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </Link>
            </div>

            <div className="divide-y divide-gray-100">
              {recentForms.length === 0 ? (
                <p className="text-xs text-gray-400 py-4">No forms created yet.</p>
              ) : (
                recentForms.map(form => (
                  <div
                    key={form.id}
                    className="py-3 flex items-center justify-between first:pt-0 last:pb-0"
                  >
                    <div className="min-w-0 pr-4">
                      <Link
                        to={`/admin/forms/${form.id}/edit`}
                        className="text-sm font-semibold text-gray-900 hover:text-indigo-600 truncate block"
                      >
                        {form.name}
                      </Link>
                      <span className="text-xs text-gray-400">
                        {form.response_count || 0} responses • Updated{' '}
                        {new Date(form.updated_at).toLocaleDateString()}
                      </span>
                    </div>

                    <div className="flex items-center gap-2 flex-shrink-0">
                      <span
                        className={`text-[10px] uppercase font-bold px-2 py-0.5 rounded-full ${
                          form.status === 'published'
                            ? 'bg-emerald-100 text-emerald-800'
                            : 'bg-amber-100 text-amber-800'
                        }`}
                      >
                        {form.status}
                      </span>
                      <Link
                        to={`/forms/${form.slug}`}
                        target="_blank"
                        className="p-1 text-gray-400 hover:text-indigo-600"
                        title="View Public Form"
                      >
                        <ExternalLink className="w-4 h-4" />
                      </Link>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

        {/* Recent Responses Card */}
        <div className="bg-white p-6 rounded-2xl border border-gray-200/80 shadow-sm flex flex-col justify-between">
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-gray-900">Recent Submissions</h3>
              <Link
                to="/admin/responses"
                className="text-xs font-semibold text-indigo-600 hover:text-indigo-800 flex items-center gap-1"
              >
                <span>View All Responses</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </Link>
            </div>

            <div className="divide-y divide-gray-100">
              {recentResponses.length === 0 ? (
                <p className="text-xs text-gray-400 py-4">No submissions received yet.</p>
              ) : (
                recentResponses.map(resp => (
                  <div
                    key={resp.id}
                    className="py-3 flex items-center justify-between first:pt-0 last:pb-0"
                  >
                    <div className="min-w-0 pr-4">
                      <p className="text-sm font-semibold text-gray-900 truncate">
                        {resp.respondent_email || 'Anonymous Respondent'}
                      </p>
                      <p className="text-xs text-gray-400 truncate">
                        Submitted for {resp.form_name}
                      </p>
                    </div>
                    <span className="text-xs text-gray-400 whitespace-nowrap">
                      {new Date(resp.submitted_at).toLocaleDateString(undefined, {
                        month: 'short',
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </span>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
