import React from 'react';
import { ArrowDownToLine, ArrowUpFromLine, X, Info } from 'lucide-react';
import { useClassroomStore } from '../../store/useClassroomStore';

export const StationConsoleModal: React.FC = () => {
  const activeStation = useClassroomStore((s) => s.activeStation);
  const setActiveStation = useClassroomStore((s) => s.setActiveStation);
  const stackDiscs = useClassroomStore((s) => s.stackDiscs);
  const pushStackDisc = useClassroomStore((s) => s.pushStackDisc);
  const popStackDisc = useClassroomStore((s) => s.popStackDisc);

  if (activeStation !== 'stack_lab') return null;

  const topDisc = stackDiscs[stackDiscs.length - 1];
  const isFull = stackDiscs.length >= 6;
  const isEmpty = stackDiscs.length === 0;

  return (
    <div
      style={{
        position: 'fixed',
        bottom: '24px',
        right: '24px',
        width: '420px',
        zIndex: 50,
      }}
      className="ui-interactive"
    >
      <div
        className="glass-panel"
        style={{
          padding: '20px',
          border: '1px solid rgba(245, 158, 11, 0.4)',
          boxShadow: '0 0 30px rgba(245, 158, 11, 0.18)',
        }}
      >
        {/* Header Bar */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: '#f59e0b', boxShadow: '0 0 8px #f59e0b' }}></span>
            <span style={{ fontFamily: 'var(--font-display)', fontSize: '12px', letterSpacing: '0.1em', color: '#f59e0b', textTransform: 'uppercase', fontWeight: 700 }}>
              Stack Lab Apparatus
            </span>
          </div>

          <button
            onClick={() => setActiveStation(null)}
            className="cyber-button"
            style={{ padding: '4px 8px', fontSize: '11px', color: 'var(--text-muted)' }}
            title="Exit Console [ESC]"
          >
            <X size={14} />
          </button>
        </div>

        {/* Title & Concept Badge */}
        <h2 style={{ fontFamily: 'var(--font-display)', fontSize: '18px', fontWeight: 800, color: 'var(--text-primary)', margin: '0 0 4px 0' }}>
          Kinetic LIFO Cylinder
        </h2>
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '16px' }}>
          <span className="glass-pill" style={{ color: '#00f0ff', borderColor: 'rgba(0, 240, 255, 0.3)' }}>
            LIFO (Last-In, First-Out)
          </span>
          <span className="glass-pill" style={{ color: '#f59e0b' }}>
            Capacity: {stackDiscs.length} / 6
          </span>
        </div>

        {/* Live Telemetry Display */}
        <div
          style={{
            background: 'rgba(0, 0, 0, 0.35)',
            borderRadius: '8px',
            padding: '12px',
            marginBottom: '16px',
            border: '1px solid var(--border-subtle)',
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', marginBottom: '6px' }}>
            <span style={{ color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>Top Element (Peek):</span>
            <span style={{ color: topDisc ? '#00f0ff' : 'var(--text-muted)', fontWeight: 700, fontFamily: 'var(--font-mono)' }}>
              {topDisc ? `[ ${topDisc.value} ]` : 'NULL (EMPTY)'}
            </span>
          </div>

          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px' }}>
            <span style={{ color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>Stack Contents (Top → Base):</span>
            <span style={{ color: 'var(--text-primary)', fontFamily: 'var(--font-mono)', fontSize: '11px' }}>
              {isEmpty ? '[]' : stackDiscs.slice().reverse().map((d) => d.value).join(' → ')}
            </span>
          </div>
        </div>

        {/* Push & Pop Interactive Controls */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginBottom: '14px' }}>
          <button
            onClick={() => pushStackDisc()}
            disabled={isFull}
            className="cyber-button"
            style={{
              padding: '10px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '6px',
              background: isFull ? 'rgba(255,255,255,0.02)' : 'rgba(0, 240, 255, 0.15)',
              borderColor: isFull ? 'transparent' : 'var(--cyan-core)',
              color: isFull ? 'var(--text-muted)' : 'var(--cyan-core)',
              cursor: isFull ? 'not-allowed' : 'pointer',
              fontWeight: 600,
            }}
          >
            <ArrowDownToLine size={16} />
            Push Disc
          </button>

          <button
            onClick={() => popStackDisc()}
            disabled={isEmpty}
            className="cyber-button"
            style={{
              padding: '10px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '6px',
              background: isEmpty ? 'rgba(255,255,255,0.02)' : 'rgba(255, 0, 85, 0.15)',
              borderColor: isEmpty ? 'transparent' : 'var(--crimson-alert)',
              color: isEmpty ? 'var(--text-muted)' : '#ff6699',
              cursor: isEmpty ? 'not-allowed' : 'pointer',
              fontWeight: 600,
            }}
          >
            <ArrowUpFromLine size={16} />
            Pop Disc
          </button>
        </div>

        {/* Pedagogical Explanation Tip */}
        <div style={{ display: 'flex', gap: '8px', alignItems: 'flex-start', fontSize: '11px', color: 'var(--text-secondary)' }}>
          <Info size={14} color="#f59e0b" style={{ flexShrink: 0, marginTop: '2px' }} />
          <span>
            Notice the physical spring displacement: elements are strictly inserted at the top and removed from the top.
            This physical mechanism is identical to how the computer allocates call-stack frames during recursion!
          </span>
        </div>

        {/* Exit Helper */}
        <div style={{ marginTop: '12px', textAlign: 'center' }}>
          <button
            onClick={() => setActiveStation(null)}
            style={{
              background: 'transparent',
              border: 'none',
              color: 'var(--text-muted)',
              fontSize: '11px',
              cursor: 'pointer',
              textDecoration: 'underline',
            }}
          >
            Press [ESC] to return to Exploration Mode
          </button>
        </div>
      </div>
    </div>
  );
};
