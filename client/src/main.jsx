import React, { useEffect, useMemo, useState } from 'react';
import { createRoot } from 'react-dom/client';
import axios from 'axios';
import { Upload, TrendingUp, MousePointerClick, ShoppingCart, IndianRupee, Trash2, LayoutDashboard, Target, Activity, Bell, Search, Info, List } from 'lucide-react';
import { XAxis, YAxis, Tooltip, ResponsiveContainer, LineChart, Line, CartesianGrid, Legend } from 'recharts';
import './style.css';

const API = import.meta.env.VITE_API_URL || 'https://instamartads-1.onrender.com';
const money = n => `Γé╣${Number(n || 0).toLocaleString('en-IN')}`;

function StatCard({ title, value, hint, icon, trend }) {
  return (
    <div className="bg-white rounded-xl shadow-sm border border-slate-100 p-6 flex flex-col gap-4">
      <div className="flex justify-between items-center text-slate-500">
        <h3 className="text-sm font-semibold uppercase tracking-wider">{title}</h3>
        <div className="p-2 bg-orange-50 text-orange-600 rounded-lg">{icon}</div>
      </div>
      <div>
        <h2 className="text-3xl font-bold text-slate-900">{value}</h2>
        <div className="flex items-center gap-2 mt-2">
          {trend && <span className={`text-sm font-medium ${trend > 0 ? 'text-green-600' : 'text-red-600'}`}>{trend > 0 ? '+' : ''}{trend}%</span>}
          <span className="text-xs text-slate-400">{hint}</span>
        </div>
      </div>
    </div>
  );
}

function DataTable({ title, columns, rows }) {
  return (
    <div className="bg-white rounded-xl shadow-sm border border-slate-100 overflow-hidden">
      <div className="px-6 py-4 border-b border-slate-100 bg-slate-50/50">
        <h3 className="text-lg font-semibold text-slate-800">{title}</h3>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-sm text-left">
          <thead className="text-xs text-slate-500 uppercase bg-slate-50/50">
            <tr>{columns.map(c => <th key={c} className="px-6 py-3 font-semibold">{c}</th>)}</tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {rows.map((r, i) => (
              <tr key={i} className="hover:bg-slate-50/50 transition-colors">
                {columns.map(c => <td key={c} className="px-6 py-4 text-slate-600 font-medium">{r[c] ?? '-'}</td>)}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function Sidebar({ reports, active, setActive, uploadFile, loading, view, setView }) {
  return (
    <aside className="w-64 bg-slate-900 text-slate-300 flex flex-col h-full shrink-0 shadow-xl z-20">
      <div className="p-6 flex items-center gap-3 text-white font-bold text-xl border-b border-slate-800">
        <TrendingUp className="text-orange-500" /> Instamart Ads
      </div>

      <div className="p-4">
        <label className="flex items-center justify-center gap-2 w-full py-2.5 px-4 bg-orange-600 hover:bg-orange-500 text-white rounded-lg cursor-pointer transition-colors shadow-sm font-medium">
          <Upload size={18} /> {loading ? 'Analyzing...' : 'Upload Report'}
          <input type="file" accept=".csv,.xlsx,.xls" onChange={uploadFile} className="hidden" />
        </label>
      </div>

      <nav className="flex-1 px-4 py-2 space-y-1 overflow-y-auto custom-scrollbar">
        <div className="space-y-1 mb-4 mt-2">
          <button 
            onClick={() => setView('dashboard')} 
            className={`w-full text-left flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors ${view === 'dashboard' ? 'bg-orange-500/10 text-orange-500' : 'hover:bg-slate-800 hover:text-slate-100'}`}
          >
            <LayoutDashboard size={18} /> <span className="font-medium text-sm">Dashboard</span>
          </button>
          <button 
            onClick={() => setView('reports')} 
            className={`w-full text-left flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors ${view === 'reports' ? 'bg-orange-500/10 text-orange-500' : 'hover:bg-slate-800 hover:text-slate-100'}`}
          >
            <List size={18} /> <span className="font-medium text-sm">Daily Reports</span>
          </button>
        </div>

        <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-3 mt-4">History</div>
        {reports.map(r => (
          <button
            key={r.id}
            onClick={() => { setActive(r); setView('dashboard'); }}
            className={`w-full text-left flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors ${active?.id === r.id && view === 'dashboard' ? 'bg-orange-500/10 text-orange-500' : 'hover:bg-slate-800 hover:text-slate-100'}`}
          >
            <Activity size={18} />
            <div className="truncate">
              <div className="text-sm font-medium">{r.campaignName}</div>
              <div className="text-xs text-slate-500">{r.date}</div>
            </div>
          </button>
        ))}
        {reports.length === 0 && (
          <div className="text-xs text-slate-500 text-center py-4">No reports found</div>
        )}
      </nav>

      <div className="p-4 border-t border-slate-800 text-sm text-slate-500 text-center">
        +Instamartads
      </div>
    </aside>
  );
}

function Header({ activeData, remove, filter, setFilter }) {
  return (
    <header className="h-16 bg-white border-b border-slate-200 px-8 flex items-center justify-between shrink-0 shadow-sm z-10">
      <div className="flex items-center gap-4">
        <div>
          <h1 className="text-lg font-bold text-slate-800">{activeData.campaignName}</h1>
          <p className="text-xs text-slate-500 font-medium">{activeData.date} ┬╖ {filter !== 'Single' ? 'Aggregated View' : 'Single Report'}</p>
        </div>
      </div>
      <div className="flex items-center gap-4">
        <select 
          value={filter}
          onChange={e => setFilter(e.target.value)}
          className="px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-orange-500 outline-none text-slate-700 font-semibold cursor-pointer shadow-sm"
        >
          <option value="Single">Selected Report</option>
          <option value="All">All Time</option>
          <option value="Today">Today</option>
          <option value="Yesterday">Yesterday</option>
          <option value="Weekly">Last 7 Days</option>
          <option value="Monthly">Last 30 Days</option>
        </select>
        <div className="relative hidden md:block">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
          <input type="text" placeholder="Search insights..." className="pl-9 pr-4 py-1.5 bg-slate-100 border-none rounded-lg text-sm focus:ring-2 focus:ring-orange-500 outline-none w-64" />
        </div>
        <button className="p-2 text-slate-400 hover:text-slate-600 bg-slate-50 hover:bg-slate-100 rounded-full transition-colors relative">
          <Bell size={18} />
          <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full border-2 border-white"></span>
        </button>
        {filter === 'Single' && activeData.id && (
          <button className="p-2 text-slate-400 hover:text-red-600 bg-slate-50 hover:bg-slate-100 rounded-full transition-colors" onClick={() => remove(activeData.id)} title="Delete Report">
            <Trash2 size={18} />
          </button>
        )}
      </div>
    </header>
  );
}

function EmptyState({ uploadFile, loading }) {
  return (
    <div className="flex-1 flex items-center justify-center bg-slate-50 p-8 h-screen w-screen">
      <div className="max-w-md w-full bg-white rounded-2xl shadow-xl p-8 text-center border border-slate-100">
        <div className="w-20 h-20 bg-orange-50 rounded-full flex items-center justify-center mx-auto mb-6 text-orange-500">
          <Activity size={40} />
        </div>
        <h1 className="text-2xl font-bold text-slate-900 mb-2">Campaign Intelligence</h1>
        <p className="text-slate-500 mb-8 leading-relaxed text-sm">
          Upload your Instamart daily performance report (Excel/CSV) to instantly generate advanced analytics, AI insights, and comprehensive performance tracking.
        </p>
        <label className="flex items-center justify-center gap-2 w-full py-3 px-6 bg-orange-600 hover:bg-orange-700 text-white rounded-xl cursor-pointer transition-all shadow-md hover:shadow-lg font-semibold text-lg relative overflow-hidden group">
          <Upload className="group-hover:-translate-y-1 transition-transform" size={24} /> {loading ? 'Processing Data Engine...' : 'Generate Dashboard'}
          <input type="file" accept=".csv,.xlsx,.xls" onChange={uploadFile} className="hidden" />
          <div className="absolute inset-0 bg-white/20 translate-y-full group-hover:translate-y-0 transition-transform"></div>
        </label>
        <div className="mt-6 text-xs text-slate-400 flex items-center justify-center gap-1">
          <Info size={14} /> Supports standard Instamart Ads exports
        </div>
      </div>
    </div>
  );
}

function DailyReportsPage({ reports }) {
  const sortedReports = [...reports].sort((a, b) => new Date(b.date) - new Date(a.date));

  const columns = ['Date', 'Campaign', 'Total Spend', 'Total GMV', 'Ad Clicks', 'Total Orders', 'ROI', 'CTR'];
  const rows = sortedReports.map(r => ({
    'Date': r.date,
    'Campaign': r.campaignName,
    'Total Spend': money(r.overview?.spend),
    'Total GMV': money(r.overview?.gmv),
    'Ad Clicks': r.traffic?.clicks || 0,
    'Total Orders': r.overview?.orders || 0,
    'ROI': r.overview?.spend ? (r.overview.gmv / r.overview.spend).toFixed(2) : 0,
    'CTR': r.traffic?.impressions ? ((r.traffic.clicks / r.traffic.impressions) * 100).toFixed(2) + '%' : '0%'
  }));

  return (
    <div className="flex-1 overflow-y-auto p-8 custom-scrollbar bg-slate-50">
      <div className="max-w-7xl mx-auto h-full flex flex-col">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-slate-900">Daily Reports</h1>
          <p className="text-sm text-slate-500 mt-1">Compare performance across all your daily campaign reports.</p>
        </div>
        <div className="bg-white rounded-xl shadow-sm border border-slate-100 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead className="text-xs text-slate-500 uppercase bg-slate-50/50">
                <tr>{columns.map(c => <th key={c} className="px-6 py-4 font-semibold whitespace-nowrap">{c}</th>)}</tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {rows.length === 0 ? (
                  <tr><td colSpan={columns.length} className="px-6 py-8 text-center text-slate-500">No reports available.</td></tr>
                ) : (
                  rows.map((r, i) => (
                    <tr key={i} className="hover:bg-slate-50/50 transition-colors">
                      {columns.map(c => <td key={c} className="px-6 py-4 text-slate-700 font-medium whitespace-nowrap">{r[c] ?? '-'}</td>)}
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}

function App() {
  const [reports, setReports] = useState([]);
  const [active, setActive] = useState(null);
  const [loading, setLoading] = useState(false);
  const [filter, setFilter] = useState('Single');
  const [view, setView] = useState('dashboard');

  useEffect(() => {
    axios.get(`${API}/api/reports`).then(res => { setReports(res.data); setActive(res.data[0] || null); });
  }, []);

  const uploadFile = async e => {
    const file = e.target.files[0];
    if (!file) return;
    const fd = new FormData();
    fd.append('file', file);
    setLoading(true);
    try {
      const { data } = await axios.post(`${API}/api/upload`, fd);
      setReports([data, ...reports]);
      setActive(data);
      setFilter('Single');
      setView('dashboard');
    } catch (err) {
      alert(err.response?.data?.message || 'Upload failed');
    } finally {
      setLoading(false);
      e.target.value = '';
    }
  };

  const remove = async id => {
    await axios.delete(`${API}/api/reports/${id}`);
    const next = reports.filter(r => r.id !== id);
    setReports(next);
    setActive(next[0] || null);
  };

  const activeData = useMemo(() => {
    if (filter === 'Single' && active) return active;
    if (!reports.length) return null;

    const now = new Date();
    const filteredReports = reports.filter(r => {
      if (filter === 'All') return true;
      const rd = new Date(r.date);
      if (filter === 'Today') return rd.toDateString() === now.toDateString();
      if (filter === 'Yesterday') {
        const y = new Date(now); y.setDate(y.getDate() - 1);
        return rd.toDateString() === y.toDateString();
      }
      if (filter === 'Weekly') {
        const w = new Date(now); w.setDate(w.getDate() - 7);
        return rd >= w;
      }
      if (filter === 'Monthly') {
        const m = new Date(now); m.setMonth(m.getMonth() - 1);
        return rd >= m;
      }
      return true;
    });

    if (filteredReports.length === 0) {
      return {
        isEmpty: true,
        campaignName: 'No Data',
        date: filter,
        overview: { spend: 0, gmv: 0, orders: 0, roi: 0 },
        traffic: { clicks: 0, ctr: 0 },
        conversion: { cvr: 0 },
        budget: { utilized: 0 },
        dailyBreakdown: []
      };
    }

    const baseDailyBreakdown = filteredReports.map(r => ({
        Date: r.date,
        'Total Spend': money(r.overview?.spend),
        'Total GMV': money(r.overview?.gmv),
        'Ad Clicks': r.traffic?.clicks || 0,
        'Total Orders': r.overview?.orders || 0
    })).sort((a, b) => new Date(b.Date) - new Date(a.Date));

    if (filteredReports.length === 1 && filter === 'Single') return { ...filteredReports[0], dailyBreakdown: baseDailyBreakdown };

    // Aggregate
    const agg = {
      campaignName: `${filter === 'All' ? 'All Time' : filter} Aggregation`,
      date: `${filteredReports.length} Reports`,
      overview: { spend: 0, gmv: 0, orders: 0, roi: 0 },
      traffic: { impressions: 0, clicks: 0, ctr: 0, ecpc: 0, avgRank: '-' },
      conversion: { addToCart: 0, a2cRate: 0, orders: 0, cvr: 0, gmv: 0, roi: 0 },
      budget: { dailyBudget: 0, spent: 0, utilized: 0, exhaustedTime: '-', missedSlots: '-' },
      insights: filteredReports[0].insights,
      products: [],
      keywords: [],
      cities: [],
      targets: filteredReports[0].targets,
      dailyBreakdown: baseDailyBreakdown
    };

    const pMap = {}, kMap = {}, cMap = {};

    filteredReports.forEach(r => {
      agg.overview.spend += (r.overview?.spend || 0);
      agg.overview.gmv += (r.overview?.gmv || 0);
      agg.overview.orders += (r.overview?.orders || 0);
      agg.traffic.impressions += (r.traffic?.impressions || 0);
      agg.traffic.clicks += (r.traffic?.clicks || 0);
      agg.conversion.addToCart += (r.conversion?.addToCart || 0);
      agg.conversion.orders += (r.conversion?.orders || 0);
      agg.conversion.gmv += (r.conversion?.gmv || 0);

      (r.products || []).forEach(p => {
        if (!pMap[p.product]) pMap[p.product] = { product: p.product, spend: 0, impressions: 0, clicks: 0, orders: 0, gmv: 0 };
        pMap[p.product].spend += p.spend; pMap[p.product].impressions += p.impressions;
        pMap[p.product].clicks += p.clicks; pMap[p.product].orders += p.orders; pMap[p.product].gmv += p.gmv;
      });
      (r.keywords || []).forEach(k => {
        if (!kMap[k.keyword]) kMap[k.keyword] = { keyword: k.keyword, spend: 0, impressions: 0, clicks: 0, orders: 0, gmv: 0 };
        kMap[k.keyword].spend += k.spend; kMap[k.keyword].impressions += k.impressions;
        kMap[k.keyword].clicks += k.clicks; kMap[k.keyword].orders += k.orders; kMap[k.keyword].gmv += k.gmv;
      });
      (r.cities || []).forEach(c => {
        if (!cMap[c.city]) cMap[c.city] = { city: c.city, impressions: 0, orders: 0, gmv: 0, spend: 0 };
        cMap[c.city].impressions += c.impressions; cMap[c.city].orders += c.orders; cMap[c.city].gmv += c.gmv; cMap[c.city].spend += c.roi ? c.gmv/c.roi : 0; // rough est
      });
    });

    agg.overview.roi = agg.overview.spend ? Number((agg.overview.gmv / agg.overview.spend).toFixed(2)) : 0;
    agg.traffic.ctr = agg.traffic.impressions ? Number(((agg.traffic.clicks / agg.traffic.impressions) * 100).toFixed(2)) : 0;
    agg.conversion.cvr = agg.traffic.clicks ? Number(((agg.conversion.orders / agg.traffic.clicks) * 100).toFixed(2)) : 0;
    
    agg.products = Object.values(pMap).map(p => ({ ...p, roi: p.spend ? Number((p.gmv / p.spend).toFixed(2)) : 0 })).sort((a,b)=>b.gmv-a.gmv);
    agg.keywords = Object.values(kMap).map(k => ({ ...k, roi: k.spend ? Number((k.gmv / k.spend).toFixed(2)) : 0 })).sort((a,b)=>b.gmv-a.gmv);
    agg.cities = Object.values(cMap).map(c => ({ ...c, roi: c.spend ? Number((c.gmv / c.spend).toFixed(2)) : 0 })).sort((a,b)=>b.gmv-a.gmv);

    return agg;
  }, [reports, filter, active]);

  const trend = useMemo(() => {
    let filtered = reports;
    if (filter !== 'Single' && filter !== 'All') {
      const now = new Date();
      filtered = reports.filter(r => {
        const rd = new Date(r.date);
        if (filter === 'Today') return rd.toDateString() === now.toDateString();
        if (filter === 'Yesterday') {
          const y = new Date(now); y.setDate(y.getDate() - 1);
          return rd.toDateString() === y.toDateString();
        }
        if (filter === 'Weekly') {
          const w = new Date(now); w.setDate(w.getDate() - 7);
          return rd >= w;
        }
        if (filter === 'Monthly') {
          const m = new Date(now); m.setMonth(m.getMonth() - 1);
          return rd >= m;
        }
        return true;
      });
    }
    return filtered.slice().reverse().map(r => ({ date: r.date, ROI: r.overview.roi, GMV: r.overview.gmv, Spend: r.overview.spend }));
  }, [reports, filter]);

  if (!reports.length || (!active && filter === 'Single')) return <EmptyState uploadFile={uploadFile} loading={loading} />;
  if (!activeData) return <div className="p-8 text-center">Loading...</div>;

  const productRows = (activeData.products || []).slice(0,10).map(x => ({ Product: x.product, Spend: money(x.spend), Impressions: x.impressions, Clicks: x.clicks, Orders: x.orders, GMV: money(x.gmv), ROI: x.roi }));
  const keywordRows = (activeData.keywords || []).slice(0,10).map(x => ({ Keyword: x.keyword, Spend: money(x.spend), Impressions: x.impressions, Clicks: x.clicks, Orders: x.orders, GMV: money(x.gmv), ROI: x.roi }));
  const cityRows = (activeData.cities || []).slice(0,10).map(x => ({ City: x.city, Impressions: x.impressions, Orders: x.orders, GMV: money(x.gmv), ROI: x.roi }));
  const targetRows = (activeData.targets || []).map(x => ({ KPI: x.kpi, Target: x.target, Actual: x.actual }));

  return (
    <div className="flex h-screen bg-slate-50 font-sans overflow-hidden">
      <Sidebar reports={reports} active={active} setActive={(r) => { setActive(r); setFilter('Single'); }} uploadFile={uploadFile} loading={loading} view={view} setView={setView} />

      {view === 'reports' ? (
        <DailyReportsPage reports={reports} />
      ) : (
        <div className="flex-1 flex flex-col min-w-0">
          <Header activeData={activeData} remove={remove} filter={filter} setFilter={setFilter} />

          <main className="flex-1 overflow-y-auto p-8 custom-scrollbar">
            {activeData.isEmpty ? (
            <div className="flex items-center justify-center h-full text-slate-500 flex-col gap-4">
              <Activity size={48} className="text-slate-300" />
              <p>No data available for the selected period.</p>
            </div>
          ) : (
            <div className="max-w-7xl mx-auto space-y-8 pb-12">
              {/* Overview Cards */}
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6">
                <StatCard title="Total Spend" value={money(activeData.overview?.spend)} hint={filter === 'Single' ? `${activeData.budget?.utilized}% of daily budget used` : 'Total spend in period'} icon={<IndianRupee />} trend={12} />
                <StatCard title="Total GMV" value={money(activeData.overview?.gmv)} hint="Direct ad sales revenue" icon={<TrendingUp />} trend={8} />
                <StatCard title="Ad Clicks" value={activeData.traffic?.clicks} hint={`${activeData.traffic?.ctr}% Click-through rate`} icon={<MousePointerClick />} />
                <StatCard title="Total Orders" value={activeData.overview?.orders} hint={`${activeData.conversion?.cvr}% Conversion rate`} icon={<ShoppingCart />} trend={-2} />
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Daily Trend Chart */}
                <div className="lg:col-span-2 bg-white rounded-xl shadow-sm border border-slate-100 p-6">
                  <div className="flex justify-between items-center mb-6">
                    <h3 className="text-lg font-semibold text-slate-800">Performance Trend</h3>
                    <div className="text-sm text-slate-500">Historical Tracking</div>
                  </div>
                  <ResponsiveContainer width="100%" height={300}>
                    <LineChart data={trend} margin={{ top: 20, right: 20, left: -20, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                      <XAxis dataKey="date" tick={{ fill: '#94a3b8', fontSize: 12 }} axisLine={false} tickLine={false} />
                      <YAxis yAxisId="left" tick={{ fill: '#94a3b8', fontSize: 12 }} axisLine={false} tickLine={false} />
                      <YAxis yAxisId="right" orientation="right" tick={{ fill: '#94a3b8', fontSize: 12 }} axisLine={false} tickLine={false} />
                      <Tooltip contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 25px -5px rgba(0,0,0,0.1), 0 8px 10px -6px rgba(0,0,0,0.1)', padding: '12px' }} />
                      <Legend iconType="circle" wrapperStyle={{ paddingTop: '20px' }} />
                      <Line yAxisId="left" type="monotone" dataKey="ROI" stroke="#ea580c" strokeWidth={3} activeDot={{ r: 6, strokeWidth: 0, fill: '#ea580c' }} label={{ position: 'top', fill: '#ea580c', fontSize: 12, fontWeight: 600 }} />
                      <Line yAxisId="right" type="monotone" dataKey="GMV" stroke="#10b981" strokeWidth={3} activeDot={{ r: 6, strokeWidth: 0, fill: '#10b981' }} label={{ position: 'bottom', fill: '#10b981', fontSize: 12, fontWeight: 600 }} />
                    </LineChart>
                  </ResponsiveContainer>
                </div>

                {/* AI Insights Panel */}
                <div className="bg-gradient-to-br from-orange-500 to-pink-600 rounded-xl shadow-md text-white p-6 flex flex-col">
                  <div className="flex items-center gap-2 mb-6">
                    <Activity size={20} className="text-orange-200" />
                    <h3 className="text-lg font-semibold text-white">{filter === 'Single' ? 'Daily' : 'Aggregated'} Insights Engine</h3>
                  </div>
                  <div className="flex-1 space-y-4 overflow-y-auto custom-scrollbar pr-2">
                    {Object.entries(activeData.insights || {}).map(([k, v]) => (
                      <div key={k} className="bg-white/10 rounded-lg p-3 backdrop-blur-sm border border-white/5">
                        <div className="text-xs text-orange-200 uppercase font-semibold tracking-wider mb-1">{k.replace(/([A-Z])/g, ' $1')}</div>
                        <div className="text-sm font-medium leading-snug">{v}</div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Performance Tables */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <DataTable title="Traffic Performance" columns={['Impressions', 'Clicks', 'CTR', 'eCPC', 'Avg Rank']} rows={[{ 'Impressions': activeData.traffic?.impressions, 'Clicks': activeData.traffic?.clicks, 'CTR': `${activeData.traffic?.ctr}%`, 'eCPC': money(activeData.traffic?.ecpc), 'Avg Rank': activeData.traffic?.avgRank }]} />
                <DataTable title="Conversion Funnel" columns={['Add to Cart', 'A2C Rate', 'Orders', 'CVR', 'GMV', 'ROI']} rows={[{ 'Add to Cart': activeData.conversion?.addToCart, 'A2C Rate': `${activeData.conversion?.a2cRate}%`, 'Orders': activeData.conversion?.orders, 'CVR': `${activeData.conversion?.cvr}%`, 'GMV': money(activeData.conversion?.gmv), 'ROI': activeData.conversion?.roi }]} />
              </div>

              {activeData.dailyBreakdown && activeData.dailyBreakdown.length > 0 ? (
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold text-slate-800">Daily Performance Breakdown</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                    {activeData.dailyBreakdown.map((day) => (
                      <div key={day.Date} className="bg-white rounded-xl shadow-sm border border-slate-100 p-5 flex flex-col gap-4 hover:shadow-md transition-shadow">
                        <div className="flex justify-between items-center border-b border-slate-50 pb-3">
                          <span className="text-md font-bold text-orange-600">{day.Date}</span>
                          <span className="text-xs font-semibold text-slate-400 uppercase bg-slate-50 px-2 py-1 rounded">Summary</span>
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <p className="text-xs text-slate-500 mb-1">Total Spend</p>
                            <p className="text-sm font-bold text-slate-900">{day['Total Spend']}</p>
                          </div>
                          <div>
                            <p className="text-xs text-slate-500 mb-1">Total GMV</p>
                            <p className="text-sm font-bold text-slate-900">{day['Total GMV']}</p>
                          </div>
                          <div>
                            <p className="text-xs text-slate-500 mb-1">Ad Clicks</p>
                            <p className="text-sm font-bold text-slate-900">{day['Ad Clicks']}</p>
                          </div>
                          <div>
                            <p className="text-xs text-slate-500 mb-1">Total Orders</p>
                            <p className="text-sm font-bold text-slate-900">{day['Total Orders']}</p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ) : null}

              {productRows.length > 0 ? <DataTable title="Product Level Analytics (Top 10)" columns={['Product', 'Spend', 'Impressions', 'Clicks', 'Orders', 'GMV', 'ROI']} rows={productRows} /> : null}
              {keywordRows.length > 0 ? <DataTable title="Keyword Intelligence (Top 10)" columns={['Keyword', 'Spend', 'Impressions', 'Clicks', 'Orders', 'GMV', 'ROI']} rows={keywordRows} /> : null}
              {cityRows.length > 0 ? <DataTable title="Geographic Performance (Top 10)" columns={['City', 'Impressions', 'Orders', 'GMV', 'ROI']} rows={cityRows} /> : null}

              {filter === 'Single' && (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  <DataTable title="Budget Optimization" columns={['Daily Budget', 'Spent', '% Utilized', 'Exhausted Time', 'Missed Slots']} rows={[{ 'Daily Budget': money(activeData.budget?.dailyBudget), 'Spent': money(activeData.budget?.spent), '% Utilized': `${activeData.budget?.utilized}%`, 'Exhausted Time': activeData.budget?.exhaustedTime, 'Missed Slots': activeData.budget?.missedSlots }]} />
                  <DataTable title="KPI Targets vs Actuals" columns={['KPI', 'Target', 'Actual']} rows={targetRows} />
                </div>
              )}
            </div>
          )}
        </main>
      </div>
      )}
    </div>
  );
}

createRoot(document.getElementById('root')).render(<App />);
