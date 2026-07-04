import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  Sparkles, ArrowLeft, TrendingUp, Award, Target, BarChart2, Loader2
} from 'lucide-react';
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar,
  BarChart, Bar, Cell
} from 'recharts';
import toast from 'react-hot-toast';
import api from '../lib/api';

const ROLE_LABELS = {
  SDE: 'Software Eng', Data: 'Data Analyst', Frontend: 'Frontend',
  Backend: 'Backend', PM: 'Product Mgr',
};

export default function Analytics() {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const { data } = await api.get('/sessions/stats');
        setStats(data.stats);
      } catch (err) {
        toast.error(err.response?.data?.error || 'Failed to load analytics');
      } finally {
        setLoading(false);
      }
    };
    fetchStats();
  }, []);

  // Radar data — built from the dimensions object
  const radarData = stats ? [
    { dimension: 'Content', score: stats.dimensions.content },
    { dimension: 'Structure', score: stats.dimensions.structure },
    { dimension: 'Tech Depth', score: stats.dimensions.technicalDepth },
  ] : [];

  // By-role data with friendly labels
  const roleData = stats ? stats.byRole.map(r => ({
    ...r,
    label: ROLE_LABELS[r.role] || r.role,
  })) : [];

  return (
    <div className="min-h-screen bg-slate-50">
      <nav className="flex justify-between items-center px-8 py-4 border-b bg-white">
        <Link to="/dashboard" className="flex items-center gap-2">
          <Sparkles className="w-6 h-6 text-indigo-600" />
          <span className="font-bold text-xl">InterviewAce</span>
        </Link>
      </nav>

      <main className="max-w-5xl mx-auto px-6 py-12">
        <Link to="/dashboard" className="inline-flex items-center gap-2 text-slate-600 mb-6 hover:text-slate-900">
          <ArrowLeft className="w-4 h-4" />
          Back to dashboard
        </Link>

        <h1 className="text-3xl font-bold mb-2">Your performance</h1>
        <p className="text-slate-600 mb-8">Insights across all your completed mock interviews.</p>

        {loading ? (
          <div className="flex items-center justify-center py-24 text-slate-400">
            <Loader2 className="w-8 h-8 animate-spin" />
          </div>
        ) : !stats || stats.totalInterviews === 0 ? (
          <div className="bg-white border rounded-xl p-12 text-center">
            <BarChart2 className="w-12 h-12 text-slate-300 mx-auto mb-3" />
            <h2 className="text-lg font-semibold mb-1">No data yet</h2>
            <p className="text-slate-500 mb-6">Complete an interview to see your analytics here.</p>
            <Link to="/dashboard" className="inline-block bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-2 rounded-lg font-medium">
              Start an interview
            </Link>
          </div>
        ) : (
          <>
            {/* ===== Stat cards ===== */}
            <div className="grid grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
              <StatCard icon={BarChart2} label="Interviews" value={stats.totalInterviews} color="text-indigo-600 bg-indigo-50" />
              <StatCard icon={TrendingUp} label="Avg score" value={`${stats.averageScore}/10`} color="text-emerald-600 bg-emerald-50" />
              <StatCard icon={Award} label="Best score" value={`${stats.bestScore}/10`} color="text-amber-600 bg-amber-50" />
            </div>

            {/* ===== Score trend ===== */}
            <ChartCard title="Score trend" subtitle="Overall score per interview, oldest to newest">
              {stats.trend.length < 2 ? (
                <EmptyHint text="Complete a few more interviews to see your trend line." />
              ) : (
                <ResponsiveContainer width="100%" height={280}>
                  <LineChart data={stats.trend} margin={{ top: 10, right: 20, bottom: 0, left: -10 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                    <XAxis dataKey="interview" tick={{ fontSize: 12 }} stroke="#94a3b8"
                      label={{ value: 'Interview #', position: 'insideBottom', offset: -2, fontSize: 12, fill: '#94a3b8' }} />
                    <YAxis domain={[0, 10]} tick={{ fontSize: 12 }} stroke="#94a3b8" />
                    <Tooltip />
                    <Line type="monotone" dataKey="score" stroke="#4f46e5" strokeWidth={3} dot={{ r: 4 }} />
                  </LineChart>
                </ResponsiveContainer>
              )}
            </ChartCard>

            <div className="grid lg:grid-cols-2 gap-6 mt-6">
              {/* ===== Radar of dimensions ===== */}
              <ChartCard title="Skill breakdown" subtitle="Your average across the three scoring dimensions">
                <ResponsiveContainer width="100%" height={280}>
                  <RadarChart data={radarData}>
                    <PolarGrid stroke="#e2e8f0" />
                    <PolarAngleAxis dataKey="dimension" tick={{ fontSize: 12, fill: '#475569' }} />
                    <PolarRadiusAxis domain={[0, 10]} tick={{ fontSize: 10 }} stroke="#cbd5e1" />
                    <Radar dataKey="score" stroke="#4f46e5" fill="#6366f1" fillOpacity={0.5} />
                    <Tooltip />
                  </RadarChart>
                </ResponsiveContainer>
              </ChartCard>

              {/* ===== By role ===== */}
              <ChartCard title="Average by role" subtitle="How you score across different target roles">
                <ResponsiveContainer width="100%" height={280}>
                  <BarChart data={roleData} margin={{ top: 10, right: 10, bottom: 0, left: -10 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" vertical={false} />
                    <XAxis dataKey="label" tick={{ fontSize: 11 }} stroke="#94a3b8" />
                    <YAxis domain={[0, 10]} tick={{ fontSize: 12 }} stroke="#94a3b8" />
                    <Tooltip />
                    <Bar dataKey="score" radius={[6, 6, 0, 0]}>
                      {roleData.map((entry, i) => (
                        <Cell key={i} fill="#6366f1" />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </ChartCard>
            </div>
          </>
        )}
      </main>
    </div>
  );
}

// ===== Small components =====
function StatCard({ icon: Icon, label, value, color }) {
  return (
    <div className="bg-white border rounded-xl p-5">
      <div className={`inline-flex p-2 rounded-lg mb-3 ${color}`}>
        <Icon className="w-5 h-5" />
      </div>
      <div className="text-2xl font-bold text-slate-900">{value}</div>
      <div className="text-sm text-slate-500">{label}</div>
    </div>
  );
}

function ChartCard({ title, subtitle, children }) {
  return (
    <div className="bg-white border rounded-xl p-6">
      <h3 className="font-semibold text-slate-900">{title}</h3>
      {subtitle && <p className="text-sm text-slate-500 mb-4">{subtitle}</p>}
      {children}
    </div>
  );
}

function EmptyHint({ text }) {
  return (
    <div className="flex items-center justify-center h-[280px] text-slate-400 text-sm text-center px-6">
      {text}
    </div>
  );
}