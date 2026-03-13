import { useState, useEffect } from 'react';
import { api } from '../../services/api.js';
import { StatCard } from '../common/index.jsx';
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend,
  LineChart, Line, CartesianGrid,
} from 'recharts';

const COLORS = ['#f97316', '#3b82f6', '#10b981', '#8b5cf6', '#ef4444'];

function fmt(n) {
  return `₱${Number(n || 0).toLocaleString('en-PH', { minimumFractionDigits: 2 })}`;
}

export default function SalesDashboard() {
  const [summary, setSummary]   = useState(null);
  const [daily, setDaily]       = useState([]);
  const [categories, setCats]   = useState([]);
  const [trend, setTrend]       = useState([]);
  const [topItems, setTopItems] = useState([]);
  const [loading, setLoading]   = useState(true);
  const [days, setDays]         = useState(30);

  useEffect(() => {
    let cancelled = false;

    const fetchAll = async () => {
      setLoading(true);
      try {
        const [s, d, c, tr, t] = await Promise.all([
          api.get('/reports/summary'),
          api.get(`/reports/daily-sales?days=${days}`),
          api.get('/reports/category-breakdown'),
          api.get(`/reports/order-trend?days=${days}`),
          api.get('/reports/top-items?limit=5'),
        ]);

        if (cancelled) return;

        setSummary(s);
        setDaily(d.map(row => ({ ...row, revenue: parseFloat(row.revenue) })));
        setCats(c.map(row => ({ ...row, revenue: parseFloat(row.revenue) })));

        const tMap = {};
        tr.forEach(r => { tMap[r.date] = (tMap[r.date] || 0) + Number(r.orders); });
        setTrend(Object.entries(tMap).map(([date, orders]) => ({ date, orders })));

        setTopItems(t);
      } catch (err) {
        console.error('Dashboard fetch error:', err);
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    fetchAll();
    return () => { cancelled = true; };
  }, [days]);

  if (loading) {
    return <div className="spinner-center"><div className="spinner" /></div>;
  }

  return (
    <div className="dashboard">
      {/* Summary cards */}
      <div className="stats-row">
        <StatCard icon="💰" label="Total Sales"   value={fmt(summary?.total_sales)}      color="#f97316" />
        <StatCard icon="📋" label="Total Orders"  value={summary?.total_orders ?? 0}     color="#3b82f6" />
        <StatCard icon="🧾" label="Avg Order"     value={fmt(summary?.average_order)}    color="#10b981" />
        <StatCard icon="🍱" label="Items Sold"    value={summary?.total_items_sold ?? 0} color="#8b5cf6" />
      </div>

      {/* Period filter */}
      <div className="chart-controls">
        <span>Period:</span>
        {[7, 14, 30, 60].map(d => (
          <button
            key={d}
            type="button"
            className={`chip${days === d ? ' active' : ''}`}
            onClick={() => setDays(d)}
          >
            {d} days
          </button>
        ))}
      </div>

      {/* Charts */}
      <div className="charts-grid">
        <div className="chart-card">
          <h4>Daily Sales Revenue</h4>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={daily}>
              <XAxis dataKey="date" tick={{ fontSize: 11 }} tickFormatter={d => d.slice(5)} />
              <YAxis tick={{ fontSize: 11 }} tickFormatter={v => `₱${(v / 1000).toFixed(0)}k`} />
              <Tooltip formatter={v => `₱${Number(v).toFixed(2)}`} />
              <Bar dataKey="revenue" fill="#f97316" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="chart-card">
          <h4>Sales by Category</h4>
          <ResponsiveContainer width="100%" height={220}>
            <PieChart>
              <Pie
                data={categories}
                dataKey="revenue"
                nameKey="name"
                cx="50%"
                cy="50%"
                outerRadius={80}
                label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
              >
                {categories.map((_, i) => (
                  <Cell key={i} fill={COLORS[i % COLORS.length]} />
                ))}
              </Pie>
              <Legend />
              <Tooltip formatter={v => `₱${Number(v).toFixed(2)}`} />
            </PieChart>
          </ResponsiveContainer>
        </div>

        <div className="chart-card chart-card-wide">
          <h4>Order Volume Trend (last {days} days)</h4>
          <ResponsiveContainer width="100%" height={200}>
            <LineChart data={trend}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
              <XAxis dataKey="date" tick={{ fontSize: 11 }} tickFormatter={d => d.slice(5)} />
              <YAxis tick={{ fontSize: 11 }} allowDecimals={false} />
              <Tooltip />
              <Line type="monotone" dataKey="orders" stroke="#3b82f6" strokeWidth={2} dot={false} />
            </LineChart>
          </ResponsiveContainer>
        </div>

        <div className="chart-card">
          <h4>Top 5 Items by Quantity</h4>
          <div className="top-items">
            {topItems.map((item, i) => (
              <div key={item.menu_item_id} className="top-item-row">
                <span className="top-item-rank">{i + 1}</span>
                <span className="top-item-name">{item.menu_item?.name}</span>
                <span className="top-item-qty">{item.total_quantity} sold</span>
                <span className="top-item-rev">{fmt(item.total_revenue)}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
