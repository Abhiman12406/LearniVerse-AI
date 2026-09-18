import React, { useEffect, useState } from 'react';
import {
  X,
  Play,
  Plus,
  Trash2,
  AlertTriangle,
  AlertOctagon,
  RotateCcw,
  Zap,
  Wrench,
  Layers,
  ArrowRight,
  ShieldAlert,
  Sparkles,
} from 'lucide-react';
import { useClassroomStore } from '../../store/useClassroomStore';

export const LinkedListConsole: React.FC = () => {
  const activeStation = useClassroomStore((s) => s.activeStation);
  const setActiveStation = useClassroomStore((s) => s.setActiveStation);
  const demonstrateFeynmanAgent = useClassroomStore((s) => s.demonstrateFeynmanAgent);

  const linkedListNodes = useClassroomStore((s) => s.linkedListNodes);
  const linkedListActiveNodeId = useClassroomStore((s) => s.linkedListActiveNodeId);
  const linkedListIsTraversing = useClassroomStore((s) => s.linkedListIsTraversing);
  const linkedListIsSevered = useClassroomStore((s) => s.linkedListIsSevered);
  const linkedListSeveredNodeId = useClassroomStore((s) => s.linkedListSeveredNodeId);
  const linkedListNullError = useClassroomStore((s) => s.linkedListNullError);
  const linkedListOperation = useClassroomStore((s) => s.linkedListOperation);

  const traverseLinkedList = useClassroomStore((s) => s.traverseLinkedList);
  const insertLinkedListNode = useClassroomStore((s) => s.insertLinkedListNode);
  const removeLinkedListNode = useClassroomStore((s) => s.removeLinkedListNode);
  const severLinkedListLink = useClassroomStore((s) => s.severLinkedListLink);
  const repairLinkedListLink = useClassroomStore((s) => s.repairLinkedListLink);
  const triggerNullPointerDereference = useClassroomStore((s) => s.triggerNullPointerDereference);
  const clearLinkedListError = useClassroomStore((s) => s.clearLinkedListError);
  const resetLinkedList = useClassroomStore((s) => s.resetLinkedList);

  const [insertVal, setInsertVal] = useState<number>(42);

  // Keyboard shortcut listener: [ESC] to exit, [T] to traverse, [I] to insert
  useEffect(() => {
    if (activeStation !== 'linked_list_lab') return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (['INPUT', 'TEXTAREA'].includes((e.target as HTMLElement)?.tagName)) return;

      if (e.key === 'Escape') {
        e.preventDefault();
        setActiveStation(null);
      } else if (e.key.toLowerCase() === 't' && !e.ctrlKey && !e.metaKey) {
        e.preventDefault();
        if (!linkedListIsTraversing) {
          traverseLinkedList();
        }
      } else if (e.key.toLowerCase() === 'i' && !e.ctrlKey && !e.metaKey) {
        e.preventDefault();
        insertLinkedListNode(1, insertVal, 'D');
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [
    activeStation,
    linkedListIsTraversing,
    insertVal,
    setActiveStation,
    traverseLinkedList,
    insertLinkedListNode,
  ]);

  if (activeStation !== 'linked_list_lab') return null;

  const isError = !!linkedListNullError || linkedListIsSevered;

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
        backgroundColor: 'rgba(5, 10, 20, 0.78)',
        backdropFilter: 'blur(12px)',
        animation: 'fadeIn 0.25s ease-out',
      }}
    >
      <div
        className="ui-interactive"
        style={{
          position: 'relative',
          width: '100%',
          maxWidth: '960px',
          maxHeight: '92vh',
          display: 'flex',
          flexDirection: 'column',
          borderRadius: '16px',
          backgroundColor: '#0a0f1d',
          border: isError
            ? '1px solid rgba(239, 68, 68, 0.6)'
            : '1px solid rgba(245, 158, 11, 0.45)',
          boxShadow: isError
            ? '0 0 45px rgba(239, 68, 68, 0.28)'
            : '0 0 45px rgba(245, 158, 11, 0.18)',
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
            backgroundColor: 'rgba(15, 23, 42, 0.65)',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <div
              style={{
                width: '38px',
                height: '38px',
                borderRadius: '10px',
                backgroundColor: isError ? 'rgba(239, 68, 68, 0.15)' : 'rgba(245, 158, 11, 0.15)',
                border: isError ? '1px solid #ef4444' : '1px solid #f59e0b',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: isError ? '#ef4444' : '#f59e0b',
              }}
            >
              <Layers size={20} />
            </div>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <h2
                  style={{
                    fontSize: '1.15rem',
                    fontWeight: 700,
                    letterSpacing: '0.04em',
                    margin: 0,
                  }}
                >
                  LINKED LIST LAB // POINTER NODE APPARATUS
                </h2>
                <span
                  style={{
                    fontSize: '0.7rem',
                    padding: '2px 8px',
                    borderRadius: '999px',
                    backgroundColor: 'rgba(245, 158, 11, 0.2)',
                    color: '#fbbf24',
                    border: '1px solid rgba(245, 158, 11, 0.4)',
                    fontWeight: 600,
                    fontFamily: 'monospace',
                  }}
                >
                  East Wing Chamber
                </span>
              </div>
              <p
                style={{
                  fontSize: '0.8rem',
                  color: '#94a3b8',
                  margin: '2px 0 0 0',
                  fontFamily: 'monospace',
                }}
              >
                Dynamic Non-Contiguous Memory // Pointer Redirection & Heap Mechanics
              </p>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem' }}>
            <button
              id="btn-linked-list-demonstrate-feynman"
              onClick={() => demonstrateFeynmanAgent('linked_list')}
              style={{
                background: 'linear-gradient(135deg, rgba(168, 85, 247, 0.3), rgba(245, 158, 11, 0.2))',
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
              title="Demonstrate Feynman Multimodal Adaptive Explanation Agent for Linked List"
            >
              <Sparkles size={13} color="#c084fc" />
              <span>Demonstrate Feynman Agent</span>
            </button>

            <div
              style={{
                fontSize: '0.75rem',
                fontFamily: 'monospace',
                padding: '4px 10px',
                borderRadius: '6px',
                backgroundColor: 'rgba(255, 255, 255, 0.05)',
                color: '#cbd5e1',
                border: '1px solid rgba(255, 255, 255, 0.1)',
              }}
            >
              ALLOCATED: <span style={{ color: '#fbbf24', fontWeight: 700 }}>{linkedListNodes.length} Nodes ({linkedListNodes.length * 24}B)</span>
            </div>

            <button
              onClick={() => setActiveStation(null)}
              style={{
                background: 'none',
                border: 'none',
                color: '#94a3b8',
                cursor: 'pointer',
                padding: '4px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                borderRadius: '6px',
                transition: 'color 0.15s',
              }}
              title="Close console [ESC]"
            >
              <X size={20} />
            </button>
          </div>
        </div>

        {/* Scrollable Main Content */}
        <div style={{ padding: '1.5rem', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          {/* Error Alert Banner */}
          {linkedListNullError && (
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '0.85rem 1.25rem',
                borderRadius: '10px',
                backgroundColor: 'rgba(239, 68, 68, 0.15)',
                border: '1px solid rgba(239, 68, 68, 0.5)',
                color: '#fca5a5',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                <AlertOctagon size={22} color="#ef4444" />
                <div>
                  <div style={{ fontWeight: 700, fontSize: '0.88rem', color: '#ef4444' }}>
                    CRITICAL EXCEPTION TRIGGERED
                  </div>
                  <div style={{ fontSize: '0.8rem', fontFamily: 'monospace' }}>
                    {linkedListNullError}
                  </div>
                </div>
              </div>
              <button
                onClick={clearLinkedListError}
                style={{
                  padding: '6px 14px',
                  borderRadius: '6px',
                  backgroundColor: 'rgba(239, 68, 68, 0.25)',
                  border: '1px solid rgba(239, 68, 68, 0.6)',
                  color: '#fff',
                  fontSize: '0.75rem',
                  fontWeight: 600,
                  cursor: 'pointer',
                }}
              >
                Dismiss
              </button>
            </div>
          )}

          {/* Dangling Pointer Alert Banner */}
          {linkedListIsSevered && !linkedListNullError && (
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '0.85rem 1.25rem',
                borderRadius: '10px',
                backgroundColor: 'rgba(249, 115, 22, 0.15)',
                border: '1px solid rgba(249, 115, 22, 0.5)',
                color: '#fdba74',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                <AlertTriangle size={22} color="#f97316" />
                <div>
                  <div style={{ fontWeight: 700, fontSize: '0.88rem', color: '#f97316' }}>
                    DANGLING POINTER WARNING
                  </div>
                  <div style={{ fontSize: '0.8rem', fontFamily: 'monospace' }}>
                    Pointer from Node {linkedListSeveredNodeId} is severed. Downstream nodes are unreachable in heap memory!
                  </div>
                </div>
              </div>
              <button
                onClick={repairLinkedListLink}
                style={{
                  padding: '6px 14px',
                  borderRadius: '6px',
                  backgroundColor: 'rgba(249, 115, 22, 0.25)',
                  border: '1px solid rgba(249, 115, 22, 0.6)',
                  color: '#fff',
                  fontSize: '0.75rem',
                  fontWeight: 600,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                }}
              >
                <Wrench size={13} />
                <span>Repair Link</span>
              </button>
            </div>
          )}

          {/* Interactive Memory Graph / Node Chain */}
          <div
            style={{
              padding: '1.25rem',
              borderRadius: '12px',
              backgroundColor: 'rgba(15, 23, 42, 0.45)',
              border: '1px solid rgba(255, 255, 255, 0.08)',
              display: 'flex',
              flexDirection: 'column',
              gap: '1rem',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <span style={{ fontSize: '0.8rem', color: '#94a3b8', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                Active Heap Memory Chain
              </span>
              <span style={{ fontSize: '0.75rem', fontFamily: 'monospace', color: '#fbbf24' }}>
                Head Reference: {linkedListNodes[0]?.address || 'NULL'}
              </span>
            </div>

            {/* Horizontal Nodes Flex Container */}
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.75rem',
                overflowX: 'auto',
                paddingBottom: '0.5rem',
              }}
            >
              {/* Head Pointer Label */}
              <div
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  padding: '8px 12px',
                  borderRadius: '8px',
                  backgroundColor: 'rgba(56, 189, 248, 0.1)',
                  border: '1px solid rgba(56, 189, 248, 0.3)',
                  color: '#38bdf8',
                  fontFamily: 'monospace',
                  fontSize: '0.75rem',
                  fontWeight: 700,
                  flexShrink: 0,
                }}
              >
                <span>HEAD*</span>
                <span style={{ fontSize: '0.65rem', color: '#94a3b8' }}>Pointer</span>
              </div>

              <ArrowRight size={18} color="#38bdf8" />

              {/* Render Nodes */}
              {linkedListNodes.map((node) => {
                const isActive = linkedListActiveNodeId === node.id;
                const isNodeSevered = linkedListIsSevered && linkedListSeveredNodeId === node.id;

                return (
                  <React.Fragment key={node.id}>
                    {/* Modular Node Housing Card */}
                    <div
                      style={{
                        width: '140px',
                        padding: '10px 12px',
                        borderRadius: '10px',
                        backgroundColor: isActive
                          ? 'rgba(245, 158, 11, 0.22)'
                          : isNodeSevered
                          ? 'rgba(239, 68, 68, 0.15)'
                          : 'rgba(30, 41, 59, 0.7)',
                        border: isActive
                          ? '2px solid #f59e0b'
                          : isNodeSevered
                          ? '2px solid #ef4444'
                          : '1px solid rgba(255, 255, 255, 0.15)',
                        boxShadow: isActive ? '0 0 20px rgba(245, 158, 11, 0.35)' : 'none',
                        display: 'flex',
                        flexDirection: 'column',
                        gap: '6px',
                        flexShrink: 0,
                        transition: 'all 0.2s ease',
                      }}
                    >
                      {/* Node Header */}
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <span
                          style={{
                            fontWeight: 800,
                            fontSize: '0.95rem',
                            color: node.crystalColor,
                            fontFamily: 'monospace',
                          }}
                        >
                          Node {node.label}
                        </span>
                        <span style={{ fontSize: '0.65rem', fontFamily: 'monospace', color: '#94a3b8' }}>
                          {node.address}
                        </span>
                      </div>

                      {/* Split [Data | Next] Representation */}
                      <div
                        style={{
                          display: 'grid',
                          gridTemplateColumns: '1fr 1fr',
                          gap: '4px',
                          backgroundColor: 'rgba(15, 23, 42, 0.8)',
                          borderRadius: '6px',
                          padding: '6px',
                          border: '1px solid rgba(255, 255, 255, 0.08)',
                        }}
                      >
                        {/* Data Chamber */}
                        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                          <span style={{ fontSize: '0.6rem', color: '#94a3b8', textTransform: 'uppercase' }}>Data</span>
                          <span style={{ fontSize: '0.85rem', fontWeight: 700, color: node.crystalColor }}>
                            {node.value}
                          </span>
                        </div>

                        {/* Next Pointer Chamber */}
                        <div
                          style={{
                            display: 'flex',
                            flexDirection: 'column',
                            alignItems: 'center',
                            borderLeft: '1px solid rgba(255, 255, 255, 0.1)',
                          }}
                        >
                          <span style={{ fontSize: '0.6rem', color: '#94a3b8', textTransform: 'uppercase' }}>*Next</span>
                          <span
                            style={{
                              fontSize: '0.72rem',
                              fontWeight: 700,
                              color: isNodeSevered ? '#ef4444' : node.nextId ? '#fbbf24' : '#94a3b8',
                              fontFamily: 'monospace',
                            }}
                          >
                            {isNodeSevered ? 'DEAD' : node.nextId ? node.nextId.replace('node_', '').toUpperCase() : 'NULL'}
                          </span>
                        </div>
                      </div>

                      {/* Quick Node Actions */}
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '2px' }}>
                        <button
                          onClick={() => severLinkedListLink(node.id)}
                          style={{
                            background: 'none',
                            border: 'none',
                            color: '#f97316',
                            cursor: 'pointer',
                            fontSize: '0.65rem',
                            padding: '2px 4px',
                            borderRadius: '4px',
                            fontFamily: 'monospace',
                          }}
                          title="Sever outgoing pointer"
                        >
                          Sever
                        </button>
                        {linkedListNodes.length > 1 && (
                          <button
                            onClick={() => removeLinkedListNode(node.id)}
                            style={{
                              background: 'none',
                              border: 'none',
                              color: '#ef4444',
                              cursor: 'pointer',
                              fontSize: '0.65rem',
                              padding: '2px 4px',
                              borderRadius: '4px',
                            }}
                            title="Delete this node"
                          >
                            <Trash2 size={12} />
                          </button>
                        )}
                      </div>
                    </div>

                    {/* Connecting Pointer Beam Arrow */}
                    <div
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        flexShrink: 0,
                      }}
                    >
                      {isNodeSevered ? (
                        <div style={{ display: 'flex', alignItems: 'center', gap: '2px', color: '#ef4444' }}>
                          <X size={16} />
                          <span style={{ fontSize: '0.65rem', fontFamily: 'monospace' }}>SEVERED</span>
                        </div>
                      ) : (
                        <div style={{ display: 'flex', alignItems: 'center', color: '#f59e0b' }}>
                          <span
                            style={{
                              width: '28px',
                              height: '3px',
                              backgroundColor: isActive ? '#fff' : '#f59e0b',
                              boxShadow: isActive ? '0 0 10px #f59e0b' : 'none',
                              borderRadius: '2px',
                            }}
                          />
                          <ArrowRight size={16} color={isActive ? '#fff' : '#f59e0b'} />
                        </div>
                      )}
                    </div>
                  </React.Fragment>
                );
              })}

              {/* Grounded Brass NULL Termination Plate */}
              <div
                style={{
                  width: '100px',
                  padding: '12px 10px',
                  borderRadius: '8px',
                  backgroundColor: isError && linkedListNullError
                    ? 'rgba(239, 68, 68, 0.25)'
                    : 'rgba(245, 158, 11, 0.12)',
                  border: isError && linkedListNullError
                    ? '2px solid #ef4444'
                    : '1px solid rgba(245, 158, 11, 0.5)',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0,
                  boxShadow: isError && linkedListNullError ? '0 0 20px rgba(239, 68, 68, 0.5)' : 'none',
                }}
              >
                <span
                  style={{
                    fontFamily: 'monospace',
                    fontWeight: 800,
                    fontSize: '1rem',
                    color: isError && linkedListNullError ? '#ef4444' : '#fbbf24',
                    letterSpacing: '0.08em',
                  }}
                >
                  NULL
                </span>
                <span style={{ fontSize: '0.62rem', color: '#94a3b8', fontFamily: 'monospace' }}>
                  (0x0000)
                </span>
              </div>
            </div>
          </div>

          {/* Interactive Actions Toolbar */}
          <div
            style={{
              display: 'flex',
              flexWrap: 'wrap',
              gap: '0.75rem',
              alignItems: 'center',
            }}
          >
            {/* Traverse Button */}
            <button
              onClick={() => traverseLinkedList()}
              disabled={linkedListIsTraversing}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                padding: '10px 18px',
                borderRadius: '8px',
                backgroundColor: 'rgba(245, 158, 11, 0.2)',
                border: '1px solid #f59e0b',
                color: '#fbbf24',
                fontWeight: 600,
                fontSize: '0.85rem',
                cursor: linkedListIsTraversing ? 'not-allowed' : 'pointer',
                transition: 'all 0.15s',
              }}
            >
              <Play size={15} />
              <span>Traverse Chain [T] (O(n))</span>
            </button>

            {/* Insert Node D Button */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
              <button
                onClick={() => insertLinkedListNode(1, insertVal, 'D')}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  padding: '10px 16px',
                  borderRadius: '8px',
                  backgroundColor: 'rgba(16, 185, 129, 0.18)',
                  border: '1px solid #10b981',
                  color: '#6ee7b7',
                  fontWeight: 600,
                  fontSize: '0.85rem',
                  cursor: 'pointer',
                }}
              >
                <Plus size={15} />
                <span>Insert Node D [I] (O(1))</span>
              </button>
              <input
                type="number"
                value={insertVal}
                onChange={(e) => setInsertVal(parseInt(e.target.value, 10) || 0)}
                style={{
                  width: '54px',
                  padding: '9px 6px',
                  borderRadius: '8px',
                  backgroundColor: 'rgba(15, 23, 42, 0.8)',
                  border: '1px solid rgba(255, 255, 255, 0.2)',
                  color: '#fff',
                  fontFamily: 'monospace',
                  fontSize: '0.85rem',
                  textAlign: 'center',
                }}
                title="Value to insert"
              />
            </div>

            {/* Trigger Null Pointer Dereference */}
            <button
              onClick={triggerNullPointerDereference}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                padding: '10px 16px',
                borderRadius: '8px',
                backgroundColor: 'rgba(239, 68, 68, 0.15)',
                border: '1px solid #ef4444',
                color: '#f87171',
                fontWeight: 600,
                fontSize: '0.85rem',
                cursor: 'pointer',
              }}
            >
              <ShieldAlert size={15} />
              <span>Dereference NULL (NullPointerException)</span>
            </button>

            {/* Repair Link Button */}
            {linkedListIsSevered && (
              <button
                onClick={repairLinkedListLink}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  padding: '10px 16px',
                  borderRadius: '8px',
                  backgroundColor: 'rgba(245, 158, 11, 0.2)',
                  border: '1px solid #f59e0b',
                  color: '#fbbf24',
                  fontWeight: 600,
                  fontSize: '0.85rem',
                  cursor: 'pointer',
                }}
              >
                <Wrench size={15} />
                <span>Repair Chain</span>
              </button>
            )}

            {/* Reset Button */}
            <button
              onClick={resetLinkedList}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                padding: '10px 14px',
                borderRadius: '8px',
                backgroundColor: 'rgba(255, 255, 255, 0.05)',
                border: '1px solid rgba(255, 255, 255, 0.15)',
                color: '#94a3b8',
                fontWeight: 600,
                fontSize: '0.85rem',
                cursor: 'pointer',
                marginLeft: 'auto',
              }}
              title="Reset chain back to A -> B -> C -> NULL"
            >
              <RotateCcw size={15} />
              <span>Reset</span>
            </button>
          </div>

          {/* Operation Details & Code Inspector */}
          {linkedListOperation && (
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: '1fr 1fr',
                gap: '1rem',
                padding: '1.25rem',
                borderRadius: '12px',
                backgroundColor: 'rgba(15, 23, 42, 0.65)',
                border: '1px solid rgba(255, 255, 255, 0.08)',
              }}
            >
              {/* Left Column: Pedagogical Explanation */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <Zap size={16} color="#fbbf24" />
                  <span style={{ fontWeight: 700, fontSize: '0.88rem', color: '#f8fafc' }}>
                    Pedagogical Telemetry
                  </span>
                  <span
                    style={{
                      fontSize: '0.7rem',
                      fontWeight: 700,
                      fontFamily: 'monospace',
                      padding: '2px 8px',
                      borderRadius: '4px',
                      backgroundColor:
                        linkedListOperation.timeComplexity === 'O(1)'
                          ? 'rgba(16, 185, 129, 0.2)'
                          : 'rgba(245, 158, 11, 0.2)',
                      color:
                        linkedListOperation.timeComplexity === 'O(1)' ? '#10b981' : '#f59e0b',
                      border:
                        linkedListOperation.timeComplexity === 'O(1)'
                          ? '1px solid rgba(16, 185, 129, 0.4)'
                          : '1px solid rgba(245, 158, 11, 0.4)',
                    }}
                  >
                    {linkedListOperation.timeComplexity}
                  </span>
                </div>

                <p style={{ fontSize: '0.82rem', color: '#cbd5e1', lineHeight: 1.5, margin: 0 }}>
                  {linkedListOperation.description}
                </p>

                <div style={{ marginTop: 'auto', fontSize: '0.75rem', color: '#94a3b8' }}>
                  Contrast with Array: Linked lists eliminate contiguous block reallocations and O(n) element shifting during insertion.
                </div>
              </div>

              {/* Right Column: Code Snippet */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <span style={{ fontSize: '0.75rem', fontFamily: 'monospace', color: '#94a3b8' }}>
                    C / Java Pointer Trace
                  </span>
                  <span style={{ fontSize: '0.7rem', color: '#64748b' }}>Live Memory Mutation</span>
                </div>

                <pre
                  style={{
                    margin: 0,
                    padding: '0.75rem 1rem',
                    borderRadius: '8px',
                    backgroundColor: '#020617',
                    border: '1px solid rgba(255, 255, 255, 0.1)',
                    fontFamily: 'monospace',
                    fontSize: '0.78rem',
                    color: '#e2e8f0',
                    lineHeight: 1.45,
                    overflowX: 'auto',
                  }}
                >
                  {linkedListOperation.codeSnippet}
                </pre>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
