import React, { useEffect, useState } from 'react';
import { toast } from 'react-toastify';
import { orderAPI } from '../services/api';
import { Order } from '../types';
import { useAuth } from '../contexts/AuthContext';
import './Orders.css';

const Orders: React.FC = () => {
  const { user } = useAuth();
  const [orders, setOrders] = useState<Order[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedStatus, setSelectedStatus] = useState('');

  useEffect(() => {
    fetchOrders();
  }, [selectedStatus]);

  const fetchOrders = async () => {
    try {
      const params: any = {};
      if (selectedStatus) params.status = selectedStatus;

      if (user?.role === 'customer') {
        const response = await orderAPI.getMyOrders();
        setOrders(response.data.data);
      } else {
        const response = await orderAPI.getAll(params);
        setOrders(response.data.data);
      }
    } catch {
      toast.error('Failed to load orders');
    } finally {
      setIsLoading(false);
    }
  };

  const formatCurrency = (amount: number) =>
    new Intl.NumberFormat('en-PH', {
      style: 'currency',
      currency: 'PHP',
    }).format(amount);

  const formatDate = (date: string) =>
    new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });

  if (isLoading) {
    return (
      <div className="loading-container">
        <div className="spinner"></div>
      </div>
    );
  }

  return (
    <div className="orders-page">

      <div className="orders-header">

        <h1>
          {user?.role === 'customer' ? 'My Orders' : 'All Orders'}
        </h1>

        {user?.role !== 'customer' && (
          <select
            value={selectedStatus}
            onChange={(e) => setSelectedStatus(e.target.value)}
            className="input"
          >
            <option value="">All Status</option>
            <option value="pending">Pending</option>
            <option value="preparing">Preparing</option>
            <option value="ready">Ready</option>
            <option value="completed">Completed</option>
            <option value="cancelled">Cancelled</option>
          </select>
        )}

      </div>

      {orders.length === 0 ? (
        <div className="empty-orders">
          <h3>No orders found</h3>
          <p>
            {user?.role === 'customer'
              ? "You haven't placed any orders yet."
              : 'No orders match your criteria.'}
          </p>
        </div>
      ) : (
        <div className="table-container">

          <table className="orders-table">

            <thead>
              <tr>
                <th>Order #</th>
                <th>Customer</th>
                <th>Date</th>
                <th>Status</th>
                <th>Items</th>
                <th>Total</th>
              </tr>
            </thead>

            <tbody>

              {orders.map((order) => (
                <tr key={order.id}>

                  <td className="font-bold">
                    {order.order_number}
                  </td>

                  <td>
                    {order.customer_name ||
                      order.user?.name ||
                      'N/A'}
                  </td>

                  <td>
                    {formatDate(order.created_at)}
                  </td>

                  <td>
                    <span className={`badge ${order.status}`}>
                      {order.status}
                    </span>
                  </td>

                  <td>
                    {order.order_items?.length || 0} items
                  </td>

                  <td className="font-bold">
                    {formatCurrency(order.final_amount)}
                  </td>

                </tr>
              ))}

            </tbody>

          </table>

        </div>
      )}
    </div>
  );
};

export default Orders;