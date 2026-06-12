/**
 * PredictionsPage.jsx — ML Demand Forecasting Dashboard
 *
 * Displays results from two supervised ML models:
 *   1. Random Forest Regressor  — predicts exact order quantities
 *   2. Logistic Regression      — classifies demand tier (LOW/MEDIUM/HIGH/VERY_HIGH)
 *
 * Features:
 *   - KPI cards (R², MAE, accuracy, items analyzed)
 *   - Stock Advice tab with urgency-ranked restock recommendations
 *   - Demand Forecast tab (bar chart: RF predicted vs historical)
 *   - 7-Day Trend tab (area chart per top 5 items)
 *   - All Items table with both RF and LR results
 *   - Model Info tab with feature importances and algorithm details
 *   - CSV export on every tab + Export All button
 */
import { useState, useEffect } from 'react';
import { api } from '../../services/api.js';
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
  CartesianGrid, Legend, AreaChart, Area,
} from 'recharts';

// ── Constants ─────────────────────────────────────────────────────────────────
const URGENCY = {
  critical: { color: '#ef4444', bg: '#fef2f2', label: 'Critical', icon: '🔴' },
  high:     { color: '#f97316', bg: '#fff7ed', label: 'High',     icon: '🟠' },
  medium:   { color: '#eab308', bg: '#fefce8', label: 'Medium',   icon: '🟡' },
  low:      { color: '#22c55e', bg: '#f0fdf4', label: 'Good',     icon: '🟢' },
};

const LR_COLORS = {
  LOW:       '#94a3b8',
  MEDIUM:    '#3b82f6',
  HIGH:      '#f97316',
  VERY_HIGH: '#ef4444',
};

const TREND_COLOR = { rising: '#22c55e', declining: '#ef4444', stable: '#94a3b8' };
const TREND_ICON  = { rising: '↑', declining: '↓', stable: '→' };
const TOP_COLORS  = ['#6b0f1a', '#fbbf24', '#10b981', '#8b5cf6', '#3b82f6'];


// ── CSV export helpers ────────────────────────────────────────────────────────
function escapeCell(val) {
  const s = String(val ?? '');
  return s.includes(',') || s.includes('"') || s.includes('\n')
    ? `"${s.replace(/"/g, '""')}"` : s;
}

function downloadCSV(filename, rows2d) {
  const csv  = rows2d.map(r => r.map(escapeCell).join(',')).join('\n');
  const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8;' });
  const url  = URL.createObjectURL(blob);
  const a    = Object.assign(document.createElement('a'), { href: url, download: filename });
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

function exportAllPredictions(predictions, dates) {
  const ts = new Date().toISOString().slice(0, 10);
  const header = [
    'Rank','Item','Category','Price',
    'RF Predicted (7d)','RF Avg/Day','Historical Avg/Day',
    'LR Demand Category','LR Confidence %',
    'Current Stock','Days of Stock','Restock Qty','Urgency','Trend','Advice',
    ...dates.map(d => `Forecast ${d}`),
  ];
  const rows = predictions.map((p, i) => [
    i + 1, p.name, p.category, p.price,
    p.predicted_week, p.avg_daily_pred, p.avg_daily_hist,
    p.lr_demand_category, `${((p.lr_confidence || 0) * 100).toFixed(0)}%`,
    p.current_stock, p.days_of_stock, p.restock_qty, p.urgency, p.trend, p.advice,
    ...p.daily_breakdown,
  ]);
  downloadCSV(`ml_all_predictions_${ts}.csv`, [header, ...rows]);
}

function exportStockAdvice(items) {
  const ts = new Date().toISOString().slice(0, 10);
  const header = ['Priority','Item','Category','Urgency','RF Predicted (7d)',
    'LR Category','LR Confidence %','Current Stock','Days Left','Restock Qty','Advice'];
  const rows = items.map((p, i) => [
    i + 1, p.name, p.category, p.urgency.toUpperCase(),
    p.predicted_week, p.lr_demand_category || '—',
    `${((p.lr_confidence || 0) * 100).toFixed(0)}%`,
    p.current_stock, p.days_of_stock, p.restock_qty, p.advice,
  ]);
  downloadCSV(`ml_stock_advice_${ts}.csv`, [header, ...rows]);
}

function exportModelInfo(metrics, importances) {
  const ts = new Date().toISOString().slice(0, 10);
  const rows = [
    ['=== RANDOM FOREST (Regression) ==='],
    ['Algorithm', metrics.rf_algorithm],
    ['Task', metrics.rf_task],
    ['R² Score', metrics.rf_r2],
    ['Mean Absolute Error', `±${metrics.rf_mae} orders`],
    ['Trees', metrics.rf_trees],
    [],
    ['=== LOGISTIC REGRESSION (Classification) ==='],
    ['Algorithm', metrics.lr_algorithm],
    ['Task', metrics.lr_task],
    ['Accuracy', `${(metrics.lr_accuracy * 100).toFixed(1)}%`],
    ['Classes', (metrics.lr_classes || []).join(' / ')],
    [],
    ['=== TRAINING INFO ==='],
    ['Training Samples', metrics.training_samples],
    ['Test Samples', metrics.test_samples],
    ['Features Used', metrics.features_used],
    ['Items Analyzed', metrics.items_analyzed],
    ['Days of History', metrics.days_of_history],
    [],
    ['=== FEATURE IMPORTANCES (Random Forest) ==='],
    ['Feature', 'Importance Score', 'Importance %'],
    ...importances.map(f => [f.feature, f.importance, `${(f.importance * 100).toFixed(2)}%`]),
  ];
  downloadCSV(`ml_model_info_${ts}.csv`, rows);
}


// ── Reusable UI components ────────────────────────────────────────────────────

/** Loading skeleton placeholder */
function Skeleton({ h = 20, r = 8 }) {
  return (
    <div style={{
      height: h, borderRadius: r,
      background: 'linear-gradient(90deg,#f0e8e0 25%,#e8dfd6 50%,#f0e8e0 75%)',
      backgroundSize: '400px 100%', animation: 'shimmer 1.4s ease infinite',
    }} />
  );
}

/** KPI stat card at the top of the dashboard */
function KpiCard({ icon, label, value, sub, accent = '#6b0f1a' }) {
  return (
    <div style={{
      background: '#fff', borderRadius: 16, padding: '1.25rem 1.4rem',
      boxShadow: '0 1px 3px rgba(0,0,0,.06), 0 8px 24px rgba(0,0,0,.04)',
      borderTop: `4px solid ${accent}`,
      display: 'flex', alignItems: 'center', gap: '1rem',
    }}>
      <div style={{
        width: 48, height: 48, borderRadius: 12, background: accent + '15',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontSize: '1.4rem', flexShrink: 0,
      }}>{icon}</div>
      <div>
        <div style={{ fontSize: '1.3rem', fontWeight: 800, lineHeight: 1.1, color: '#1c1b18' }}>{value}</div>
        <div style={{ fontSize: '.75rem', fontWeight: 600, color: '#7a7870', marginTop: 2 }}>{label}</div>
        {sub && <div style={{ fontSize: '.7rem', color: '#aaa', marginTop: 1 }}>{sub}</div>}
      </div>
    </div>
  );
}

/** Export CSV button */
function ExportBtn({ label, onClick }) {
  const [hovered, setHovered] = useState(false);
  return (
    <button type="button" onClick={onClick}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        display: 'flex', alignItems: 'center', gap: '.35rem',
        background: hovered ? '#6b0f1a' : '#f0ede6',
        color: hovered ? '#fff' : '#6b0f1a',
        border: '1px solid #d1cfc7', borderRadius: 8,
        padding: '.38rem .85rem', fontSize: '.78rem',
        fontWeight: 700, cursor: 'pointer', whiteSpace: 'nowrap',
        transition: 'all .15s',
      }}>
      ⬇ {label}
    </button>
  );
}

/** Card wrapper for charts and tables */
function Card({ title, sub, action, children }) {
  return (
    <div style={{
      background: '#fff', borderRadius: 16, padding: '1.25rem',
      boxShadow: '0 1px 3px rgba(0,0,0,.06), 0 4px 16px rgba(0,0,0,.04)',
    }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '.85rem' }}>
        <div>
          <div style={{ fontWeight: 700, fontSize: '.95rem', color: '#1c1b18' }}>{title}</div>
          {sub && <div style={{ fontSize: '.75rem', color: '#7a7870', marginTop: 2 }}>{sub}</div>}
        </div>
        {action && <div style={{ flexShrink: 0, marginLeft: '1rem' }}>{action}</div>}
      </div>
      {children}
    </div>
  );
}

/** Custom recharts tooltip */
const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <div style={{
      background: '#fff', border: '1px solid #e5e3de', borderRadius: 10,
      padding: '.6rem .9rem', boxShadow: '0 4px 16px rgba(0,0,0,.1)', fontSize: '.8rem',
    }}>
      <div style={{ fontWeight: 700, marginBottom: 4, color: '#1c1b18' }}>{label}</div>
      {payload.map((p, i) => (
        <div key={i} style={{ display: 'flex', gap: '.5rem', alignItems: 'center', marginTop: 2 }}>
          <div style={{ width: 8, height: 8, borderRadius: '50%', background: p.color }} />
          <span style={{ color: '#7a7870' }}>{p.name}:</span>
          <span style={{ fontWeight: 600, color: '#1c1b18' }}>{p.value}</span>
        </div>
      ))}
    </div>
  );
};

/** Stock advice card for a single item */
function AdviceCard({ item, rank }) {
  const u   = URGENCY[item.urgency] || URGENCY.low;
  const pct = Math.min(100, Math.round((item.current_stock / Math.max(item.predicted_week, 1)) * 100));
  const lrColor = LR_COLORS[item.lr_demand_category] || '#94a3b8';

  return (
    <div style={{
      background: '#fff', borderRadius: 16, overflow: 'hidden',
      boxShadow: '0 1px 3px rgba(0,0,0,.06), 0 4px 16px rgba(0,0,0,.04)',
      border: `1px solid ${u.color}30`,
    }}>
      {/* Card header with urgency color */}
      <div style={{
        background: `linear-gradient(135deg,${u.color}18,${u.color}06)`,
        borderBottom: `2px solid ${u.color}30`,
        padding: '1rem 1.25rem',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '.75rem' }}>
          <div style={{
            width: 32, height: 32, borderRadius: '50%', background: u.color,
            color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: '.85rem', fontWeight: 800, flexShrink: 0,
          }}>#{rank}</div>
          <div>
            <div style={{ fontWeight: 700, fontSize: '.95rem', color: '#1c1b18' }}>{item.name}</div>
            <div style={{ fontSize: '.72rem', color: '#7a7870' }}>{item.category}</div>
          </div>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 4 }}>
          {/* Urgency badge */}
          <span style={{
            background: u.color, color: '#fff', padding: '.2rem .65rem',
            borderRadius: 20, fontSize: '.72rem', fontWeight: 700,
          }}>{u.icon} {u.label}</span>
          {/* LR demand category badge */}
          {item.lr_demand_category && (
            <span style={{
              background: lrColor + '20', color: lrColor, border: `1px solid ${lrColor}40`,
              padding: '.15rem .55rem', borderRadius: 20, fontSize: '.7rem', fontWeight: 700,
            }}>
              LR: {item.lr_demand_category} {item.lr_confidence ? `(${(item.lr_confidence * 100).toFixed(0)}%)` : ''}
            </span>
          )}
          <span style={{ fontSize: '.75rem', color: TREND_COLOR[item.trend], fontWeight: 600 }}>
            {TREND_ICON[item.trend]} {item.trend}
          </span>
        </div>
      </div>

      {/* Card body */}
      <div style={{ padding: '1rem 1.25rem' }}>
        {/* Stock progress bar */}
        <div style={{ marginBottom: '.85rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '.72rem', color: '#7a7870', marginBottom: 4 }}>
            <span>Current stock vs predicted demand</span>
            <span style={{ fontWeight: 600, color: pct < 50 ? u.color : '#22c55e' }}>{pct}%</span>
          </div>
          <div style={{ height: 8, background: '#f3f0eb', borderRadius: 4, overflow: 'hidden' }}>
            <div style={{
              height: '100%', width: `${pct}%`,
              background: pct < 30 ? '#ef4444' : pct < 70 ? '#f97316' : '#22c55e',
              borderRadius: 4,
            }} />
          </div>
        </div>

        {/* Stats grid */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: '.5rem', marginBottom: '.85rem' }}>
          {[
            { label: 'Current Stock', val: `${item.current_stock}`, unit: 'units' },
            { label: 'RF Predicted',  val: `${item.predicted_week}`, unit: '7-day orders', hl: true },
            { label: 'Days of Stock', val: item.days_of_stock > 99 ? '99+' : `${item.days_of_stock}`, unit: 'days' },
            { label: 'Restock By',    val: `+${item.restock_qty}`, unit: 'units', col: u.color },
          ].map(s => (
            <div key={s.label} style={{ background: '#f9f8f5', borderRadius: 10, padding: '.6rem .5rem', textAlign: 'center' }}>
              <div style={{ fontSize: '1rem', fontWeight: 800, color: s.col || (s.hl ? '#6b0f1a' : '#1c1b18') }}>{s.val}</div>
              <div style={{ fontSize: '.62rem', color: '#aaa', marginTop: 1 }}>{s.unit}</div>
              <div style={{ fontSize: '.65rem', color: '#7a7870', marginTop: 2 }}>{s.label}</div>
            </div>
          ))}
        </div>

        {/* Advice text */}
        <div style={{
          background: u.bg, border: `1px solid ${u.color}25`,
          borderRadius: 10, padding: '.65rem .85rem', fontSize: '.8rem', lineHeight: 1.5,
        }}>
          💡 {item.advice}
        </div>
      </div>
    </div>
  );
}


// ── Main page component ───────────────────────────────────────────────────────
export default function PredictionsPage() {
  const [data, setData]             = useState(null);
  const [loading, setLoading]       = useState(true);
  const [error, setError]           = useState('');
  const [tab, setTab]               = useState('advice');
  const [refreshing, setRefreshing] = useState(false);

  /** Fetch predictions from the Laravel API (which calls predict.py) */
  const fetchPredictions = async (refresh = false) => {
    if (refresh) setRefreshing(true);
    else setLoading(true);
    setError('');
    try {
      const res = await api.get(refresh ? '/predictions?refresh=1' : '/predictions');
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

  // ── Loading state ────────────────────────────────────────────────────────
  if (loading) return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      <style>{`@keyframes shimmer{0%{background-position:-400px 0}100%{background-position:400px 0}}`}</style>
      <Skeleton h={110} r={20} />
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5,1fr)', gap: '1rem' }}>
        {[...Array(5)].map((_, i) => <Skeleton key={i} h={90} r={16} />)}
      </div>
      <Skeleton h={300} r={16} />
      {[...Array(3)].map((_, i) => <Skeleton key={i} h={150} r={16} />)}
      <p style={{ textAlign: 'center', color: '#7a7870', fontSize: '.85rem' }}>
        🤖 Training Random Forest + Logistic Regression on your order history…
      </p>
    </div>
  );

  // ── Error state ──────────────────────────────────────────────────────────
  if (error) return (
    <div style={{
      background: '#fff', borderRadius: 20, padding: '3rem',
      textAlign: 'center', boxShadow: '0 4px 24px rgba(0,0,0,.06)',
    }}>
      <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>🤖</div>
      <div style={{ fontWeight: 700, marginBottom: '.5rem' }}>Prediction Failed</div>
      <div style={{ color: '#7a7870', fontSize: '.85rem', maxWidth: 400, margin: '0 auto .75rem' }}>{error}</div>
      <button type="button" onClick={() => fetchPredictions()} style={{
        background: '#6b0f1a', color: '#fff', border: 'none',
        borderRadius: 10, padding: '.65rem 1.5rem', fontWeight: 600, cursor: 'pointer',
      }}>Try Again</button>
    </div>
  );

  if (!data) return null;

  const { predictions, top_stock_advice, model_metrics, feature_importance, prediction_dates, demand_distribution } = data;

  // Build chart data for top 10 items
  const chartData = predictions.slice(0, 10).map(p => ({
    name:       p.name.length > 14 ? p.name.slice(0, 12) + '…' : p.name,
    fullName:   p.name,
    predicted:  p.predicted_week,
    historical: Math.round((p.avg_daily_hist || 0) * 7),
  }));

  // Build trend data: one row per future date, one column per top 5 item
  const trendData = (prediction_dates || []).map((date, i) => {
    const row = { date: date.slice(5) };
    predictions.slice(0, 5).forEach(p => {
      const key = p.name.length > 12 ? p.name.slice(0, 10) + '…' : p.name;
      row[key] = (p.daily_breakdown || [])[i] || 0;
    });
    return row;
  });

  const TABS = [
    { key: 'advice',   label: '📋 Stock Advice'   },
    { key: 'forecast', label: '📊 RF Forecast'     },
    { key: 'trends',   label: '📈 7-Day Trend'     },
    { key: 'all',      label: '📝 All Items'       },
    { key: 'model',    label: '🧠 Model Info'      },
  ];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      <style>{`@keyframes shimmer{0%{background-position:-400px 0}100%{background-position:400px 0}}`}</style>

      {/* ── Page header ── */}
      <div style={{
        background: 'linear-gradient(135deg,#6b0f1a,#9b1428)',
        borderRadius: 20, padding: '1.5rem 2rem', color: '#fff',
        display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem',
      }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '.6rem', marginBottom: '.3rem' }}>
            <span style={{ fontSize: '1.6rem' }}>🤖</span>
            <h2 style={{ margin: 0, fontSize: '1.3rem', fontWeight: 800 }}>ML Demand Forecasting</h2>
          </div>
          <p style={{ margin: 0, fontSize: '.8rem', color: 'rgba(255,255,255,.7)', lineHeight: 1.5 }}>
            Random Forest Regressor + Logistic Regression ·
            {model_metrics.days_of_history} days of history ·
            {model_metrics.items_analyzed} items · Next 7 days forecast
          </p>
        </div>
        <div style={{ display: 'flex', gap: '.65rem', flexWrap: 'wrap' }}>
          <ExportBtn label="Export All CSVs" onClick={() => {
            const ts = new Date().toISOString().slice(0, 10);
            exportAllPredictions(predictions, prediction_dates);
            setTimeout(() => exportStockAdvice(top_stock_advice), 400);
            setTimeout(() => exportModelInfo(model_metrics, feature_importance), 800);
          }} />
          <button type="button" onClick={() => fetchPredictions(true)} disabled={refreshing} style={{
            background: 'rgba(255,255,255,.15)', color: '#fff',
            border: '1px solid rgba(255,255,255,.3)', borderRadius: 10,
            padding: '.55rem 1.1rem', fontWeight: 600, cursor: 'pointer', fontSize: '.82rem',
          }}>{refreshing ? '⟳ Retraining…' : '⟳ Retrain Model'}</button>
        </div>
      </div>

      {/* ── KPI cards ── */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(155px,1fr))', gap: '1rem' }}>
        <KpiCard icon="🌲" label="RF Accuracy (R²)"    value={`${(model_metrics.rf_r2 * 100).toFixed(1)}%`}       sub="Random Forest"         accent="#6b0f1a" />
        <KpiCard icon="📏" label="RF Mean Abs. Error"  value={`±${model_metrics.rf_mae}`}                         sub="Orders per day"         accent="#fbbf24" />
        <KpiCard icon="📊" label="LR Accuracy"         value={`${(model_metrics.lr_accuracy * 100).toFixed(1)}%`} sub="Logistic Regression"    accent="#6b0f1a" />
        <KpiCard icon="📦" label="Items Analyzed"      value={model_metrics.items_analyzed}                       sub="Menu items"              accent="#fbbf24" />
        <KpiCard icon="⚠️" label="Need Restocking"     value={top_stock_advice.length}                            sub="Urgent items"            accent={top_stock_advice.length > 0 ? '#ef4444' : '#22c55e'} />
      </div>

      {/* ── LR Demand distribution summary ── */}
      {demand_distribution && (
        <div style={{
          background: '#fff', borderRadius: 14, padding: '1rem 1.25rem',
          boxShadow: '0 1px 3px rgba(0,0,0,.06)',
          display: 'flex', alignItems: 'center', gap: '1.5rem', flexWrap: 'wrap',
        }}>
          <span style={{ fontSize: '.8rem', fontWeight: 700, color: '#7a7870' }}>🧮 LR Demand Distribution:</span>
          {Object.entries(demand_distribution).map(([cat, count]) => (
            <div key={cat} style={{ display: 'flex', alignItems: 'center', gap: '.4rem' }}>
              <div style={{ width: 10, height: 10, borderRadius: '50%', background: LR_COLORS[cat] || '#94a3b8' }} />
              <span style={{ fontSize: '.82rem', fontWeight: 600, color: LR_COLORS[cat] || '#94a3b8' }}>{cat}</span>
              <span style={{ fontSize: '.82rem', color: '#7a7870' }}>{count} item{count > 1 ? 's' : ''}</span>
            </div>
          ))}
        </div>
      )}

      {/* ── Tab navigation ── */}
      <div style={{ display: 'flex', gap: '.4rem', flexWrap: 'wrap' }}>
        {TABS.map(t => (
          <button key={t.key} type="button" onClick={() => setTab(t.key)} style={{
            padding: '.45rem 1rem', borderRadius: 20, border: 'none',
            background: tab === t.key ? '#6b0f1a' : '#f0ede6',
            color: tab === t.key ? '#fff' : '#7a7870',
            fontWeight: tab === t.key ? 700 : 500,
            cursor: 'pointer', fontSize: '.82rem', transition: 'all .15s',
          }}>{t.label}</button>
        ))}
      </div>


      {/* ══ TAB: STOCK ADVICE ══ */}
      {tab === 'advice' && (
        top_stock_advice.length === 0 ? (
          <div style={{ background: '#f0fdf4', border: '1px solid #86efac', borderRadius: 16, padding: '2.5rem', textAlign: 'center' }}>
            <div style={{ fontSize: '2.5rem', marginBottom: '.5rem' }}>✅</div>
            <div style={{ fontWeight: 700, color: '#166534' }}>All items have sufficient stock!</div>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <p style={{ color: '#7a7870', fontSize: '.85rem', margin: 0 }}>
                {top_stock_advice.length} item{top_stock_advice.length > 1 ? 's' : ''} flagged — ranked by urgency using both RF and LR predictions
              </p>
              <ExportBtn label="Export Advice" onClick={() => exportStockAdvice(top_stock_advice)} />
            </div>
            {top_stock_advice.map((item, i) => <AdviceCard key={item.menu_item_id} item={item} rank={i + 1} />)}
          </div>
        )
      )}


      {/* ══ TAB: RF DEMAND FORECAST ══ */}
      {tab === 'forecast' && (
        <Card
          title="Random Forest — Predicted vs Historical Demand (Top 10)"
          sub="Blue = RF predicted orders next 7 days · Yellow = historical 7-day average"
          action={<ExportBtn label="Export CSV" onClick={() => {
            const ts = new Date().toISOString().slice(0, 10);
            const header = ['Rank','Item','Category','RF Predicted (7d)','Historical (7d)','Difference'];
            const rows = chartData.map((r, i) => [
              i+1, r.fullName, predictions[i]?.category || '',
              r.predicted, r.historical, r.predicted - r.historical,
            ]);
            downloadCSV(`ml_rf_forecast_${ts}.csv`, [header, ...rows]);
          }} />}
        >
          <ResponsiveContainer width="100%" height={320}>
            <BarChart data={chartData} margin={{ bottom: 60 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0e8e0" vertical={false} />
              <XAxis dataKey="name" tick={{ fontSize: 10, fill: '#7a7870' }} angle={-35} textAnchor="end" interval={0} />
              <YAxis tick={{ fontSize: 11, fill: '#7a7870' }} axisLine={false} tickLine={false} />
              <Tooltip content={<CustomTooltip />} />
              <Legend verticalAlign="top" wrapperStyle={{ fontSize: '.8rem', paddingBottom: '1rem' }} />
              <Bar dataKey="predicted"   name="RF Predicted (7d)"  fill="#6b0f1a" radius={[6,6,0,0]} maxBarSize={40} />
              <Bar dataKey="historical"  name="Historical avg (7d)" fill="#fbbf24" radius={[6,6,0,0]} maxBarSize={40} />
            </BarChart>
          </ResponsiveContainer>
        </Card>
      )}


      {/* ══ TAB: 7-DAY TREND ══ */}
      {tab === 'trends' && (
        <Card
          title="Random Forest — Daily Demand Forecast (Top 5 Items)"
          sub={`Predicted orders per day: ${prediction_dates[0]?.slice(5)} → ${prediction_dates[6]?.slice(5)}`}
          action={<ExportBtn label="Export CSV" onClick={() => {
            const ts = new Date().toISOString().slice(0, 10);
            const itemNames = predictions.slice(0,5).map(p => p.name.length > 12 ? p.name.slice(0,10)+'…' : p.name);
            const header = ['Date', ...itemNames];
            const rows = trendData.map(r => [r.date, ...itemNames.map(n => r[n] ?? 0)]);
            downloadCSV(`ml_daily_trend_${ts}.csv`, [header, ...rows]);
          }} />}
        >
          <ResponsiveContainer width="100%" height={300}>
            <AreaChart data={trendData}>
              <defs>
                {predictions.slice(0,5).map((p,i) => (
                  <linearGradient key={i} id={`g${i}`} x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%"  stopColor={TOP_COLORS[i]} stopOpacity={0.2} />
                    <stop offset="95%" stopColor={TOP_COLORS[i]} stopOpacity={0}   />
                  </linearGradient>
                ))}
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0e8e0" vertical={false} />
              <XAxis dataKey="date" tick={{ fontSize: 11, fill: '#7a7870' }} axisLine={false} />
              <YAxis tick={{ fontSize: 11, fill: '#7a7870' }} axisLine={false} tickLine={false} allowDecimals={false} />
              <Tooltip content={<CustomTooltip />} />
              <Legend wrapperStyle={{ fontSize: '.8rem' }} />
              {predictions.slice(0,5).map((p,i) => (
                <Area key={p.menu_item_id} type="monotone"
                  dataKey={p.name.length > 12 ? p.name.slice(0,10)+'…' : p.name}
                  stroke={TOP_COLORS[i]} fill={`url(#g${i})`} strokeWidth={2}
                  dot={{ r: 4, fill: TOP_COLORS[i], strokeWidth: 0 }}
                />
              ))}
            </AreaChart>
          </ResponsiveContainer>
        </Card>
      )}


      {/* ══ TAB: ALL ITEMS ══ */}
      {tab === 'all' && (
        <div style={{ background: '#fff', borderRadius: 16, overflow: 'hidden', boxShadow: '0 1px 3px rgba(0,0,0,.06), 0 4px 16px rgba(0,0,0,.04)' }}>
          <div style={{ padding: '1.1rem 1.25rem', borderBottom: '1px solid #f0ede6', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <div style={{ fontWeight: 700, fontSize: '.95rem' }}>All Items — RF + LR Results</div>
              <div style={{ fontSize: '.75rem', color: '#7a7870', marginTop: 2 }}>{predictions.length} items · RF predicts quantity · LR predicts demand tier</div>
            </div>
            <ExportBtn label="Export All Items" onClick={() => exportAllPredictions(predictions, prediction_dates)} />
          </div>
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ background: '#fdf8f0' }}>
                  {['#','Item','Category','RF Predicted (7d)','LR Category','LR Confidence','Stock','Days Left','Trend','Urgency','Restock'].map(h => (
                    <th key={h} style={{ padding: '.65rem 1rem', textAlign: 'left', fontSize: '.75rem', fontWeight: 700, color: '#7a7870', borderBottom: '1px solid #f0ede6', whiteSpace: 'nowrap' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {predictions.map((item, i) => {
                  const u  = URGENCY[item.urgency] || URGENCY.low;
                  const lc = LR_COLORS[item.lr_demand_category] || '#94a3b8';
                  return (
                    <tr key={item.menu_item_id} style={{ background: i%2===0?'#fff':'#fdf8f0', borderBottom: '1px solid #f0ede6' }}>
                      <td style={{ padding: '.6rem 1rem', fontSize: '.82rem', color: '#7a7870', fontWeight: 600 }}>{i+1}</td>
                      <td style={{ padding: '.6rem 1rem', fontWeight: 700, fontSize: '.85rem' }}>{item.name}</td>
                      <td style={{ padding: '.6rem 1rem', fontSize: '.82rem', color: '#7a7870' }}>{item.category}</td>
                      <td style={{ padding: '.6rem 1rem', fontWeight: 800, color: '#6b0f1a', fontSize: '.9rem' }}>{item.predicted_week}</td>
                      <td style={{ padding: '.6rem 1rem' }}>
                        {item.lr_demand_category ? (
                          <span style={{ background: lc + '20', color: lc, border: `1px solid ${lc}40`, padding: '.15rem .5rem', borderRadius: 20, fontSize: '.75rem', fontWeight: 700 }}>
                            {item.lr_demand_category}
                          </span>
                        ) : '—'}
                      </td>
                      <td style={{ padding: '.6rem 1rem', fontSize: '.82rem', color: '#7a7870' }}>
                        {item.lr_confidence ? `${(item.lr_confidence * 100).toFixed(0)}%` : '—'}
                      </td>
                      <td style={{ padding: '.6rem 1rem', fontSize: '.82rem' }}>{item.current_stock}</td>
                      <td style={{ padding: '.6rem 1rem', fontSize: '.82rem' }}>{item.days_of_stock}d</td>
                      <td style={{ padding: '.6rem 1rem', fontSize: '.85rem', color: TREND_COLOR[item.trend], fontWeight: 700 }}>
                        {TREND_ICON[item.trend]} {item.trend}
                      </td>
                      <td style={{ padding: '.6rem 1rem' }}>
                        <span style={{ background: u.color, color: '#fff', padding: '.18rem .55rem', borderRadius: 20, fontSize: '.7rem', fontWeight: 700 }}>{u.label}</span>
                      </td>
                      <td style={{ padding: '.6rem 1rem', fontWeight: 700, color: item.restock_qty > 0 ? u.color : '#22c55e', fontSize: '.85rem' }}>
                        {item.restock_qty > 0 ? `+${item.restock_qty}` : '—'}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}


      {/* ══ TAB: MODEL INFO ══ */}
      {tab === 'model' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
            <ExportBtn label="Export Model Info" onClick={() => exportModelInfo(model_metrics, feature_importance)} />
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.25rem' }}>

            {/* RF details */}
            <Card title="🌲 Random Forest — Regression Model" sub="Predicts exact order quantities">
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '.85rem', marginTop: '.5rem' }}>
                <tbody>
                  {[
                    ['Task',             'Supervised Regression'],
                    ['Output',           'Predicted order count (numeric)'],
                    ['Trees',            `${model_metrics.rf_trees} estimators`],
                    ['Max Depth',        '10 levels'],
                    ['R² Score',         `${model_metrics.rf_r2} (${(model_metrics.rf_r2*100).toFixed(1)}%)`],
                    ['Mean Abs. Error',  `±${model_metrics.rf_mae} orders`],
                    ['Training Samples', model_metrics.training_samples],
                    ['Test Samples',     model_metrics.test_samples],
                  ].map(([k,v]) => (
                    <tr key={k} style={{ borderBottom: '1px solid #f0ede6' }}>
                      <td style={{ padding: '.5rem .75rem', color: '#7a7870', fontWeight: 600 }}>{k}</td>
                      <td style={{ padding: '.5rem .75rem', fontWeight: 700, color: '#1c1b18' }}>{v}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </Card>

            {/* LR details */}
            <Card title="📊 Logistic Regression — Classification Model" sub="Classifies demand into tiers">
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '.85rem', marginTop: '.5rem' }}>
                <tbody>
                  {[
                    ['Task',       'Supervised Classification'],
                    ['Output',     'Demand tier label + confidence %'],
                    ['Classes',    (model_metrics.lr_classes || []).join(' / ')],
                    ['Solver',     'L-BFGS (multiclass)'],
                    ['Accuracy',   `${(model_metrics.lr_accuracy * 100).toFixed(1)}%`],
                    ['Features',   `${model_metrics.features_used} (scaled via StandardScaler)`],
                    ['Max Iter',   '2000'],
                    ['C (regularization)', '1.0 (balanced)'],
                  ].map(([k,v]) => (
                    <tr key={k} style={{ borderBottom: '1px solid #f0ede6' }}>
                      <td style={{ padding: '.5rem .75rem', color: '#7a7870', fontWeight: 600 }}>{k}</td>
                      <td style={{ padding: '.5rem .75rem', fontWeight: 700, color: '#1c1b18' }}>{v}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </Card>

            {/* Feature importances (RF) */}
            <Card title="🔍 Top Feature Importances (Random Forest)" sub="Which signals the RF model relies on most">
              <div style={{ display: 'flex', flexDirection: 'column', gap: '.65rem', marginTop: '.5rem' }}>
                {(feature_importance || []).map((f, i) => (
                  <div key={f.feature}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '.75rem', marginBottom: 4 }}>
                      <span style={{ fontWeight: 600, color: '#1c1b18' }}>{f.feature}</span>
                      <span style={{ color: '#7a7870' }}>{(f.importance * 100).toFixed(1)}%</span>
                    </div>
                    <div style={{ height: 8, background: '#f0ede6', borderRadius: 4, overflow: 'hidden' }}>
                      <div style={{
                        height: '100%',
                        width: `${(f.importance / (feature_importance[0]?.importance || 1)) * 100}%`,
                        background: i === 0 ? '#6b0f1a' : i === 1 ? '#fbbf24' : i === 2 ? '#10b981' : '#94a3b8',
                        borderRadius: 4,
                      }} />
                    </div>
                  </div>
                ))}
              </div>
            </Card>

            {/* LR demand distribution */}
            <Card title="📈 LR Demand Distribution" sub="How items are classified across demand tiers">
              <div style={{ display: 'flex', flexDirection: 'column', gap: '.75rem', marginTop: '.75rem' }}>
                {Object.entries(demand_distribution || {}).map(([cat, count]) => {
                  const total = Object.values(demand_distribution).reduce((a, b) => a + b, 0);
                  const pct   = Math.round((count / total) * 100);
                  return (
                    <div key={cat}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '.8rem', marginBottom: 4 }}>
                        <span style={{ fontWeight: 700, color: LR_COLORS[cat] || '#94a3b8' }}>{cat}</span>
                        <span style={{ color: '#7a7870' }}>{count} item{count > 1 ? 's' : ''} ({pct}%)</span>
                      </div>
                      <div style={{ height: 10, background: '#f0ede6', borderRadius: 4, overflow: 'hidden' }}>
                        <div style={{
                          height: '100%', width: `${pct}%`,
                          background: LR_COLORS[cat] || '#94a3b8', borderRadius: 4,
                        }} />
                      </div>
                    </div>
                  );
                })}
              </div>
            </Card>

          </div>
        </div>
      )}

    </div>
  );
}
