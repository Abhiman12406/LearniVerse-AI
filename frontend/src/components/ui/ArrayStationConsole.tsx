import React, { useEffect, useState } from 'react';
import {
  X,
  Search,
  AlertTriangle,
  AlertOctagon,
  Zap,
  RotateCcw,
  Binary,
  Cpu,
  Terminal,
  Activity,
  Brain,
  Sparkles,
} from 'lucide-react';
import { useClassroomStore } from '../../store/useClassroomStore';

export const ArrayStationConsole: React.FC = () => {
  const activeStation = useClassroomStore((s) => s.activeStation);
  const setActiveStation = useClassroomStore((s) => s.setActiveStation);
  const demonstrateFeynmanAgent = useClassroomStore((s) => s.demonstrateFeynmanAgent);

  const arrayBays = useClassroomStore((s) => s.arrayBays);
  const arrayTargetIndex = useClassroomStore((s) => s.arrayTargetIndex);
  const arrayIsScanning = useClassroomStore((s) => s.arrayIsScanning);
  const arrayScanCurrentStep = useClassroomStore((s) => s.arrayScanCurrentStep);
  const arrayOutOfBounds = useClassroomStore((s) => s.arrayOutOfBounds);
  const arrayErrorMessage = useClassroomStore((s) => s.arrayErrorMessage);
  const arrayOperation = useClassroomStore((s) => s.arrayOperation);

  const jumpToArrayIndex = useClassroomStore((s) => s.jumpToArrayIndex);
  const runArrayLinearSearch = useClassroomStore((s) => s.runArrayLinearSearch);
  const updateArrayElement = useClassroomStore((s) => s.updateArrayElement);
  const clearArrayError = useClassroomStore((s) => s.clearArrayError);
  const resetArrayStation = useClassroomStore((s) => s.resetArrayStation);

  const [searchTarget, setSearchTarget] = useState<number>(78);
  const [editValue, setEditValue] = useState<string>('');

  const latestDeliberation = useClassroomStore((s) => s.latestDeliberation);
  const openTelemetry = useClassroomStore((s) => s.openTelemetry);
  const diagnosticResult = useClassroomStore((s) => s.diagnosticResult);

  const delib = diagnosticResult?.deliberation || latestDeliberation;
  const assignedMission = delib?.world_instructions?.active_mission;
  const decision = delib?.final_decision;
  const isArrayAssigned =
    delib?.world_instructions?.recommended_station === 'array_station' ||
    delib?.final_decision?.concept === 'array';

  // Keyboard navigation: [ESC] to exit, [0-4] to select index, [S] for linear search
  useEffect(() => {
    if (activeStation !== 'array_station') return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (['INPUT', 'TEXTAREA'].includes((e.target as HTMLElement)?.tagName)) return;

      if (e.key === 'Escape') {
        e.preventDefault();
        setActiveStation(null);
      } else if (e.key >= '0' && e.key <= '4') {
        e.preventDefault();
        jumpToArrayIndex(parseInt(e.key, 10));
      } else if (e.key.toLowerCase() === 's' && !e.ctrlKey && !e.metaKey) {
        e.preventDefault();
        if (!arrayIsScanning) {
          runArrayLinearSearch(searchTarget);
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [activeStation, arrayIsScanning, searchTarget, setActiveStation, jumpToArrayIndex, runArrayLinearSearch]);

  if (activeStation !== 'array_station') return null;

  const activeBay =
    arrayTargetIndex >= 0 && arrayTargetIndex < arrayBays.length
      ? arrayBays[arrayTargetIndex]
      : null;

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 50,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '1.5rem',
        backgroundColor: 'rgba(5, 10, 20, 0.75)',
        backdropFilter: 'blur(12px)',
        animation: 'fadeIn 0.25s ease-out',
      }}
    >
      <div
        className="ui-interactive"
        style={{
          position: 'relative',
          width: '100%',
          maxWidth: '920px',
          maxHeight: '90vh',
          display: 'flex',
          flexDirection: 'column',
          borderRadius: '16px',
          backgroundColor: '#0a0f1d',
          border: arrayOutOfBounds
            ? '1px solid rgba(239, 68, 68, 0.6)'
            : '1px solid rgba(16, 185, 129, 0.4)',
          boxShadow: arrayOutOfBounds
            ? '0 0 40px rgba(239, 68, 68, 0.25)'
            : '0 0 40px rgba(16, 185, 129, 0.15)',
          overflow: 'hidden',
          color: '#f8fafc',
          fontFamily: 'system-ui, -apple-system, sans-serif',
        }}
      >
        {/* Header Bar */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '1.25rem 1.5rem',
            borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
            backgroundColor: 'rgba(15, 23, 42, 0.6)',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <div
              style={{
                width: '38px',
                height: '38px',
                borderRadius: '8px',
                backgroundColor: arrayOutOfBounds
                  ? 'rgba(239, 68, 68, 0.2)'
                  : 'rgba(16, 185, 129, 0.2)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: arrayOutOfBounds ? '#ef4444' : '#10b981',
                border: arrayOutOfBounds
                  ? '1px solid rgba(239, 68, 68, 0.4)'
                  : '1px solid rgba(16, 185, 129, 0.4)',
              }}
            >
              {arrayOutOfBounds ? <AlertOctagon size={22} /> : <Binary size={22} />}
            </div>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <h2 style={{ fontSize: '1.25rem', fontWeight: 700, margin: 0, letterSpacing: '0.02em' }}>
                  ARRAY STATION
                </h2>
                <span
                  style={{
                    fontSize: '0.75rem',
                    fontWeight: 600,
                    padding: '0.15rem 0.5rem',
                    borderRadius: '9999px',
                    backgroundColor: 'rgba(16, 185, 129, 0.15)',
                    color: '#34d399',
                    border: '1px solid rgba(16, 185, 129, 0.3)',
                  }}
                >
                  O(1) RANDOM ACCESS VS O(n) SCAN
                </span>
              </div>
              <p style={{ margin: '0.2rem 0 0', fontSize: '0.85rem', color: '#94a3b8' }}>
                Contiguous physical memory slots with hardware pointer arithmetic
              </p>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <button
              id="btn-array-demonstrate-feynman"
              onClick={() => demonstrateFeynmanAgent('array')}
              style={{
                background: 'linear-gradient(135deg, rgba(168, 85, 247, 0.3), rgba(16, 185, 129, 0.2))',
                border: '1px solid rgba(168, 85, 247, 0.5)',
                borderRadius: '8px',
                padding: '0.5rem 0.75rem',
                color: '#f5f3ff',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '0.35rem',
                fontSize: '0.8rem',
                fontWeight: 700,
                boxShadow: '0 0 10px rgba(168, 85, 247, 0.25)',
              }}
              title="Demonstrate Feynman Multimodal Adaptive Explanation Agent for Array"
            >
              <Sparkles size={14} color="#c084fc" />
              <span>Demonstrate Feynman Agent</span>
            </button>

            <button
              id="btn-array-telemetry"
              onClick={() => openTelemetry('agents')}
              style={{
                background: 'rgba(168, 85, 247, 0.15)',
                border: '1px solid rgba(168, 85, 247, 0.4)',
                borderRadius: '8px',
                padding: '0.5rem 0.75rem',
                color: '#e9d5ff',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '0.35rem',
                fontSize: '0.8rem',
                fontWeight: 600,
              }}
              title="Inspect 5-Agent Deliberation in Telemetry Drawer"
            >
              <Activity size={15} color="#c084fc" />
              Telemetry
            </button>
            <button
              onClick={() => resetArrayStation()}
              title="Reset array elements and probe"
              style={{
                background: 'rgba(255, 255, 255, 0.05)',
                border: '1px solid rgba(255, 255, 255, 0.1)',
                borderRadius: '8px',
                padding: '0.5rem',
                color: '#94a3b8',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '0.35rem',
                fontSize: '0.8rem',
              }}
            >
              <RotateCcw size={15} />
              Reset
            </button>
            <button
              onClick={() => setActiveStation(null)}
              style={{
                background: 'rgba(255, 255, 255, 0.05)',
                border: '1px solid rgba(255, 255, 255, 0.1)',
                borderRadius: '8px',
                padding: '0.5rem',
                color: '#cbd5e1',
                cursor: 'pointer',
              }}
            >
              <X size={20} />
            </button>
          </div>
        </div>

        {/* Content Body */}
        <div
          style={{
            padding: '1.5rem',
            overflowY: 'auto',
            display: 'flex',
            flexDirection: 'column',
            gap: '1.25rem',
          }}
        >
          {/* LangGraph Mission Banner if Assigned */}
          {isArrayAssigned && (
            <div
              id="array-langgraph-mission-card"
              style={{
                padding: '12px 14px',
                borderRadius: '10px',
                background: 'linear-gradient(135deg, rgba(168, 85, 247, 0.14), rgba(16, 185, 129, 0.1))',
                border: '1px solid rgba(168, 85, 247, 0.35)',
                boxShadow: '0 4px 16px rgba(0, 0, 0, 0.4)',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '6px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '4px',
                      padding: '2px 8px',
                      borderRadius: '4px',
                      backgroundColor: 'rgba(168, 85, 247, 0.25)',
                      border: '1px solid rgba(168, 85, 247, 0.5)',
                      fontSize: '10px',
                      fontWeight: 700,
                      color: '#e9d5ff',
                      textTransform: 'uppercase',
                    }}
                  >
                    <Brain size={12} color="#c084fc" />
                    LangGraph Assigned Mission
                  </span>
                  <span
                    style={{
                      fontSize: '10px',
                      fontWeight: 700,
                      color: '#34d399',
                      backgroundColor: 'rgba(16, 185, 129, 0.15)',
                      padding: '2px 6px',
                      borderRadius: '4px',
                      border: '1px solid rgba(16, 185, 129, 0.3)',
                    }}
                  >
                    {decision?.action || 'PRACTICE'} ({decision?.difficulty || 'easy'})
                  </span>
                </div>
                <button
                  onClick={() => openTelemetry('agents')}
                  style={{
                    padding: '3px 8px',
                    fontSize: '10px',
                    borderRadius: '4px',
                    border: '1px solid rgba(168, 85, 247, 0.4)',
                    background: 'rgba(168, 85, 247, 0.15)',
                    color: '#e9d5ff',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '4px',
                  }}
                >
                  <Activity size={12} color="#c084fc" />
                  <span>Inspect Traces</span>
                </button>
              </div>

              <div style={{ fontSize: '13px', fontWeight: 700, color: '#f8fafc', marginBottom: '4px' }}>
                {assignedMission?.title || 'Operation Hardware-Probe: O(1) Memory Offsets'}
              </div>

              <p style={{ margin: '0 0 6px 0', fontSize: '11px', color: 'rgba(226, 232, 240, 0.85)', lineHeight: 1.4 }}>
                <strong>Objective: </strong>
                {assignedMission?.objective || 'Understand contiguous memory allocation and zero-based indexing.'}
              </p>
            </div>
          )}

          {/* Out of bounds alert banner */}
          {arrayOutOfBounds && (
            <div
              style={{
                display: 'flex',
                alignItems: 'flex-start',
                justifyContent: 'space-between',
                gap: '1rem',
                padding: '1rem',
                borderRadius: '10px',
                backgroundColor: 'rgba(239, 68, 68, 0.12)',
                border: '1px solid rgba(239, 68, 68, 0.4)',
                color: '#fca5a5',
              }}
            >
              <div style={{ display: 'flex', gap: '0.75rem' }}>
                <AlertTriangle size={22} color="#ef4444" style={{ flexShrink: 0, marginTop: '2px' }} />
                <div>
                  <div style={{ fontWeight: 700, fontSize: '0.95rem', color: '#f87171' }}>
                    BOUNDARY VIOLATION: ArrayIndexOutOfBoundsException
                  </div>
                  <div style={{ fontSize: '0.85rem', marginTop: '0.2rem', color: '#fecaca' }}>
                    {arrayErrorMessage || 'Hardware limit reached. Attempted access outside array length [5].'}
                  </div>
                  <div style={{ fontSize: '0.75rem', marginTop: '0.35rem', color: '#94a3b8' }}>
                    In contiguous memory, accessing indices &lt; 0 or &ge; size attempts to read unallocated memory, triggering a segmentation fault.
                  </div>
                </div>
              </div>
              <button
                onClick={clearArrayError}
                style={{
                  background: 'rgba(239, 68, 68, 0.25)',
                  border: '1px solid rgba(239, 68, 68, 0.5)',
                  borderRadius: '6px',
                  color: '#fff',
                  padding: '0.35rem 0.75rem',
                  fontSize: '0.8rem',
                  fontWeight: 600,
                  cursor: 'pointer',
                  flexShrink: 0,
                }}
              >
                Clear Error
              </button>
            </div>
          )}

          {/* Pointer Arithmetic Equation Card */}
          <div
            style={{
              padding: '1rem 1.25rem',
              borderRadius: '12px',
              backgroundColor: 'rgba(15, 23, 42, 0.7)',
              border: '1px solid rgba(255, 255, 255, 0.08)',
              display: 'flex',
              flexDirection: 'column',
              gap: '0.6rem',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.85rem', fontWeight: 600, color: '#94a3b8' }}>
                <Cpu size={16} color="#34d399" />
                POINTER ARITHMETIC ADDRESS FORMULA
              </div>
              <div style={{ fontSize: '0.8rem', color: '#64748b' }}>
                Word Size = 4 Bytes (32-bit Integer)
              </div>
            </div>

            <div
              style={{
                fontFamily: 'monospace',
                fontSize: '1.05rem',
                backgroundColor: 'rgba(0, 0, 0, 0.4)',
                padding: '0.75rem 1rem',
                borderRadius: '8px',
                border: '1px solid rgba(255, 255, 255, 0.05)',
                color: '#38bdf8',
                display: 'flex',
                alignItems: 'center',
                flexWrap: 'wrap',
                gap: '0.5rem',
              }}
            >
              <span>Address =</span>
              <span style={{ color: '#fbbf24' }}>Base (0x2000)</span>
              <span>+</span>
              <span>(</span>
              <span style={{ color: arrayOutOfBounds ? '#ef4444' : '#34d399', fontWeight: 700 }}>
                Index {arrayTargetIndex}
              </span>
              <span>×</span>
              <span style={{ color: '#a78bfa' }}>4 Bytes</span>
              <span>)</span>
              <span>=</span>
              <span
                style={{
                  fontWeight: 700,
                  color: arrayOutOfBounds ? '#ef4444' : '#f59e0b',
                  backgroundColor: arrayOutOfBounds ? 'rgba(239, 68, 68, 0.2)' : 'rgba(245, 158, 11, 0.15)',
                  padding: '0.15rem 0.5rem',
                  borderRadius: '4px',
                }}
              >
                {activeBay?.address || (arrayOutOfBounds ? 'SEGFAULT (0x????)' : '0x2008')}
              </span>
              <span style={{ marginLeft: 'auto', fontSize: '0.8rem', color: '#10b981', fontWeight: 600 }}>
                Time: O(1) [Single Machine Cycle]
              </span>
            </div>
          </div>

          {/* 5 Contiguous Storage Bay Visualizer */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: '0.85rem', color: '#94a3b8' }}>
              <span>CONTIGUOUS MEMORY BAYS (RAM OFFSET 0x2000..0x2010)</span>
              <span>Click bay or press [0..4] for O(1) jump</span>
            </div>

            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(5, 1fr)',
                gap: '0.75rem',
              }}
            >
              {arrayBays.map((bay) => {
                const isSelected = bay.index === arrayTargetIndex && !arrayOutOfBounds;
                const isScanningActive = arrayIsScanning && arrayScanCurrentStep === bay.index;

                return (
                  <button
                    key={bay.index}
                    onClick={() => jumpToArrayIndex(bay.index)}
                    style={{
                      position: 'relative',
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      padding: '1rem 0.5rem',
                      borderRadius: '12px',
                      backgroundColor: isScanningActive
                        ? 'rgba(0, 240, 255, 0.18)'
                        : isSelected
                        ? 'rgba(245, 158, 11, 0.18)'
                        : 'rgba(30, 41, 59, 0.5)',
                      border: isScanningActive
                        ? '2px solid #00f0ff'
                        : isSelected
                        ? '2px solid #f59e0b'
                        : '1px solid rgba(255, 255, 255, 0.08)',
                      boxShadow: isScanningActive
                        ? '0 0 20px rgba(0, 240, 255, 0.3)'
                        : isSelected
                        ? '0 0 20px rgba(245, 158, 11, 0.25)'
                        : 'none',
                      cursor: 'pointer',
                      transition: 'all 0.15s ease',
                      textAlign: 'center',
                    }}
                  >
                    {/* Index Plaque Badge */}
                    <div
                      style={{
                        position: 'absolute',
                        top: '-10px',
                        backgroundColor: isSelected ? '#f59e0b' : '#334155',
                        color: isSelected ? '#000' : '#f8fafc',
                        fontSize: '0.75rem',
                        fontWeight: 700,
                        padding: '0.1rem 0.5rem',
                        borderRadius: '6px',
                        border: '1px solid rgba(255, 255, 255, 0.2)',
                      }}
                    >
                      [{bay.index}]
                    </div>

                    {/* Value Display */}
                    <div
                      style={{
                        marginTop: '0.5rem',
                        fontSize: '1.75rem',
                        fontWeight: 800,
                        color: isScanningActive ? '#00f0ff' : isSelected ? '#f59e0b' : bay.color,
                        fontFamily: 'monospace',
                      }}
                    >
                      {bay.value}
                    </div>

                    {/* Memory Address Offset */}
                    <div
                      style={{
                        marginTop: '0.35rem',
                        fontSize: '0.75rem',
                        color: isSelected ? '#fcd34d' : '#64748b',
                        fontFamily: 'monospace',
                      }}
                    >
                      {bay.address}
                    </div>

                    {/* Probe Indicator Dot */}
                    {isSelected && (
                      <div
                        style={{
                          marginTop: '0.5rem',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '0.25rem',
                          fontSize: '0.7rem',
                          color: '#f59e0b',
                          fontWeight: 600,
                        }}
                      >
                        <Zap size={12} fill="#f59e0b" /> PROBE ALIGNED
                      </div>
                    )}
                    {isScanningActive && (
                      <div
                        style={{
                          marginTop: '0.5rem',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '0.25rem',
                          fontSize: '0.7rem',
                          color: '#00f0ff',
                          fontWeight: 600,
                        }}
                      >
                        <Search size={12} /> SCANNING
                      </div>
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Interactive Control Panels */}
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
              gap: '1rem',
            }}
          >
            {/* Panel 1: Direct Access & Boundary Exceptions */}
            <div
              style={{
                padding: '1rem',
                borderRadius: '12px',
                backgroundColor: 'rgba(15, 23, 42, 0.6)',
                border: '1px solid rgba(255, 255, 255, 0.08)',
                display: 'flex',
                flexDirection: 'column',
                gap: '0.75rem',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontWeight: 600, fontSize: '0.9rem', color: '#cbd5e1' }}>
                <Zap size={16} color="#fbbf24" />
                O(1) DIRECT ACCESS & BOUNDARY TESTS
              </div>

              <div style={{ display: 'flex', gap: '0.4rem', flexWrap: 'wrap' }}>
                {[0, 1, 2, 3, 4].map((idx) => (
                  <button
                    key={idx}
                    onClick={() => jumpToArrayIndex(idx)}
                    style={{
                      flex: 1,
                      minWidth: '40px',
                      padding: '0.5rem 0',
                      borderRadius: '8px',
                      backgroundColor: arrayTargetIndex === idx && !arrayOutOfBounds ? '#f59e0b' : 'rgba(255, 255, 255, 0.06)',
                      color: arrayTargetIndex === idx && !arrayOutOfBounds ? '#000' : '#f8fafc',
                      fontWeight: 700,
                      border: '1px solid rgba(255, 255, 255, 0.1)',
                      cursor: 'pointer',
                    }}
                  >
                    Bay {idx}
                  </button>
                ))}
              </div>

              {/* Exception Triggers */}
              <div style={{ marginTop: '0.25rem', display: 'flex', gap: '0.5rem' }}>
                <button
                  onClick={() => jumpToArrayIndex(-1)}
                  style={{
                    flex: 1,
                    padding: '0.5rem',
                    borderRadius: '8px',
                    backgroundColor: 'rgba(239, 68, 68, 0.12)',
                    border: '1px solid rgba(239, 68, 68, 0.35)',
                    color: '#f87171',
                    fontSize: '0.8rem',
                    fontWeight: 600,
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '0.35rem',
                  }}
                >
                  <AlertTriangle size={14} />
                  Test Index -1
                </button>
                <button
                  onClick={() => jumpToArrayIndex(5)}
                  style={{
                    flex: 1,
                    padding: '0.5rem',
                    borderRadius: '8px',
                    backgroundColor: 'rgba(239, 68, 68, 0.12)',
                    border: '1px solid rgba(239, 68, 68, 0.35)',
                    color: '#f87171',
                    fontSize: '0.8rem',
                    fontWeight: 600,
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '0.35rem',
                  }}
                >
                  <AlertTriangle size={14} />
                  Test Index 5
                </button>
              </div>

              {/* Value Mutator (O(1) Write) */}
              {activeBay && (
                <div
                  style={{
                    marginTop: '0.25rem',
                    padding: '0.6rem',
                    borderRadius: '8px',
                    backgroundColor: 'rgba(0, 0, 0, 0.25)',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.5rem',
                  }}
                >
                  <span style={{ fontSize: '0.8rem', color: '#94a3b8' }}>
                    Mutate Bay [{activeBay.index}]:
                  </span>
                  <input
                    type="number"
                    placeholder={String(activeBay.value)}
                    value={editValue}
                    onChange={(e) => setEditValue(e.target.value)}
                    style={{
                      width: '70px',
                      padding: '0.3rem 0.5rem',
                      borderRadius: '6px',
                      backgroundColor: 'rgba(255, 255, 255, 0.08)',
                      border: '1px solid rgba(255, 255, 255, 0.15)',
                      color: '#fff',
                      fontSize: '0.85rem',
                    }}
                  />
                  <button
                    onClick={() => {
                      const num = parseInt(editValue, 10);
                      if (!isNaN(num)) {
                        updateArrayElement(activeBay.index, num);
                        setEditValue('');
                      }
                    }}
                    style={{
                      padding: '0.3rem 0.75rem',
                      borderRadius: '6px',
                      backgroundColor: 'rgba(16, 185, 129, 0.25)',
                      border: '1px solid rgba(16, 185, 129, 0.4)',
                      color: '#34d399',
                      fontSize: '0.8rem',
                      fontWeight: 600,
                      cursor: 'pointer',
                    }}
                  >
                    Write (O(1))
                  </button>
                </div>
              )}
            </div>

            {/* Panel 2: O(n) Linear Search Scanner */}
            <div
              style={{
                padding: '1rem',
                borderRadius: '12px',
                backgroundColor: 'rgba(15, 23, 42, 0.6)',
                border: '1px solid rgba(255, 255, 255, 0.08)',
                display: 'flex',
                flexDirection: 'column',
                gap: '0.75rem',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontWeight: 600, fontSize: '0.9rem', color: '#cbd5e1' }}>
                <Search size={16} color="#00f0ff" />
                O(n) LINEAR SEQUENTIAL SEARCH SCAN
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <div style={{ fontSize: '0.8rem', color: '#94a3b8' }}>Target Value:</div>
                <div style={{ display: 'flex', gap: '0.3rem' }}>
                  {[12, 78, 56, 99].map((val) => (
                    <button
                      key={val}
                      onClick={() => setSearchTarget(val)}
                      style={{
                        padding: '0.3rem 0.55rem',
                        borderRadius: '6px',
                        backgroundColor: searchTarget === val ? 'rgba(0, 240, 255, 0.25)' : 'rgba(255, 255, 255, 0.06)',
                        color: searchTarget === val ? '#00f0ff' : '#94a3b8',
                        border: searchTarget === val ? '1px solid rgba(0, 240, 255, 0.5)' : '1px solid rgba(255, 255, 255, 0.08)',
                        fontSize: '0.8rem',
                        fontWeight: 600,
                        cursor: 'pointer',
                      }}
                    >
                      {val}
                    </button>
                  ))}
                </div>
              </div>

              <button
                disabled={arrayIsScanning}
                onClick={() => runArrayLinearSearch(searchTarget)}
                style={{
                  marginTop: 'auto',
                  padding: '0.65rem',
                  borderRadius: '8px',
                  backgroundColor: arrayIsScanning ? 'rgba(0, 240, 255, 0.1)' : '#0284c7',
                  border: '1px solid rgba(0, 240, 255, 0.3)',
                  color: '#fff',
                  fontWeight: 700,
                  fontSize: '0.9rem',
                  cursor: arrayIsScanning ? 'not-allowed' : 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '0.5rem',
                  boxShadow: '0 4px 12px rgba(2, 132, 199, 0.3)',
                }}
              >
                <Search size={16} />
                {arrayIsScanning ? `Scanning Cell [${arrayScanCurrentStep ?? 0}]...` : `Run Linear Scan for ${searchTarget} [Key: S]`}
              </button>

              <div style={{ fontSize: '0.75rem', color: '#64748b' }}>
                Unlike random access, search must sequentially compare each bay until a match is reached or the array ends (worst-case n comparisons).
              </div>
            </div>
          </div>

          {/* Operation Trace Output Log */}
          {arrayOperation && (
            <div
              style={{
                padding: '0.85rem 1.1rem',
                borderRadius: '10px',
                backgroundColor: 'rgba(0, 0, 0, 0.35)',
                border: '1px solid rgba(255, 255, 255, 0.06)',
                display: 'flex',
                flexDirection: 'column',
                gap: '0.35rem',
                fontFamily: 'monospace',
                fontSize: '0.85rem',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <span style={{ color: '#94a3b8', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                  <Terminal size={14} color="#34d399" />
                  OPERATION TRACE
                </span>
                <span
                  style={{
                    color: arrayOperation.timeComplexity === 'O(1)' ? '#34d399' : '#38bdf8',
                    fontWeight: 700,
                  }}
                >
                  Complexity: {arrayOperation.timeComplexity}
                </span>
              </div>
              <div style={{ color: '#e2e8f0' }}>{arrayOperation.description}</div>
              <div style={{ color: '#fbbf24', fontSize: '0.8rem' }}>{arrayOperation.formula}</div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
