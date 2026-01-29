import React from 'react';

export const Logo: React.FC<{ className?: string }> = ({ className = "" }) => (
  <svg viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
    <rect x="10" y="10" width="80" height="80" rx="10" stroke="currentColor" strokeWidth="8" />
  </svg>
);