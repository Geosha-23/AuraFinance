import React, { useState, useEffect } from 'react';
import { 
  Search, 
  Filter, 
  Plus, 
  UploadCloud, 
  Trash2, 
  AlertTriangle, 
  Copy, 
  Sparkles, 
  Edit2, 
  Check, 
  X,
  RefreshCw,
  HelpCircle
} from 'lucide-react';
import { api } from '../api/client';
import { formatCurrency, formatDate, getCategoryColor } from '../utils/formatters';

const CATEGORIES = [
  "All",
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

export default function Transactions({ 
  selectedMonth, 
  onOpenAddModal, 
  onOpenImportModal,
  refreshTrigger,
  onDataChanged
}) {
  const [transactions, setTransactions] = useState([]);
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('All');
  const [onlyAnomalies, setOnlyAnomalies] = useState(false);
  const [loading, setLoading] = useState(true);
  const [editingId, setEditingId] = useState(null);
  const [editCategory, setEditCategory] = useState('');
  const [deletingId, setDeletingId] = useState(null);

  const loadTransactions = async () => {
    try {
      setLoading(true);
      const data = await api.transactions.list(selectedMonth, categoryFilter, onlyAnomalies);
      setTransactions(data);
    } catch (err) {
      console.error('Error fetching transactions:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadTransactions();
  }, [selectedMonth, categoryFilter, onlyAnomalies, refreshTrigger]);

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this transaction?')) return;
    try {
      setDeletingId(id);
      await api.transactions.delete(id);
      setTransactions(prev => prev.filter(t => t.id !== id));
      if (onDataChanged) onDataChanged();
    } catch (err) {
      alert(err.message || 'Failed to delete transaction.');
    } finally {
      setDeletingId(null);
    }
  };

  const handleSaveCategoryEdit = async (tx) => {
    try {
      const updated = await api.transactions.update(tx.id, {
        category: editCategory
      });
      setTransactions(prev => prev.map(t => t.id === tx.id ? updated : t));
      setEditingId(null);
      if (onDataChanged) onDataChanged();
    } catch (err) {
      alert(err.message || 'Failed to update category.');
    }
  };

  const filteredTransactions = transactions.filter(t => {
    if (!search.trim()) return true;
    const q = search.toLowerCase();
    return (
      t.description.toLowerCase().includes(q) ||
      (t.merchant && t.merchant.toLowerCase().includes(q)) ||
      (t.category && t.category.toLowerCase().includes(q)) ||
      (t.payment_method && t.payment_method.toLowerCase().includes(q))
    );
  });

  return (
    <div style={{ padding: '24px', maxWidth: '1440px', margin: '0 auto' }}>
      {/* Top Header */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: '16px',
        marginBottom: '20px'
      }}>
        <div>
          <h1 style={{ fontSize: '1.75rem', fontWeight: 800, color: '#fff' }}>
            Transaction Ledger
          </h1>
          <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginTop: '2px' }}>
            Review, filter, edit categories, and investigate AI anomaly alerts
          </p>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <button className="btn btn-secondary" onClick={onOpenImportModal}>
            <UploadCloud size={16} /> Import Bank Statement
          </button>
          <button className="btn btn-primary" onClick={onOpenAddModal}>
            <Plus size={16} /> Add Transaction
          </button>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="glass-card" style={{ padding: '16px 20px', marginBottom: '20px' }}>
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: '14px'
        }}>
          {/* Search box */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '10px',
            background: 'rgba(15,20,32,0.8)',
            border: '1px solid var(--border-light)',
            borderRadius: '10px',
            padding: '8px 14px',
            flex: '1 1 260px'
          }}>
            <Search size={16} color="var(--text-dim)" />
            <input
              type="text"
              placeholder="Search by description, merchant, or payment method..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              style={{
                background: 'transparent',
                border: 'none',
                color: 'var(--text-main)',
                fontSize: '0.88rem',
                outline: 'none',
                width: '100%'
              }}
            />
            {search && (
              <X 
                size={14} 
                color="var(--text-dim)" 
                style={{ cursor: 'pointer' }} 
                onClick={() => setSearch('')} 
              />
            )}
          </div>

          {/* Category Dropdown */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Category:</span>
            <select
              className="form-select"
              value={categoryFilter}
              onChange={e => setCategoryFilter(e.target.value)}
              style={{ padding: '8px 12px', fontSize: '0.85rem', width: 'auto' }}
            >
              {CATEGORIES.map(c => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
          </div>

          {/* Anomaly Only Toggle */}
          <label style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            fontSize: '0.85rem',
            color: onlyAnomalies ? '#fda4af' : 'var(--text-muted)',
            cursor: 'pointer',
            userSelect: 'none'
          }}>
            <input
              type="checkbox"
              checked={onlyAnomalies}
              onChange={e => setOnlyAnomalies(e.target.checked)}
              style={{ accentColor: '#f43f5e', cursor: 'pointer', width: 16, height: 16 }}
            />
            <AlertTriangle size={15} color={onlyAnomalies ? '#fb7185' : 'var(--text-dim)'} />
            Show Only Anomalies & Duplicates
          </label>
        </div>
      </div>

      {/* Transactions Table */}
      <div className="glass-card" style={{ padding: '20px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
          <div style={{ fontSize: '0.88rem', color: 'var(--text-muted)' }}>
            Showing <strong>{filteredTransactions.length}</strong> transactions
          </div>
        </div>

        {loading ? (
          <div style={{ padding: '40px', textAlign: 'center', color: 'var(--text-dim)' }}>
            Loading ledger records...
          </div>
        ) : filteredTransactions.length > 0 ? (
          <div className="data-table-container">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Date</th>
                  <th>Description</th>
                  <th>Category</th>
                  <th>Merchant / Payee</th>
                  <th>Method</th>
                  <th>Amount</th>
                  <th>AI Analysis</th>
                  <th style={{ textAlign: 'right' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredTransactions.map(tx => (
                  <tr key={tx.id} className={tx.is_anomaly ? 'row-anomaly' : ''}>
                    <td style={{ color: 'var(--text-muted)', fontFamily: 'var(--font-mono)', fontSize: '0.82rem' }}>
                      {formatDate(tx.date)}
                    </td>

                    <td>
                      <div style={{ fontWeight: 600, color: '#fff' }}>{tx.description}</div>
                      {tx.notes && <div style={{ fontSize: '0.72rem', color: 'var(--text-dim)' }}>{tx.notes}</div>}
                    </td>

                    <td>
                      {editingId === tx.id ? (
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                          <select
                            className="form-select"
                            value={editCategory}
                            onChange={e => setEditCategory(e.target.value)}
                            style={{ padding: '4px 8px', fontSize: '0.78rem' }}
                          >
                            {CATEGORIES.filter(c => c !== 'All').map(c => (
                              <option key={c} value={c}>{c}</option>
                            ))}
                          </select>
                          <button
                            onClick={() => handleSaveCategoryEdit(tx)}
                            style={{ background: '#10b981', border: 'none', color: '#fff', borderRadius: '4px', padding: '4px', cursor: 'pointer' }}
                            title="Save and train ML model"
                          >
                            <Check size={14} />
                          </button>
                          <button
                            onClick={() => setEditingId(null)}
                            style={{ background: 'transparent', border: 'none', color: 'var(--text-dim)', cursor: 'pointer' }}
                          >
                            <X size={14} />
                          </button>
                        </div>
                      ) : (
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
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
                          <button
                            onClick={() => {
                              setEditingId(tx.id);
                              setEditCategory(tx.category);
                            }}
                            title="Re-classify category (AI will learn from your correction)"
                            style={{ background: 'transparent', border: 'none', color: 'var(--text-dim)', cursor: 'pointer' }}
                          >
                            <Edit2 size={12} />
                          </button>
                        </div>
                      )}
                    </td>

                    <td style={{ color: 'var(--text-muted)' }}>
                      {tx.merchant || '—'}
                    </td>

                    <td>
                      <span className="badge" style={{ background: 'rgba(255,255,255,0.05)', color: 'var(--text-muted)' }}>
                        {tx.payment_method || 'UPI'}
                      </span>
                    </td>

                    <td style={{ fontWeight: 700, fontFamily: 'var(--font-heading)', color: '#fff', fontSize: '0.95rem' }}>
                      {formatCurrency(tx.amount)}
                    </td>

                    <td>
                      {tx.is_duplicate ? (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                          <span className="badge badge-amber" style={{ width: 'fit-content' }}>
                            <Copy size={11} /> Duplicate Detected
                          </span>
                          <span style={{ fontSize: '0.7rem', color: '#fde68a' }}>
                            {tx.anomaly_reason}
                          </span>
                        </div>
                      ) : tx.is_anomaly ? (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                          <span className="badge badge-rose" style={{ width: 'fit-content' }}>
                            <AlertTriangle size={11} /> Anomaly ({Math.round(tx.anomaly_score * 100)}%)
                          </span>
                          <span style={{ fontSize: '0.7rem', color: '#fda4af' }}>
                            {tx.anomaly_reason}
                          </span>
                        </div>
                      ) : (
                        <span className="badge badge-emerald">
                          Normal
                        </span>
                      )}
                    </td>

                    <td style={{ textAlign: 'right' }}>
                      <button
                        onClick={() => handleDelete(tx.id)}
                        disabled={deletingId === tx.id}
                        style={{
                          background: 'rgba(244,63,94,0.1)',
                          border: '1px solid rgba(244,63,94,0.2)',
                          color: '#fb7185',
                          borderRadius: '8px',
                          padding: '6px 8px',
                          cursor: 'pointer',
                          transition: 'all 0.2s'
                        }}
                        title="Delete transaction"
                      >
                        <Trash2 size={14} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div style={{ textAlign: 'center', padding: '40px', color: 'var(--text-dim)' }}>
            No matching transactions found. Try adjusting your search query or filters.
          </div>
        )}
      </div>
    </div>
  );
}
