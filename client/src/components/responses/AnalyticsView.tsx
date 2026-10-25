import React from 'react';
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';
import {
  Users,
  Calendar,
  Clock,
  Sparkles,
  Star,
  Layers,
  BarChart2,
} from 'lucide-react';

interface AnalyticsData {
  formId: string;
  formName: string;
  formTitle: string;
  totalResponses: number;
  responsesToday: number;
  responsesThisWeek: number;
  responsesThisMonth: number;
  timeline: Array<{ date: string; displayDate: string; submissions: number }>;
  fields: any[];
}

interface AnalyticsViewProps {
  analytics: AnalyticsData;
}

const COLORS = [
  '#4f46e5',
  '#06b6d4',
  '#10b981',
  '#f59e0b',
  '#ec4899',
  '#8b5cf6',
  '#64748b',
  '#ef4444',
];

export const AnalyticsView: React.FC<AnalyticsViewProps> = ({ analytics }) => {
  return (
    <div className="space-y-6">
      {/* Metric Stat Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-2xl border border-gray-200/80 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider">
              Total Submissions
            </p>
            <h3 className="text-2xl font-bold text-gray-900 mt-1">
              {analytics.totalResponses}
            </h3>
          </div>
          <div className="w-10 h-10 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
            <Users className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-gray-200/80 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider">
              Today
            </p>
            <h3 className="text-2xl font-bold text-indigo-600 mt-1">
              {analytics.responsesToday}
            </h3>
          </div>
          <div className="w-10 h-10 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
            <Clock className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-gray-200/80 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider">
              This Week
            </p>
            <h3 className="text-2xl font-bold text-emerald-600 mt-1">
              {analytics.responsesThisWeek}
            </h3>
          </div>
          <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
            <Calendar className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-gray-200/80 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider">
              This Month
            </p>
            <h3 className="text-2xl font-bold text-violet-600 mt-1">
              {analytics.responsesThisMonth}
            </h3>
          </div>
          <div className="w-10 h-10 rounded-xl bg-violet-50 text-violet-600 flex items-center justify-center">
            <Sparkles className="w-5 h-5" />
          </div>
        </div>
      </div>

      {/* Submission Timeline Line Chart */}
      <div className="bg-white p-6 rounded-2xl border border-gray-200/80 shadow-sm space-y-3">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-sm font-bold text-gray-900">Submission Activity Over Time</h3>
            <p className="text-xs text-gray-400">Daily response volume over the last 14 days</p>
          </div>
          <span className="text-xs font-semibold text-indigo-600 bg-indigo-50 px-2.5 py-1 rounded-lg">
            14-Day Timeline
          </span>
        </div>

        <div className="h-64 w-full pt-2">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={analytics.timeline}>
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
                activeDot={{ r: 6 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Dynamic Per-Field Breakdown */}
      <div className="space-y-4">
        <h3 className="text-sm font-bold uppercase tracking-wider text-gray-500 flex items-center gap-2">
          <Layers className="w-4 h-4 text-indigo-500" />
          <span>Dynamic Field Analytics ({analytics.fields?.length || 0} Analyzed)</span>
        </h3>

        {analytics.fields?.length === 0 ? (
          <div className="bg-white p-8 rounded-2xl border border-gray-200 text-center text-gray-400">
            No questions with chartable aggregate responses in this form.
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
            {analytics.fields.map(field => {
              return (
                <div
                  key={field.fieldId}
                  className="bg-white p-6 rounded-2xl border border-gray-200/80 shadow-sm flex flex-col justify-between space-y-4"
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <h4 className="text-sm font-bold text-gray-900 leading-snug">{field.label}</h4>
                      <p className="text-xs text-gray-400 mt-0.5">
                        {field.totalAnswers} responses ({field.responseRate}% completion rate)
                      </p>
                    </div>
                    <span className="text-[10px] uppercase font-mono font-bold px-2 py-0.5 bg-gray-100 text-gray-600 rounded">
                      {field.fieldType.replace('_', ' ')}
                    </span>
                  </div>

                  {/* Pie / Donut Chart for Single Choice */}
                  {field.chartType === 'pie' && (
                    <div className="h-56 w-full flex items-center justify-center">
                      <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                          <Pie
                            data={field.data}
                            dataKey="count"
                            nameKey="name"
                            cx="50%"
                            cy="50%"
                            innerRadius={45}
                            outerRadius={80}
                            paddingAngle={3}
                          >
                            {field.data.map((_: any, index: number) => (
                              <Cell
                                key={`cell-${index}`}
                                fill={COLORS[index % COLORS.length]}
                              />
                            ))}
                          </Pie>
                          <Tooltip
                            formatter={(value: any) => [`${value} votes`, 'Count']}
                            contentStyle={{
                              backgroundColor: '#0f172a',
                              borderRadius: '8px',
                              color: '#fff',
                              fontSize: '12px',
                            }}
                          />
                          <Legend wrapperStyle={{ fontSize: '11px' }} />
                        </PieChart>
                      </ResponsiveContainer>
                    </div>
                  )}

                  {/* Bar Chart for Multi-select Checkboxes */}
                  {field.chartType === 'bar' && (
                    <div className="h-56 w-full">
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={field.data} layout="vertical">
                          <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#f1f5f9" />
                          <XAxis type="number" fontSize={11} stroke="#94a3b8" allowDecimals={false} />
                          <YAxis
                            dataKey="name"
                            type="category"
                            width={90}
                            fontSize={11}
                            stroke="#64748b"
                            tickFormatter={v => (v.length > 12 ? `${v.slice(0, 12)}…` : v)}
                          />
                          <Tooltip
                            contentStyle={{
                              backgroundColor: '#0f172a',
                              borderRadius: '8px',
                              color: '#fff',
                              fontSize: '12px',
                            }}
                          />
                          <Bar dataKey="count" fill="#6366f1" radius={[0, 6, 6, 0]} />
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  )}

                  {/* Rating / Scale Chart & Average Score */}
                  {field.chartType === 'rating_scale' && (
                    <div className="space-y-3">
                      <div className="flex items-center gap-3 p-3 bg-indigo-50/60 rounded-xl">
                        <div className="w-10 h-10 rounded-lg bg-indigo-600 text-white flex items-center justify-center font-bold text-lg">
                          {field.average}
                        </div>
                        <div>
                          <p className="text-xs font-bold text-gray-800">
                            Average Score ({field.min} to {field.max})
                          </p>
                          <div className="flex items-center gap-1 mt-0.5">
                            {Array.from({ length: 5 }).map((_, i) => (
                              <Star
                                key={i}
                                className={`w-3.5 h-3.5 ${
                                  i < Math.round(field.average)
                                    ? 'fill-amber-400 text-amber-400'
                                    : 'text-gray-300'
                                }`}
                              />
                            ))}
                          </div>
                        </div>
                      </div>

                      <div className="h-44 w-full">
                        <ResponsiveContainer width="100%" height="100%">
                          <BarChart data={field.data}>
                            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                            <XAxis dataKey="score" fontSize={11} stroke="#94a3b8" />
                            <YAxis fontSize={11} stroke="#94a3b8" allowDecimals={false} />
                            <Tooltip
                              contentStyle={{
                                backgroundColor: '#0f172a',
                                borderRadius: '8px',
                                color: '#fff',
                                fontSize: '12px',
                              }}
                            />
                            <Bar dataKey="count" fill="#4f46e5" radius={[6, 6, 0, 0]} />
                          </BarChart>
                        </ResponsiveContainer>
                      </div>
                    </div>
                  )}

                  {/* Text Feed / Latest Responses */}
                  {field.chartType === 'text_feed' && (
                    <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
                      {field.recentAnswers?.map((ans: any, i: number) => (
                        <div
                          key={i}
                          className="p-3 bg-gray-50 border border-gray-100 rounded-xl text-xs text-gray-700 font-medium"
                        >
                          "{String(ans)}"
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};
