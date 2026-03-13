import { useState, useEffect, useCallback } from 'react';
import { api } from '../../services/api.js';
import { StatCard } from '../common/index.jsx';
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid,
  PieChart, Pie, Cell, Legend,
  LineChart, Line,
} from 'recharts';

const COLORS = ['#6b0f1a', '#fbbf24', '#10b981', '#8b5cf6', '#ef4444', '#3b82f6'];

function fmt(n) {
  return `₱${Number(n || 0).toLocaleString('en-PH', { minimumFractionDigits: 2 })}`;
}

/* ── Date range presets ── */
function getPresetRange(preset) {
  const now   = new Date();
  const pad   = (n) => String(n).padStart(2, '0');
  const toStr = (d) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;

  const today = toStr(now);
  const sub   = (days) => { const d = new Date(now); d.setDate(d.getDate() - days); return toStr(d); };
  const startOfMonth = () => toStr(new Date(now.getFullYear(), now.getMonth(), 1));
  const startOfYear  = () => toStr(new Date(now.getFullYear(), 0, 1));

  switch (preset) {
    case 'today':      return { start: today,           end: today };
    case '7days':      return { start: sub(6),           end: today };
    case '30days':     return { start: sub(29),          end: today };
    case 'this_month': return { start: startOfMonth(),   end: today };
    case 'this_year':  return { start: startOfYear(),    end: today };
    default:           return { start: sub(29),          end: today };
  }
}

/* ── Export helpers ── */
function exportCSV(filename, rows, headers) {
  const lines = [headers.join(','), ...rows.map(r => headers.map(h => `"${r[h] ?? ''}"`).join(','))];
  const blob  = new Blob([lines.join('\n')], { type: 'text/csv' });
  const url   = URL.createObjectURL(blob);
  const a     = Object.assign(document.createElement('a'), { href: url, download: filename });
  a.click();
  URL.revokeObjectURL(url);
}

/* ── Section wrapper ── */
function Section({ title, children, onExport }) {
  return (
    <div className="report-section">
      <div className="report-section-head">
        <h4>{title}</h4>
        {onExport && (
          <button type="button" className="btn-outline btn-sm" onClick={onExport}>
            ⬇ Export CSV
          </button>
        )}
      </div>
      {children}
    </div>
  );
}

export default function ReportsPage() {
  const [preset, setPreset]         = useState('30days');
  const [range, setRange]           = useState(getPresetRange('30days'));
  const [activeTab, setActiveTab]   = useState('overview');
  const [loading, setLoading]       = useState(true);

  // Data states
  const [summary, setSummary]       = useState(null);
  const [daily, setDaily]           = useState([]);
  const [weekly, setWeekly]         = useState([]);
  const [topItems, setTopItems]     = useState([]);
  const [categories, setCategories] = useState([]);
  const [trend, setTrend]           = useState([]);

  const fetchAll = useCallback(async () => {
    setLoading(true);
    try {
      const params = `?start=${range.start}&end=${range.end}`;
      const days   = Math.ceil((new Date(range.end) - new Date(range.start)) / 86400000) + 1;

      const [s, d, w, t, c, tr] = await Promise.all([
        api.get(`/reports/summary${params}`),
        api.get(`/reports/daily-sales?days=${days}`),
        api.get('/reports/weekly-sales'),
        api.get('/reports/top-items?limit=10'),
        api.get(`/reports/category-breakdown${params}`),
        api.get(`/reports/order-trend?days=${days}`),
      ]);

      setSummary(s);
      setDaily(d.map(r => ({ ...r, revenue: parseFloat(r.revenue) })));
      setWeekly(w.map(r => ({ ...r, revenue: parseFloat(r.revenue) })));
      setTopItems(t);
      setCategories(c.map(r => ({ ...r, revenue: parseFloat(r.revenue) })));

      // Flatten order trend by date
      const tMap = {};
      tr.forEach(r => {
        if (!tMap[r.date]) tMap[r.date] = { date: r.date, total: 0, completed: 0, cancelled: 0 };
        tMap[r.date].total      += Number(r.orders);
        tMap[r.date][r.status]   = (tMap[r.date][r.status] || 0) + Number(r.orders);
      });
      setTrend(Object.values(tMap).sort((a, b) => a.date.localeCompare(b.date)));
    } catch (err) {
      console.error('Reports fetch error:', err);
    } finally {
      setLoading(false);
    }
  }, [range]);

  useEffect(() => { fetchAll(); }, [fetchAll]);

  const applyPreset = (p) => {
    setPreset(p);
    setRange(getPresetRange(p));
  };

  const TABS = ['overview', 'sales', 'orders', 'menu', 'categories'];

  return (
    <div className="reports-page">

      {/* ── Controls bar ── */}
      <div className="report-controls">
        <div className="report-presets">
          {[
            { key: 'today',      label: 'Today'      },
            { key: '7days',      label: 'Last 7 days' },
            { key: '30days',     label: 'Last 30 days'},
            { key: 'this_month', label: 'This Month'  },
            { key: 'this_year',  label: 'This Year'   },
          ].map(p => (
            <button
              key={p.key}
              type="button"
              className={`chip${preset === p.key ? ' active' : ''}`}
              onClick={() => applyPreset(p.key)}
            >
              {p.label}
            </button>
          ))}
        </div>

        <div className="report-daterange">
          <div className="field" style={{ flexDirection: 'row', alignItems: 'center', gap: '.5rem' }}>
            <label style={{ whiteSpace: 'nowrap' }}>From</label>
            <input
              type="date"
              value={range.start}
              onChange={e => { setPreset('custom'); setRange(r => ({ ...r, start: e.target.value })); }}
              style={{ padding: '.4rem .6rem', borderRadius: 8, border: '1px solid var(--border)', fontFamily: 'inherit' }}
            />
          </div>
          <div className="field" style={{ flexDirection: 'row', alignItems: 'center', gap: '.5rem' }}>
            <label style={{ whiteSpace: 'nowrap' }}>To</label>
            <input
              type="date"
              value={range.end}
              onChange={e => { setPreset('custom'); setRange(r => ({ ...r, end: e.target.value })); }}
              style={{ padding: '.4rem .6rem', borderRadius: 8, border: '1px solid var(--border)', fontFamily: 'inherit' }}
            />
          </div>
          <button type="button" className="btn-primary btn-sm" onClick={fetchAll}>Apply</button>
        </div>
      </div>

      {/* ── Tabs ── */}
      <div className="report-tabs">
        {TABS.map(t => (
          <button
            key={t}
            type="button"
            className={`queue-tab${activeTab === t ? ' active' : ''}`}
            onClick={() => setActiveTab(t)}
          >
            {t.charAt(0).toUpperCase() + t.slice(1)}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="spinner-center"><div className="spinner" /></div>
      ) : (
        <>
          {/* ═══ OVERVIEW TAB ═══ */}
          {activeTab === 'overview' && (
            <div>
              <div className="stats-row">
                <StatCard icon="💰" label="Total Revenue"  value={fmt(summary?.total_sales)}      color="#6b0f1a" />
                <StatCard icon="📋" label="Total Orders"   value={summary?.total_orders ?? 0}     color="#fbbf24" />
                <StatCard icon="🧾" label="Average Order"  value={fmt(summary?.average_order)}    color="#6b0f1a" />
                <StatCard icon="🍱" label="Items Sold"     value={summary?.total_items_sold ?? 0} color="#fbbf24" />
              </div>

              <div className="charts-grid">
                <Section title="Daily Revenue">
                  <ResponsiveContainer width="100%" height={220}>
                    <BarChart data={daily}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#f0e8e0" />
                      <XAxis dataKey="date" tick={{ fontSize: 11 }} tickFormatter={d => d.slice(5)} />
                      <YAxis tick={{ fontSize: 11 }} tickFormatter={v => `₱${(v/1000).toFixed(0)}k`} />
                      <Tooltip formatter={v => fmt(v)} />
                      <Bar dataKey="revenue" fill="#6b0f1a" radius={[4,4,0,0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </Section>

                <Section title="Revenue by Category">
                  <ResponsiveContainer width="100%" height={220}>
                    <PieChart>
                      <Pie data={categories} dataKey="revenue" nameKey="name" cx="50%" cy="50%" outerRadius={80}
                        label={({ name, percent }) => `${name} ${(percent*100).toFixed(0)}%`}>
                        {categories.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                      </Pie>
                      <Legend />
                      <Tooltip formatter={v => fmt(v)} />
                    </PieChart>
                  </ResponsiveContainer>
                </Section>
              </div>
            </div>
          )}

          {/* ═══ SALES TAB ═══ */}
          {activeTab === 'sales' && (
            <div>
              <Section
                title="Daily Sales"
                onExport={() => exportCSV('daily-sales.csv', daily, ['date','revenue','orders'])}
              >
                <ResponsiveContainer width="100%" height={280}>
                  <BarChart data={daily}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f0e8e0" />
                    <XAxis dataKey="date" tick={{ fontSize: 11 }} tickFormatter={d => d.slice(5)} />
                    <YAxis tick={{ fontSize: 11 }} tickFormatter={v => `₱${(v/1000).toFixed(0)}k`} />
                    <Tooltip formatter={v => fmt(v)} />
                    <Bar dataKey="revenue" fill="#6b0f1a" radius={[4,4,0,0]} name="Revenue" />
                  </BarChart>
                </ResponsiveContainer>

                <table className="data-table" style={{ marginTop: '1rem' }}>
                  <thead><tr><th>Date</th><th>Orders</th><th>Revenue</th></tr></thead>
                  <tbody>
                    {daily.slice().reverse().map(r => (
                      <tr key={r.date}>
                        <td>{r.date}</td>
                        <td>{r.orders}</td>
                        <td>{fmt(r.revenue)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </Section>

              <Section
                title="Weekly Sales"
                onExport={() => exportCSV('weekly-sales.csv', weekly, ['week','revenue','orders'])}
              >
                <ResponsiveContainer width="100%" height={220}>
                  <BarChart data={weekly}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f0e8e0" />
                    <XAxis dataKey="week" tick={{ fontSize: 11 }} />
                    <YAxis tick={{ fontSize: 11 }} tickFormatter={v => `₱${(v/1000).toFixed(0)}k`} />
                    <Tooltip formatter={v => fmt(v)} />
                    <Bar dataKey="revenue" fill="#fbbf24" radius={[4,4,0,0]} name="Revenue" />
                  </BarChart>
                </ResponsiveContainer>
              </Section>
            </div>
          )}

          {/* ═══ ORDERS TAB ═══ */}
          {activeTab === 'orders' && (
            <Section
              title="Order Volume Trend"
              onExport={() => exportCSV('order-trend.csv', trend, ['date','total','completed','cancelled','pending','preparing'])}
            >
              <ResponsiveContainer width="100%" height={280}>
                <LineChart data={trend}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0e8e0" />
                  <XAxis dataKey="date" tick={{ fontSize: 11 }} tickFormatter={d => d.slice(5)} />
                  <YAxis tick={{ fontSize: 11 }} allowDecimals={false} />
                  <Tooltip />
                  <Legend />
                  <Line type="monotone" dataKey="completed" stroke="#10b981" strokeWidth={2} dot={false} name="Completed" />
                  <Line type="monotone" dataKey="pending"   stroke="#fbbf24" strokeWidth={2} dot={false} name="Pending" />
                  <Line type="monotone" dataKey="cancelled" stroke="#ef4444" strokeWidth={2} dot={false} name="Cancelled" />
                </LineChart>
              </ResponsiveContainer>

              <table className="data-table" style={{ marginTop: '1rem' }}>
                <thead><tr><th>Date</th><th>Total</th><th>Completed</th><th>Pending</th><th>Cancelled</th></tr></thead>
                <tbody>
                  {trend.slice().reverse().map(r => (
                    <tr key={r.date}>
                      <td>{r.date}</td>
                      <td><strong>{r.total}</strong></td>
                      <td style={{ color: '#10b981' }}>{r.completed || 0}</td>
                      <td style={{ color: '#f59e0b' }}>{r.pending   || 0}</td>
                      <td style={{ color: '#ef4444' }}>{r.cancelled || 0}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </Section>
          )}

          {/* ═══ MENU TAB ═══ */}
          {activeTab === 'menu' && (
            <Section
              title="Top Selling Items"
              onExport={() => exportCSV('top-items.csv',
                topItems.map((t, i) => ({
                  rank: i+1,
                  name: t.menu_item?.name,
                  category: t.menu_item?.category?.name,
                  quantity: t.total_quantity,
                  revenue: t.total_revenue,
                })),
                ['rank','name','category','quantity','revenue']
              )}
            >
              <table className="data-table">
                <thead>
                  <tr>
                    <th>#</th>
                    <th>Item</th>
                    <th>Category</th>
                    <th>Qty Sold</th>
                    <th>Revenue</th>
                    <th>Avg Price</th>
                  </tr>
                </thead>
                <tbody>
                  {topItems.map((item, i) => (
                    <tr key={item.menu_item_id}>
                      <td>
                        <span className="top-item-rank" style={{ display: 'inline-flex' }}>{i + 1}</span>
                      </td>
                      <td><strong>{item.menu_item?.name}</strong></td>
                      <td>{item.menu_item?.category?.name}</td>
                      <td>{item.total_quantity}</td>
                      <td>{fmt(item.total_revenue)}</td>
                      <td>{fmt(item.total_revenue / item.total_quantity)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>

              <div style={{ marginTop: '1.5rem' }}>
                <ResponsiveContainer width="100%" height={280}>
                  <BarChart data={topItems.slice(0, 10)} layout="vertical">
                    <CartesianGrid strokeDasharray="3 3" stroke="#f0e8e0" />
                    <XAxis type="number" tick={{ fontSize: 11 }} tickFormatter={v => fmt(v)} />
                    <YAxis type="category" dataKey="menu_item.name" tick={{ fontSize: 11 }} width={140} />
                    <Tooltip formatter={v => fmt(v)} />
                    <Bar dataKey="total_revenue" fill="#6b0f1a" radius={[0,4,4,0]} name="Revenue" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </Section>
          )}

          {/* ═══ CATEGORIES TAB ═══ */}
          {activeTab === 'categories' && (
            <Section
              title="Sales by Category"
              onExport={() => exportCSV('categories.csv', categories, ['name','revenue','quantity'])}
            >
              <div className="charts-grid" style={{ marginBottom: '1.5rem' }}>
                <div>
                  <ResponsiveContainer width="100%" height={260}>
                    <PieChart>
                      <Pie data={categories} dataKey="revenue" nameKey="name" cx="50%" cy="50%" outerRadius={100}
                        label={({ name, percent }) => `${(percent*100).toFixed(0)}%`}>
                        {categories.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                      </Pie>
                      <Legend />
                      <Tooltip formatter={v => fmt(v)} />
                    </PieChart>
                  </ResponsiveContainer>
                </div>

                <div>
                  <ResponsiveContainer width="100%" height={260}>
                    <BarChart data={categories}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#f0e8e0" />
                      <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                      <YAxis tick={{ fontSize: 11 }} tickFormatter={v => `₱${(v/1000).toFixed(0)}k`} />
                      <Tooltip formatter={v => fmt(v)} />
                      <Bar dataKey="revenue" radius={[4,4,0,0]} name="Revenue">
                        {categories.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>

              <table className="data-table">
                <thead><tr><th>Category</th><th>Items Sold</th><th>Revenue</th><th>% of Total</th></tr></thead>
                <tbody>
                  {(() => {
                    const total = categories.reduce((s, c) => s + c.revenue, 0);
                    return categories.map((cat, i) => (
                      <tr key={cat.name}>
                        <td>
                          <span style={{ display: 'inline-block', width: 10, height: 10, borderRadius: '50%', background: COLORS[i % COLORS.length], marginRight: 6 }} />
                          <strong>{cat.name}</strong>
                        </td>
                        <td>{cat.quantity}</td>
                        <td>{fmt(cat.revenue)}</td>
                        <td>{total > 0 ? ((cat.revenue / total) * 100).toFixed(1) : 0}%</td>
                      </tr>
                    ));
                  })()}
                </tbody>
              </table>
            </Section>
          )}
        </>
      )}
    </div>
  );
}
