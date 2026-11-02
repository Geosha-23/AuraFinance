import React from 'react';
import { 
  TrendingUp, 
  ShieldAlert, 
  CreditCard, 
  PieChart, 
  Sparkles, 
  LogOut, 
  Calendar,
  Layers
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export default function Navbar({ activeTab, setActiveTab, selectedMonth, setSelectedMonth, anomaliesCount = 0 }) {
  const { user, logout } = useAuth();

  const months = [
    { value: '2026-10', label: 'October 2026' },
    { value: '2026-09', label: 'September 2026' },
    { value: '2026-08', label: 'August 2026' },
  ];

  return (
    <nav style={{
      position: 'sticky',
      top: 0,
      zIndex: 100,
      background: 'rgba(12, 16, 26, 0.85)',
      backdropFilter: 'blur(16px)',
      borderBottom: '1px solid var(--border-light)',
      padding: '12px 24px',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      gap: '16px'
    }}>
      {/* Brand */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px', cursor: 'pointer' }} onClick={() => setActiveTab('dashboard')}>
        <div style={{
          width: 40,
          height: 40,
          borderRadius: 12,
          background: 'linear-gradient(135deg, #6366f1 0%, #a855f7 100%)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          boxShadow: '0 4px 16px rgba(99, 102, 241, 0.4)'
        }}>
          <Sparkles size={22} color="#fff" />
        </div>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{ fontSize: '1.25rem', fontWeight: 800, letterSpacing: '-0.02em', color: '#fff' }}>
              AuraFinance
            </span>
            <span style={{
              fontSize: '0.68rem',
              fontWeight: 700,
              padding: '2px 6px',
              borderRadius: 6,
              background: 'linear-gradient(90deg, #6366f1, #06b6d4)',
              color: '#fff',
              textTransform: 'uppercase',
              letterSpacing: '0.05em'
            }}>
              AI 2.0
            </span>
          </div>
          <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
            Expense Anomaly & Forecast Engine
          </span>
        </div>
      </div>

      {/* Navigation tabs */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '6px', background: 'rgba(255,255,255,0.03)', padding: '4px', borderRadius: '12px', border: '1px solid var(--border-light)' }}>
        <button
          className={`btn ${activeTab === 'dashboard' ? 'btn-primary' : 'btn-secondary'}`}
          style={{ padding: '8px 14px', fontSize: '0.85rem', border: 'none' }}
          onClick={() => setActiveTab('dashboard')}
        >
          <PieChart size={16} />
          Dashboard
        </button>

        <button
          className={`btn ${activeTab === 'transactions' ? 'btn-primary' : 'btn-secondary'}`}
          style={{ padding: '8px 14px', fontSize: '0.85rem', border: 'none' }}
          onClick={() => setActiveTab('transactions')}
        >
          <CreditCard size={16} />
          Transactions
        </button>

        <button
          className={`btn ${activeTab === 'budgets' ? 'btn-primary' : 'btn-secondary'}`}
          style={{ padding: '8px 14px', fontSize: '0.85rem', border: 'none' }}
          onClick={() => setActiveTab('budgets')}
        >
          <Layers size={16} />
          Budgets
        </button>

        <button
          className={`btn ${activeTab === 'analytics' ? 'btn-primary' : 'btn-secondary'}`}
          style={{ padding: '8px 14px', fontSize: '0.85rem', border: 'none', position: 'relative' }}
          onClick={() => setActiveTab('analytics')}
        >
          <TrendingUp size={16} />
          AI & Anomalies
          {anomaliesCount > 0 && (
            <span style={{
              background: '#f43f5e',
              color: '#fff',
              fontSize: '0.7rem',
              fontWeight: 700,
              padding: '1px 6px',
              borderRadius: '999px',
              marginLeft: '4px'
            }}>
              {anomaliesCount}
            </span>
          )}
        </button>
      </div>

      {/* Right Controls: Month Selector & User */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
        {/* Month Selector */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', background: 'rgba(15,20,32,0.9)', padding: '6px 12px', borderRadius: '10px', border: '1px solid var(--border-light)' }}>
          <Calendar size={15} color="var(--text-muted)" />
          <select
            value={selectedMonth}
            onChange={(e) => setSelectedMonth(e.target.value)}
            style={{
              background: 'transparent',
              border: 'none',
              color: 'var(--text-main)',
              fontSize: '0.85rem',
              fontWeight: 600,
              outline: 'none',
              cursor: 'pointer'
            }}
          >
            {months.map(m => (
              <option key={m.value} value={m.value} style={{ background: '#111726' }}>
                {m.label}
              </option>
            ))}
          </select>
        </div>

        {/* User Profile & Logout */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <div style={{ textAlign: 'right' }}>
            <div style={{ fontSize: '0.85rem', fontWeight: 600, color: '#fff' }}>
              {user?.name || 'Student'}
            </div>
            <div style={{ fontSize: '0.72rem', color: 'var(--text-dim)' }}>
              Allowance: ₹{Number(user?.monthly_allowance || 15000).toLocaleString('en-IN')}
            </div>
          </div>
          <button
            onClick={logout}
            title="Log out"
            style={{
              background: 'rgba(255,255,255,0.06)',
              border: '1px solid var(--border-light)',
              borderRadius: '10px',
              width: 36,
              height: 36,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
              color: 'var(--text-muted)',
              transition: 'all 0.2s'
            }}
            onMouseOver={(e) => e.currentTarget.style.color = '#f43f5e'}
            onMouseOut={(e) => e.currentTarget.style.color = 'var(--text-muted)'}
          >
            <LogOut size={16} />
          </button>
        </div>
      </div>
    </nav>
  );
}
