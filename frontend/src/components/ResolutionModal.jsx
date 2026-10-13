import React, { useEffect } from 'react';
import { CheckCircle2, X, Printer, ShieldCheck, Calendar, MapPin, Package, Download } from 'lucide-react';
import confetti from 'canvas-confetti';
import { format } from 'date-fns';

export const ResolutionModal = ({ isOpen, onClose, item }) => {
  useEffect(() => {
    if (isOpen) {
      confetti({
        particleCount: 70,
        spread: 70,
        origin: { y: 0.6 },
      });
    }
  }, [isOpen]);

  if (!isOpen || !item) return null;

  const handlePrint = () => {
    window.print();
  };

  const receiptId = `CT-${new Date().getFullYear()}-#${String(item.id).padStart(5, '0')}`;

  return (
    <div style={{
      position: 'fixed',
      inset: 0,
      backgroundColor: 'rgba(0, 0, 0, 0.7)',
      backdropFilter: 'blur(5px)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 9999,
      padding: '1rem',
    }}>
      <div className="surface-card" style={{
        width: '100%',
        maxWidth: 520,
        backgroundColor: 'var(--bg-surface)',
        borderRadius: 'var(--radius-lg)',
        padding: '2rem',
        display: 'flex',
        flexDirection: 'column',
        gap: '1.25rem',
        boxShadow: 'var(--shadow-lg)',
      }}>
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
            <div style={{
              width: 36,
              height: 36,
              borderRadius: 'var(--radius-full)',
              backgroundColor: 'var(--status-found-bg)',
              color: 'var(--status-found-text)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}>
              <CheckCircle2 size={20} />
            </div>
            <div>
              <h3 style={{ fontSize: '1.15rem', fontWeight: 800, color: 'var(--text-primary)' }}>
                Item Resolved & Reunited!
              </h3>
              <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                Official CampusTrack Handover Confirmation
              </span>
            </div>
          </div>

          <button 
            onClick={onClose}
            style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}
          >
            <X size={18} />
          </button>
        </div>

        {/* Digital Handover Receipt Card */}
        <div style={{
          backgroundColor: 'var(--bg-elevated)',
          border: '2px dashed var(--border-subtle)',
          borderRadius: 'var(--radius-md)',
          padding: '1.25rem',
          display: 'flex',
          flexDirection: 'column',
          gap: '1rem',
          position: 'relative',
        }}>
          {/* Watermark Seal */}
          <div style={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%) rotate(-15deg)',
            fontSize: '2.5rem',
            fontWeight: 900,
            color: 'rgba(34, 197, 94, 0.08)',
            pointerEvents: 'none',
            letterSpacing: '0.1em',
            textTransform: 'uppercase',
          }}>
            RESOLVED
          </div>

          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid var(--border-subtle)', paddingBottom: '0.5rem' }}>
            <span style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-muted)' }}>RECEIPT NO:</span>
            <span style={{ fontSize: '0.8rem', fontWeight: 800, color: 'var(--accent-blue)', fontFamily: 'monospace' }}>
              {receiptId}
            </span>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>ITEM NAME</div>
            <div style={{ fontSize: '1rem', fontWeight: 700, color: 'var(--text-primary)' }}>
              {item.title}
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem', fontSize: '0.8125rem' }}>
            <div>
              <span style={{ color: 'var(--text-muted)', fontSize: '0.7rem' }}>CATEGORY</span>
              <div style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{item.category || 'General'}</div>
            </div>

            <div>
              <span style={{ color: 'var(--text-muted)', fontSize: '0.7rem' }}>TYPE</span>
              <div style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{item.type} Listing</div>
            </div>

            <div>
              <span style={{ color: 'var(--text-muted)', fontSize: '0.7rem' }}>LOCATION</span>
              <div style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{item.location || 'Campus'}</div>
            </div>

            <div>
              <span style={{ color: 'var(--text-muted)', fontSize: '0.7rem' }}>RESOLUTION DATE</span>
              <div style={{ fontWeight: 600, color: 'var(--text-primary)' }}>
                {format(new Date(), 'MMM dd, yyyy')}
              </div>
            </div>
          </div>

          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem',
            backgroundColor: 'var(--bg-surface)',
            padding: '0.6rem 0.85rem',
            borderRadius: 'var(--radius-sm)',
            border: '1px solid var(--border-subtle)',
            fontSize: '0.75rem',
            color: 'var(--text-secondary)',
          }}>
            <ShieldCheck size={16} color="#16A34A" />
            <span>Verified recovery confirmed on CampusTrack Lost & Found network.</span>
          </div>
        </div>

        {/* Actions */}
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem' }}>
          <button
            onClick={handlePrint}
            className="btn btn-secondary btn-sm"
            style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}
          >
            <Printer size={14} /> Print Receipt
          </button>

          <button
            onClick={onClose}
            className="btn btn-primary btn-sm"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
};
