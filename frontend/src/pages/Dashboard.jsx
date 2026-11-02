import React, { useState, useEffect } from 'react';
import { 
  DollarSign, 
  TrendingUp, 
  AlertTriangle, 
  Copy, 
  Plus, 
  UploadCloud, 
  Sparkles, 
  ArrowRight,
  Flame,
  Wallet
} from 'lucide-react';
import { 
  ResponsiveContainer, 
  PieChart, 
  Pie, 
  Cell, 
  Tooltip, 
  ComposedChart, 
  Line, 
  Area, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Legend 
} from 'recharts';
import { api } from '../api/client';
import { formatCurrency, formatDate, getCategoryColor } from '../utils/formatters';
import StatCard from '../components/StatCard';
import SpendingForecastCard from '../components/SpendingForecastCard';

export default function Dashboard({ 
  selectedMonth, 
  onNavigateTab, 
  onOpenAddModal, 
  onOpenImportModal,
  refreshTrigger 
}) {
  const [overview, setOverview] = useState(null);
  const [categoryData, setCategoryData] = useState([]);
  const [forecast, setForecast] = useState(null);
  const [recentTransactions, setRecentTransactions] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadDashboardData() {
      try {
        setLoading(true);
        const [ovData, catData, fcData, txData] = await Promise.all([
          api.analytics.getOverview(selectedMonth),
          api.analytics.getCategoryBreakdown(selectedMonth),
          api.ml.getForecast(selectedMonth),
          api.transactions.list(selectedMonth)
        ]);

        setOverview(ovData);
        setCategoryData(catData);
        setForecast(fcData);
        setRecentTransactions(txData.slice(0, 6));
      } catch (err) {
        console.error('Error loading dashboard data:', err);
      } finally {
        setLoading(false);
      }
    }
    loadDashboardData();
  }, [selectedMonth, refreshTrigger]);

  const handleSeedDemo = async () => {
    try {
      setLoading(true);
      await api.transactions.seedDemo();
      // Reload dashboard
      const [ovData, catData, fcData, txData] = await Promise.all([
        api.analytics.getOverview(selectedMonth),
        api.analytics.getCategoryBreakdown(selectedMonth),
        api.ml.getForecast(selectedMonth),
        api.transactions.list(selectedMonth)
      ]);
      setOverview(ovData);
      setCategoryData(catData);
      setForecast(fcData);
      setRecentTransactions(txData.slice(0, 6));
    } catch (err) {
      console.error('Failed to seed demo data:', err);
    } finally {
      setLoading(false);
    }
  };

  if (loading && !overview) {
    return (
      <div style={{ padding: '40px', textAlign: 'center', color: 'var(--text-muted)' }}>
        <Sparkles size={28} className="anomaly-pulse" style={{ margin: '0 auto 12px auto', color: 'var(--primary)' }} />
        <div>Computing AI Expense Analytics & Training Anomaly Models...</div>
      </div>
    );
  }

  // Trajectory chart points
  const trajectoryData = forecast?.forecast_trajectory || [];

  return (
    <div style={{ padding: '24px', maxWidth: '1440px', margin: '0 auto' }}>
      {/* Top Banner Actions */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: '16px',
        marginBottom: '24px'
      }}>
        <div>
          <h1 style={{ fontSize: '1.75rem', fontWeight: 800, color: '#fff' }}>
            Financial Intelligence Dashboard
          </h1>
          <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginTop: '2px' }}>
            Real-time expense categorization, Isolation Forest anomaly flags & predictive budgeting
          </p>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <button
            className="btn btn-secondary"
            onClick={handleSeedDemo}
            title="Load ready-made college student transactions with sample anomalies"
          >
            <Sparkles size={16} color="#a855f7" /> Load Demo Student Data
          </button>

          <button
            className="btn btn-secondary"
            onClick={onOpenImportModal}
          >
            <UploadCloud size={16} /> Import Bank CSV
          </button>

          <button
            className="btn btn-primary"
            onClick={onOpenAddModal}
          >
            <Plus size={16} /> Add Transaction
          </button>
        </div>
      </div>

      {/* Metric Cards Grid */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
        gap: '16px',
        marginBottom: '24px'
      }}>
        <StatCard
          title="Total Spent So Far"
          value={formatCurrency(overview?.total_spent || 0)}
          subvalue={`Budget: ${formatCurrency(overview?.total_budget || 15000)} • ${overview?.remaining_budget ? formatCurrency(overview.remaining_budget) + ' remaining' : '0 remaining'}`}
          icon={Wallet}
          accent="#6366f1"
          progress={overview?.percentage_used || 0}
          badge={`${overview?.percentage_used || 0}%`}
          badgeType={overview?.percentage_used >= 100 ? 'rose' : overview?.percentage_used >= 80 ? 'amber' : 'emerald'}
          onClick={() => onNavigateTab('budgets')}
        />

        <StatCard
          title="Predicted Month-End Spend"
          value={formatCurrency(forecast?.predicted_month_end_spend || 0)}
          subvalue={forecast?.will_exceed_total_budget 
            ? `⚠️ Will exceed budget by ${formatCurrency(Math.abs(forecast?.projected_savings_or_deficit || 0))}` 
            : `✅ Projected savings of ${formatCurrency(forecast?.projected_savings_or_deficit || 0)}`}
          icon={TrendingUp}
          accent={forecast?.will_exceed_total_budget ? '#f43f5e' : '#10b981'}
          badge={forecast?.will_exceed_total_budget ? 'Budget Risk' : 'On Track'}
          badgeType={forecast?.will_exceed_total_budget ? 'rose' : 'emerald'}
          onClick={() => onNavigateTab('analytics')}
        />

        <StatCard
          title="Daily Spending Velocity"
          value={`${formatCurrency(overview?.burn_rate || 0)}/day`}
          subvalue={`Avg pace across ${forecast?.days_elapsed || 1} elapsed days`}
          icon={Flame}
          accent="#f59e0b"
          badge="Burn Rate"
          badgeType="amber"
        />

        <StatCard
          title="Anomalies & Duplicates"
          value={`${(overview?.anomalies_count || 0) + (overview?.duplicates_count || 0)} Flagged`}
          subvalue={`${overview?.duplicates_count || 0} duplicates • ${overview?.anomalies_count || 0} outliers`}
          icon={AlertTriangle}
          accent="#f43f5e"
          badge={overview?.anomalies_count > 0 ? 'Requires Review' : 'Clean'}
          badgeType={overview?.anomalies_count > 0 ? 'rose' : 'emerald'}
          onClick={() => onNavigateTab('analytics')}
        />
      </div>

      {/* Spending Forecast Trajectory Section */}
      <div style={{ marginBottom: '24px' }}>
        <SpendingForecastCard forecast={forecast} />
      </div>

      {/* Recharts Analytics Row */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(460px, 1fr))',
        gap: '20px',
        marginBottom: '24px'
      }}>
        {/* Cumulative Pace vs Forecast Line Chart */}
        <div className="glass-card" style={{ padding: '22px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
            <div>
              <h3 style={{ fontSize: '1.05rem', color: '#fff' }}>
                Cumulative Spending Pace & Trajectory
              </h3>
              <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                Actual spend vs ML projected curve vs Linear budget ceiling
              </p>
            </div>
          </div>

          <div style={{ width: '100%', height: 280 }}>
            {trajectoryData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <ComposedChart data={trajectoryData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" />
                  <XAxis 
                    dataKey="day" 
                    stroke="var(--text-dim)" 
                    fontSize={11}
                    tickFormatter={(val) => val.replace('Day ', 'D')}
                  />
                  <YAxis 
                    stroke="var(--text-dim)" 
                    fontSize={11} 
                    tickFormatter={(val) => `₹${val >= 1000 ? (val/1000).toFixed(0)+'k' : val}`}
                  />
                  <Tooltip 
                    contentStyle={{ 
                      background: '#111726', 
                      borderColor: 'var(--border-light)', 
                      borderRadius: '8px',
                      fontSize: '0.8rem' 
                    }}
                    formatter={(val) => [formatCurrency(val), '']}
                  />
                  <Legend wrapperStyle={{ fontSize: '0.78rem', paddingTop: '10px' }} />
                  <Line 
                    type="monotone" 
                    dataKey="budget_limit" 
                    name="Budget Ceiling" 
                    stroke="#f59e0b" 
                    strokeDasharray="4 4" 
                    strokeWidth={2}
                    dot={false}
                  />
                  <Line 
                    type="monotone" 
                    dataKey="projected" 
                    name="Projected Trajectory" 
                    stroke="#a855f7" 
                    strokeWidth={2}
                    strokeDasharray="3 3"
                    dot={false}
                  />
                  <Area 
                    type="monotone" 
                    dataKey="actual" 
                    name="Actual Spend" 
                    stroke="#6366f1" 
                    strokeWidth={3}
                    fill="rgba(99, 102, 241, 0.2)" 
                  />
                </ComposedChart>
              </ResponsiveContainer>
            ) : (
              <div style={{ height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-dim)' }}>
                No expenditure trajectory recorded for this month.
              </div>
            )}
          </div>
        </div>

        {/* Category Expense Breakdown Donut */}
        <div className="glass-card" style={{ padding: '22px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
            <div>
              <h3 style={{ fontSize: '1.05rem', color: '#fff' }}>
                Category Expense Distribution
              </h3>
              <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                Where your student budget is consumed
              </p>
            </div>
            <button
              className="btn btn-secondary btn-sm"
              onClick={() => onNavigateTab('budgets')}
            >
              Manage Budgets
            </button>
          </div>

          <div style={{ width: '100%', height: 280, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            {categoryData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={categoryData}
                    cx="50%"
                    cy="50%"
                    innerRadius={65}
                    outerRadius={105}
                    paddingAngle={4}
                    dataKey="value"
                  >
                    {categoryData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={getCategoryColor(entry.name)} />
                    ))}
                  </Pie>
                  <Tooltip 
                    contentStyle={{ 
                      background: '#111726', 
                      borderColor: 'var(--border-light)', 
                      borderRadius: '8px',
                      fontSize: '0.8rem' 
                    }}
                    formatter={(val) => [formatCurrency(val), 'Spent']}
                  />
                  <Legend 
                    layout="vertical" 
                    align="right" 
                    verticalAlign="middle" 
                    wrapperStyle={{ fontSize: '0.75rem', lineHeight: '20px', maxWidth: '40%' }} 
                  />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div style={{ color: 'var(--text-dim)' }}>No categorized transactions found.</div>
            )}
          </div>
        </div>
      </div>

      {/* Recent Transactions & Flagged Activity Table */}
      <div className="glass-card" style={{ padding: '22px' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
          <div>
            <h3 style={{ fontSize: '1.1rem', color: '#fff' }}>
              Recent Transactions & Inspection Flags
            </h3>
            <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
              Latest expenses with machine learning anomaly diagnostic tags
            </p>
          </div>
          <button
            className="btn btn-secondary btn-sm"
            onClick={() => onNavigateTab('transactions')}
          >
            View All ({overview?.transaction_count || 0}) <ArrowRight size={14} />
          </button>
        </div>

        {recentTransactions.length > 0 ? (
          <div className="data-table-container">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Date</th>
                  <th>Description</th>
                  <th>Category</th>
                  <th>Merchant / Payee</th>
                  <th>Amount</th>
                  <th>Status & AI Scan</th>
                </tr>
              </thead>
              <tbody>
                {recentTransactions.map(tx => (
                  <tr key={tx.id} className={tx.is_anomaly ? 'row-anomaly' : ''}>
                    <td style={{ color: 'var(--text-muted)', fontFamily: 'var(--font-mono)', fontSize: '0.82rem' }}>
                      {formatDate(tx.date)}
                    </td>
                    <td>
                      <div style={{ fontWeight: 600, color: '#fff' }}>{tx.description}</div>
                      {tx.notes && <div style={{ fontSize: '0.72rem', color: 'var(--text-dim)' }}>{tx.notes}</div>}
                    </td>
                    <td>
                      <span 
                        className="badge" 
                        style={{ 
                          background: `${getCategoryColor(tx.category)}20`,
                          color: getCategoryColor(tx.category),
                          borderColor: `${getCategoryColor(tx.category)}40`
                        }}
                      >
                        {tx.category}
                      </span>
                    </td>
                    <td style={{ color: 'var(--text-muted)' }}>
                      {tx.merchant || '—'}
                    </td>
                    <td style={{ fontWeight: 700, fontFamily: 'var(--font-heading)', color: '#fff' }}>
                      {formatCurrency(tx.amount)}
                    </td>
                    <td>
                      {tx.is_duplicate ? (
                        <span className="badge badge-amber" title={tx.anomaly_reason}>
                          <Copy size={12} /> Duplicate
                        </span>
                      ) : tx.is_anomaly ? (
                        <span className="badge badge-rose" title={tx.anomaly_reason}>
                          <AlertTriangle size={12} /> Anomaly ({Math.round(tx.anomaly_score * 100)}%)
                        </span>
                      ) : (
                        <span className="badge badge-emerald">
                          Normal
                        </span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div style={{ textAlign: 'center', padding: '30px', color: 'var(--text-dim)' }}>
            No transactions found for {selectedMonth}. Click "Add Transaction" or "Load Demo Student Data" to start.
          </div>
        )}
      </div>
    </div>
  );
}
