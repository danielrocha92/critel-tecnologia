import React from 'react';

const pulseStyle = {
  animation: 'pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite',
  backgroundColor: 'rgba(50, 57, 76, 0.5)',
  borderRadius: '4px',
};

export function SkeletonHistory() {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', padding: '16px' }}>
      <style>{`
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: .5; }
        }
      `}</style>
      {Array.from({ length: 3 }).map((_, i) => (
        <div key={i} style={{ display: 'flex', gap: '12px' }}>
          <div style={{ ...pulseStyle, width: '40px', height: '40px', borderRadius: '50%' }}></div>
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <div style={{ ...pulseStyle, width: '150px', height: '16px' }}></div>
            <div style={{ ...pulseStyle, width: '100%', height: '60px', borderRadius: '8px' }}></div>
          </div>
        </div>
      ))}
    </div>
  );
}
