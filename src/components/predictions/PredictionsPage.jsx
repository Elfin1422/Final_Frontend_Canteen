/**
 * PredictionsPage.jsx
 * ====================
 * ML-powered demand forecasting dashboard for the Admin.
 *
 * Uses supervised machine learning (Random Forest + Linear Regression)
 * to predict next-week demand per menu item and advise which items
 * need restocking based on predicted demand vs. current stock levels.
 */
import { useState, useEffect } from 'react';
import { api } from '../../services/api.js';
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
  LineChart, Line, CartesianGrid, Legend,
} from 'recharts';

const URGENCY_COLOR = {
  critical: '#ef4444',
  high:     '#f59e0b',
  medium:   '#3b82f6',
  low:      '#10b981',
};

const URGENCY_LABEL = {
  critical: '🔴 Critical',
  high:     '🟠 High',
  medium:   '🔵 Medium',
  low:      '🟢 Low',
};

const TREND_ICON = {
  rising:   '📈',
  declining:'📉',
  stable:   '➡️',
};

function fmt(n) {
  return `₱${Number(n || 0).toLocaleString('en-PH', { minimumFractionDigits: 2 })}`;
}

/* ── Metric card ── */
function MetricCard({ icon, label, value, sub }) {
  return (
    <div className="pred-metric-card">
      <div className="pred-metric-icon">{icon}</div>
      <div>
        <div className="pred-metric-value">{value}</div>
        <div className="pred-metric-label">{label}</div>
        {sub && <div className="pred-metric-sub">{sub}</div>}
      </div>
    </div>
  );
}

/* ── Stock advice card ── */
function AdviceCard({ item, rank }) {
  return (
    <div className="pred-advice-card" style={{ borderLeftColor: URGENCY_COLOR[item.urgency] }}>
      <div className="pred-advice-rank">#{rank}</div>
      <div className="pred-advice-body">
        <div className="pred-advice-name">{item.name}</div>
        <div className="pred-advice-cat">{item.category}</div>
        <div className="pred-advice-meta">
          <span className="pred-urgency-badge" style={{ background: URGENCY_COLOR[item.urgency] + '20', color: URGENCY_COLOR[item.urgency] }}>
            {URGENCY_LABEL[item.urgency]}
          </span>
          <span>{TREND_ICON[item.trend]} {item.trend}</span>
        </div>
        <p className="pred-advice-text">{item.advice}</p>
        <div className="pred-advice-stats">
          <div className="pred-stat">
            <span className="pred-stat-label">Current Stock</span>
            <span className="pred-stat-val">{item.current_stock} units</span>
          </div>
          <div className="pred-stat">
            <span className="pred-stat-label">Predicted (7d)</span>
            <span className="pred-stat-val" style={{ color: '#6b0f1a', fontWeight: 700 }}>
              {item.predicted_week} orders
            </span>
          </div>
          <div className="pred-stat">
            <span className="pred-stat-label">Days of Stock</span>
            <span className="pred-stat-val">{item.days_of_stock}d</span>
          </div>
          <div className="pred-stat">
            <span className="pred-stat-label">Restock By</span>
            <span className="pred-stat-val" style={{ color: URGENCY_COLOR[item.urgency], fontWeight: 600 }}>
              +{item.restock_qty} units
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function PredictionsPage() {
  const [data, setData]       = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError]     = useState('');
  const [tab, setTab]         = useState('advice');
  const [refreshing, setRefreshing] = useState(false);

  const fetchPredictions = async (refresh = false) => {
    if (refresh) setRefreshing(true);
    else setLoading(true);
    setError('');
    try {
      const url = refresh ? '/predictions?refresh=1' : '/predictions';
      const res = await api.get(url);
      if (res.error) throw new Error(res.error);
      setData(res);
    } catch (err) {
      setError(err.message || 'Failed to load predictions.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => { fetchPredictions(); }, []);

  if (loading) {
    return (
      <div className="spinner-center" style={{ flexDirection: 'column', gap: '1rem' }}>
        <div className="spinner" />
        <p style={{ color: 'var(--muted)', fontSize: '.9rem' }}>
          Training ML model on order history… this may take a moment.
        </p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="pred-error">
        <span style={{ fontSize: '2rem' }}>🤖</span>
        <p>{error}</p>
        <button type="button" className="btn-primary" onClick={() => fetchPredictions()}>Try Again</button>
      </div>
    );
  }

  if (!data) return null;

  const { predictions, top_stock_advice, model_metrics, feature_importance, prediction_dates } = data;

  // Chart data: top 10 predicted items
  const chartData = predictions.slice(0, 10).map(p => ({
    name:     p.name.length > 16 ? p.name.slice(0, 14) + '…' : p.name,
    fullName: p.name,
    predicted:p.predicted_week,
    current:  p.avg_daily_hist * 7,
  }));

  // Daily breakdown for top 3 items
  const trendData = prediction_dates.map((date, i) => {
    const row = { date: date.slice(5) }; // MM-DD
    predictions.slice(0, 3).forEach(p => {
      row[p.name.slice(0, 12)] = p.daily_breakdown[i];
    });
    return row;
  });

  const TOP_3_COLORS = ['#6b0f1a', '#fbbf24', '#10b981'];

  return (
    <div className="predictions-page">

      {/* ── Header ── */}
      <div className="pred-header">
        <div>
          <h2 className="pred-title">🤖 ML Demand Forecasting</h2>
          <p className="pred-subtitle">
            Supervised machine learning · Random Forest + Linear Regression ·
            Predicting next 7 days based on {model_metrics.days_of_history} days of history
          </p>
        </div>
        <button
          type="button"
          className="btn-outline btn-sm"
          onClick={() => fetchPredictions(true)}
          disabled={refreshing}
        >
          {refreshing ? '⟳ Retraining…' : '⟳ Retrain Model'}
        </button>
      </div>

      {/* ── Model metrics ── */}
      <div className="pred-metrics-row">
        <MetricCard icon="🎯" label="Model Accuracy (R²)" value={`${(model_metrics.r2_score * 100).toFixed(1)}%`}  sub="Random Forest" />
        <MetricCard icon="📏" label="Mean Abs. Error"     value={`±${model_metrics.mae} orders`}                  sub="Per prediction" />
        <MetricCard icon="📦" label="Items Analyzed"      value={model_metrics.items_analyzed}                     sub="Menu items" />
        <MetricCard icon="🗓️" label="History Used"        value={`${model_metrics.days_of_history} days`}          sub="Training data" />
        <MetricCard icon="🔢" label="Features Used"       value={model_metrics.features_used}                      sub="ML features" />
      </div>

      {/* ── Tabs ── */}
      <div className="report-tabs" style={{ marginBottom: '1.25rem' }}>
        {[
          { key: 'advice',      label: '📋 Stock Advice'      },
          { key: 'forecast',    label: '📊 Demand Forecast'   },
          { key: 'trends',      label: '📈 7-Day Trend'       },
          { key: 'all',         label: '📝 All Items'         },
          { key: 'model',       label: '🧠 Model Details'     },
        ].map(t => (
          <button key={t.key} type="button"
            className={`queue-tab${tab === t.key ? ' active' : ''}`}
            onClick={() => setTab(t.key)}>
            {t.label}
          </button>
        ))}
      </div>

      {/* ══ STOCK ADVICE TAB ══ */}
      {tab === 'advice' && (
        <div>
          <p style={{ color: 'var(--muted)', fontSize: '.88rem', marginBottom: '1rem' }}>
            Items below are ranked by urgency — how soon they will run out based on predicted demand.
          </p>
          {top_stock_advice.length === 0 ? (
            <div className="empty-state">✅ All items have sufficient stock for the predicted demand!</div>
          ) : (
            <div className="pred-advice-list">
              {top_stock_advice.map((item, i) => (
                <AdviceCard key={item.menu_item_id} item={item} rank={i + 1} />
              ))}
            </div>
          )}
        </div>
      )}

      {/* ══ DEMAND FORECAST TAB ══ */}
      {tab === 'forecast' && (
        <div className="pred-chart-card">
          <h4>Predicted Orders (Next 7 Days) — Top 10 Items</h4>
          <p className="pred-chart-sub">
            Blue = Predicted demand · Orange = Historical average (same 7-day window)
          </p>
          <ResponsiveContainer width="100%" height={320}>
            <BarChart data={chartData} margin={{ bottom: 60 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0e8e0" />
              <XAxis dataKey="name" tick={{ fontSize: 10 }} angle={-35} textAnchor="end" interval={0} />
              <YAxis tick={{ fontSize: 11 }} />
              <Tooltip
                formatter={(v, name) => [v, name === 'predicted' ? 'Predicted (7d)' : 'Historical avg (7d)']}
                labelFormatter={(l, payload) => payload?.[0]?.payload?.fullName || l}
              />
              <Legend verticalAlign="top" />
              <Bar dataKey="predicted" name="Predicted"   fill="#6b0f1a" radius={[4,4,0,0]} />
              <Bar dataKey="current"   name="Historical"  fill="#fbbf24" radius={[4,4,0,0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* ══ 7-DAY TREND TAB ══ */}
      {tab === 'trends' && (
        <div className="pred-chart-card">
          <h4>Daily Demand Forecast — Top 3 Items</h4>
          <p className="pred-chart-sub">Predicted orders per day for the next 7 days</p>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={trendData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0e8e0" />
              <XAxis dataKey="date" tick={{ fontSize: 11 }} />
              <YAxis tick={{ fontSize: 11 }} allowDecimals={false} />
              <Tooltip />
              <Legend />
              {predictions.slice(0, 3).map((p, i) => (
                <Line
                  key={p.menu_item_id}
                  type="monotone"
                  dataKey={p.name.slice(0, 12)}
                  stroke={TOP_3_COLORS[i]}
                  strokeWidth={2}
                  dot={{ r: 4 }}
                />
              ))}
            </LineChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* ══ ALL ITEMS TAB ══ */}
      {tab === 'all' && (
        <div className="pred-chart-card" style={{ padding: 0, overflow: 'hidden' }}>
          <table className="data-table">
            <thead>
              <tr>
                <th>#</th>
                <th>Item</th>
                <th>Category</th>
                <th>Predicted (7d)</th>
                <th>Avg/Day</th>
                <th>Stock</th>
                <th>Days Left</th>
                <th>Trend</th>
                <th>Urgency</th>
                <th>Restock</th>
              </tr>
            </thead>
            <tbody>
              {predictions.map((item, i) => (
                <tr key={item.menu_item_id} className={item.urgency === 'critical' ? 'row-warn' : ''}>
                  <td>{i + 1}</td>
                  <td><strong>{item.name}</strong></td>
                  <td>{item.category}</td>
                  <td style={{ color: '#6b0f1a', fontWeight: 700 }}>{item.predicted_week}</td>
                  <td>{item.avg_daily_pred}</td>
                  <td>{item.current_stock}</td>
                  <td>{item.days_of_stock}d</td>
                  <td>{TREND_ICON[item.trend]} {item.trend}</td>
                  <td>
                    <span className="pred-urgency-badge"
                      style={{ background: URGENCY_COLOR[item.urgency] + '20', color: URGENCY_COLOR[item.urgency] }}>
                      {item.urgency}
                    </span>
                  </td>
                  <td style={{ color: URGENCY_COLOR[item.urgency], fontWeight: 600 }}>
                    {item.restock_qty > 0 ? `+${item.restock_qty}` : '—'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* ══ MODEL DETAILS TAB ══ */}
      {tab === 'model' && (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.25rem' }}>
          <div className="pred-chart-card">
            <h4>Algorithm Details</h4>
            <table className="data-table" style={{ marginTop: '.5rem' }}>
              <tbody>
                <tr><td><strong>Primary Model</strong></td><td>Random Forest Regressor</td></tr>
                <tr><td><strong>Support Model</strong></td><td>Linear Regression (trend)</td></tr>
                <tr><td><strong>Task Type</strong></td><td>Supervised Regression</td></tr>
                <tr><td><strong>Trees (RF)</strong></td><td>150 estimators</td></tr>
                <tr><td><strong>Max Depth</strong></td><td>10 levels</td></tr>
                <tr><td><strong>Training Samples</strong></td><td>{model_metrics.training_samples}</td></tr>
                <tr><td><strong>Test Samples</strong></td><td>{model_metrics.test_samples}</td></tr>
                <tr><td><strong>R² Score</strong></td><td>{model_metrics.r2_score} ({(model_metrics.r2_score * 100).toFixed(1)}%)</td></tr>
                <tr><td><strong>Mean Abs. Error</strong></td><td>±{model_metrics.mae} orders</td></tr>
                <tr><td><strong>Generated</strong></td><td>{new Date(data.generated_at).toLocaleString()}</td></tr>
              </tbody>
            </table>
          </div>

          <div className="pred-chart-card">
            <h4>Top Feature Importances</h4>
            <p className="pred-chart-sub">Which signals matter most to the model</p>
            <div style={{ marginTop: '.75rem', display: 'flex', flexDirection: 'column', gap: '.5rem' }}>
              {feature_importance.map((f, i) => (
                <div key={f.feature} style={{ display: 'flex', alignItems: 'center', gap: '.5rem' }}>
                  <span style={{ fontSize: '.78rem', color: 'var(--muted)', width: 140, flexShrink: 0 }}>{f.feature}</span>
                  <div style={{ flex: 1, background: 'var(--border)', borderRadius: 4, height: 14, overflow: 'hidden' }}>
                    <div style={{
                      width: `${(f.importance / feature_importance[0].importance) * 100}%`,
                      height: '100%',
                      background: i === 0 ? '#6b0f1a' : i === 1 ? '#fbbf24' : '#9ca3af',
                      borderRadius: 4,
                    }} />
                  </div>
                  <span style={{ fontSize: '.75rem', color: 'var(--muted)', width: 40, textAlign: 'right' }}>
                    {(f.importance * 100).toFixed(1)}%
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
