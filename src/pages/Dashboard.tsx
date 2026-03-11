import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { toast } from 'react-toastify';
import { useAuth } from '../contexts/AuthContext';
import { reportAPI } from '../services/api';
import { DashboardSummary } from '../types';
import './Dashboard.css';

const Dashboard: React.FC = () => {
  const { user } = useAuth();
  const [summary, setSummary] = useState<DashboardSummary | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (user?.role === 'admin') {
      fetchDashboardData();
    } else {
      setIsLoading(false);
    }
  }, [user]);

  const fetchDashboardData = async () => {
    try {
      const response = await reportAPI.getDashboard();
      setSummary(response.data.summary);
    } catch (error) {
      toast.error('Failed to load dashboard data');
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

  if (isLoading) {
    return (
      <div className="loading-container">
        <div className="spinner"></div>
      </div>
    );
  }

  if (user?.role === 'customer') {
    return (
      <div className="dashboard">
        <h1 className="welcome-title">Welcome, {user.name}!</h1>

        <div className="dashboard-grid">
          <Link to="/menu" className="dashboard-card">
            <h3>Browse Menu</h3>
            <p>View our delicious offerings</p>
          </Link>

          <Link to="/orders" className="dashboard-card">
            <h3>My Orders</h3>
            <p>View your order history</p>
          </Link>

          <Link to="/profile" className="dashboard-card">
            <h3>My Profile</h3>
            <p>Manage your account</p>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="dashboard">
      <div className="dashboard-header">
        <h1>Dashboard</h1>
        <span>Welcome back, {user?.name}</span>
      </div>

      {summary && (
        <div className="stats-grid">
          <div className="stat-card">
            <p>Today's Sales</p>
            <h2>{formatCurrency(summary.today_sales)}</h2>
          </div>

          <div className="stat-card">
            <p>Today's Orders</p>
            <h2>{summary.today_orders}</h2>
          </div>

          <div className="stat-card">
            <p>Total Sales (This Month)</p>
            <h2>{formatCurrency(summary.total_sales)}</h2>
          </div>

          <div className="stat-card">
            <p>Average Order Value</p>
            <h2>{formatCurrency(summary.average_order_value)}</h2>
          </div>
        </div>
      )}

      <div className="dashboard-grid">
        <Link to="/pos" className="dashboard-card">
          <h3>POS</h3>
          <p>Process new orders</p>
        </Link>

        <Link to="/order-queue" className="dashboard-card">
          <h3>Order Queue</h3>
          <p>Manage active orders</p>
        </Link>

        <Link to="/inventory" className="dashboard-card">
          <h3>Inventory</h3>
          <p>Manage stock levels</p>
        </Link>

        {user?.role === 'admin' && (
          <Link to="/reports" className="dashboard-card">
            <h3>Reports</h3>
            <p>View sales analytics</p>
          </Link>
        )}
      </div>
    </div>
  );
};

export default Dashboard;