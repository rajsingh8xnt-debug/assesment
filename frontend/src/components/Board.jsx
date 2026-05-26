import React from 'react';
import TicketCard from './TicketCard';
import { Inbox, Play, CheckCircle, Archive } from 'lucide-react';

const COLUMNS = [
  { key: 'open', label: 'Open', color: 'var(--color-open)', bgGlow: 'var(--color-open-glow)', icon: <Inbox className="w-5 h-5" /> },
  { key: 'in_progress', label: 'In Progress', color: 'var(--color-progress)', bgGlow: 'var(--color-progress-glow)', icon: <Play className="w-5 h-5" /> },
  { key: 'resolved', label: 'Resolved', color: 'var(--color-resolved)', bgGlow: 'var(--color-resolved-glow)', icon: <CheckCircle className="w-5 h-5" /> },
  { key: 'closed', label: 'Closed', color: 'var(--color-closed)', bgGlow: 'var(--color-closed-glow)', icon: <Archive className="w-5 h-5" /> }
];

const VALID_TRANSITIONS = {
  'open': ['in_progress'],
  'in_progress': ['open', 'resolved'],
  'resolved': ['in_progress', 'closed'],
  'closed': ['resolved']
};

export default function Board({ tickets, onMoveTicket, onDeleteTicket }) {
  
  const handleDragOver = (e) => {
    e.preventDefault();
    e.currentTarget.style.background = 'rgba(255, 255, 255, 0.02)';
    e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.15)';
  };

  const handleDragLeave = (e) => {
    e.currentTarget.style.background = 'transparent';
    e.currentTarget.style.borderColor = 'var(--border-color)';
  };

  const handleDrop = async (e, targetStatus) => {
    e.preventDefault();
    e.currentTarget.style.background = 'transparent';
    e.currentTarget.style.borderColor = 'var(--border-color)';

    const ticketId = e.dataTransfer.getData('text/plain');
    const currentStatus = e.dataTransfer.getData('current-status');

    if (!ticketId || !currentStatus) return;
    if (currentStatus === targetStatus) return;

    const allowed = VALID_TRANSITIONS[currentStatus] || [];
    if (allowed.includes(targetStatus)) {
      // Valid transition
      const success = await onMoveTicket(ticketId, targetStatus);
      if (!success) {
        // If API update failed, shake card
        window.dispatchEvent(new CustomEvent('ticket-shake-error', { detail: { id: ticketId } }));
      }
    } else {
      // Invalid transition: trigger card shake
      window.dispatchEvent(new CustomEvent('ticket-shake-error', { detail: { id: ticketId } }));
    }
  };

  return (
    <div style={{
      display: 'grid',
      gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
      gap: '20px',
      alignItems: 'stretch',
      minHeight: '65vh',
      width: '100%'
    }}>
      {COLUMNS.map(col => {
        const columnTickets = tickets.filter(t => t.status === col.key);

        return (
          <div
            key={col.key}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={(e) => handleDrop(e, col.key)}
            style={{
              display: 'flex',
              flexDirection: 'column',
              background: 'transparent',
              borderRadius: '16px',
              border: '1px solid var(--border-color)',
              padding: '16px',
              transition: 'var(--transition-smooth)',
              minHeight: '400px'
            }}
          >
            {/* Column Header */}
            <div style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              marginBottom: '16px',
              borderBottom: `2px solid ${col.color}`,
              paddingBottom: '12px'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: col.color }}>
                {col.icon}
                <h3 style={{ fontSize: '16px', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                  {col.label}
                </h3>
              </div>
              <span style={{
                background: col.bgGlow,
                color: col.color,
                fontSize: '12px',
                fontWeight: '700',
                padding: '2px 8px',
                borderRadius: '999px'
              }}>
                {columnTickets.length}
              </span>
            </div>

            {/* Column Tickets List */}
            <div style={{
              display: 'flex',
              flexDirection: 'column',
              gap: '12px',
              flex: 1,
              overflowY: 'auto',
              maxHeight: 'calc(100vh - 350px)',
              padding: '4px'
            }}>
              {columnTickets.length > 0 ? (
                columnTickets.map(ticket => (
                  <TicketCard
                    key={ticket._id}
                    ticket={ticket}
                    onMove={onMoveTicket}
                    onDelete={onDeleteTicket}
                  />
                ))
              ) : (
                <div style={{
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flex: 1,
                  color: 'var(--text-muted)',
                  fontSize: '14px',
                  border: '1px dashed rgba(255,255,255,0.05)',
                  borderRadius: '12px',
                  padding: '24px',
                  textAlign: 'center'
                }}>
                  No tickets in this status
                </div>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
