import React, { useEffect, useState } from "react";
import { toast } from "react-toastify";
import { reportAPI } from "../services/api";
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
} from "chart.js";
import { Bar, Line, Pie } from "react-chartjs-2";
import "./Reports.css";

import {
  DashboardSummary,
  SalesByDay,
  SalesByCategory,
  TopSellingItem,
  OrderTrend,
} from "../types";

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
  const [isLoading, setIsLoading] = useState(true);

  const [dateRange, setDateRange] = useState({
    from: new Date(new Date().setDate(new Date().getDate() - 30))
      .toISOString()
      .split("T")[0],
    to: new Date().toISOString().split("T")[0],
  });

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

      const [
        summaryRes,
        salesDayRes,
        salesCatRes,
        topItemsRes,
        trendsRes,
      ] = await Promise.all([
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
    } catch {
      toast.error("Failed to load report data");
    } finally {
      setIsLoading(false);
    }
  };

  const formatCurrency = (amount: number) =>
    new Intl.NumberFormat("en-PH", {
      style: "currency",
      currency: "PHP",
    }).format(amount);

  const salesByDayData = {
    labels: salesByDay.map((d) =>
      new Date(d.date).toLocaleDateString()
    ),
    datasets: [
      {
        label: "Sales",
        data: salesByDay.map((d) => d.sales),
        backgroundColor: "#f97316",
      },
    ],
  };

  const salesByCategoryData = {
    labels: salesByCategory.map((c) => c.category),
    datasets: [
      {
        data: salesByCategory.map((c) => c.revenue),
        backgroundColor: [
          "#f97316",
          "#3b82f6",
          "#10b981",
          "#f59e0b",
          "#8b5cf6",
        ],
      },
    ],
  };

  const orderTrendsData = {
    labels: orderTrends.map((t) =>
      new Date(t.date).toLocaleDateString()
    ),
    datasets: [
      {
        label: "Total Orders",
        data: orderTrends.map((t) => t.total_orders),
        borderColor: "#f97316",
        backgroundColor: "rgba(249,115,22,0.2)",
        tension: 0.4,
      },
      {
        label: "Completed",
        data: orderTrends.map((t) => t.completed_orders),
        borderColor: "#10b981",
        backgroundColor: "rgba(16,185,129,0.2)",
        tension: 0.4,
      },
    ],
  };

  if (isLoading) {
    return (
      <div className="reports-loading">
        <div className="spinner"></div>
      </div>
    );
  }

  return (
    <div className="reports-container">

      <div className="reports-header">
        <h1>Sales Reports</h1>

        <div className="date-range">
          <input
            type="date"
            value={dateRange.from}
            onChange={(e) =>
              setDateRange({ ...dateRange, from: e.target.value })
            }
            className="input"
          />

          <span>to</span>

          <input
            type="date"
            value={dateRange.to}
            onChange={(e) =>
              setDateRange({ ...dateRange, to: e.target.value })
            }
            className="input"
          />
        </div>
      </div>

      {summary && (
        <div className="stats-grid">
          <div className="stat-card">
            <p>Total Sales</p>
            <h2>{formatCurrency(summary.total_sales)}</h2>
          </div>

          <div className="stat-card">
            <p>Total Orders</p>
            <h2>{summary.total_orders}</h2>
          </div>

          <div className="stat-card">
            <p>Completed Orders</p>
            <h2>{summary.completed_orders}</h2>
          </div>

          <div className="stat-card">
            <p>Average Order Value</p>
            <h2>{formatCurrency(summary.average_order_value)}</h2>
          </div>
        </div>
      )}

      <div className="charts-grid">

        <div className="card">
          <h3>Daily Sales</h3>
          <Bar data={salesByDayData} />
        </div>

        <div className="card">
          <h3>Sales by Category</h3>
          <Pie data={salesByCategoryData} />
        </div>

        <div className="card wide">
          <h3>Order Trends</h3>
          <Line data={orderTrendsData} />
        </div>

      </div>

      <div className="card">

        <h3>Top Selling Items</h3>

        <table className="table">
          <thead>
            <tr>
              <th>Rank</th>
              <th>Item</th>
              <th>Category</th>
              <th>Quantity</th>
              <th>Revenue</th>
            </tr>
          </thead>

          <tbody>
            {topSellingItems.map((item, index) => (
              <tr key={item.id}>
                <td>#{index + 1}</td>
                <td>{item.name}</td>
                <td>{item.category}</td>
                <td>{item.total_quantity}</td>
                <td>{formatCurrency(item.total_revenue)}</td>
              </tr>
            ))}
          </tbody>
        </table>

      </div>

    </div>
  );
};

export default Reports;