import React, { useEffect, useState } from 'react';
import {
  X,
  Play,
  Search,
  RotateCcw,
  GitBranch,
  Sparkles,
  ArrowRight,
} from 'lucide-react';
import { useClassroomStore } from '../../store/useClassroomStore';

export const TreeBSTConsole: React.FC = () => {
  const activeStation = useClassroomStore((s) => s.activeStation);
  const setActiveStation = useClassroomStore((s) => s.setActiveStation);
  const demonstrateFeynmanAgent = useClassroomStore((s) => s.demonstrateFeynmanAgent);

  const treeActiveNodeValue = useClassroomStore((s) => s.treeActiveNodeValue);
  const treeTraversingValues = useClassroomStore((s) => s.treeTraversingValues);
  const treeSearchTarget = useClassroomStore((s) => s.treeSearchTarget);
  const treeIsTraversing = useClassroomStore((s) => s.treeIsTraversing);
  const treeOperation = useClassroomStore((s) => s.treeOperation);

  const runTreeInOrderTraversal = useClassroomStore((s) => s.runTreeInOrderTraversal);
  const runTreeSearch = useClassroomStore((s) => s.runTreeSearch);
  const resetTreeLab = useClassroomStore((s) => s.resetTreeLab);

  const [searchKey, setSearchKey] = useState<number>(60);

  // Keyboard shortcut listener: [ESC] to exit, [T] to traverse, [S] to search
  useEffect(() => {
    if (activeStation !== 'tree_lab') return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (['INPUT', 'TEXTAREA'].includes((e.target as HTMLElement)?.tagName)) return;

      if (e.key === 'Escape') {
        e.preventDefault();
        setActiveStation(null);
      } else if (e.key.toLowerCase() === 't' && !e.ctrlKey && !e.metaKey) {
        e.preventDefault();
        if (!treeIsTraversing) {
          runTreeInOrderTraversal();
        }
      } else if (e.key.toLowerCase() === 's' && !e.ctrlKey && !e.metaKey) {
        e.preventDefault();
        if (!treeIsTraversing) {
          runTreeSearch(searchKey);
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [
    activeStation,
    treeIsTraversing,
    searchKey,
    setActiveStation,
    runTreeInOrderTraversal,
    runTreeSearch,
  ]);

  if (activeStation !== 'tree_lab') return null;

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
        backgroundColor: 'rgba(5, 12, 22, 0.82)',
        backdropFilter: 'blur(12px)',
        animation: 'fadeIn 0.25s ease-out',
      }}
    >
      <div
        className="glass-panel"
        style={{
          width: '100%',
          maxWidth: '1020px',
          maxHeight: '92vh',
          display: 'flex',
          flexDirection: 'column',
          backgroundColor: 'rgba(7, 16, 26, 0.95)',
          borderColor: 'rgba(16, 185, 129, 0.45)',
          boxShadow: '0 20px 50px rgba(0, 0, 0, 0.8), 0 0 30px rgba(16, 185, 129, 0.25)',
          borderRadius: '12px',
          overflow: 'hidden',
        }}
      >
        {/* --- Top Header Bar --- */}
        <header
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '14px 22px',
            borderBottom: '1px solid rgba(16, 185, 129, 0.2)',
            background: 'linear-gradient(90deg, rgba(16, 185, 129, 0.12), rgba(0, 240, 255, 0.04))',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div
              style={{
                width: '32px',
                height: '32px',
                borderRadius: '8px',
                background: 'rgba(16, 185, 129, 0.2)',
                border: '1px solid #10b981',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <GitBranch size={18} color="#10b981" />
            </div>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <h2
                  style={{
                    fontFamily: 'var(--font-display)',
                    fontSize: '16px',
                    fontWeight: 800,
                    color: '#ffffff',
                    letterSpacing: '0.04em',
                    margin: 0,
                  }}
                >
                  TREE & BST APPARATUS // HIERARCHICAL CANOPY
                </h2>
                <span
                  className="glass-pill"
                  style={{
                    color: '#10b981',
                    borderColor: 'rgba(16, 185, 129, 0.4)',
                    fontSize: '10px',
                    fontWeight: 700,
                  }}
                >
                  SOUTH-EAST WING
                </span>
              </div>
              <p
                style={{
                  fontSize: '11px',
                  fontFamily: 'var(--font-mono)',
                  color: 'var(--text-secondary)',
                  margin: '2px 0 0 0',
                }}
              >
                O(log n) Logarithmic Binary Search vs O(n) In-Order Sorted Traversal
              </p>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <button
              id="btn-tree-demonstrate-feynman"
              onClick={() => demonstrateFeynmanAgent('tree')}
              className="cyber-button"
              style={{
                background: 'linear-gradient(135deg, rgba(168, 85, 247, 0.3), rgba(16, 185, 129, 0.2))',
                border: '1px solid rgba(168, 85, 247, 0.5)',
                borderRadius: '8px',
                padding: '0.45rem 0.75rem',
                color: '#f5f3ff',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '0.35rem',
                fontSize: '0.75rem',
                fontWeight: 700,
                boxShadow: '0 0 10px rgba(168, 85, 247, 0.25)',
              }}
              title="Demonstrate Feynman Multimodal Adaptive Explanation Agent for Tree"
            >
              <Sparkles size={13} color="#c084fc" />
              <span>Demonstrate Feynman Agent</span>
            </button>

            <button
              onClick={() => setActiveStation(null)}
              className="glass-panel"
              style={{
                padding: '6px 10px',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '4px',
                color: 'var(--text-muted)',
                borderColor: 'var(--border-subtle)',
              }}
              title="Close Station Console [ESC]"
            >
              <X size={15} />
              <span style={{ fontSize: '11px', fontFamily: 'var(--font-mono)' }}>ESC</span>
            </button>
          </div>
        </header>

        {/* --- Main Dual-Panel Content --- */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: '1.2fr 1fr',
            gap: '16px',
            padding: '20px',
            overflowY: 'auto',
          }}
        >
          {/* Left Panel: 2D Visual Tree Representation & Telemetry */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            {/* 2D Interactive Tree Diagram Card */}
            <div
              className="glass-panel"
              style={{
                padding: '16px',
                backgroundColor: 'rgba(6, 14, 24, 0.7)',
                borderColor: 'rgba(16, 185, 129, 0.25)',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
              }}
            >
              <div
                style={{
                  fontSize: '10px',
                  fontFamily: 'var(--font-mono)',
                  color: '#10b981',
                  marginBottom: '12px',
                  letterSpacing: '0.08em',
                  textTransform: 'uppercase',
                  width: '100%',
                  display: 'flex',
                  justifyContent: 'space-between',
                }}
              >
                <span>HIERARCHICAL BST TOPOLOGY</span>
                <span>HEIGHT: 3 LEVELS</span>
              </div>

              {/* Tree Visual Nodes Layout */}
              <div
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  gap: '16px',
                  width: '100%',
                  padding: '10px 0',
                }}
              >
                {/* Level 0: Root */}
                <div style={{ display: 'flex', justifyContent: 'center' }}>
                  <TreeNodeBadge
                    value={50}
                    isActive={treeActiveNodeValue === 50}
                    isVisited={treeTraversingValues.includes(50)}
                    isTarget={treeSearchTarget === 50}
                    label="ROOT"
                  />
                </div>

                {/* Level 1: Left & Right */}
                <div
                  style={{
                    display: 'flex',
                    justifyContent: 'space-around',
                    width: '75%',
                    position: 'relative',
                  }}
                >
                  <TreeNodeBadge
                    value={30}
                    isActive={treeActiveNodeValue === 30}
                    isVisited={treeTraversingValues.includes(30)}
                    isTarget={treeSearchTarget === 30}
                    label="L"
                  />
                  <TreeNodeBadge
                    value={70}
                    isActive={treeActiveNodeValue === 70}
                    isVisited={treeTraversingValues.includes(70)}
                    isTarget={treeSearchTarget === 70}
                    label="R"
                  />
                </div>

                {/* Level 2: Leaves */}
                <div
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    width: '95%',
                  }}
                >
                  <TreeNodeBadge
                    value={20}
                    isActive={treeActiveNodeValue === 20}
                    isVisited={treeTraversingValues.includes(20)}
                    isTarget={treeSearchTarget === 20}
                  />
                  <TreeNodeBadge
                    value={40}
                    isActive={treeActiveNodeValue === 40}
                    isVisited={treeTraversingValues.includes(40)}
                    isTarget={treeSearchTarget === 40}
                  />
                  <TreeNodeBadge
                    value={60}
                    isActive={treeActiveNodeValue === 60}
                    isVisited={treeTraversingValues.includes(60)}
                    isTarget={treeSearchTarget === 60}
                  />
                  <TreeNodeBadge
                    value={80}
                    isActive={treeActiveNodeValue === 80}
                    isVisited={treeTraversingValues.includes(80)}
                    isTarget={treeSearchTarget === 80}
                  />
                </div>
              </div>
            </div>

            {/* Live Telemetry Operation Card */}
            <div
              className="glass-panel"
              style={{
                padding: '14px 16px',
                backgroundColor: 'rgba(6, 14, 24, 0.7)',
                borderColor: 'rgba(0, 240, 255, 0.25)',
              }}
            >
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  marginBottom: '8px',
                }}
              >
                <span
                  style={{
                    fontSize: '11px',
                    fontFamily: 'var(--font-mono)',
                    color: 'var(--cyan-core)',
                    fontWeight: 700,
                  }}
                >
                  DIAGNOSTIC TELEMETRY TRACE
                </span>
                {treeOperation && (
                  <span
                    className="glass-pill"
                    style={{
                      fontSize: '10px',
                      color:
                        treeOperation.timeComplexity === 'O(log n)' ? '#10b981' : '#00f0ff',
                      fontWeight: 800,
                    }}
                  >
                    {treeOperation.timeComplexity}
                  </span>
                )}
              </div>

              {treeOperation ? (
                <div style={{ fontSize: '11px', fontFamily: 'var(--font-mono)' }}>
                  <p style={{ color: '#ffffff', margin: '4px 0 8px 0', lineHeight: 1.5 }}>
                    {treeOperation.description}
                  </p>
                  <div
                    style={{
                      background: 'rgba(0, 240, 255, 0.06)',
                      padding: '6px 10px',
                      borderRadius: '4px',
                      color: 'var(--cyan-core)',
                      fontSize: '10px',
                    }}
                  >
                    <strong>Complexity Math:</strong> {treeOperation.formula}
                  </div>
                  {treeOperation.visitedNodes.length > 0 && (
                    <div
                      style={{
                        marginTop: '8px',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '6px',
                        flexWrap: 'wrap',
                      }}
                    >
                      <span style={{ color: 'var(--text-muted)' }}>Visited Sequence:</span>
                      {treeOperation.visitedNodes.map((val, i) => (
                        <React.Fragment key={val}>
                          <span
                            style={{
                              color: val === treeSearchTarget ? '#ff0055' : '#10b981',
                              fontWeight: 700,
                              background: 'rgba(255, 255, 255, 0.08)',
                              padding: '2px 6px',
                              borderRadius: '4px',
                            }}
                          >
                            [{val}]
                          </span>
                          {i < treeOperation.visitedNodes.length - 1 && (
                            <ArrowRight size={10} color="var(--text-muted)" />
                          )}
                        </React.Fragment>
                      ))}
                    </div>
                  )}
                </div>
              ) : (
                <p
                  style={{
                    fontSize: '11px',
                    color: 'var(--text-muted)',
                    fontFamily: 'var(--font-mono)',
                    margin: 0,
                  }}
                >
                  Select an operation on the right panel to execute tree canopy traversals or
                  logarithmic key lookups.
                </p>
              )}
            </div>
          </div>

          {/* Right Panel: Interactive Operations & Educational Invariants */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            {/* Interactive Execution Controls */}
            <div
              className="glass-panel"
              style={{
                padding: '16px',
                backgroundColor: 'rgba(6, 14, 24, 0.7)',
                borderColor: 'rgba(16, 185, 129, 0.3)',
              }}
            >
              <h3
                style={{
                  fontFamily: 'var(--font-display)',
                  fontSize: '13px',
                  fontWeight: 700,
                  color: '#ffffff',
                  marginBottom: '12px',
                  letterSpacing: '0.04em',
                }}
              >
                CANOPY OPERATIONS
              </h3>

              {/* In-Order Traversal Trigger */}
              <button
                onClick={() => runTreeInOrderTraversal()}
                disabled={treeIsTraversing}
                className="cyber-button"
                style={{
                  width: '100%',
                  padding: '10px 14px',
                  marginBottom: '14px',
                  background:
                    'linear-gradient(135deg, rgba(16, 185, 129, 0.2), rgba(0, 240, 255, 0.15))',
                  borderColor: '#10b981',
                  color: '#ffffff',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  cursor: treeIsTraversing ? 'not-allowed' : 'pointer',
                  opacity: treeIsTraversing ? 0.6 : 1,
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <Play size={14} color="#10b981" />
                  <span style={{ fontWeight: 700, fontSize: '11px' }}>
                    Run In-Order Traversal
                  </span>
                </div>
                <span className="glass-pill" style={{ fontSize: '9px', color: '#10b981' }}>
                  O(n) Sorted
                </span>
              </button>

              {/* Logarithmic Search Controls */}
              <div
                style={{
                  padding: '12px',
                  borderRadius: '6px',
                  background: 'rgba(255, 255, 255, 0.03)',
                  border: '1px solid rgba(255, 255, 255, 0.08)',
                  marginBottom: '12px',
                }}
              >
                <div
                  style={{
                    fontSize: '10px',
                    fontFamily: 'var(--font-mono)',
                    color: 'var(--cyan-core)',
                    marginBottom: '8px',
                  }}
                >
                  BINARY SEARCH KEY LOOKUP O(log n)
                </div>

                {/* Preset Keys */}
                <div style={{ display: 'flex', gap: '6px', marginBottom: '10px' }}>
                  {[20, 40, 60, 80, 25].map((k) => (
                    <button
                      key={k}
                      onClick={() => setSearchKey(k)}
                      style={{
                        flex: 1,
                        padding: '6px 4px',
                        background:
                          searchKey === k
                            ? 'rgba(0, 240, 255, 0.25)'
                            : 'rgba(255, 255, 255, 0.05)',
                        border: `1px solid ${
                          searchKey === k ? 'var(--cyan-core)' : 'rgba(255, 255, 255, 0.1)'
                        }`,
                        color: searchKey === k ? '#00f0ff' : 'var(--text-secondary)',
                        borderRadius: '4px',
                        fontSize: '11px',
                        fontFamily: 'var(--font-mono)',
                        fontWeight: 700,
                        cursor: 'pointer',
                      }}
                    >
                      {k}
                    </button>
                  ))}
                </div>

                <button
                  onClick={() => runTreeSearch(searchKey)}
                  disabled={treeIsTraversing}
                  className="cyber-button"
                  style={{
                    width: '100%',
                    padding: '8px 12px',
                    background: 'rgba(0, 240, 255, 0.15)',
                    borderColor: 'var(--cyan-core)',
                    color: '#00f0ff',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '6px',
                    cursor: treeIsTraversing ? 'not-allowed' : 'pointer',
                    fontSize: '11px',
                    fontWeight: 700,
                  }}
                >
                  <Search size={13} />
                  <span>Search Key [{searchKey}] O(log n)</span>
                </button>
              </div>

              {/* Reset Button */}
              <button
                onClick={resetTreeLab}
                className="cyber-button"
                style={{
                  width: '100%',
                  padding: '8px',
                  background: 'rgba(255, 255, 255, 0.04)',
                  borderColor: 'var(--border-subtle)',
                  color: 'var(--text-muted)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '6px',
                  fontSize: '10px',
                }}
              >
                <RotateCcw size={12} />
                <span>Reset Canopy Highlights</span>
              </button>
            </div>

            {/* Invariant Explanation Card */}
            <div
              className="glass-panel"
              style={{
                padding: '14px 16px',
                backgroundColor: 'rgba(6, 14, 24, 0.7)',
                borderColor: 'rgba(16, 185, 129, 0.2)',
                fontSize: '11px',
                lineHeight: 1.5,
              }}
            >
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  marginBottom: '6px',
                  color: '#10b981',
                  fontWeight: 700,
                  fontSize: '11px',
                }}
              >
                <Sparkles size={13} />
                <span>BST INVARIANT LAW</span>
              </div>
              <p style={{ color: 'var(--text-secondary)', margin: '0 0 6px 0' }}>
                For every node with value <strong style={{ color: '#ffffff' }}>X</strong>:
                All keys in its left subtree are <strong style={{ color: '#10b981' }}>&lt; X</strong>,
                and all keys in its right subtree are <strong style={{ color: '#00f0ff' }}>&gt; X</strong>.
              </p>
              <p style={{ color: 'var(--text-muted)', fontSize: '10px', margin: 0 }}>
                This ordering enables binary decision pruning: each comparison eliminates 50% of the
                remaining candidate space, requiring only <strong style={{ color: '#ffffff' }}>log₂(N)</strong> steps.
              </p>
            </div>
          </div>
        </div>

        {/* Bottom Shortcut Guide */}
        <footer
          style={{
            padding: '10px 20px',
            borderTop: '1px solid rgba(255, 255, 255, 0.06)',
            display: 'flex',
            justifyContent: 'center',
            fontSize: '10px',
            fontFamily: 'var(--font-mono)',
            color: 'var(--text-muted)',
            gap: '14px',
          }}
        >
          <span>[ESC] Exit Station</span>
          <span>[T] Run In-Order</span>
          <span>[S] Search Key</span>
        </footer>
      </div>
    </div>
  );
};

interface TreeNodeBadgeProps {
  value: number;
  isActive: boolean;
  isVisited: boolean;
  isTarget: boolean;
  label?: string;
}

const TreeNodeBadge: React.FC<TreeNodeBadgeProps> = ({
  value,
  isActive,
  isVisited,
  isTarget,
  label,
}) => {
  let borderColor = 'rgba(16, 185, 129, 0.35)';
  let bg = 'rgba(6, 18, 28, 0.85)';
  let textColor = '#ffffff';

  if (isTarget) {
    borderColor = '#ff0055';
    bg = 'rgba(255, 0, 85, 0.25)';
    textColor = '#ff6699';
  } else if (isActive) {
    borderColor = '#f59e0b';
    bg = 'rgba(245, 158, 11, 0.3)';
    textColor = '#fbbf24';
  } else if (isVisited) {
    borderColor = '#10b981';
    bg = 'rgba(16, 185, 129, 0.2)';
    textColor = '#34d399';
  }

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: '2px',
      }}
    >
      {label && (
        <span
          style={{
            fontSize: '8px',
            fontFamily: 'var(--font-mono)',
            color: 'var(--text-muted)',
          }}
        >
          {label}
        </span>
      )}
      <div
        style={{
          width: '38px',
          height: '38px',
          borderRadius: '50%',
          border: `2px solid ${borderColor}`,
          background: bg,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: '12px',
          fontFamily: 'var(--font-mono)',
          fontWeight: 800,
          color: textColor,
          boxShadow: isActive ? '0 0 14px #f59e0b' : isTarget ? '0 0 16px #ff0055' : 'none',
          transition: 'all 0.2s ease',
        }}
      >
        {value}
      </div>
    </div>
  );
};
