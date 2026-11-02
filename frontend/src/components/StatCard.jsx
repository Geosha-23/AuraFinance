import React from 'react';

export default function StatCard({ 
  title, 
  value, 
  subvalue, 
  icon: Icon, 
  accent = '#6366f1', 
  badge,
  badgeType = 'default',
  progress = null,
  onClick
}) {
  return (
    <div 
      className={`glass-card ${onClick ? 'interactive' : ''}`}
      style={{
        padding: '20px',
        position: 'relative',
        overflow: 'hidden',
        cursor: onClick ? 'pointer' : 'default'
      }}
      onClick={onClick}
    >
      {/* Background glow orb */}
      <div style={{
        position: 'absolute',
        top: '-20px',
        right: '-20px',
        width: '90px',
        height: '90px',
        borderRadius: '50%',
        background: accent,
        opacity: 0.12,
        filter: 'blur(30px)',
        pointerEvents: 'none'
      }} />

      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '12px' }}>
        <span style={{ fontSize: '0.82rem', fontWeight: 600, color: 'var(--text-muted)', letterSpacing: '0.02em' }}>
          {title}
        </span>
        <div style={{
          width: 36,
          height: 36,
          borderRadius: 10,
          background: `rgba(${accent === '#6366f1' ? '99,102,241' : accent === '#10b981' ? '16,185,129' : accent === '#f59e0b' ? '245,158,11' : '244,63,94'}, 0.15)`,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: accent
        }}>
          {Icon && <Icon size={18} />}
        </div>
      </div>

      <div style={{ display: 'flex', alignItems: 'baseline', gap: '8px', marginBottom: '6px' }}>
        <span style={{ fontSize: '1.65rem', fontWeight: 800, fontFamily: 'var(--font-heading)', color: '#fff' }}>
          {value}
        </span>
        {badge && (
          <span className={`badge ${
            badgeType === 'emerald' ? 'badge-emerald' :
            badgeType === 'amber' ? 'badge-amber' :
            badgeType === 'rose' ? 'badge-rose' : 'badge-primary'
          }`}>
            {badge}
          </span>
        )}
      </div>

      {subvalue && (
        <div style={{ fontSize: '0.78rem', color: 'var(--text-dim)' }}>
          {subvalue}
        </div>
      )}

      {progress !== null && (
        <div style={{ marginTop: '12px' }}>
          <div style={{
            height: '6px',
            background: 'rgba(255,255,255,0.06)',
            borderRadius: '999px',
            overflow: 'hidden'
          }}>
            <div style={{
              width: `${Math.min(100, Math.max(0, progress))}%`,
              height: '100%',
              background: progress >= 100 ? '#f43f5e' : progress >= 80 ? '#f59e0b' : accent,
              borderRadius: '999px',
              transition: 'width 0.5s ease'
            }} />
          </div>
        </div>
      )}
    </div>
  );
}
