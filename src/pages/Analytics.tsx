import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { fetchWithAuth } from '../lib/api';
import { AnalyticsData } from '../types/models';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell
} from 'recharts';
import { MousePointer2, Smartphone, Globe, TrendingUp, AlertCircle } from 'lucide-react';
import { formatDate } from '../lib/utils';

const Analytics = () => {
  const { user } = useAuth();
  const [data, setData] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchAnalytics = async () => {
      if (!user) return;
      try {
        const response = await fetchWithAuth(user, '/api/analytics');
        if (response.ok) {
          const result = await response.json();
          setData(result);
        } else {
          setError('Failed to load analytics data.');
        }
      } catch (err) {
        setError('Network error: Could not connect to API.');
        console.error('Error fetching analytics:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchAnalytics();
  }, [user]);

  if (loading) {
    return (
      <div className="space-y-8 animate-pulse">
        <div className="h-12 w-48 bg-slate-900 rounded-xl"></div>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          {[1, 2, 3, 4].map(i => <div key={i} className="h-32 bg-slate-900 rounded-2xl"></div>)}
        </div>
        <div className="h-96 bg-slate-900 rounded-3xl"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center py-20 bg-red-500/10 border border-red-500/20 rounded-3xl mt-8">
        <AlertCircle className="w-12 h-12 text-red-500 mb-4" />
        <h3 className="text-xl font-bold text-red-400">Error Loading Data</h3>
        <p className="text-slate-400 mt-2">{error}</p>
      </div>
    );
  }

  if (!data) return null;

  const { stats, clicks } = data;

  // Prepare chart data
  const dateData = Object.keys(stats.byDate)
    .sort((a, b) => new Date(a).getTime() - new Date(b).getTime())
    .map(date => ({
      date: formatDate(date),
      clicks: stats.byDate[date]
    }));

  const linkData = Object.keys(stats.byLink).map(name => ({
    name,
    value: stats.byLink[name]
  }));

  const deviceData = Object.keys(stats.byDevice).map(name => ({
    name,
    value: stats.byDevice[name]
  }));

  const COLORS = ['#8b5cf6', '#ec4899', '#06b6d4', '#10b981', '#f59e0b'];

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Analytics</h1>
        <p className="text-slate-400 mt-1 text-lg">Track your performance and audience engagement.</p>
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-slate-900 border border-white/10 p-6 rounded-2xl">
          <div className="flex items-center gap-3 text-slate-400 mb-2">
            <MousePointer2 className="w-4 h-4" />
            <span className="text-sm font-medium uppercase tracking-wider">Total Clicks</span>
          </div>
          <div className="text-3xl font-bold">{stats.totalClicks}</div>
        </div>
        <div className="bg-slate-900 border border-white/10 p-6 rounded-2xl">
          <div className="flex items-center gap-3 text-slate-400 mb-2">
            <TrendingUp className="w-4 h-4" />
            <span className="text-sm font-medium uppercase tracking-wider">Top Link</span>
          </div>
          <div className="text-xl font-bold truncate">
            {Object.keys(stats.byLink).sort((a, b) => stats.byLink[b] - stats.byLink[a])[0] || 'N/A'}
          </div>
        </div>
        <div className="bg-slate-900 border border-white/10 p-6 rounded-2xl">
          <div className="flex items-center gap-3 text-slate-400 mb-2">
            <Smartphone className="w-4 h-4" />
            <span className="text-sm font-medium uppercase tracking-wider">Top Device</span>
          </div>
          <div className="text-3xl font-bold capitalize">
            {Object.keys(stats.byDevice).sort((a, b) => stats.byDevice[b] - stats.byDevice[a])[0] || 'N/A'}
          </div>
        </div>
        <div className="bg-slate-900 border border-white/10 p-6 rounded-2xl">
          <div className="flex items-center gap-3 text-slate-400 mb-2">
            <Globe className="w-4 h-4" />
            <span className="text-sm font-medium uppercase tracking-wider">Top Browser</span>
          </div>
          <div className="text-3xl font-bold capitalize">
            {Object.keys(stats.byBrowser).sort((a, b) => stats.byBrowser[b] - stats.byBrowser[a])[0] || 'N/A'}
          </div>
        </div>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="bg-slate-900 border border-white/10 p-8 rounded-3xl">
          <h3 className="text-xl font-bold mb-8">Clicks Over Time</h3>
          <div className="h-80 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={dateData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
                <XAxis dataKey="date" stroke="#64748b" fontSize={12} tickLine={false} axisLine={false} />
                <YAxis stroke="#64748b" fontSize={12} tickLine={false} axisLine={false} />
                <Tooltip 
                  contentStyle={{ backgroundColor: '#0f172a', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '12px' }}
                  cursor={{ fill: 'rgba(255,255,255,0.05)' }}
                />
                <Bar dataKey="clicks" fill="#8b5cf6" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-slate-900 border border-white/10 p-8 rounded-3xl">
          <h3 className="text-xl font-bold mb-8">Clicks by Link</h3>
          <div className="h-80 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={linkData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={100}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {linkData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip 
                  contentStyle={{ backgroundColor: '#0f172a', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '12px' }}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Recent Clicks Table */}
      <div className="bg-slate-900 border border-white/10 rounded-3xl overflow-hidden">
        <div className="p-6 border-b border-white/5">
          <h3 className="text-xl font-bold">Recent Activity</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="text-slate-500 text-sm uppercase tracking-wider border-b border-white/5">
                <th className="px-6 py-4 font-semibold">Link</th>
                <th className="px-6 py-4 font-semibold">Device</th>
                <th className="px-6 py-4 font-semibold">Browser</th>
                <th className="px-6 py-4 font-semibold">Referrer</th>
                <th className="px-6 py-4 font-semibold">Time</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {clicks.map((click) => (
                <tr key={click.id} className="hover:bg-white/5 transition-all">
                  <td className="px-6 py-4 font-medium text-violet-400">
                    {click.linkTitle}
                  </td>
                  <td className="px-6 py-4 text-slate-300 capitalize">{click.device}</td>
                  <td className="px-6 py-4 text-slate-300 capitalize">{click.browser}</td>
                  <td className="px-6 py-4 text-slate-400 text-sm">{click.referrer}</td>
                  <td className="px-6 py-4 text-slate-500 text-sm">{formatDate(click.clickedAt)}</td>
                </tr>
              ))}
              {clicks.length === 0 && (
                <tr>
                  <td colSpan={5} className="px-6 py-12 text-center text-slate-500">
                    No clicks recorded yet. Share your profile to start seeing data!
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default Analytics;
