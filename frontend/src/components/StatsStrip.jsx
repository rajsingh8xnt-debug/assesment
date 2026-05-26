import React from 'react';
import { ShieldAlert, Inbox, Play, CheckCircle, Archive } from 'lucide-react';

export default function StatsStrip({ stats, loading }) {
  const getStatusIcon = (status) => {
    switch (status) {
      case 'open': return <Inbox className="w-5 h-5 text-purple-400" />;
      case 'in_progress': return <Play className="w-5 h-5 text-cyan-400" />;
      case 'resolved': return <CheckCircle className="w-5 h-5 text-emerald-400" />;
      case 'closed': return <Archive className="w-5 h-5 text-gray-400" />;
      default: return null;
    }
  };

  const getStatusColorClass = (status) => {
    switch (status) {
      case 'open': return 'border-l-4 border-purple-500';
      case 'in_progress': return 'border-l-4 border-cyan-500';
      case 'resolved': return 'border-l-4 border-emerald-500';
      case 'closed': return 'border-l-4 border-gray-500';
      default: return '';
    }
  };

  const statusList = [
    { key: 'open', label: 'Open' },
    { key: 'in_progress', label: 'In Progress' },
    { key: 'resolved', label: 'Resolved' },
    { key: 'closed', label: 'Closed' }
  ];

  return (
    <div style={{
      display: 'grid',
      gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
      gap: '16px',
      marginBottom: '28px',
      animation: 'fadeInSlide 0.4s ease-out'
    }}>
      {statusList.map(({ key, label }) => {
        const count = stats?.statusCounts?.[key] ?? 0;
        return (
          <div 
            key={key}
            className={`glass ${getStatusColorClass(key)}`}
            style={{
              padding: '16px 20px',
              borderRadius: '12px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              transition: 'var(--transition-smooth)'
            }}
          >
            <div>
              <p style={{ 
                fontSize: '13px', 
                color: 'var(--text-secondary)',
                fontWeight: '500',
                textTransform: 'uppercase',
                letterSpacing: '0.05em',
                marginBottom: '4px'
              }}>
                {label}
              </p>
              <h3 style={{ 
                fontSize: '24px', 
                fontWeight: '700',
                fontFamily: 'var(--font-family-title)',
                color: 'var(--text-primary)'
              }}>
                {loading ? '—' : count}
              </h3>
            </div>
            <div style={{
              background: 'rgba(255, 255, 255, 0.03)',
              padding: '10px',
              borderRadius: '10px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}>
              {getStatusIcon(key)}
            </div>
          </div>
        );
      })}

      {/* SLA Breach glowing counter */}
      <div 
        className="glass"
        style={{
          padding: '16px 20px',
          borderRadius: '12px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          borderLeft: '4px solid var(--priority-urgent)',
          background: 'rgba(239, 68, 68, 0.03)',
          transition: 'var(--transition-smooth)'
        }}
      >
        <div>
          <p style={{ 
            fontSize: '13px', 
            color: 'var(--priority-urgent)',
            fontWeight: '600',
            textTransform: 'uppercase',
            letterSpacing: '0.05em',
            marginBottom: '4px'
          }}>
            Active SLA Breaches
          </p>
          <h3 style={{ 
            fontSize: '24px', 
            fontWeight: '700',
            fontFamily: 'var(--font-family-title)',
            color: '#ff6b6b',
            textShadow: stats?.openSlaBreachedCount > 0 ? '0 0 10px rgba(239, 68, 68, 0.3)' : 'none'
          }}>
            {loading ? '—' : stats?.openSlaBreachedCount ?? 0}
          </h3>
        </div>
        <div style={{
          background: stats?.openSlaBreachedCount > 0 ? 'rgba(239, 68, 68, 0.15)' : 'rgba(255, 255, 255, 0.03)',
          padding: '10px',
          borderRadius: '10px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          animation: stats?.openSlaBreachedCount > 0 ? 'pulse-breach 2s infinite' : 'none'
        }}>
          <ShieldAlert className="w-5 h-5 text-red-500" />
        </div>
      </div>
    </div>
  );
}
