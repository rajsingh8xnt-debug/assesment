import React, { useState, useEffect, useCallback } from 'react';
import Board from './components/Board';
import StatsStrip from './components/StatsStrip';
import TicketForm from './components/TicketForm';
import { Plus, Filter, RefreshCw, AlertCircle, CheckCircle, ShieldAlert, Layers } from 'lucide-react';

const API_BASE = import.meta.env.VITE_API_URL || '';

export default function App() {
  const [tickets, setTickets] = useState([]);
  const [stats, setStats] = useState({
    statusCounts: { open: 0, in_progress: 0, resolved: 0, closed: 0 },
    priorityCounts: { low: 0, medium: 0, high: 0, urgent: 0 },
    openSlaBreachedCount: 0
  });
  const [filters, setFilters] = useState({
    priority: 'all',
    breached: false
  });
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState('');
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [toasts, setToasts] = useState([]);

  // Toast helper
  const showToast = useCallback((message, type = 'success') => {
    const id = Date.now();
    setToasts(prev => [...prev, { id, message, type }]);
    setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== id));
    }, 4500);
  }, []);

  // Fetch Tickets
  const fetchTickets = useCallback(async (isSilent = false) => {
    if (!isSilent) setLoading(true);
    try {
      const params = new URLSearchParams();
      if (filters.priority !== 'all') {
        params.append('priority', filters.priority);
      }
      if (filters.breached) {
        params.append('breached', 'true');
      }

      const response = await fetch(`${API_BASE}/api/tickets?${params.toString()}`);
      if (!response.ok) {
        throw new Error('Failed to fetch tickets');
      }
      const data = await response.json();
      setTickets(data);
      setError('');
    } catch (err) {
      console.error(err);
      setError('Could not connect to DeskFlow API. Please verify the backend is running.');
    } finally {
      if (!isSilent) setLoading(false);
    }
  }, [filters]);

  // Fetch Stats
  const fetchStats = useCallback(async () => {
    try {
      const response = await fetch(`${API_BASE}/api/tickets/stats`);
      if (!response.ok) {
        throw new Error('Failed to fetch statistics');
      }
      const data = await response.json();
      setStats(data);
    } catch (err) {
      console.error('Stats fetch error:', err);
    }
  }, []);

  // Combined Initial Load & Refresher
  const loadData = useCallback(async (isSilent = false) => {
    if (isSilent) setRefreshing(true);
    await Promise.all([fetchTickets(isSilent), fetchStats()]);
    setRefreshing(false);
  }, [fetchTickets, fetchStats]);

  // Load data when filters change
  useEffect(() => {
    loadData();
  }, [loadData]);

  // Background ticker to keep ticket ages and SLAs updated every 30s
  useEffect(() => {
    const interval = setInterval(() => {
      loadData(true);
    }, 30000);
    return () => clearInterval(interval);
  }, [loadData]);

  // Handle ticket creation callback
  const handleTicketCreated = (newTicket) => {
    showToast(`Ticket #${newTicket._id.substring(18)} created successfully!`);
    loadData(true);
  };

  // Move / Transition ticket status
  const handleMoveTicket = async (ticketId, targetStatus) => {
    try {
      const response = await fetch(`${API_BASE}/api/tickets/${ticketId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ status: targetStatus })
      });

      const data = await response.json();

      if (!response.ok) {
        showToast(data.message || 'Transition disallowed', 'error');
        return false;
      }

      // Success
      showToast(`Ticket status updated to ${targetStatus.replace('_', ' ')}!`);
      // Update local state instantly for extreme responsiveness
      setTickets(prev => prev.map(t => t._id === ticketId ? data : t));
      // Refresh aggregates and virtual states in background
      fetchStats();
      return true;
    } catch (err) {
      showToast('Network error updating ticket', 'error');
      return false;
    }
  };

  // Delete ticket
  const handleDeleteTicket = async (ticketId) => {
    if (!window.confirm('Are you sure you want to delete this ticket?')) return;

    try {
      const response = await fetch(`${API_BASE}/api/tickets/${ticketId}`, {
        method: 'DELETE'
      });

      if (!response.ok) {
        throw new Error('Failed to delete ticket');
      }

      showToast('Ticket deleted successfully.', 'info');
      // Update states
      setTickets(prev => prev.filter(t => t._id !== ticketId));
      fetchStats();
    } catch (err) {
      showToast(err.message, 'error');
    }
  };

  return (
    <div style={{
      maxWidth: '1440px',
      margin: '0 auto',
      padding: '24px 32px 48px 32px',
      minHeight: '100vh',
      display: 'flex',
      flexDirection: 'column'
    }}>
      {/* Toast Notification Container */}
      <div style={{
        position: 'fixed',
        top: '24px',
        right: '24px',
        zIndex: 2000,
        display: 'flex',
        flexDirection: 'column',
        gap: '12px',
        maxWidth: '350px'
      }}>
        {toasts.map(t => (
          <div 
            key={t.id}
            className="glass animate-fade-in"
            style={{
              padding: '14px 20px',
              borderRadius: '10px',
              boxShadow: '0 10px 25px rgba(0,0,0,0.5)',
              display: 'flex',
              alignItems: 'center',
              gap: '12px',
              borderLeft: t.type === 'error' ? '4px solid #ef4444' : t.type === 'info' ? '4px solid #3b82f6' : '4px solid #10b981',
              background: '#0d111c'
            }}
          >
            {t.type === 'error' ? (
              <AlertCircle className="w-5 h-5 text-red-500" style={{ flexShrink: 0 }} />
            ) : t.type === 'info' ? (
              <CheckCircle className="w-5 h-5 text-blue-500" style={{ flexShrink: 0 }} />
            ) : (
              <CheckCircle className="w-5 h-5 text-emerald-500" style={{ flexShrink: 0 }} />
            )}
            <span style={{ fontSize: '13px', fontWeight: '600', color: 'var(--text-primary)' }}>
              {t.message}
            </span>
          </div>
        ))}
      </div>

      {/* Main Header */}
      <header style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingBottom: '24px',
        borderBottom: '1px solid var(--border-color)',
        marginBottom: '28px'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <div style={{
            background: 'linear-gradient(135deg, var(--color-progress), var(--color-open))',
            padding: '10px',
            borderRadius: '12px',
            boxShadow: '0 4px 15px rgba(6, 182, 212, 0.3)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}>
            <Layers className="w-7 h-7 text-white" />
          </div>
          <div>
            <h1 style={{ 
              fontSize: '28px', 
              fontWeight: '800',
              background: 'linear-gradient(to right, #ffffff, var(--text-secondary))',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent'
            }}>
              DeskFlow
            </h1>
            <p style={{ fontSize: '13px', color: 'var(--text-secondary)', marginTop: '2px' }}>
              Real-time Support Ticket Triage Board
            </p>
          </div>
        </div>

        {/* Global Action Bar */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <button 
            onClick={() => loadData(true)}
            disabled={refreshing}
            style={{
              background: 'rgba(255,255,255,0.03)',
              border: '1px solid var(--border-color)',
              borderRadius: '8px',
              padding: '10px 14px',
              color: 'var(--text-secondary)',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              transition: 'var(--transition-smooth)'
            }}
            onMouseOver={(e) => { e.currentTarget.style.color = 'var(--text-primary)'; e.currentTarget.style.borderColor = 'var(--border-glow)'; }}
            onMouseOut={(e) => { e.currentTarget.style.color = 'var(--text-secondary)'; e.currentTarget.style.borderColor = 'var(--border-color)'; }}
          >
            <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
            Sync
          </button>

          <button 
            onClick={() => setIsFormOpen(true)}
            style={{
              background: 'linear-gradient(135deg, var(--color-progress), var(--color-open))',
              border: 'none',
              borderRadius: '8px',
              padding: '10px 18px',
              color: '#ffffff',
              fontWeight: '700',
              fontSize: '13px',
              textTransform: 'uppercase',
              letterSpacing: '0.05em',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              boxShadow: '0 4px 15px rgba(6, 182, 212, 0.25)',
              transition: 'var(--transition-smooth)'
            }}
            onMouseOver={(e) => { e.currentTarget.style.transform = 'translateY(-1px)'; }}
            onMouseOut={(e) => { e.currentTarget.style.transform = 'translateY(0)'; }}
          >
            <Plus className="w-4.5 h-4.5" />
            Create Ticket
          </button>
        </div>
      </header>

      {/* Stats Bar */}
      <StatsStrip stats={stats} loading={loading} />

      {/* Filter and Control Bar */}
      <div className="glass" style={{
        padding: '16px 24px',
        borderRadius: '12px',
        marginBottom: '24px',
        display: 'flex',
        flexWrap: 'wrap',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: '16px'
      }}>
        {/* Left Side: Priority Filter */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--text-secondary)', fontSize: '13px', fontWeight: '600' }}>
            <Filter className="w-4 h-4" />
            Filter Priority:
          </div>
          <div style={{ display: 'flex', gap: '6px' }}>
            {['all', 'low', 'medium', 'high', 'urgent'].map(p => {
              const active = filters.priority === p;
              return (
                <button
                  key={p}
                  onClick={() => setFilters(prev => ({ ...prev, priority: p }))}
                  style={{
                    background: active ? 'rgba(255,255,255,0.08)' : 'transparent',
                    border: 'none',
                    borderRadius: '6px',
                    padding: '6px 12px',
                    color: active ? 'var(--text-primary)' : 'var(--text-muted)',
                    fontSize: '13px',
                    fontWeight: active ? '700' : '500',
                    cursor: 'pointer',
                    textTransform: 'capitalize',
                    transition: 'var(--transition-smooth)'
                  }}
                  onMouseOver={(e) => { if (!active) e.currentTarget.style.color = 'var(--text-secondary)'; }}
                  onMouseOut={(e) => { if (!active) e.currentTarget.style.color = 'var(--text-muted)'; }}
                >
                  {p}
                </button>
              );
            })}
          </div>
        </div>

        {/* Right Side: SLA Breach Toggle */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <label style={{
            display: 'flex',
            alignItems: 'center',
            gap: '10px',
            cursor: 'pointer',
            fontSize: '13px',
            fontWeight: '600',
            color: filters.breached ? '#ff6b6b' : 'var(--text-secondary)',
            transition: 'var(--transition-smooth)'
          }}>
            <input 
              type="checkbox"
              checked={filters.breached}
              onChange={(e) => setFilters(prev => ({ ...prev, breached: e.target.checked }))}
              style={{
                cursor: 'pointer',
                accentColor: 'var(--priority-urgent)',
                width: '16px',
                height: '16px'
              }}
            />
            Show SLA Breached Only
          </label>
        </div>
      </div>

      {/* Main Board Area */}
      {error ? (
        <div className="glass" style={{
          padding: '40px',
          borderRadius: '16px',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '16px',
          textAlign: 'center',
          border: '1px solid rgba(239, 68, 68, 0.2)',
          background: 'rgba(239, 68, 68, 0.02)',
          flex: 1
        }}>
          <AlertCircle className="w-12 h-12 text-red-500" />
          <h3 style={{ fontSize: '18px', fontWeight: '700', color: '#ff6b6b' }}>Connection Failure</h3>
          <p style={{ color: 'var(--text-secondary)', maxWidth: '450px', fontSize: '14px', lineHeight: '1.6' }}>
            {error}
          </p>
          <button
            onClick={() => loadData()}
            style={{
              background: 'rgba(255,255,255,0.05)',
              border: '1px solid var(--border-color)',
              borderRadius: '8px',
              padding: '10px 20px',
              color: 'var(--text-primary)',
              fontWeight: '600',
              cursor: 'pointer',
              marginTop: '8px'
            }}
          >
            Retry Connection
          </button>
        </div>
      ) : loading ? (
        <div style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          flex: 1,
          gap: '16px',
          color: 'var(--text-secondary)'
        }}>
          <RefreshCw className="w-8 h-8 animate-spin text-cyan-400" />
          <span style={{ fontSize: '14px', fontWeight: '500' }}>Loading DeskFlow board...</span>
        </div>
      ) : (
        <Board 
          tickets={tickets} 
          onMoveTicket={handleMoveTicket}
          onDeleteTicket={handleDeleteTicket}
        />
      )}

      {/* Side Slide-Over Form */}
      <TicketForm 
        isOpen={isFormOpen} 
        onClose={() => setIsFormOpen(false)}
        onTicketCreated={handleTicketCreated}
      />
    </div>
  );
}
