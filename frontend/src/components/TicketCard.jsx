import React, { useState, useEffect } from 'react';
import { ArrowLeft, ArrowRight, Clock, AlertTriangle, User, Trash2 } from 'lucide-react';

export default function TicketCard({ ticket, onMove, onDelete }) {
  const [isUpdating, setIsUpdating] = useState(false);
  const [shakeError, setShakeError] = useState(false);

  useEffect(() => {
    const handleShake = (e) => {
      if (e.detail?.id === ticket._id) {
        triggerShake();
      }
    };
    window.addEventListener('ticket-shake-error', handleShake);
    return () => window.removeEventListener('ticket-shake-error', handleShake);
  }, [ticket._id]);


  // Formatter for ageMinutes
  const formatAge = (mins) => {
    if (!mins || mins < 0) return '0m';
    if (mins < 60) return `${mins}m`;
    const hours = Math.floor(mins / 60);
    const remMins = mins % 60;
    if (hours < 24) return `${hours}h ${remMins}m`;
    const days = Math.floor(hours / 24);
    const remHours = hours % 24;
    return `${days}d ${remHours}h`;
  };

  const getPriorityBadgeStyle = (priority) => {
    switch (priority) {
      case 'urgent':
        return { background: 'rgba(239, 68, 68, 0.1)', color: 'var(--priority-urgent)', border: '1px solid rgba(239, 68, 68, 0.2)' };
      case 'high':
        return { background: 'rgba(249, 115, 22, 0.1)', color: 'var(--priority-high)', border: '1px solid rgba(249, 115, 22, 0.2)' };
      case 'medium':
        return { background: 'rgba(234, 179, 8, 0.1)', color: 'var(--priority-medium)', border: '1px solid rgba(234, 179, 8, 0.2)' };
      case 'low':
      default:
        return { background: 'rgba(59, 130, 246, 0.1)', color: 'var(--priority-low)', border: '1px solid rgba(59, 130, 246, 0.2)' };
    }
  };

  // Determine transition directions
  const getAdjacentTransitions = (status) => {
    switch (status) {
      case 'open':
        return { prev: null, next: 'in_progress' };
      case 'in_progress':
        return { prev: 'open', next: 'resolved' };
      case 'resolved':
        return { prev: 'in_progress', next: 'closed' };
      case 'closed':
        return { prev: 'resolved', next: null };
      default:
        return { prev: null, next: null };
    }
  };

  const transitions = getAdjacentTransitions(ticket.status);

  const handleTransition = async (targetStatus) => {
    if (!targetStatus) return;
    setIsUpdating(true);
    try {
      const success = await onMove(ticket._id, targetStatus);
      if (!success) {
        triggerShake();
      }
    } catch (err) {
      triggerShake();
    } finally {
      setIsUpdating(false);
    }
  };

  const triggerShake = () => {
    setShakeError(true);
    setTimeout(() => setShakeError(false), 400);
  };

  // HTML5 Drag Start
  const handleDragStart = (e) => {
    e.dataTransfer.setData('text/plain', ticket._id);
    e.dataTransfer.setData('current-status', ticket.status);
    e.dataTransfer.effectAllowed = 'move';
    e.currentTarget.style.opacity = '0.4';
  };

  const handleDragEnd = (e) => {
    e.currentTarget.style.opacity = '1';
  };

  return (
    <div
      draggable
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
      className={`glass ${ticket.slaBreached && (ticket.status === 'open' || ticket.status === 'in_progress') ? 'animate-pulse-breach' : ''} ${shakeError ? 'animate-shake' : ''}`}
      style={{
        padding: '18px',
        borderRadius: '12px',
        display: 'flex',
        flexDirection: 'column',
        gap: '12px',
        cursor: 'grab',
        transition: 'border-color 0.2s, box-shadow 0.2s, transform 0.2s',
        border: shakeError ? '1px solid #ef4444' : '1px solid var(--border-color)',
        opacity: isUpdating ? 0.6 : 1,
        position: 'relative'
      }}
      onMouseOver={(e) => {
        if (!shakeError) {
          e.currentTarget.style.borderColor = 'var(--border-glow)';
          e.currentTarget.style.transform = 'translateY(-2px)';
        }
      }}
      onMouseOut={(e) => {
        if (!shakeError) {
          e.currentTarget.style.borderColor = 'var(--border-color)';
          e.currentTarget.style.transform = 'translateY(0)';
        }
      }}
    >
      {/* SLA Breach Banner */}
      {ticket.slaBreached && (
        <div style={{
          position: 'absolute',
          top: '-10px',
          right: '12px',
          background: 'var(--priority-urgent)',
          color: '#ffffff',
          fontSize: '10px',
          fontWeight: '800',
          textTransform: 'uppercase',
          padding: '2px 8px',
          borderRadius: '4px',
          boxShadow: 'var(--shadow-neon-red)',
          display: 'flex',
          alignItems: 'center',
          gap: '4px'
        }}>
          <AlertTriangle className="w-3 h-3" />
          SLA Breached
        </div>
      )}

      {/* Top row: Priority & Age */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <span style={{
          ...getPriorityBadgeStyle(ticket.priority),
          fontSize: '11px',
          fontWeight: '700',
          textTransform: 'uppercase',
          padding: '3px 8px',
          borderRadius: '6px',
          letterSpacing: '0.05em'
        }}>
          {ticket.priority}
        </span>
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '4px',
          color: ticket.slaBreached ? '#ff6b6b' : 'var(--text-secondary)',
          fontSize: '12px',
          fontWeight: '500'
        }}>
          <Clock className="w-3.5 h-3.5" />
          {formatAge(ticket.ageMinutes)}
        </div>
      </div>

      {/* Title / Subject */}
      <div>
        <h4 style={{
          fontSize: '15px',
          fontWeight: '600',
          color: 'var(--text-primary)',
          lineHeight: '1.4',
          wordBreak: 'break-word'
        }}>
          {ticket.subject}
        </h4>
        <p style={{
          fontSize: '13px',
          color: 'var(--text-secondary)',
          marginTop: '6px',
          lineHeight: '1.5',
          wordBreak: 'break-word',
          display: '-webkit-box',
          WebkitLineClamp: 2,
          WebkitBoxOrient: 'vertical',
          overflow: 'hidden'
        }}>
          {ticket.description}
        </p>
      </div>

      {/* Customer Email info */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        gap: '6px',
        fontSize: '12px',
        color: 'var(--text-muted)',
        borderTop: '1px solid rgba(255,255,255,0.05)',
        paddingTop: '10px',
        marginTop: '2px'
      }}>
        <User className="w-3.5 h-3.5" />
        <span style={{ textOverflow: 'ellipsis', overflow: 'hidden', whiteSpace: 'nowrap', maxWidth: '100%' }}>
          {ticket.customerEmail}
        </span>
      </div>

      {/* Bottom actions: Delete, Quick Transitions */}
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginTop: '4px'
      }}>
        <button
          onClick={() => onDelete(ticket._id)}
          disabled={isUpdating}
          style={{
            background: 'transparent',
            border: 'none',
            color: 'var(--text-muted)',
            cursor: 'pointer',
            padding: '6px',
            borderRadius: '6px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            transition: 'var(--transition-smooth)'
          }}
          onMouseOver={(e) => { e.currentTarget.style.color = '#ef4444'; e.currentTarget.style.background = 'rgba(239, 68, 68, 0.08)'; }}
          onMouseOut={(e) => { e.currentTarget.style.color = 'var(--text-muted)'; e.currentTarget.style.background = 'transparent'; }}
        >
          <Trash2 className="w-4 h-4" />
        </button>

        <div style={{ display: 'flex', gap: '6px' }}>
          {/* Back Transition Button */}
          {transitions.prev && (
            <button
              onClick={() => handleTransition(transitions.prev)}
              disabled={isUpdating}
              title={`Move back to ${transitions.prev}`}
              style={{
                background: 'rgba(255, 255, 255, 0.03)',
                border: '1px solid var(--border-color)',
                color: 'var(--text-secondary)',
                borderRadius: '6px',
                padding: '6px 8px',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                transition: 'var(--transition-smooth)'
              }}
              onMouseOver={(e) => { e.currentTarget.style.borderColor = 'var(--color-progress)'; e.currentTarget.style.color = 'var(--text-primary)'; }}
              onMouseOut={(e) => { e.currentTarget.style.borderColor = 'var(--border-color)'; e.currentTarget.style.color = 'var(--text-secondary)'; }}
            >
              <ArrowLeft className="w-3.5 h-3.5" />
            </button>
          )}

          {/* Forward Transition Button */}
          {transitions.next && (
            <button
              onClick={() => handleTransition(transitions.next)}
              disabled={isUpdating}
              title={`Move to ${transitions.next}`}
              style={{
                background: 'rgba(255, 255, 255, 0.03)',
                border: '1px solid var(--border-color)',
                color: 'var(--text-secondary)',
                borderRadius: '6px',
                padding: '6px 8px',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                transition: 'var(--transition-smooth)'
              }}
              onMouseOver={(e) => { e.currentTarget.style.borderColor = 'var(--color-progress)'; e.currentTarget.style.color = 'var(--text-primary)'; }}
              onMouseOut={(e) => { e.currentTarget.style.borderColor = 'var(--border-color)'; e.currentTarget.style.color = 'var(--text-secondary)'; }}
            >
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
