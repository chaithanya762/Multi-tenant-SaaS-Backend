import React from 'react';

export function Skeleton({ width = '100%', height = '20px' }) {
  return <div className="skeleton" style={{ width, height }}></div>;
}

export function SkeletonLines({ count = 3 }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginTop: '16px' }}>
      {Array.from({ length: count }).map((_, i) => (
        <Skeleton key={i} width="100%" height="40px" />
      ))}
    </div>
  );
}
