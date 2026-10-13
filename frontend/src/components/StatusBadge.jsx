import React from 'react';
import { AlertCircle, CheckCircle2, Sparkles, Check, X, ShieldAlert } from 'lucide-react';

/**
 * Reusable StatusBadge component providing consistent semantic colors and icons.
 * Clearly separates:
 * - itemType: 'LOST' | 'FOUND'
 * - itemStatus: 'OPEN' | 'RESOLVED'
 * - matchStatus: 'SUGGESTED' | 'CONFIRMED' | 'REJECTED'
 */
export const StatusBadge = ({ itemType, itemStatus, matchStatus, size = 'sm', className = '' }) => {
  // 1. Item Type (Lost vs Found)
  if (itemType) {
    const isLost = String(itemType).toUpperCase() === 'LOST';
    return (
      <span 
        className={`badge ${isLost ? 'badge-lost' : 'badge-found'} ${className}`}
        style={{
          fontSize: size === 'xs' ? '0.675rem' : size === 'sm' ? '0.75rem' : '0.8125rem',
          padding: size === 'xs' ? '0.15rem 0.45rem' : '0.2rem 0.55rem',
          fontWeight: 700,
          letterSpacing: '0.02em',
        }}
      >
        {isLost ? <AlertCircle size={size === 'xs' ? 10 : 12} /> : <CheckCircle2 size={size === 'xs' ? 10 : 12} />}
        {isLost ? 'LOST' : 'FOUND'}
      </span>
    );
  }

  // 2. Match Status (Suggested vs Confirmed vs Rejected)
  if (matchStatus) {
    const status = String(matchStatus).toUpperCase();
    if (status === 'CONFIRMED') {
      return (
        <span 
          className={`badge badge-found ${className}`}
          style={{
            fontSize: size === 'xs' ? '0.675rem' : '0.75rem',
            padding: '0.2rem 0.55rem',
            fontWeight: 700,
          }}
        >
          <Check size={12} strokeWidth={2.4} /> Confirmed Match
        </span>
      );
    }
    if (status === 'REJECTED') {
      return (
        <span 
          className={`badge badge-open ${className}`}
          style={{
            fontSize: size === 'xs' ? '0.675rem' : '0.75rem',
            padding: '0.2rem 0.55rem',
            fontWeight: 600,
            color: 'var(--text-muted)',
          }}
        >
          <X size={12} strokeWidth={2.4} /> Rejected
        </span>
      );
    }
    // Default SUGGESTED
    return (
      <span 
        className={`badge badge-matched ${className}`}
        style={{
          fontSize: size === 'xs' ? '0.675rem' : '0.75rem',
          padding: '0.2rem 0.55rem',
          fontWeight: 700,
        }}
      >
        <Sparkles size={12} /> Suggested
      </span>
    );
  }

  // 3. Item Status (Open vs Resolved)
  if (itemStatus) {
    const status = String(itemStatus).toUpperCase();
    if (status === 'RESOLVED') {
      return (
        <span 
          className={`badge badge-resolved ${className}`}
          style={{
            fontSize: size === 'xs' ? '0.675rem' : '0.75rem',
            padding: '0.2rem 0.55rem',
            fontWeight: 700,
          }}
        >
          <CheckCircle2 size={12} /> Resolved
        </span>
      );
    }
    return (
      <span 
        className={`badge badge-open ${className}`}
        style={{
          fontSize: size === 'xs' ? '0.675rem' : '0.75rem',
          padding: '0.2rem 0.55rem',
          fontWeight: 600,
        }}
      >
        Open Listing
      </span>
    );
  }

  return null;
};
