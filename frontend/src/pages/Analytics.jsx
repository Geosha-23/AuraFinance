import React, { useState, useEffect } from 'react';
import { 
  ShieldAlert, 
  Sparkles, 
  RefreshCw, 
  AlertTriangle, 
  Copy, 
  BarChart2, 
  CheckCircle,
  HelpCircle,
  Sliders,
  Cpu
} from 'lucide-react';
import { 
  ResponsiveContainer, 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  Tooltip, 
  CartesianGrid 
} from 'recharts';
import { api } from '../api/client';
import { formatCurrency, formatDate, getCategoryColor } from '../utils/formatters';

export default function Analytics({ selectedMonth, refreshTrigger, onDataChanged }) {
  const [anomalies, setAnomalies] = useState([]);
  const [dailyData, setDailyData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [reEvaluating, setReEvaluating] = useState(false);
  const [evalResult, setEvalResult] = useState('');

  const loadAnalytics = async () => {
    try {
      setLoading(true);
      const [anomData, dailyTrend] = await Promise.all([
        api.ml.getAnomalies(selectedMonth),
        api.analytics.getDailyTrend(selectedMonth)
      ]);
      setAnomalies(anomData);
      setDailyData(dailyTrend);
    } catch (err) {
      console.error('Error fetching analytics:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAnalytics();
  }, [selectedMonth, refreshTrigger]);

  const handleReEvaluate = async () => {
    try {
      setReEvaluating(true);
      setEvalResult('');
      const res = await api.ml.reEvaluate();
      setEvalResult(`Re-evaluated ${res.processed_transactions} records. Found ${res.anomalies_detected} anomalies.`);
      await loadAnalytics();
      if (onDataChanged) onDataChanged();
    } catch (err) {
      alert(err.message || 'Failed to re-evaluate anomalies.');
    } finally {
      setReEvaluating(false);
    }
  };

  return (
    <div style={{ padding: '24px', maxWidth: '1440px', margin: '0 auto' }}>
      {/* Header */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: '16px',
        marginBottom: '24px'
      }}>
        <div>
          <h1 style={{ fontSize: '1.75rem', fontWeight: 800, color: '#fff', display: 'flex', alignItems: 'center', gap: '10px' }}>
            AI Anomaly & Outlier Inspector
            <span className="badge badge-primary" style={{ fontSize: '0.72rem' }}>
              <Cpu size={14} /> Isolation Forest Active
            </span>
          </h1>
          <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginTop: '2px' }}>
            Detects multivariate outlier spending, duplicate transactions, and out-of-distribution spikes
          </p>
        </div>

        <button
          className="btn btn-primary"
          onClick={handleReEvaluate}
          disabled={reEvaluating}
        >
          <RefreshCw size={16} className={reEvaluating ? 'anomaly-pulse' : ''} />
          {reEvaluating ? 'Running Scikit-learn Pipeline...' : 'Re-Run Anomaly Detection'}
        </button>
      </div>

      {evalResult && (
        <div style={{
          background: 'rgba(16, 185, 129, 0.1)',
          border: '1px solid rgba(16, 185, 129, 0.3)',
          color: '#34d399',
          padding: '12px 18px',
          borderRadius: '12px',
          fontSize: '0.85rem',
          marginBottom: '20px',
          display: 'flex',
          alignItems: 'center',
          gap: '10px'
        }}>
          <CheckCircle size={18} />
          {evalResult}
        </div>
      )}

      {/* Daily Spending Velocity Chart */}
      <div className="glass-card" style={{ padding: '24px', marginBottom: '24px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
          <div>
            <h3 style={{ fontSize: '1.1rem', color: '#fff' }}>
              Daily Spending Velocity Spikes
            </h3>
            <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
              Day-by-day expenditure magnitude to identify sudden weekend or event splurges
            </p>
          </div>
          <span className="badge badge-cyan">
            <BarChart2 size={13} /> Velocity Tracker
          </span>
        </div>

        <div style={{ width: '100%', height: 260 }}>
          {dailyData.length > 0 ? (
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={dailyData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" />
                <XAxis 
                  dataKey="date" 
                  stroke="var(--text-dim)" 
                  fontSize={11}
                  tickFormatter={(val) => val.split('-').slice(1).join('/')}
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
                  formatter={(val) => [formatCurrency(val), 'Spent']}
                  labelFormatter={(val) => formatDate(val)}
                />
                <Bar 
                  dataKey="amount" 
                  name="Spent" 
                  fill="#6366f1" 
                  radius={[6, 6, 0, 0]} 
                />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div style={{ height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-dim)' }}>
              No daily data available for {selectedMonth}.
            </div>
          )}
        </div>
      </div>

      {/* Flagged Anomalies Grid */}
      <div className="glass-card" style={{ padding: '24px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '18px' }}>
          <div>
            <h3 style={{ fontSize: '1.15rem', color: '#fff', display: 'flex', alignItems: 'center', gap: '8px' }}>
              Flagged Transactions for Review
              <span className="badge badge-rose" style={{ fontSize: '0.75rem' }}>
                {anomalies.length} Flagged
              </span>
            </h3>
            <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
              Scanned using Isolation Forest (contamination=0.08) and 24-48h temporal duplicate heuristics
            </p>
          </div>
        </div>

        {loading ? (
          <div style={{ padding: '30px', textAlign: 'center', color: 'var(--text-dim)' }}>
            Inspecting transactions...
          </div>
        ) : anomalies.length > 0 ? (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(360px, 1fr))', gap: '16px' }}>
            {anomalies.map(anom => {
              const catColor = getCategoryColor(anom.category);
              return (
                <div 
                  key={anom.transaction_id}
                  style={{
                    background: anom.is_duplicate 
                      ? 'rgba(245,158,11,0.06)' 
                      : 'rgba(244,63,94,0.06)',
                    border: `1px solid ${anom.is_duplicate ? 'rgba(245,158,11,0.3)' : 'rgba(244,63,94,0.3)'}`,
                    borderRadius: '14px',
                    padding: '16px',
                    position: 'relative'
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '8px' }}>
                    <div>
                      <div style={{ fontSize: '0.78rem', color: 'var(--text-dim)', fontFamily: 'var(--font-mono)' }}>
                        {formatDate(anom.date)}
                      </div>
                      <div style={{ fontSize: '1rem', fontWeight: 700, color: '#fff', marginTop: '2px' }}>
                        {anom.description}
                      </div>
                    </div>

                    <div style={{ textAlign: 'right' }}>
                      <div style={{ fontSize: '1.2rem', fontWeight: 800, color: anom.is_duplicate ? '#fbbf24' : '#fb7185' }}>
                        {formatCurrency(anom.amount)}
                      </div>
                    </div>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '10px' }}>
                    <span 
                      className="badge" 
                      style={{ 
                        background: `${catColor}20`,
                        color: catColor,
                        borderColor: `${catColor}40`,
                        fontSize: '0.72rem'
                      }}
                    >
                      {anom.category}
                    </span>

                    {anom.is_duplicate ? (
                      <span className="badge badge-amber" style={{ fontSize: '0.72rem' }}>
                        <Copy size={11} /> Duplicate Charge
                      </span>
                    ) : (
                      <span className="badge badge-rose" style={{ fontSize: '0.72rem' }}>
                        <AlertTriangle size={11} /> {anom.risk_level} Risk Anomaly
                      </span>
                    )}

                    <span style={{ fontSize: '0.72rem', color: 'var(--text-dim)', marginLeft: 'auto' }}>
                      Score: {Math.round(anom.anomaly_score * 100)}%
                    </span>
                  </div>

                  {/* Diagnostic Explanation Box */}
                  <div style={{
                    background: 'rgba(0,0,0,0.25)',
                    padding: '10px 12px',
                    borderRadius: '8px',
                    fontSize: '0.78rem',
                    color: anom.is_duplicate ? '#fde68a' : '#fda4af',
                    display: 'flex',
                    alignItems: 'flex-start',
                    gap: '8px'
                  }}>
                    <HelpCircle size={15} style={{ flexShrink: 0, marginTop: '2px' }} />
                    <div>
                      <strong>Why was this flagged?</strong>
                      <div style={{ marginTop: '2px', color: 'var(--text-main)', opacity: 0.9 }}>
                        {anom.anomaly_reason}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div style={{ textAlign: 'center', padding: '40px', color: 'var(--text-dim)' }}>
            <CheckCircle size={32} color="#10b981" style={{ margin: '0 auto 10px auto' }} />
            <div>No anomalous or duplicate transactions flagged for {selectedMonth}!</div>
            <div style={{ fontSize: '0.8rem', color: 'var(--text-dim)', marginTop: '4px' }}>
              Your spending aligns neatly with typical college student patterns.
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
