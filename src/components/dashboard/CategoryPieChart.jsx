import { PieChart, Pie, Cell, Legend, Tooltip, ResponsiveContainer } from 'recharts';

const COLORS = ['#fbbf24', '#6b0f1a', '#10b981', '#8b5cf6', '#ef4444'];

export default function CategoryPieChart({ data }) {
  return (
    <div className="chart-card">
      <h4>Sales by Category</h4>
      <ResponsiveContainer width="100%" height={220}>
        <PieChart>
          <Pie
            data={data}
            dataKey="revenue"
            nameKey="name"
            cx="50%"
            cy="50%"
            outerRadius={80}
            label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
          >
            {data.map((_, i) => (
              <Cell key={i} fill={COLORS[i % COLORS.length]} />
            ))}
          </Pie>
          <Legend />
          <Tooltip formatter={v => `₱${Number(v).toFixed(2)}`} />
        </PieChart>
      </ResponsiveContainer>
    </div>
  );
}
