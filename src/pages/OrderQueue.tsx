import React, { useEffect, useState } from 'react';
import { toast } from 'react-toastify';
import { orderAPI } from '../services/api';
import { Order } from '../types';
import './OrderQueue.css';

const OrderQueue: React.FC = () => {
  const [orders, setOrders] = useState<Order[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchOrders();
    const interval = setInterval(fetchOrders, 5000);
    return () => clearInterval(interval);
  }, []);

  const fetchOrders = async () => {
    try {
      const response = await orderAPI.getQueue();
      setOrders(response.data);
    } catch {
      toast.error('Failed to load order queue');
    } finally {
      setIsLoading(false);
    }
  };

  const handleUpdateStatus = async (orderId: number, newStatus: string) => {
    try {
      await orderAPI.updateStatus(orderId, newStatus);
      toast.success(`Order status updated to ${newStatus}`);
      fetchOrders();
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to update status');
    }
  };

  const getNextStatus = (status: string) => {
    switch (status) {
      case 'pending':
        return { status: 'preparing', label: 'Start Preparing' };
      case 'preparing':
        return { status: 'ready', label: 'Mark Ready' };
      case 'ready':
        return { status: 'completed', label: 'Complete' };
      default:
        return null;
    }
  };

  const formatCurrency = (amount: number) =>
    new Intl.NumberFormat('en-PH', {
      style: 'currency',
      currency: 'PHP',
    }).format(amount);

  const formatTime = (date: string) =>
    new Date(date).toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
    });

  const getElapsedTime = (date: string) => {
    const diff = Math.floor((Date.now() - new Date(date).getTime()) / 60000);
    if (diff < 1) return 'Just now';
    if (diff === 1) return '1 min ago';
    return `${diff} mins ago`;
  };

  if (isLoading) {
    return (
      <div className="loading-container">
        <div className="spinner"></div>
      </div>
    );
  }

  const pending = orders.filter(o => o.status === 'pending');
  const preparing = orders.filter(o => o.status === 'preparing');
  const ready = orders.filter(o => o.status === 'ready');

  return (
    <div className="order-page">

      <div className="order-header">
        <h1>Order Queue</h1>

        <div className="order-stats">
          <span className="badge warning">{pending.length} Pending</span>
          <span className="badge info">{preparing.length} Preparing</span>
          <span className="badge success">{ready.length} Ready</span>
        </div>
      </div>

      <div className="order-columns">

        <OrderColumn
          title="Pending"
          orders={pending}
          handleUpdateStatus={handleUpdateStatus}
          getNextStatus={getNextStatus}
          formatCurrency={formatCurrency}
          formatTime={formatTime}
          getElapsedTime={getElapsedTime}
        />

        <OrderColumn
          title="Preparing"
          orders={preparing}
          handleUpdateStatus={handleUpdateStatus}
          getNextStatus={getNextStatus}
          formatCurrency={formatCurrency}
          formatTime={formatTime}
          getElapsedTime={getElapsedTime}
        />

        <OrderColumn
          title="Ready"
          orders={ready}
          handleUpdateStatus={handleUpdateStatus}
          getNextStatus={getNextStatus}
          formatCurrency={formatCurrency}
          formatTime={formatTime}
          getElapsedTime={getElapsedTime}
        />

      </div>
    </div>
  );
};

interface ColumnProps {
  title: string;
  orders: Order[];
  handleUpdateStatus: (id: number, status: string) => void;
  getNextStatus: (status: string) => { status: string; label: string } | null;
  formatCurrency: (n: number) => string;
  formatTime: (s: string) => string;
  getElapsedTime: (s: string) => string;
}

const OrderColumn: React.FC<ColumnProps> = ({
  title,
  orders,
  handleUpdateStatus,
  getNextStatus,
  formatCurrency,
  formatTime,
  getElapsedTime,
}) => (
  <div className="order-column">

    <h2>{title} ({orders.length})</h2>

    {orders.length === 0 && <EmptyColumn />}

    {orders.map(order => (
      <OrderCard
        key={order.id}
        order={order}
        nextStatus={getNextStatus(order.status)}
        onUpdateStatus={handleUpdateStatus}
        formatCurrency={formatCurrency}
        formatTime={formatTime}
        getElapsedTime={getElapsedTime}
      />
    ))}

  </div>
);

interface OrderCardProps {
  order: Order;
  nextStatus: { status: string; label: string } | null;
  onUpdateStatus: (id: number, status: string) => void;
  formatCurrency: (n: number) => string;
  formatTime: (s: string) => string;
  getElapsedTime: (s: string) => string;
}

const OrderCard: React.FC<OrderCardProps> = ({
  order,
  nextStatus,
  onUpdateStatus,
  formatCurrency,
  formatTime,
  getElapsedTime,
}) => {
  const [showItems, setShowItems] = useState(false);

  return (
    <div className="card">

      <div className="card-header">
        <div>
          <strong>{order.order_number}</strong>
          <p className="customer">{order.customer_name || 'Walk-in Customer'}</p>
        </div>

        <span className={`badge status ${order.status}`}>
          {order.status}
        </span>
      </div>

      <div className="card-meta">
        <span>{formatTime(order.created_at)}</span>
        <span>{getElapsedTime(order.created_at)}</span>
      </div>

      <div className="card-total">
        <span>{formatCurrency(order.final_amount)}</span>

        <button
          onClick={() => setShowItems(!showItems)}
          className="link-btn"
        >
          {showItems ? 'Hide' : 'View'} Items
        </button>
      </div>

      {showItems && (
        <ul className="order-items">
          {order.order_items?.map(item => (
            <li key={item.id}>
              {item.quantity}x {item.menu_item?.name}
              <span>{formatCurrency(item.subtotal)}</span>
            </li>
          ))}
        </ul>
      )}

      {nextStatus && (
        <button
          className="btn-primary"
          onClick={() => onUpdateStatus(order.id, nextStatus.status)}
        >
          {nextStatus.label}
        </button>
      )}

      {order.status !== 'cancelled' && (
        <button
          className="btn-danger"
          onClick={() => onUpdateStatus(order.id, 'cancelled')}
        >
          Cancel Order
        </button>
      )}

    </div>
  );
};

const EmptyColumn: React.FC = () => (
  <div className="card empty">
    No orders
  </div>
);

export default OrderQueue;