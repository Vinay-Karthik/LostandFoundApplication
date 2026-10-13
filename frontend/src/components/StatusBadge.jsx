import React from 'react';

export const StatusBadge = ({ status }) => {
  const norm = (status || 'OPEN').toUpperCase();

  switch (norm) {
    case 'OPEN':
      return <span className="badge badge-open">Open</span>;
    case 'MATCHED':
      return <span className="badge badge-matched">Matched</span>;
    case 'RESOLVED':
      return <span className="badge badge-resolved">Resolved</span>;
    case 'REMOVED':
      return <span className="badge badge-lost">Removed</span>;
    case 'FOUND':
      return <span className="badge badge-found">Found</span>;
    case 'LOST':
      return <span className="badge badge-lost">Lost</span>;
    default:
      return <span className="badge badge-open">{status}</span>;
  }
};
