import React, { useState } from 'react';
import { X, Send, AlertTriangle } from 'lucide-react';

export default function TicketForm({ isOpen, onClose, onTicketCreated }) {
  const [formData, setFormData] = useState({
    subject: '',
    description: '',
    customerEmail: '',
    priority: 'medium'
  });
  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [serverError, setServerError] = useState('');

  const validate = () => {
    const tempErrors = {};
    if (!formData.subject.trim()) tempErrors.subject = 'Subject is required';
    if (!formData.description.trim()) tempErrors.description = 'Description is required';
    
    if (!formData.customerEmail.trim()) {
      tempErrors.customerEmail = 'Customer email is required';
    } else {
      const emailRegex = /^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/;
      if (!emailRegex.test(formData.customerEmail)) {
        tempErrors.customerEmail = 'Please enter a valid email address';
      }
    }

    if (!formData.priority) tempErrors.priority = 'Priority is required';

    setErrors(tempErrors);
    return Object.keys(tempErrors).length === 0;
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    // Clear validation error when editing field
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
    setServerError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) return;

    setIsSubmitting(true);
    setServerError('');

    try {
      const response = await fetch('/api/tickets', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(formData)
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Failed to create ticket');
      }

      // Success
      setFormData({
        subject: '',
        description: '',
        customerEmail: '',
        priority: 'medium'
      });
      onTicketCreated(data);
      onClose();
    } catch (err) {
      setServerError(err.message || 'An error occurred. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      width: '100vw',
      height: '100vh',
      backgroundColor: 'rgba(0, 0, 0, 0.65)',
      backdropFilter: 'blur(8px)',
      zIndex: 1000,
      display: 'flex',
      justifyContent: 'flex-end',
      transition: 'var(--transition-smooth)'
    }} onClick={onClose}>
      <div 
        style={{
          width: '100%',
          maxWidth: '480px',
          height: '100%',
          backgroundColor: '#0d111c',
          borderLeft: '1px solid var(--border-color)',
          boxShadow: 'var(--shadow-glow)',
          padding: '32px',
          display: 'flex',
          flexDirection: 'column',
          overflowY: 'auto',
          animation: 'fadeInSlide 0.25s cubic-bezier(0.16, 1, 0.3, 1) forwards'
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: '32px',
          borderBottom: '1px solid var(--border-color)',
          paddingBottom: '16px'
        }}>
          <div>
            <h2 style={{ fontSize: '22px', fontWeight: '700', color: 'var(--text-primary)' }}>
              Create Support Ticket
            </h2>
            <p style={{ fontSize: '13px', color: 'var(--text-secondary)', marginTop: '4px' }}>
              Submit a customer request for triage.
            </p>
          </div>
          <button 
            onClick={onClose}
            style={{
              background: 'rgba(255,255,255,0.05)',
              border: 'none',
              padding: '8px',
              borderRadius: '8px',
              cursor: 'pointer',
              color: 'var(--text-secondary)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              transition: 'var(--transition-smooth)'
            }}
            onMouseOver={(e) => { e.currentTarget.style.color = '#ef4444'; e.currentTarget.style.background = 'rgba(239,68,68,0.1)'; }}
            onMouseOut={(e) => { e.currentTarget.style.color = 'var(--text-secondary)'; e.currentTarget.style.background = 'rgba(255,255,255,0.05)'; }}
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Server Error Alert */}
        {serverError && (
          <div style={{
            background: 'rgba(239, 68, 68, 0.08)',
            border: '1px solid rgba(239, 68, 68, 0.3)',
            borderRadius: '8px',
            padding: '12px 16px',
            display: 'flex',
            alignItems: 'flex-start',
            gap: '12px',
            marginBottom: '24px'
          }}>
            <AlertTriangle className="w-5 h-5 text-red-500" style={{ flexShrink: 0, marginTop: '2px' }} />
            <span style={{ fontSize: '14px', color: '#ff6b6b', fontWeight: '500' }}>{serverError}</span>
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '20px', flex: 1 }}>
          {/* Subject */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <label style={{ fontSize: '13px', fontWeight: '600', color: 'var(--text-primary)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              Subject *
            </label>
            <input 
              type="text" 
              name="subject"
              value={formData.subject}
              onChange={handleChange}
              placeholder="e.g. Can't log into billing portal"
              style={{
                background: 'rgba(255,255,255,0.03)',
                border: errors.subject ? '1px solid #ef4444' : '1px solid var(--border-color)',
                borderRadius: '8px',
                padding: '12px 16px',
                color: 'var(--text-primary)',
                fontFamily: 'var(--font-family-body)',
                fontSize: '14px',
                outline: 'none',
                transition: 'var(--transition-smooth)'
              }}
              onFocus={(e) => { if (!errors.subject) e.currentTarget.style.borderColor = 'var(--color-progress)'; }}
              onBlur={(e) => { if (!errors.subject) e.currentTarget.style.borderColor = 'var(--border-color)'; }}
            />
            {errors.subject && (
              <span style={{ fontSize: '12px', color: '#ef4444', fontWeight: '500' }}>{errors.subject}</span>
            )}
          </div>

          {/* Customer Email */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <label style={{ fontSize: '13px', fontWeight: '600', color: 'var(--text-primary)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              Customer Email *
            </label>
            <input 
              type="text" 
              name="customerEmail"
              value={formData.customerEmail}
              onChange={handleChange}
              placeholder="e.g. john@customer.com"
              style={{
                background: 'rgba(255,255,255,0.03)',
                border: errors.customerEmail ? '1px solid #ef4444' : '1px solid var(--border-color)',
                borderRadius: '8px',
                padding: '12px 16px',
                color: 'var(--text-primary)',
                fontFamily: 'var(--font-family-body)',
                fontSize: '14px',
                outline: 'none',
                transition: 'var(--transition-smooth)'
              }}
              onFocus={(e) => { if (!errors.customerEmail) e.currentTarget.style.borderColor = 'var(--color-progress)'; }}
              onBlur={(e) => { if (!errors.customerEmail) e.currentTarget.style.borderColor = 'var(--border-color)'; }}
            />
            {errors.customerEmail && (
              <span style={{ fontSize: '12px', color: '#ef4444', fontWeight: '500' }}>{errors.customerEmail}</span>
            )}
          </div>

          {/* Priority */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <label style={{ fontSize: '13px', fontWeight: '600', color: 'var(--text-primary)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              Priority *
            </label>
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(4, 1fr)',
              gap: '8px'
            }}>
              {['low', 'medium', 'high', 'urgent'].map(p => {
                const getPColor = (pr) => {
                  if (pr === 'low') return 'var(--priority-low)';
                  if (pr === 'medium') return 'var(--priority-medium)';
                  if (pr === 'high') return 'var(--priority-high)';
                  return 'var(--priority-urgent)';
                };
                const isSelected = formData.priority === p;
                return (
                  <button
                    type="button"
                    key={p}
                    onClick={() => {
                      setFormData(prev => ({ ...prev, priority: p }));
                      setServerError('');
                    }}
                    style={{
                      background: isSelected ? getPColor(p) : 'rgba(255,255,255,0.03)',
                      border: isSelected ? 'none' : '1px solid var(--border-color)',
                      borderRadius: '8px',
                      padding: '10px 4px',
                      color: isSelected ? '#000000' : 'var(--text-secondary)',
                      fontWeight: '700',
                      fontSize: '12px',
                      textTransform: 'uppercase',
                      cursor: 'pointer',
                      transition: 'var(--transition-smooth)'
                    }}
                  >
                    {p}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Description */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', flex: 1 }}>
            <label style={{ fontSize: '13px', fontWeight: '600', color: 'var(--text-primary)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              Description *
            </label>
            <textarea 
              name="description"
              value={formData.description}
              onChange={handleChange}
              placeholder="Provide a detailed description of the issue..."
              style={{
                background: 'rgba(255,255,255,0.03)',
                border: errors.description ? '1px solid #ef4444' : '1px solid var(--border-color)',
                borderRadius: '8px',
                padding: '12px 16px',
                color: 'var(--text-primary)',
                fontFamily: 'var(--font-family-body)',
                fontSize: '14px',
                outline: 'none',
                resize: 'none',
                minHeight: '120px',
                flex: 1,
                transition: 'var(--transition-smooth)'
              }}
              onFocus={(e) => { if (!errors.description) e.currentTarget.style.borderColor = 'var(--color-progress)'; }}
              onBlur={(e) => { if (!errors.description) e.currentTarget.style.borderColor = 'var(--border-color)'; }}
            />
            {errors.description && (
              <span style={{ fontSize: '12px', color: '#ef4444', fontWeight: '500' }}>{errors.description}</span>
            )}
          </div>

          {/* Submit Action */}
          <button 
            type="submit"
            disabled={isSubmitting}
            style={{
              background: 'linear-gradient(135deg, var(--color-progress), var(--color-open))',
              border: 'none',
              borderRadius: '8px',
              padding: '14px 20px',
              color: '#ffffff',
              fontWeight: '700',
              fontSize: '14px',
              textTransform: 'uppercase',
              letterSpacing: '0.05em',
              cursor: isSubmitting ? 'not-allowed' : 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '10px',
              marginTop: '12px',
              boxShadow: '0 4px 15px rgba(6, 182, 212, 0.25)',
              opacity: isSubmitting ? 0.7 : 1,
              transition: 'var(--transition-smooth)'
            }}
            onMouseOver={(e) => { if (!isSubmitting) e.currentTarget.style.transform = 'translateY(-1px)'; }}
            onMouseOut={(e) => { if (!isSubmitting) e.currentTarget.style.transform = 'translateY(0)'; }}
          >
            <Send className="w-4 h-4" />
            {isSubmitting ? 'Submitting...' : 'Submit Ticket'}
          </button>
        </form>
      </div>
    </div>
  );
}
