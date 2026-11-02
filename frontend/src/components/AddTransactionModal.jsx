import React, { useState, useEffect } from 'react';
import { X, Sparkles, Check, Plus, AlertCircle } from 'lucide-react';
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

export default function AddTransactionModal({ isOpen, onClose, onTransactionAdded }) {
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [description, setDescription] = useState('');
  const [amount, setAmount] = useState('');
  const [category, setCategory] = useState('');
  const [merchant, setMerchant] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('UPI');
  const [notes, setNotes] = useState('');

  // ML Auto-suggestion state
  const [aiSuggestion, setAiSuggestion] = useState(null);
  const [isPredicting, setIsPredicting] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  // Debounced AI category prediction as user types
  useEffect(() => {
    if (!description || description.trim().length < 3) {
      setAiSuggestion(null);
      return;
    }
    const timer = setTimeout(async () => {
      try {
        setIsPredicting(true);
        const res = await api.transactions.categorizePreview(description, parseFloat(amount) || 0);
        setAiSuggestion(res);
        if (!category) {
          setCategory(res.category);
        }
      } catch (err) {
        console.error('AI categorization error:', err);
      } finally {
        setIsPredicting(false);
      }
    }, 400);

    return () => clearTimeout(timer);
  }, [description]);

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!description.trim() || !amount) {
      setError('Please provide a valid description and amount.');
      return;
    }

    try {
      setSubmitting(true);
      setError('');
      const newTx = await api.transactions.create({
        date,
        description: description.trim(),
        amount: parseFloat(amount),
        category: category || undefined, // ML will infer if blank
        merchant: merchant.trim() || undefined,
        payment_method: paymentMethod,
        notes: notes.trim() || undefined
      });

      onTransactionAdded(newTx);
      onClose();
    } catch (err) {
      setError(err.message || 'Failed to save transaction');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={e => e.stopPropagation()}>
        {/* Modal Header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div style={{
              width: 36,
              height: 36,
              borderRadius: 10,
              background: 'linear-gradient(135deg, #6366f1, #a855f7)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#fff'
            }}>
              <Plus size={20} />
            </div>
            <div>
              <h3 style={{ fontSize: '1.2rem', color: '#fff' }}>Add Transaction</h3>
              <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                Powered by real-time ML Categorization & Anomaly Scan
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
            marginBottom: '16px',
            display: 'flex',
            alignItems: 'center',
            gap: '8px'
          }}>
            <AlertCircle size={16} />
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          {/* Description with live ML tag */}
          <div className="form-group">
            <label className="form-label">Expense Description *</label>
            <input
              type="text"
              className="form-input"
              placeholder="e.g. Swiggy biryani lunch, Metro recharge, Uber cab..."
              value={description}
              onChange={e => setDescription(e.target.value)}
              required
              autoFocus
            />

            {/* Live AI Suggestion Pill */}
            {aiSuggestion && (
              <div style={{
                marginTop: '6px',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                background: 'rgba(99, 102, 241, 0.12)',
                border: '1px solid rgba(99, 102, 241, 0.3)',
                padding: '6px 10px',
                borderRadius: '8px',
                fontSize: '0.78rem'
              }}>
                <Sparkles size={14} color="#818cf8" />
                <span style={{ color: 'var(--text-muted)' }}>AI Suggestion:</span>
                <strong style={{ color: '#a5b4fc' }}>{aiSuggestion.category}</strong>
                <span style={{ color: 'var(--text-dim)', fontSize: '0.72rem' }}>
                  ({Math.round(aiSuggestion.confidence * 100)}% match)
                </span>
                {category !== aiSuggestion.category && (
                  <button
                    type="button"
                    onClick={() => setCategory(aiSuggestion.category)}
                    style={{
                      marginLeft: 'auto',
                      background: '#6366f1',
                      border: 'none',
                      color: '#fff',
                      borderRadius: '4px',
                      padding: '2px 8px',
                      fontSize: '0.7rem',
                      cursor: 'pointer'
                    }}
                  >
                    Apply
                  </button>
                )}
              </div>
            )}
          </div>

          {/* Amount & Date */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
            <div className="form-group">
              <label className="form-label">Amount (₹) *</label>
              <input
                type="number"
                step="0.01"
                min="0.1"
                className="form-input"
                placeholder="₹ Amount"
                value={amount}
                onChange={e => setAmount(e.target.value)}
                required
              />
            </div>
            <div className="form-group">
              <label className="form-label">Date *</label>
              <input
                type="date"
                className="form-input"
                value={date}
                onChange={e => setDate(e.target.value)}
                required
              />
            </div>
          </div>

          {/* Category Dropdown */}
          <div className="form-group">
            <label className="form-label">Category</label>
            <select
              className="form-select"
              value={category}
              onChange={e => setCategory(e.target.value)}
            >
              <option value="">Auto-Assign via AI Classifier</option>
              {CATEGORIES.map(cat => (
                <option key={cat} value={cat}>{cat}</option>
              ))}
            </select>
          </div>

          {/* Merchant & Payment Method */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
            <div className="form-group">
              <label className="form-label">Merchant / Payee</label>
              <input
                type="text"
                className="form-input"
                placeholder="e.g. Zomato, Starbucks, D-Mart"
                value={merchant}
                onChange={e => setMerchant(e.target.value)}
              />
            </div>
            <div className="form-group">
              <label className="form-label">Payment Method</label>
              <select
                className="form-select"
                value={paymentMethod}
                onChange={e => setPaymentMethod(e.target.value)}
              >
                <option value="UPI">UPI (Google Pay / PhonePe / Paytm)</option>
                <option value="Card">Debit / Credit Card</option>
                <option value="NetBanking">Net Banking</option>
                <option value="Cash">Cash</option>
              </select>
            </div>
          </div>

          {/* Notes */}
          <div className="form-group">
            <label className="form-label">Notes (Optional)</label>
            <input
              type="text"
              className="form-input"
              placeholder="e.g. Shared with roommates, library assignment..."
              value={notes}
              onChange={e => setNotes(e.target.value)}
            />
          </div>

          {/* Actions */}
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', marginTop: '20px' }}>
            <button
              type="button"
              className="btn btn-secondary"
              onClick={onClose}
              disabled={submitting}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="btn btn-primary"
              disabled={submitting}
            >
              {submitting ? 'Scanning & Saving...' : 'Save Transaction'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
