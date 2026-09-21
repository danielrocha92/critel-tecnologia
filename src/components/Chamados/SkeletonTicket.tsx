import React from 'react';

const pulseStyle = {
  animation: 'pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite',
  backgroundColor: 'rgba(50, 57, 76, 0.5)',
  borderRadius: '4px',
  height: '16px',
};

export function SkeletonRow() {
  return (
    <>
      <style>{`
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: .5; }
        }
      `}</style>
      <tr>
        <td><div style={{ ...pulseStyle, width: '40px' }}></div></td>
        <td><div style={{ ...pulseStyle, width: '200px' }}></div></td>
        <td><div style={{ ...pulseStyle, width: '120px' }}></div></td>
        <td><div style={{ ...pulseStyle, width: '80px', borderRadius: '12px' }}></div></td>
        <td><div style={{ ...pulseStyle, width: '80px' }}></div></td>
        <td><div style={{ ...pulseStyle, width: '150px' }}></div></td>
        <td>
          <div style={{ ...pulseStyle, width: '80px', marginBottom: '4px' }}></div>
          <div style={{ ...pulseStyle, width: '60px', height: '12px' }}></div>
        </td>
        <td>
          <div style={{ ...pulseStyle, width: '80px', marginBottom: '4px' }}></div>
          <div style={{ ...pulseStyle, width: '60px', height: '12px' }}></div>
        </td>
        <td><div style={{ ...pulseStyle, width: '100px' }}></div></td>
        <td><div style={{ ...pulseStyle, width: '24px', height: '24px', borderRadius: '4px' }}></div></td>
      </tr>
    </>
  );
}
