import React, { useEffect, useState } from 'react';
import { toast } from 'react-toastify';
import { orderAPI } from '../services/api';
import { Order } from '../types';

const OrderQueue: React.FC = () => {
  const [orders, setOrders] = useState<Order[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchOrders();
    const interval = setInterval(fetchOrders, 5000); // Refresh every 5 seconds
    return () => clearInterval(interval);
  }, []);

  const fetchOrders = async () => {
    try {
      const response = await orderAPI.getQueue();
      setOrders(response.data);
    } catch (error) {
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

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      case 'preparing':
        return 'bg-blue-100 text-blue-800';
      case 'ready':
        return 'bg-green-100 text-green-800';
      case 'completed':
        return 'bg-gray-100 text-gray-800';
      case 'cancelled':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getNextStatus = (currentStatus: string): { status: string; label: string } | null => {
    switch (currentStatus) {
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

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-PH', {
      style: 'currency',
      currency: 'PHP',
    }).format(amount);
  };

  const formatTime = (dateString: string) => {
    return new Date(dateString).toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const getElapsedTime = (dateString: string) => {
    const orderTime = new Date(dateString).getTime();
    const now = new Date().getTime();
    const diff = Math.floor((now - orderTime) / 1000 / 60); // minutes
    
    if (diff < 1) return 'Just now';
    if (diff === 1) return '1 min ago';
    return `${diff} mins ago`;
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  const pendingOrders = orders.filter((o) => o.status === 'pending');
  const preparingOrders = orders.filter((o) => o.status === 'preparing');
  const readyOrders = orders.filter((o) => o.status === 'ready');

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">Order Queue</h1>
        <div className="flex gap-4 text-sm">
          <span className="badge-warning">{pendingOrders.length} Pending</span>
          <span className="badge-info">{preparingOrders.length} Preparing</span>
          <span className="badge-success">{readyOrders.length} Ready</span>
        </div>
      </div>

      {/* Queue Columns */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Pending Column */}
        <div className="space-y-4">
          <h2 className="font-semibold text-gray-700 flex items-center gap-2">
            <span className="w-3 h-3 rounded-full bg-yellow-500"></span>
            Pending ({pendingOrders.length})
          </h2>
          <div className="space-y-4">
            {pendingOrders.map((order) => (
              <OrderCard
                key={order.id}
                order={order}
                nextStatus={getNextStatus(order.status)}
                onUpdateStatus={handleUpdateStatus}
                getStatusColor={getStatusColor}
                formatCurrency={formatCurrency}
                formatTime={formatTime}
                getElapsedTime={getElapsedTime}
              />
            ))}
            {pendingOrders.length === 0 && <EmptyColumn />}
          </div>
        </div>

        {/* Preparing Column */}
        <div className="space-y-4">
          <h2 className="font-semibold text-gray-700 flex items-center gap-2">
            <span className="w-3 h-3 rounded-full bg-blue-500"></span>
            Preparing ({preparingOrders.length})
          </h2>
          <div className="space-y-4">
            {preparingOrders.map((order) => (
              <OrderCard
                key={order.id}
                order={order}
                nextStatus={getNextStatus(order.status)}
                onUpdateStatus={handleUpdateStatus}
                getStatusColor={getStatusColor}
                formatCurrency={formatCurrency}
                formatTime={formatTime}
                getElapsedTime={getElapsedTime}
              />
            ))}
            {preparingOrders.length === 0 && <EmptyColumn />}
          </div>
        </div>

        {/* Ready Column */}
        <div className="space-y-4">
          <h2 className="font-semibold text-gray-700 flex items-center gap-2">
            <span className="w-3 h-3 rounded-full bg-green-500"></span>
            Ready ({readyOrders.length})
          </h2>
          <div className="space-y-4">
            {readyOrders.map((order) => (
              <OrderCard
                key={order.id}
                order={order}
                nextStatus={getNextStatus(order.status)}
                onUpdateStatus={handleUpdateStatus}
                getStatusColor={getStatusColor}
                formatCurrency={formatCurrency}
                formatTime={formatTime}
                getElapsedTime={getElapsedTime}
              />
            ))}
            {readyOrders.length === 0 && <EmptyColumn />}
          </div>
        </div>
      </div>
    </div>
  );
};

interface OrderCardProps {
  order: Order;
  nextStatus: { status: string; label: string } | null;
  onUpdateStatus: (orderId: number, status: string) => void;
  getStatusColor: (status: string) => string;
  formatCurrency: (amount: number) => string;
  formatTime: (dateString: string) => string;
  getElapsedTime: (dateString: string) => string;
}

const OrderCard: React.FC<OrderCardProps> = ({
  order,
  nextStatus,
  onUpdateStatus,
  getStatusColor,
  formatCurrency,
  formatTime,
  getElapsedTime,
}) => {
  const [showDetails, setShowDetails] = useState(false);

  return (
    <div className="card">
      <div className="p-4">
        <div className="flex items-start justify-between mb-2">
          <div>
            <span className="font-bold text-lg">{order.order_number}</span>
            <p className="text-sm text-gray-500">{order.customer_name || 'Walk-in Customer'}</p>
          </div>
          <span className={`badge ${getStatusColor(order.status)}`}>
            {order.status}
          </span>
        </div>

        <div className="flex items-center justify-between text-sm text-gray-500 mb-3">
          <span>{formatTime(order.created_at)}</span>
          <span>{getElapsedTime(order.created_at)}</span>
        </div>

        <div className="flex items-center justify-between">
          <span className="font-semibold text-primary-600">{formatCurrency(order.final_amount)}</span>
          <button
            onClick={() => setShowDetails(!showDetails)}
            className="text-sm text-gray-500 hover:text-gray-700"
          >
            {showDetails ? 'Hide' : 'View'} Items
          </button>
        </div>

        {showDetails && (
          <div className="mt-3 pt-3 border-t border-gray-200">
            <ul className="space-y-1 text-sm">
              {order.order_items?.map((item) => (
                <li key={item.id} className="flex justify-between">
                  <span>{item.quantity}x {item.menu_item?.name}</span>
                  <span className="text-gray-500">{formatCurrency(item.subtotal)}</span>
                </li>
              ))}
            </ul>
          </div>
        )}

        {nextStatus && (
          <button
            onClick={() => onUpdateStatus(order.id, nextStatus.status)}
            className="w-full mt-3 btn-primary"
          >
            {nextStatus.label}
          </button>
        )}

        {order.status !== 'cancelled' && (
          <button
            onClick={() => onUpdateStatus(order.id, 'cancelled')}
            className="w-full mt-2 btn-danger"
          >
            Cancel Order
          </button>
        )}
      </div>
    </div>
  );
};

const EmptyColumn: React.FC = () => (
  <div className="card p-8 text-center text-gray-400">
    <p>No orders</p>
  </div>
);

export default OrderQueue;
