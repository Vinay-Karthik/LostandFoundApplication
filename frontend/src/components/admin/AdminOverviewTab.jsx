import React from 'react';
import { 
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid 
} from 'recharts';

/**
 * AdminOverviewTab
 * Responsibility: Displays campus high-level metrics, summary cards, and category breakdown chart.
 */
export const AdminOverviewTab = ({ stats, flagsCount = 0 }) => {
  const chartData = stats?.categoryBreakdown
    ? Object.entries(stats.categoryBreakdown).map(([key, val]) => ({ name: key, count: val }))
    : [];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      {/* Key Metric Stats Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '1rem' }}>
        <div className="surface-card" style={{ padding: '1.25rem', textAlign: 'center', backgroundColor: 'var(--bg-surface)' }}>
          <div style={{ fontSize: '2rem', fontWeight: 800, color: 'var(--accent-blue)' }}>
            {stats?.totalUsers || 0}
          </div>
          <div style={{ fontSize: '0.8125rem', color: 'var(--text-muted)', fontWeight: 600, marginTop: '0.2rem' }}>
            Total Users in Database
          </div>
        </div>

        <div className="surface-card" style={{ padding: '1.25rem', textAlign: 'center', backgroundColor: 'var(--bg-surface)' }}>
          <div style={{ fontSize: '2rem', fontWeight: 800, color: 'var(--accent-coral)' }}>
            {stats?.totalLost || 0}
          </div>
          <div style={{ fontSize: '0.8125rem', color: 'var(--text-muted)', fontWeight: 600, marginTop: '0.2rem' }}>
            Lost Reports
          </div>
        </div>

        <div className="surface-card" style={{ padding: '1.25rem', textAlign: 'center', backgroundColor: 'var(--bg-surface)' }}>
          <div style={{ fontSize: '2rem', fontWeight: 800, color: '#16A34A' }}>
            {stats?.totalFound || 0}
          </div>
          <div style={{ fontSize: '0.8125rem', color: 'var(--text-muted)', fontWeight: 600, marginTop: '0.2rem' }}>
            Found Items
          </div>
        </div>

        <div className="surface-card" style={{ padding: '1.25rem', textAlign: 'center', backgroundColor: 'var(--bg-surface)' }}>
          <div style={{ fontSize: '2rem', fontWeight: 800, color: 'var(--accent-yellow)' }}>
            {stats?.recoveryRate || 0}%
          </div>
          <div style={{ fontSize: '0.8125rem', color: 'var(--text-muted)', fontWeight: 600, marginTop: '0.2rem' }}>
            Recovery Rate
          </div>
        </div>

        <div className="surface-card" style={{ padding: '1.25rem', textAlign: 'center', backgroundColor: 'var(--bg-surface)' }}>
          <div style={{ fontSize: '2rem', fontWeight: 800, color: 'var(--accent-blue)' }}>
            {stats?.totalMatched || 0}
          </div>
          <div style={{ fontSize: '0.8125rem', color: 'var(--text-muted)', fontWeight: 600, marginTop: '0.2rem' }}>
            Matched Items
          </div>
        </div>

        <div className="surface-card" style={{ padding: '1.25rem', textAlign: 'center', backgroundColor: 'var(--bg-surface)' }}>
          <div style={{ fontSize: '2rem', fontWeight: 800, color: flagsCount > 0 ? 'var(--status-lost-text)' : 'var(--text-primary)' }}>
            {flagsCount}
          </div>
          <div style={{ fontSize: '0.8125rem', color: 'var(--text-muted)', fontWeight: 600, marginTop: '0.2rem' }}>
            Open Flags
          </div>
        </div>
      </div>

      {/* Category Bar Chart */}
      <div className="surface-card" style={{ padding: '1.5rem', backgroundColor: 'var(--bg-surface)' }}>
        <h3 style={{ fontSize: '1.05rem', fontWeight: 700, marginBottom: '1.25rem', color: 'var(--text-primary)' }}>
          Category Distribution
        </h3>
        {chartData.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-muted)' }}>
            No category data available
          </div>
        ) : (
          <div style={{ width: '100%', height: 260 }}>
            <ResponsiveContainer>
              <BarChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border-subtle)" vertical={false} />
                <XAxis dataKey="name" stroke="var(--text-muted)" fontSize={12} />
                <YAxis stroke="var(--text-muted)" fontSize={12} allowDecimals={false} />
                <Tooltip 
                  contentStyle={{ backgroundColor: 'var(--bg-surface)', borderColor: 'var(--border-subtle)', borderRadius: 8, color: 'var(--text-primary)' }} 
                />
                <Bar dataKey="count" fill="var(--accent-blue)" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}
      </div>
    </div>
  );
};
