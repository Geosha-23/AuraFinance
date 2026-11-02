import React from 'react';
import { Sparkles, TrendingUp, AlertCircle, CheckCircle2, ShieldAlert } from 'lucide-react';
import { formatCurrency } from '../utils/formatters';

export default function SpendingForecastCard({ forecast }) {
  if (!forecast) return null;

  const {
    total_spent_so_far,
    predicted_month_end_spend,
    monthly_budget_allowance,
    will_exceed_total_budget,
    projected_savings_or_deficit,
    category_forecasts = [],
    ai_recommendations = [],
    days_elapsed,
    days_in_month
  } = forecast;

  const overrunCategories = category_forecasts.filter(c => c.will_exceed_budget);

  return (
    <div className="glass-card" style={{ padding: '24px', position: 'relative', overflow: 'hidden' }}>
      {/* Background Gradient */}
      <div style={{
        position: 'absolute',
        top: 0,
        right: 0,
        width: '350px',
        height: '200px',
        background: will_exceed_total_budget 
          ? 'radial-gradient(circle at 100% 0%, rgba(244,63,94,0.15) 0%, transparent 70%)'
          : 'radial-gradient(circle at 100% 0%, rgba(16,185,129,0.15) 0%, transparent 70%)',
        pointerEvents: 'none'
      }} />

      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '18px', flexWrap: 'wrap', gap: '10px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <div style={{
            width: 38,
            height: 38,
            borderRadius: 10,
            background: 'linear-gradient(135deg, #6366f1, #06b6d4)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#fff'
          }}>
            <Sparkles size={20} />
          </div>
          <div>
            <h3 style={{ fontSize: '1.15rem', color: '#fff', display: 'flex', alignItems: 'center', gap: '8px' }}>
              AI Monthly Expense Forecast
              <span className="badge badge-cyan" style={{ fontSize: '0.68rem' }}>
                Time-Series Ridge Model
              </span>
            </h3>
            <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
              Day {days_elapsed} of {days_in_month} • Cumulative pace analysis & velocity projection
            </span>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          {will_exceed_total_budget ? (
            <span className="badge badge-rose" style={{ fontSize: '0.82rem', padding: '6px 12px' }}>
              <ShieldAlert size={14} /> At-Risk of Overspending
            </span>
          ) : (
            <span className="badge badge-emerald" style={{ fontSize: '0.82rem', padding: '6px 12px' }}>
              <CheckCircle2 size={14} /> On Track with Budget
            </span>
          )}
        </div>
      </div>

      {/* Main Forecast Metrics Comparison */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
        gap: '16px',
        marginBottom: '20px'
      }}>
        <div style={{ background: 'rgba(255,255,255,0.03)', padding: '16px', borderRadius: '12px', border: '1px solid var(--border-light)' }}>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: '4px' }}>
            Current Spending
          </div>
          <div style={{ fontSize: '1.4rem', fontWeight: 800, color: '#fff' }}>
            {formatCurrency(total_spent_so_far)}
          </div>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-dim)', marginTop: '4px' }}>
            Across first {days_elapsed} days
          </div>
        </div>

        <div style={{ background: 'rgba(255,255,255,0.03)', padding: '16px', borderRadius: '12px', border: '1px solid var(--border-light)' }}>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: '4px' }}>
            Predicted Month-End Spend
          </div>
          <div style={{ 
            fontSize: '1.4rem', 
            fontWeight: 800, 
            color: will_exceed_total_budget ? '#fb7185' : '#34d399' 
          }}>
            {formatCurrency(predicted_month_end_spend)}
          </div>
          <div style={{ fontSize: '0.75rem', color: will_exceed_total_budget ? '#fda4af' : '#6ee7b7', marginTop: '4px' }}>
            {will_exceed_total_budget 
              ? `+${formatCurrency(Math.abs(projected_savings_or_deficit))} over budget` 
              : `Estimated saving: ${formatCurrency(projected_savings_or_deficit)}`}
          </div>
        </div>

        <div style={{ background: 'rgba(255,255,255,0.03)', padding: '16px', borderRadius: '12px', border: '1px solid var(--border-light)' }}>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: '4px' }}>
            Total Budget Allowance
          </div>
          <div style={{ fontSize: '1.4rem', fontWeight: 800, color: '#fff' }}>
            {formatCurrency(monthly_budget_allowance)}
          </div>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-dim)', marginTop: '4px' }}>
            Monthly cap
          </div>
        </div>
      </div>

      {/* AI Recommendation Insights Box */}
      {ai_recommendations.length > 0 && (
        <div style={{
          background: 'rgba(99, 102, 241, 0.08)',
          border: '1px solid rgba(99, 102, 241, 0.25)',
          borderRadius: '12px',
          padding: '16px',
          marginBottom: '20px'
        }}>
          <div style={{ fontSize: '0.82rem', fontWeight: 700, color: '#a5b4fc', marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '6px' }}>
            <Sparkles size={16} /> AI Proactive Recommendations & Budget Warnings:
          </div>
          <ul style={{ listStyle: 'none', display: 'flex', flexDirection: 'column', gap: '6px' }}>
            {ai_recommendations.map((rec, i) => (
              <li key={i} style={{ fontSize: '0.82rem', color: 'var(--text-main)', display: 'flex', alignItems: 'flex-start', gap: '8px' }}>
                <span style={{ color: '#818cf8', marginTop: '2px' }}>•</span>
                <span>{rec}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Category Level Projections */}
      {category_forecasts.length > 0 && (
        <div>
          <h4 style={{ fontSize: '0.9rem', color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: '12px' }}>
            Category Forecast Breakdown
          </h4>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '12px' }}>
            {category_forecasts.map(cf => (
              <div 
                key={cf.category}
                style={{
                  background: 'rgba(15,20,32,0.6)',
                  border: `1px solid ${cf.will_exceed_budget ? 'rgba(244,63,94,0.35)' : 'var(--border-light)'}`,
                  borderRadius: '10px',
                  padding: '12px 14px'
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                  <span style={{ fontSize: '0.85rem', fontWeight: 600, color: '#fff' }}>
                    {cf.category}
                  </span>
                  <span className={`badge ${
                    cf.status === 'Danger' ? 'badge-rose' :
                    cf.status === 'Warning' ? 'badge-amber' : 'badge-emerald'
                  }`}>
                    {cf.status}
                  </span>
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.78rem', color: 'var(--text-muted)', marginBottom: '4px' }}>
                  <span>Current: <strong style={{ color: '#fff' }}>{formatCurrency(cf.current_spend)}</strong></span>
                  <span>Predicted: <strong style={{ color: cf.will_exceed_budget ? '#fb7185' : '#34d399' }}>{formatCurrency(cf.predicted_spend)}</strong></span>
                  {cf.budget_limit && <span>Budget: {formatCurrency(cf.budget_limit)}</span>}
                </div>

                {cf.will_exceed_budget && (
                  <div style={{ fontSize: '0.72rem', color: '#fb7185', marginTop: '4px' }}>
                    ⚠️ Projected overrun of {formatCurrency(cf.projected_overrun)}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
