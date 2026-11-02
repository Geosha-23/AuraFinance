import React, { useState, useEffect } from 'react';
import { useAuth } from './context/AuthContext';
import Navbar from './components/Navbar';
import AnomalyAlertBanner from './components/AnomalyAlertBanner';
import AddTransactionModal from './components/AddTransactionModal';
import CsvImportModal from './components/CsvImportModal';
import Dashboard from './pages/Dashboard';
import Transactions from './pages/Transactions';
import Budgets from './pages/Budgets';
import Analytics from './pages/Analytics';
import Login from './pages/Login';
import Register from './pages/Register';
import { api } from './api/client';

export default function App() {
  const { isAuthenticated, loading } = useAuth();
  const [authView, setAuthView] = useState('login'); // 'login' or 'register'
  
  // App state
  const [activeTab, setActiveTab] = useState('dashboard');
  const [selectedMonth, setSelectedMonth] = useState('2026-10');
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  
  // Modals
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [isImportOpen, setIsImportOpen] = useState(false);

  // Alerts
  const [alerts, setAlerts] = useState([]);

  const triggerRefresh = () => setRefreshTrigger(prev => prev + 1);

  // Poll alerts on month change or refresh
  useEffect(() => {
    if (isAuthenticated) {
      api.analytics.getAlerts(selectedMonth)
        .then(res => setAlerts(res || []))
        .catch(err => console.error('Error fetching alerts:', err));
    }
  }, [isAuthenticated, selectedMonth, refreshTrigger]);

  if (loading) {
    return (
      <div style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'var(--bg-dark)',
        color: 'var(--text-muted)'
      }}>
        Loading AuraFinance Intelligence...
      </div>
    );
  }

  if (!isAuthenticated) {
    if (authView === 'register') {
      return <Register onSwitchToLogin={() => setAuthView('login')} />;
    }
    return <Login onSwitchToRegister={() => setAuthView('register')} />;
  }

  return (
    <div style={{ minHeight: '100vh', paddingBottom: '60px' }}>
      {/* Top Glass Navbar */}
      <Navbar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        selectedMonth={selectedMonth}
        setSelectedMonth={setSelectedMonth}
        anomaliesCount={alerts.filter(a => a.type === 'anomaly' || a.type === 'duplicate').length}
      />

      {/* Real-time Dynamic Alert Banner */}
      <AnomalyAlertBanner
        alerts={alerts}
        onInspect={() => setActiveTab('analytics')}
      />

      {/* Main Tab View */}
      <main>
        {activeTab === 'dashboard' && (
          <Dashboard
            selectedMonth={selectedMonth}
            onNavigateTab={setActiveTab}
            onOpenAddModal={() => setIsAddOpen(true)}
            onOpenImportModal={() => setIsImportOpen(true)}
            refreshTrigger={refreshTrigger}
          />
        )}

        {activeTab === 'transactions' && (
          <Transactions
            selectedMonth={selectedMonth}
            onOpenAddModal={() => setIsAddOpen(true)}
            onOpenImportModal={() => setIsImportOpen(true)}
            refreshTrigger={refreshTrigger}
            onDataChanged={triggerRefresh}
          />
        )}

        {activeTab === 'budgets' && (
          <Budgets
            selectedMonth={selectedMonth}
            refreshTrigger={refreshTrigger}
            onDataChanged={triggerRefresh}
          />
        )}

        {activeTab === 'analytics' && (
          <Analytics
            selectedMonth={selectedMonth}
            refreshTrigger={refreshTrigger}
            onDataChanged={triggerRefresh}
          />
        )}
      </main>

      {/* Modals */}
      <AddTransactionModal
        isOpen={isAddOpen}
        onClose={() => setIsAddOpen(false)}
        onTransactionAdded={() => triggerRefresh()}
      />

      <CsvImportModal
        isOpen={isImportOpen}
        onClose={() => setIsImportOpen(false)}
        onImportSuccess={() => triggerRefresh()}
      />
    </div>
  );
}
