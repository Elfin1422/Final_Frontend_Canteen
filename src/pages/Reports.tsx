import React, { useEffect, useState } from 'react';
import { toast } from 'react-toastify';
import { reportAPI } from '../services/api';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  LineElement,
  PointElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js';
import { Bar, Line, Pie } from 'react-chartjs-2';
import { DashboardSummary, SalesByDay, SalesByCategory, TopSellingItem, OrderTrend } from '../types';

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  LineElement,
  PointElement,
  ArcElement,
  Title,
  Tooltip,
  Legend
);

const Reports: React.FC = () => {
  const [summary, setSummary] = useState<DashboardSummary | null>(null);
  const [salesByDay, setSalesByDay] = useState<SalesByDay[]>([]);
  const [salesByCategory, setSalesByCategory] = useState<SalesByCategory[]>([]);
  const [topSellingItems, setTopSellingItems] = useState<TopSellingItem[]>([]);
  const [orderTrends, setOrderTrends] = useState<OrderTrend[]>([]);
  const [dateRange, setDateRange] = useState({
    from: new Date(new Date().setDate(new Date().getDate() - 30)).toISOString().split('T')[0],
    to: new Date().toISOString().split('T')[0],
  });
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchReportData();
  }, [dateRange]);

  const fetchReportData = async () => {
    setIsLoading(true);
    try {
      const params = {
        date_from: dateRange.from,
        date_to: dateRange.to,
      };

      const [summaryRes, salesDayRes, salesCatRes, topItemsRes, trendsRes] = await Promise.all([
        reportAPI.getDashboard(params),
        reportAPI.getSalesByDay(params),
        reportAPI.getSalesByCategory(params),
        reportAPI.getTopSellingItems({ ...params, limit: 10 }),
        reportAPI.getOrderTrends({ days: 30 }),
      ]);

      setSummary(summaryRes.data.summary);
      setSalesByDay(salesDayRes.data);
      setSalesByCategory(salesCatRes.data);
      setTopSellingItems(topItemsRes.data);
      setOrderTrends(trendsRes.data);
    } catch (error) {
      toast.error('Failed to load report data');
    } finally {
      setIsLoading(false);
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-PH', {
      style: 'currency',
      currency: 'PHP',
    }).format(amount);
  };

  // Chart data
  const salesByDayData = {
    labels: salesByDay.map((d) => new Date(d.date).toLocaleDateString()),
    datasets: [
      {
        label: 'Sales',
        data: salesByDay.map((d) => d.sales),
        backgroundColor: 'rgba(249, 115, 22, 0.8)',
        borderColor: 'rgba(249, 115, 22, 1)',
        borderWidth: 1,
      },
    ],
  };

  const salesByCategoryData = {
    labels: salesByCategory.map((c) => c.category),
    datasets: [
      {
        data: salesByCategory.map((c) => c.revenue),
        backgroundColor: [
          'rgba(249, 115, 22, 0.8)',
          'rgba(59, 130, 246, 0.8)',
          'rgba(16, 185, 129, 0.8)',
          'rgba(245, 158, 11, 0.8)',
          'rgba(139, 92, 246, 0.8)',
        ],
        borderWidth: 0,
      },
    ],
  };

  const orderTrendsData = {
    labels: orderTrends.map((t) => new Date(t.date).toLocaleDateString()),
    datasets: [
      {
        label: 'Total Orders',
        data: orderTrends.map((t) => t.total_orders),
        borderColor: 'rgba(249, 115, 22, 1)',
        backgroundColor: 'rgba(249, 115, 22, 0.1)',
        tension: 0.4,
        fill: true,
      },
      {
        label: 'Completed',
        data: orderTrends.map((t) => t.completed_orders),
        borderColor: 'rgba(16, 185, 129, 1)',
        backgroundColor: 'rgba(16, 185, 129, 0.1)',
        tension: 0.4,
        fill: true,
      },
    ],
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <h1 className="text-2xl font-bold text-gray-900">Sales Reports</h1>
        
        <div className="flex gap-2 items-center">
          <input
            type="date"
            value={dateRange.from}
            onChange={(e) => setDateRange({ ...dateRange, from: e.target.value })}
            className="input"
          />
          <span>to</span>
          <input
            type="date"
            value={dateRange.to}
            onChange={(e) => setDateRange({ ...dateRange, to: e.target.value })}
            className="input"
          />
        </div>
      </div>

      {/* Summary Cards */}
      {summary && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="stat-card">
            <p className="stat-label">Total Sales</p>
            <p className="stat-value text-primary-600">{formatCurrency(summary.total_sales)}</p>
          </div>
          <div className="stat-card">
            <p className="stat-label">Total Orders</p>
            <p className="stat-value text-blue-600">{summary.total_orders}</p>
          </div>
          <div className="stat-card">
            <p className="stat-label">Completed Orders</p>
            <p className="stat-value text-green-600">{summary.completed_orders}</p>
          </div>
          <div className="stat-card">
            <p className="stat-label">Average Order Value</p>
            <p className="stat-value text-purple-600">{formatCurrency(summary.average_order_value)}</p>
          </div>
        </div>
      )}

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Sales by Day */}
        <div className="card p-6">
          <h3 className="text-lg font-semibold mb-4">Daily Sales</h3>
          <Bar
            data={salesByDayData}
            options={{
              responsive: true,
              plugins: {
                legend: { display: false },
              },
            }}
          />
        </div>

        {/* Sales by Category */}
        <div className="card p-6">
          <h3 className="text-lg font-semibold mb-4">Sales by Category</h3>
          <Pie
            data={salesByCategoryData}
            options={{
              responsive: true,
              plugins: {
                legend: { position: 'bottom' },
              },
            }}
          />
        </div>

        {/* Order Trends */}
        <div className="card p-6 lg:col-span-2">
          <h3 className="text-lg font-semibold mb-4">Order Trends (30 Days)</h3>
          <Line
            data={orderTrendsData}
            options={{
              responsive: true,
              plugins: {
                legend: { position: 'bottom' },
              },
            }}
          />
        </div>
      </div>

      {/* Top Selling Items */}
      <div className="card">
        <div className="card-header">
          <h3 className="text-lg font-semibold">Top Selling Items</h3>
        </div>
        <div className="table-container">
          <table className="table">
            <thead className="table-header">
              <tr>
                <th className="table-header-cell">Rank</th>
                <th className="table-header-cell">Item</th>
                <th className="table-header-cell">Category</th>
                <th className="table-header-cell">Quantity Sold</th>
                <th className="table-header-cell">Revenue</th>
              </tr>
            </thead>
            <tbody className="table-body">
              {topSellingItems.map((item, index) => (
                <tr key={item.id} className="hover:bg-gray-50">
                  <td className="table-cell font-medium">#{index + 1}</td>
                  <td className="table-cell">{item.name}</td>
                  <td className="table-cell">{item.category}</td>
                  <td className="table-cell">{item.total_quantity}</td>
                  <td className="table-cell font-medium">{formatCurrency(item.total_revenue)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default Reports;
