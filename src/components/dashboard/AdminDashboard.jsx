import { useState, useEffect } from 'react';
import { api } from '../../services/api.js';
import { StatCard } from '../common/index.jsx';
import SalesChart       from './SalesChart.jsx';
import CategoryPieChart from './CategoryPieChart.jsx';
import OrderTrendChart  from './OrderTrendChart.jsx';

function fmt(n) {
  return `₱${Number(n || 0).toLocaleString('en-PH', { minimumFractionDigits: 2 })}`;
}

export default function AdminDashboard() {
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

  if (loading) return <div className="spinner-center"><div className="spinner" /></div>;

  return (
    <div className="dashboard">
      <div className="stats-row">
        <StatCard icon="💰" label="Total Sales"  value={fmt(summary?.total_sales)}      color="#6b0f1a" />
        <StatCard icon="📋" label="Total Orders" value={summary?.total_orders ?? 0}     color="#fbbf24" />
        <StatCard icon="🧾" label="Avg Order"    value={fmt(summary?.average_order)}    color="#6b0f1a" />
        <StatCard icon="🍱" label="Items Sold"   value={summary?.total_items_sold ?? 0} color="#fbbf24" />
      </div>

      <div className="chart-controls">
        <span>Period:</span>
        {[7, 14, 30, 60].map(d => (
          <button key={d} type="button" className={`chip${days === d ? ' active' : ''}`} onClick={() => setDays(d)}>
            {d} days
          </button>
        ))}
      </div>

      <div className="charts-grid">
        <SalesChart data={daily} />
        <CategoryPieChart data={categories} />
        <OrderTrendChart data={trend} days={days} />
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
