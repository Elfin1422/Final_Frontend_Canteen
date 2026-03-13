import { Routes, Route, Navigate, useLocation } from 'react-router-dom';
import Sidebar from '../components/common/Sidebar.jsx';
import { TopBar } from '../components/common/index.jsx';
import POSInterface from '../components/orders/POSInterface.jsx';
import OrderQueue   from '../components/orders/OrderQueue.jsx';

const LINKS = [
  { to: '/cashier/pos',    icon: '🛒', label: 'Point of Sale' },
  { to: '/cashier/orders', icon: '📋', label: 'Order Queue'   },
];

const TITLES = {
  '/cashier/pos':    'Point of Sale',
  '/cashier/orders': 'Order Queue',
};

export default function CashierDashboard() {
  const { pathname } = useLocation();
  const title = TITLES[pathname] ?? 'Cashier';
  return (
    <div className="app-layout">
      <Sidebar links={LINKS} />
      <div className="main-content">
        <TopBar title={title} />
        <div className="page-body">
          <Routes>
            <Route path="pos"    element={<POSInterface />} />
            <Route path="orders" element={<OrderQueue />} />
            <Route path="*"      element={<Navigate to="pos" replace />} />
          </Routes>
        </div>
      </div>
    </div>
  );
}
