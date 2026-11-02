import React, { useState, useEffect } from 'react';
import { 
  Target, 
  Plus, 
  TrendingUp, 
  AlertTriangle, 
  CheckCircle2, 
  Edit3, 
  Layers,
  Sparkles,
  PieChart
} from 'lucide-react';
import { api } from '../api/client';
import { formatCurrency, getCategoryColor } from '../utils/formatters';
import BudgetModal from '../components/BudgetModal';

export default function Budgets({ selectedMonth, refreshTrigger, onDataChanged }) {
  const [budgets, setBudgets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState('');
  const [selectedLimit, setSelectedLimit] = useState('');

  const loadBudgets = async () => {
    try {
      setLoading(true);
      const data = await api.budgets.list(selectedMonth);
      setBudgets(data);
    } catch (err) {
      console.error('Error fetching budgets:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadBudgets();
  }, [selectedMonth, refreshTrigger]);

  const handleOpenEdit = (b) => {
    setSelectedCategory(b.category);
    setSelectedLimit(b.monthly_limit.toString());
    setModalOpen(true);
  };

  const handleOpenNew = () => {
    setSelectedCategory('');
    setSelectedLimit('');
    setModalOpen(true);
  };

  const totalBudgetLimit = budgets.reduce((acc, b) => acc + b.monthly_limit, 0);
  const totalBudgetSpent = budgets.reduce((acc, b) => acc + b.spent_amount, 0);
  const totalPercentage = totalBudgetLimit > 0 ? (totalBudgetSpent / totalBudgetLimit) * 100 : 0;

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
          <h1 style={{ fontSize: '1.75rem', fontWeight: 800, color: '#fff' }}>
            Monthly Budget Allocations
          </h1>
          <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginTop: '2px' }}>
            Set category spending limits, track 80% warning thresholds, and prevent month-end depletion
          </p>
        </div>

        <button className="btn btn-primary" onClick={handleOpenNew}>
          <Plus size={16} /> Set Category Budget
        </button>
      </div>

      {/* Aggregate Overview Card */}
      <div className="glass-card" style={{ padding: '24px', marginBottom: '24px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px', marginBottom: '16px' }}>
          <div>
            <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>
              Overall Category Budgets Pace ({selectedMonth})
            </span>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: '10px', marginTop: '4px' }}>
              <span style={{ fontSize: '2rem', fontWeight: 800, color: '#fff' }}>
                {formatCurrency(totalBudgetSpent)}
              </span>
              <span style={{ fontSize: '1.1rem', color: 'var(--text-dim)' }}>
                of {formatCurrency(totalBudgetLimit)} budgeted
              </span>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span className={`badge ${
              totalPercentage >= 100 ? 'badge-rose' :
              totalPercentage >= 80 ? 'badge-amber' : 'badge-emerald'
            }`} style={{ fontSize: '0.85rem', padding: '6px 12px' }}>
              {totalPercentage >= 100 ? (
                <>⚠️ Total Budget Exceeded ({totalPercentage.toFixed(1)}%)</>
              ) : totalPercentage >= 80 ? (
                <>⚡ 80% Threshold Reached ({totalPercentage.toFixed(1)}%)</>
              ) : (
                <>✅ Within Planned Limits ({totalPercentage.toFixed(1)}%)</>
              )}
            </span>
          </div>
        </div>

        {/* Global Progress Bar */}
        <div style={{ height: '10px', background: 'rgba(255,255,255,0.06)', borderRadius: '999px', overflow: 'hidden' }}>
          <div style={{
            width: `${Math.min(100, Math.max(0, totalPercentage))}%`,
            height: '100%',
            background: totalPercentage >= 100 
              ? 'linear-gradient(90deg, #f59e0b, #f43f5e)' 
              : totalPercentage >= 80 
              ? 'linear-gradient(90deg, #6366f1, #f59e0b)' 
              : 'linear-gradient(90deg, #10b981, #06b6d4)',
            borderRadius: '999px',
            transition: 'width 0.6s ease'
          }} />
        </div>
      </div>

      {/* Category Budgets Grid */}
      {loading ? (
        <div style={{ padding: '40px', textAlign: 'center', color: 'var(--text-dim)' }}>
          Loading category budgets...
        </div>
      ) : budgets.length > 0 ? (
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
          gap: '20px'
        }}>
          {budgets.map(b => {
            const catColor = getCategoryColor(b.category);
            const isExceeded = b.status === 'Exceeded';
            const isWarning = b.status === 'Warning';

            return (
              <div 
                key={b.id} 
                className="glass-card" 
                style={{ 
                  padding: '20px', 
                  position: 'relative',
                  border: isExceeded ? '1px solid rgba(244,63,94,0.4)' : isWarning ? '1px solid rgba(245,158,11,0.4)' : '1px solid var(--border-light)'
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '14px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <div style={{
                      width: 36,
                      height: 36,
                      borderRadius: 10,
                      background: `${catColor}20`,
                      color: catColor,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center'
                    }}>
                      <PieChart size={18} />
                    </div>
                    <div>
                      <h3 style={{ fontSize: '1rem', color: '#fff' }}>{b.category}</h3>
                      <div style={{ fontSize: '0.75rem', color: 'var(--text-dim)' }}>
                        Monthly target: {formatCurrency(b.monthly_limit)}
                      </div>
                    </div>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <span className={`badge ${
                      isExceeded ? 'badge-rose' :
                      isWarning ? 'badge-amber' : 'badge-emerald'
                    }`}>
                      {b.status} ({b.percentage_used}%)
                    </span>
                    <button
                      onClick={() => handleOpenEdit(b)}
                      style={{
                        background: 'rgba(255,255,255,0.05)',
                        border: '1px solid var(--border-light)',
                        borderRadius: '6px',
                        padding: '5px',
                        color: 'var(--text-muted)',
                        cursor: 'pointer'
                      }}
                      title="Edit budget threshold"
                    >
                      <Edit3 size={13} />
                    </button>
                  </div>
                </div>

                {/* Numbers */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: '8px' }}>
                  <span style={{ fontSize: '1.25rem', fontWeight: 800, color: isExceeded ? '#fb7185' : '#fff' }}>
                    {formatCurrency(b.spent_amount)}
                  </span>
                  <span style={{ fontSize: '0.78rem', color: isExceeded ? '#fb7185' : 'var(--text-muted)' }}>
                    {isExceeded 
                      ? `Overspent by ${formatCurrency(b.spent_amount - b.monthly_limit)}` 
                      : `${formatCurrency(b.remaining_amount)} left`}
                  </span>
                </div>

                {/* Progress bar */}
                <div style={{ height: '6px', background: 'rgba(255,255,255,0.06)', borderRadius: '999px', overflow: 'hidden' }}>
                  <div style={{
                    width: `${Math.min(100, Math.max(0, b.percentage_used))}%`,
                    height: '100%',
                    background: isExceeded ? '#f43f5e' : isWarning ? '#f59e0b' : catColor,
                    borderRadius: '999px',
                    transition: 'width 0.4s ease'
                  }} />
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div style={{ textAlign: 'center', padding: '40px', color: 'var(--text-dim)' }}>
          No category budgets configured yet. Click "Set Category Budget" to define targets.
        </div>
      )}

      {/* Modal */}
      <BudgetModal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        selectedMonth={selectedMonth}
        initialCategory={selectedCategory}
        initialLimit={selectedLimit}
        onBudgetSaved={() => {
          loadBudgets();
          if (onDataChanged) onDataChanged();
        }}
      />
    </div>
  );
}
