# Canteen Management System - Frontend

A React + TypeScript + Vite frontend for the Canteen Management System.

## Features

- **Authentication**: Login, register, and role-based access control
- **Menu Browsing**: View menu items with category filtering
- **POS System**: Point-of-sale interface for cashiers
- **Order Management**: Track and manage orders in real-time
- **Inventory Management**: Monitor and update stock levels
- **Sales Reports**: Interactive charts and analytics dashboard
- **Responsive Design**: Works on desktop, tablet, and mobile

## Tech Stack

- React 18
- TypeScript
- Vite
- Tailwind CSS
- React Router DOM
- Chart.js / React-Chartjs-2
- Axios
- React Toastify

## Installation

### Prerequisites

- Node.js 18+
- npm or yarn

### Setup Instructions

1. Navigate to the frontend folder:
```bash
cd canteen-frontend
```

2. Install dependencies:
```bash
npm install
```

3. Create environment file:
```bash
cp .env.example .env
```

4. Update the `.env` file with your API URL:
```env
VITE_API_URL=http://localhost:8000/api
```

5. Start the development server:
```bash
npm run dev
```

The app will be available at `http://localhost:5173`

## Build for Production

```bash
npm run build
```

The built files will be in the `dist` folder.

## Default Login Credentials

| Role | Email | Password |
|------|-------|----------|
| Admin | admin@canteen.com | password |
| Cashier | cashier1@canteen.com | password |
| Customer | john@example.com | password |

## Project Structure

```
src/
├── components/
│   ├── auth/         # Authentication components
│   ├── common/       # Common components (Layout, etc.)
│   ├── dashboard/    # Dashboard components
│   ├── inventory/    # Inventory components
│   ├── menu/         # Menu components
│   └── orders/       # Order components
├── contexts/
│   ├── AuthContext.tsx   # Authentication state
│   └── CartContext.tsx   # Shopping cart state
├── pages/
│   ├── Dashboard.tsx
│   ├── Login.tsx
│   ├── Menu.tsx
│   ├── POS.tsx
│   ├── OrderQueue.tsx
│   ├── Orders.tsx
│   ├── Inventory.tsx
│   ├── Reports.tsx
│   ├── Users.tsx
│   ├── Profile.tsx
│   └── ...
├── services/
│   └── api.ts        # API service functions
├── types/
│   └── index.ts      # TypeScript interfaces
└── utils/            # Utility functions
```

## Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run preview` - Preview production build
- `npm run lint` - Run ESLint

## License

This project is for educational purposes.
