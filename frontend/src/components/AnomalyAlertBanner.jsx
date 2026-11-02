import React, { useState } from 'react';
import { AlertTriangle, Copy, ShieldAlert, ArrowRight, X } from 'lucide-react';

export default function AnomalyAlertBanner({ alerts = [], onInspect }) {
  const [dismissed, setDismissed] = useState(false);

  if (dismissed || !alerts || alerts.length === 0) return null;

  // Find most critical alert
  const dangerAlerts = alerts.filter(a => a.severity === 'danger');
  const warningAlerts = alerts.filter(a => a.severity === 'warning');
  const primaryAlert = dangerAlerts[0] || warningAlerts[0] || alerts[0];
  const totalIssues = alerts.length;

  return (
    <div style={{
      margin: '16px 24px 0 24px',
      background: dangerAlerts.length > 0 
        ? 'linear-gradient(90deg, rgba(244,63,94,0.18) 0%, rgba(17,23,38,0.95) 100%)'
        : 'linear-gradient(90deg, rgba(245,158,11,0.18) 0%, rgba(17,23,38,0.95) 100%)',
      border: `1px solid ${dangerAlerts.length > 0 ? 'rgba(244,63,94,0.4)' : 'rgba(245,158,11,0.4)'}`,
      borderRadius: '16px',
      padding: '12px 20px',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      gap: '16px',
      boxShadow: dangerAlerts.length > 0 ? '0 0 24px rgba(244,63,94,0.18)' : '0 0 24px rgba(245,158,11,0.15)'
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
        <div style={{
          width: 36,
          height: 36,
          borderRadius: '10px',
          background: dangerAlerts.length > 0 ? 'rgba(244,63,94,0.2)' : 'rgba(245,158,11,0.2)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: dangerAlerts.length > 0 ? '#fb7185' : '#fbbf24'
        }}>
          {primaryAlert.type === 'duplicate' ? (
            <Copy size={20} />
          ) : (
            <ShieldAlert size={20} className="anomaly-pulse" />
          )}
        </div>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{
              fontSize: '0.88rem',
              fontWeight: 700,
              color: dangerAlerts.length > 0 ? '#fda4af' : '#fde68a'
            }}>
              {primaryAlert.title}
            </span>
            {totalIssues > 1 && (
              <span style={{
                fontSize: '0.72rem',
                background: 'rgba(255,255,255,0.1)',
                padding: '2px 8px',
                borderRadius: '999px',
                color: 'var(--text-muted)'
              }}>
                +{totalIssues - 1} more issue{totalIssues > 2 ? 's' : ''} detected
              </span>
            )}
          </div>
          <div style={{ fontSize: '0.8rem', color: 'var(--text-main)', marginTop: '2px' }}>
            {primaryAlert.message}
          </div>
        </div>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
        <button
          className="btn btn-sm"
          style={{
            background: dangerAlerts.length > 0 ? '#f43f5e' : '#f59e0b',
            color: '#fff',
            border: 'none',
            fontWeight: 700
          }}
          onClick={onInspect}
        >
          Review Issues <ArrowRight size={14} />
        </button>
        <button
          onClick={() => setDismissed(true)}
          style={{
            background: 'transparent',
            border: 'none',
            color: 'var(--text-dim)',
            cursor: 'pointer',
            padding: '4px'
          }}
          title="Dismiss"
        >
          <X size={16} />
        </button>
      </div>
    </div>
  );
}
