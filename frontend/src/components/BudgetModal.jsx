import React, { useState } from 'react';
import { X, Target, Check, AlertCircle } from 'lucide-react';
import { api } from '../api/client';

const CATEGORIES = [
  "Food & Dining",
  "Travel & Commute",
  "Shopping & E-Commerce",
  "Subscriptions & Streaming",
  "Utilities & Bills",
  "Education & Books",
  "Entertainment & Outings",
  "Healthcare & Fitness",
  "Groceries & Essentials",
  "Other & Miscellaneous"
];

export default function BudgetModal({ isOpen, onClose, selectedMonth, onBudgetSaved, initialCategory = '', initialLimit = '' }) {
  const [category, setCategory] = useState(initialCategory || CATEGORIES[0]);
  const [monthlyLimit, setMonthlyLimit] = useState(initialLimit || '');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!monthlyLimit || parseFloat(monthlyLimit) <= 0) {
      setError('Please enter a valid monthly budget limit amount.');
      return;
    }

    try {
      setSaving(true);
      setError('');
      await api.budgets.save(category, parseFloat(monthlyLimit), selectedMonth);
      onBudgetSaved();
      onClose();
    } catch (err) {
      setError(err.message || 'Failed to save budget limit.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={e => e.stopPropagation()}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div style={{
              width: 36,
              height: 36,
              borderRadius: 10,
              background: 'linear-gradient(135deg, #10b981, #06b6d4)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#fff'
            }}>
              <Target size={20} />
            </div>
            <div>
              <h3 style={{ fontSize: '1.2rem', color: '#fff' }}>Set Category Budget</h3>
              <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                Target threshold for {selectedMonth}
              </p>
            </div>
          </div>
          <button 
            onClick={onClose}
            style={{ background: 'transparent', border: 'none', color: 'var(--text-dim)', cursor: 'pointer' }}
          >
            <X size={20} />
          </button>
        </div>

        {error && (
          <div style={{
            background: 'var(--rose-surface)',
            border: '1px solid var(--rose-border)',
            color: '#fda4af',
            padding: '10px 14px',
            borderRadius: '10px',
            fontSize: '0.85rem',
            marginBottom: '16px'
          }}>
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label className="form-label">Category</label>
            <select
              className="form-select"
              value={category}
              onChange={e => setCategory(e.target.value)}
            >
              {CATEGORIES.map(cat => (
                <option key={cat} value={cat}>{cat}</option>
              ))}
            </select>
          </div>

          <div className="form-group">
            <label className="form-label">Monthly Limit (₹)</label>
            <input
              type="number"
              step="100"
              min="100"
              className="form-input"
              placeholder="e.g. 4000"
              value={monthlyLimit}
              onChange={e => setMonthlyLimit(e.target.value)}
              required
              autoFocus
            />
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', marginTop: '20px' }}>
            <button
              type="button"
              className="btn btn-secondary"
              onClick={onClose}
              disabled={saving}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="btn btn-primary"
              disabled={saving}
            >
              {saving ? 'Saving Target...' : 'Save Budget'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
