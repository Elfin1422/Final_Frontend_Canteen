/**
 * SkeletonLoader.jsx
 * Provides skeleton placeholder UI during data fetching.
 * Improves perceived performance vs a blank spinner.
 */

/** Skeleton for the menu grid */
export function MenuSkeleton({ count = 8 }) {
  return (
    <div className="menu-grid">
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="menu-card">
          <div className="skeleton skeleton-card" style={{ height: 110 }} />
          <div className="menu-card-body">
            <div className="skeleton skeleton-text short" style={{ marginBottom: '.4rem' }} />
            <div className="skeleton skeleton-text medium" />
            <div className="skeleton skeleton-text short" style={{ marginTop: '.5rem' }} />
          </div>
        </div>
      ))}
    </div>
  );
}

/** Skeleton for a data table */
export function TableSkeleton({ rows = 6, cols = 5 }) {
  return (
    <div style={{ padding: '1rem' }}>
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="skeleton skeleton-row" />
      ))}
    </div>
  );
}

/** Skeleton for stat cards */
export function StatsSkeleton({ count = 4 }) {
  return (
    <div className="stats-row">
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="stat-card">
          <div className="skeleton" style={{ width: 36, height: 36, borderRadius: '50%' }} />
          <div style={{ flex: 1 }}>
            <div className="skeleton skeleton-text medium" />
            <div className="skeleton skeleton-text short" />
          </div>
        </div>
      ))}
    </div>
  );
}

/** Skeleton for chart cards */
export function ChartSkeleton() {
  return (
    <div className="chart-card">
      <div className="skeleton skeleton-text short" style={{ marginBottom: '1rem' }} />
      <div className="skeleton" style={{ height: 200, borderRadius: 10 }} />
    </div>
  );
}
