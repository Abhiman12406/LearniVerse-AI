import React, { useState } from 'react';
import {
  Brain,
  X,
  RotateCw,
  ShieldAlert,
  CheckCircle2,
  Cpu,
  Calculator,
  HelpCircle,
  ChevronDown,
  ChevronRight,
  Sparkles,
  Terminal,
  Zap,
  Activity,
  Layers,
  Lock,
  Unlock,
} from 'lucide-react';
import { useClassroomStore } from '../../store/useClassroomStore';
import { getMasteryColor } from '../../utils/mastery';

export const TelemetryDrawer: React.FC = () => {
  const {
    isTelemetryOpen,
    closeTelemetry,
    activeTelemetryTab,
    setActiveTelemetryTab,
    learner,
    latestDeliberation,
    latestBktTrace,
    worldState,
    fetchDeliberation,
    submitInteraction,
    simulateMasteryJump,
  } = useClassroomStore();

  const [expandedTraceIndex, setExpandedTraceIndex] = useState<number | null>(null);
  const [isSimulating, setIsSimulating] = useState(false);

  if (!latestDeliberation) return null;

  const { final_decision, traces, llm_mode, world_instructions } = latestDeliberation;
  const isOverruled = final_decision.overruled || final_decision.guardrail_status === 'OVERRULED';

  const stackMastery = learner?.mastery_map.stack ?? 0.38;
  const recursionMastery = learner?.mastery_map.recursion ?? 0.2;
  const isRecursionUnlocked = worldState?.wings.recursion_lab?.status === 'accessible';

  const handleSimulateAnswer = async (correct: boolean) => {
    setIsSimulating(true);
    try {
      await submitInteraction('stack', `demo_bkt_${Date.now()}`, correct, 'medium');
    } finally {
      setIsSimulating(false);
    }
  };

  return (
    <aside
      aria-label="Telemetry and Explainability Drawer"
      style={{
        position: 'fixed',
        top: 0,
        right: 0,
        width: '520px',
        maxWidth: '96vw',
        height: '100vh',
        zIndex: 50,
        background: 'rgba(9, 13, 26, 0.94)',
        backdropFilter: 'blur(24px)',
        WebkitBackdropFilter: 'blur(24px)',
        borderLeft: '1px solid rgba(0, 240, 255, 0.28)',
        boxShadow: '-12px 0 50px rgba(0, 0, 0, 0.8), 0 0 30px rgba(0, 240, 255, 0.1)',
        display: 'flex',
        flexDirection: 'column',
        transform: isTelemetryOpen ? 'translateX(0)' : 'translateX(100%)',
        transition: 'transform 0.38s cubic-bezier(0.16, 1, 0.3, 1)',
        overflow: 'hidden',
        pointerEvents: isTelemetryOpen ? 'auto' : 'none',
      }}
    >
      {/* Drawer Header */}
      <header
        style={{
          padding: '16px 20px',
          borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
          background: 'rgba(0, 240, 255, 0.03)',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexShrink: 0,
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <div
            style={{
              width: '32px',
              height: '32px',
              borderRadius: '8px',
              background: 'rgba(0, 240, 255, 0.15)',
              border: '1px solid var(--cyan-core)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: '0 0 12px var(--cyan-glow)',
            }}
          >
            <Brain size={18} color="var(--cyan-core)" />
          </div>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <h2
                style={{
                  fontFamily: 'var(--font-display)',
                  fontSize: '14px',
                  fontWeight: 800,
                  letterSpacing: '0.08em',
                  color: 'var(--text-primary)',
                  margin: 0,
                  textTransform: 'uppercase',
                }}
              >
                Telemetry & Explainability
              </h2>
              <span
                style={{
                  width: '6px',
                  height: '6px',
                  borderRadius: '50%',
                  backgroundColor: '#00ff88',
                  boxShadow: '0 0 8px #00ff88',
                }}
              />
            </div>
            <div
              style={{
                fontSize: '10px',
                fontFamily: 'var(--font-mono)',
                color: 'var(--text-secondary)',
                marginTop: '2px',
              }}
            >
              5-Agent LangGraph Pipeline • BKT Belief Tracing
            </div>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <button
            onClick={() => fetchDeliberation(learner?.learner_id)}
            title="Re-run Deliberation Pipeline"
            style={{
              background: 'rgba(255, 255, 255, 0.05)',
              border: '1px solid var(--border-subtle)',
              borderRadius: '6px',
              color: 'var(--text-secondary)',
              cursor: 'pointer',
              padding: '6px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              transition: 'all 0.2s ease',
            }}
          >
            <RotateCw size={14} />
          </button>
          <button
            onClick={closeTelemetry}
            title="Close Drawer"
            style={{
              background: 'rgba(255, 255, 255, 0.05)',
              border: '1px solid var(--border-subtle)',
              borderRadius: '6px',
              color: 'var(--text-secondary)',
              cursor: 'pointer',
              padding: '6px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              transition: 'all 0.2s ease',
            }}
          >
            <X size={15} />
          </button>
        </div>
      </header>

      {/* Model Mode Banner */}
      <div
        style={{
          padding: '6px 20px',
          background: 'rgba(0, 0, 0, 0.4)',
          borderBottom: '1px solid rgba(255, 255, 255, 0.05)',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          fontSize: '10px',
          fontFamily: 'var(--font-mono)',
          flexShrink: 0,
        }}
      >
        <span style={{ color: 'var(--text-muted)' }}>STUDENT ID: {latestDeliberation.student_id.toUpperCase()}</span>
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          {llm_mode === 'gemini' ? (
            <span
              style={{
                color: '#a855f7',
                display: 'flex',
                alignItems: 'center',
                gap: '4px',
                fontWeight: 600,
              }}
            >
              <Sparkles size={11} /> GOOGLE GEMINI 1.5 PRO
            </span>
          ) : (
            <span
              style={{
                color: '#00f0ff',
                display: 'flex',
                alignItems: 'center',
                gap: '4px',
                fontWeight: 600,
              }}
            >
              <Cpu size={11} /> DETERMINISTIC POLICY FALLBACK
            </span>
          )}
        </div>
      </div>

      {/* Segmented Tab Navigation */}
      <nav
        style={{
          display: 'flex',
          borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
          background: 'rgba(255, 255, 255, 0.02)',
          padding: '4px 12px 0 12px',
          flexShrink: 0,
          gap: '6px',
        }}
      >
        <button
          onClick={() => setActiveTelemetryTab('explainability')}
          style={{
            flex: 1,
            padding: '9px 6px',
            fontSize: '11px',
            fontFamily: 'var(--font-mono)',
            fontWeight: 700,
            cursor: 'pointer',
            border: 'none',
            borderBottom:
              activeTelemetryTab === 'explainability'
                ? '2px solid var(--cyan-core)'
                : '2px solid transparent',
            background: 'transparent',
            color: activeTelemetryTab === 'explainability' ? 'var(--cyan-core)' : 'var(--text-muted)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '6px',
            transition: 'all 0.2s ease',
          }}
        >
          <HelpCircle size={13} />
          Why This Decision?
        </button>

        <button
          onClick={() => setActiveTelemetryTab('agents')}
          style={{
            flex: 1,
            padding: '9px 6px',
            fontSize: '11px',
            fontFamily: 'var(--font-mono)',
            fontWeight: 700,
            cursor: 'pointer',
            border: 'none',
            borderBottom:
              activeTelemetryTab === 'agents' ? '2px solid var(--cyan-core)' : '2px solid transparent',
            background: 'transparent',
            color: activeTelemetryTab === 'agents' ? 'var(--cyan-core)' : 'var(--text-muted)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '6px',
            transition: 'all 0.2s ease',
          }}
        >
          <Activity size={13} />
          5-Agent Traces ({traces.length})
        </button>

        <button
          onClick={() => setActiveTelemetryTab('bkt')}
          style={{
            flex: 1,
            padding: '9px 6px',
            fontSize: '11px',
            fontFamily: 'var(--font-mono)',
            fontWeight: 700,
            cursor: 'pointer',
            border: 'none',
            borderBottom:
              activeTelemetryTab === 'bkt' ? '2px solid var(--cyan-core)' : '2px solid transparent',
            background: 'transparent',
            color: activeTelemetryTab === 'bkt' ? 'var(--cyan-core)' : 'var(--text-muted)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '6px',
            transition: 'all 0.2s ease',
          }}
        >
          <Calculator size={13} />
          BKT Mathematics
        </button>
      </nav>

      {/* Drawer Scrollable Content */}
      <div
        style={{
          flex: 1,
          overflowY: 'auto',
          padding: '16px 20px',
          display: 'flex',
          flexDirection: 'column',
          gap: '16px',
        }}
      >
        {/* ============================================================ */}
        {/* TAB 1: WHY THIS DECISION? (EXPLAINABILITY INSPECTOR)          */}
        {/* ============================================================ */}
        {activeTelemetryTab === 'explainability' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            {/* Guardrail Policy Certification Card */}
            <div
              style={{
                borderRadius: '8px',
                padding: '14px 16px',
                background: isOverruled
                  ? 'rgba(255, 0, 85, 0.08)'
                  : 'rgba(0, 255, 136, 0.08)',
                border: `1px solid ${isOverruled ? 'rgba(255, 0, 85, 0.35)' : 'rgba(0, 255, 136, 0.35)'}`,
                boxShadow: isOverruled
                  ? '0 0 20px rgba(255, 0, 85, 0.12)'
                  : '0 0 20px rgba(0, 255, 136, 0.12)',
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span
                  style={{
                    fontSize: '10px',
                    fontFamily: 'var(--font-mono)',
                    fontWeight: 700,
                    letterSpacing: '0.08em',
                    textTransform: 'uppercase',
                    color: isOverruled ? '#ff0055' : '#00ff88',
                  }}
                >
                  DETERMINISTIC GUARDRAIL VERDICT
                </span>
                <span
                  className="glass-pill"
                  style={{
                    borderColor: isOverruled ? '#ff0055' : '#00ff88',
                    color: isOverruled ? '#ff0055' : '#00ff88',
                    fontSize: '10px',
                    fontWeight: 800,
                    letterSpacing: '0.05em',
                  }}
                >
                  {isOverruled ? 'OVERRULED' : 'CERTIFIED'}
                </span>
              </div>

              <h3
                style={{
                  fontFamily: 'var(--font-display)',
                  fontSize: '15px',
                  fontWeight: 700,
                  color: 'var(--text-primary)',
                  margin: '8px 0 6px 0',
                }}
              >
                {isOverruled
                  ? 'Prerequisite Gap Detected: Remediate Stack'
                  : 'Prerequisites Satisfied: Advance to Recursion'}
              </h3>

              <p
                style={{
                  fontSize: '12px',
                  color: 'var(--text-secondary)',
                  lineHeight: 1.5,
                  margin: 0,
                }}
              >
                {final_decision.overruling_reason || final_decision.reason}
              </p>
            </div>

            {/* Prerequisite Verification Grid */}
            <div
              className="glass-panel"
              style={{
                padding: '12px 16px',
                display: 'flex',
                flexDirection: 'column',
                gap: '10px',
              }}
            >
              <div
                style={{
                  fontSize: '10px',
                  fontFamily: 'var(--font-mono)',
                  color: 'var(--cyan-core)',
                  letterSpacing: '0.08em',
                  textTransform: 'uppercase',
                }}
              >
                PREREQUISITE DEPENDENCY CHECK (NEO4J DAG)
              </div>

              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: '1fr 1fr',
                  gap: '10px',
                  fontSize: '11px',
                  fontFamily: 'var(--font-mono)',
                }}
              >
                <div style={{ background: 'rgba(255, 255, 255, 0.03)', padding: '10px', borderRadius: '6px' }}>
                  <div style={{ color: 'var(--text-muted)', fontSize: '10px' }}>TARGET CONCEPT</div>
                  <div style={{ color: 'var(--text-primary)', fontWeight: 700, fontSize: '13px', marginTop: '2px' }}>
                    {final_decision.concept.toUpperCase()}
                  </div>
                  <div style={{ color: 'var(--text-secondary)', fontSize: '10px', marginTop: '2px' }}>
                    Station: {world_instructions.recommended_station}
                  </div>
                </div>

                <div style={{ background: 'rgba(255, 255, 255, 0.03)', padding: '10px', borderRadius: '6px' }}>
                  <div style={{ color: 'var(--text-muted)', fontSize: '10px' }}>ENFORCED ACTION</div>
                  <div
                    style={{
                      color: isOverruled ? '#ff6699' : '#00ffaa',
                      fontWeight: 700,
                      fontSize: '13px',
                      marginTop: '2px',
                    }}
                  >
                    {final_decision.action} ({final_decision.difficulty.toUpperCase()})
                  </div>
                  <div style={{ color: 'var(--text-secondary)', fontSize: '10px', marginTop: '2px' }}>
                    Guardrail: {final_decision.guardrail_status}
                  </div>
                </div>
              </div>

              {/* Stack vs Recursion Prerequisite Bar */}
              <div style={{ marginTop: '4px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', fontFamily: 'var(--font-mono)' }}>
                  <span style={{ color: 'var(--text-secondary)' }}>Stack Mastery vs 70% Gate</span>
                  <span style={{ color: getMasteryColor(stackMastery), fontWeight: 700 }}>
                    {Math.round(stackMastery * 100)}% / 70%
                  </span>
                </div>
                <div
                  style={{
                    position: 'relative',
                    width: '100%',
                    height: '8px',
                    backgroundColor: 'rgba(255, 255, 255, 0.08)',
                    borderRadius: '4px',
                    overflow: 'hidden',
                    marginTop: '6px',
                  }}
                >
                  <div
                    style={{
                      width: `${Math.round(stackMastery * 100)}%`,
                      height: '100%',
                      backgroundColor: getMasteryColor(stackMastery),
                      boxShadow: `0 0 10px ${getMasteryColor(stackMastery)}`,
                      transition: 'width 0.5s ease',
                    }}
                  />
                  {/* 70% Threshold Marker */}
                  <div
                    style={{
                      position: 'absolute',
                      left: '70%',
                      top: 0,
                      bottom: 0,
                      width: '2px',
                      backgroundColor: '#ffffff',
                      boxShadow: '0 0 4px #ffffff',
                    }}
                  />
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '9px', fontFamily: 'var(--font-mono)', color: 'var(--text-muted)', marginTop: '4px' }}>
                  <span>0%</span>
                  <span style={{ color: '#ffffff' }}>70% Gate Threshold</span>
                  <span>100%</span>
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', fontFamily: 'var(--font-mono)', marginTop: '8px', paddingTop: '6px', borderTop: '1px solid rgba(255, 255, 255, 0.06)' }}>
                  <span style={{ color: 'var(--text-secondary)' }}>Target Concept (Recursion) Current:</span>
                  <span style={{ color: getMasteryColor(recursionMastery), fontWeight: 700 }}>
                    {Math.round(recursionMastery * 100)}%
                  </span>
                </div>
              </div>
            </div>

            {/* Architectural Policy Statement */}
            <div
              className="glass-panel"
              style={{
                padding: '14px 16px',
                borderLeft: '3px solid var(--purple-bright)',
                background: 'rgba(168, 85, 247, 0.04)',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
                <Layers size={14} color="var(--purple-bright)" />
                <span
                  style={{
                    fontFamily: 'var(--font-mono)',
                    fontSize: '11px',
                    fontWeight: 700,
                    color: 'var(--purple-bright)',
                    letterSpacing: '0.05em',
                  }}
                >
                  CORE ARCHITECTURAL GUARANTEE
                </span>
              </div>
              <blockquote
                style={{
                  margin: 0,
                  fontSize: '11px',
                  fontStyle: 'italic',
                  color: 'var(--text-secondary)',
                  lineHeight: 1.5,
                }}
              >
                &ldquo;The LLM is never the single source of truth for learner mastery. BKT models student
                belief, Neo4j models curriculum dependencies, and deterministic policy guardrails overrule any
                premature assignment before world transformation occurs.&rdquo;
              </blockquote>
            </div>

            {/* Active World Transformation Instructions */}
            <div className="glass-panel" style={{ padding: '12px 16px' }}>
              <div
                style={{
                  fontSize: '10px',
                  fontFamily: 'var(--font-mono)',
                  color: 'var(--cyan-core)',
                  letterSpacing: '0.08em',
                  textTransform: 'uppercase',
                  marginBottom: '10px',
                }}
              >
                EXECUTED 3D WORLD TRANSFORMATIONS
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', fontSize: '11px', fontFamily: 'var(--font-mono)' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <span style={{ color: 'var(--text-secondary)' }}>Guidance Light Conduits</span>
                  <span style={{ color: 'var(--cyan-core)', fontWeight: 600 }}>
                    Targeting {world_instructions.conduits_target_wing}
                  </span>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <span style={{ color: 'var(--text-secondary)' }}>Recursion Lab Forcefield</span>
                  <span
                    style={{
                      color: isRecursionUnlocked ? '#00ff88' : '#ff0055',
                      fontWeight: 700,
                      display: 'flex',
                      alignItems: 'center',
                      gap: '4px',
                    }}
                  >
                    {isRecursionUnlocked ? <Unlock size={12} /> : <Lock size={12} />}
                    {isRecursionUnlocked ? 'DISSOLVED (ACCESSIBLE)' : 'SEALED (COLLISION ACTIVE)'}
                  </span>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <span style={{ color: 'var(--text-secondary)' }}>Active Mission</span>
                  <span style={{ color: 'var(--text-primary)', fontWeight: 600 }}>
                    {world_instructions.active_mission.title || world_instructions.active_mission.name}
                  </span>
                </div>
              </div>
            </div>

            {/* Quick Demo Action */}
            {stackMastery < 0.7 && (
              <div
                style={{
                  padding: '12px 14px',
                  background: 'rgba(245, 158, 11, 0.08)',
                  border: '1px solid rgba(245, 158, 11, 0.3)',
                  borderRadius: '8px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  gap: '12px',
                }}
              >
                <div>
                  <div style={{ fontSize: '11px', fontWeight: 700, color: '#f59e0b', fontFamily: 'var(--font-mono)' }}>
                    DEMO ACCELERATION
                  </div>
                  <div style={{ fontSize: '10px', color: 'var(--text-secondary)', marginTop: '2px' }}>
                    Jump Stack to 75% to trigger live barrier dissolve & certification
                  </div>
                </div>
                <button
                  onClick={() => simulateMasteryJump(learner?.learner_id || 'learner_b', 'stack', 0.75)}
                  className="cyber-button"
                  style={{
                    borderColor: '#f59e0b',
                    color: '#f59e0b',
                    background: 'rgba(245, 158, 11, 0.15)',
                    fontSize: '10px',
                    padding: '6px 10px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '4px',
                    whiteSpace: 'nowrap',
                  }}
                >
                  <Zap size={12} /> Jump to 75%
                </button>
              </div>
            )}
          </div>
        )}

        {/* ============================================================ */}
        {/* TAB 2: 5-AGENT DELIBERATION PIPELINE TRACES                   */}
        {/* ============================================================ */}
        {activeTelemetryTab === 'agents' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <div
              style={{
                fontSize: '11px',
                color: 'var(--text-secondary)',
                lineHeight: 1.4,
              }}
            >
              Live trace of the sequential LangGraph pipeline: Context &rarr; Diagnostic &rarr; Planner
              &rarr; Validator &rarr; Game Agent. Click any card to inspect structured input/output JSON.
            </div>

            {traces.map((trace, idx) => {
              const isExpanded = expandedTraceIndex === idx;
              const isValOverrule = trace.agent_name === 'Validator Agent' && trace.status === 'OVERRULED';
              const isValCert = trace.agent_name === 'Validator Agent' && trace.status === 'CERTIFIED';

              const badgeColor = isValOverrule
                ? '#ff0055'
                : isValCert
                ? '#00ff88'
                : 'var(--cyan-core)';

              return (
                <div
                  key={`${trace.agent_name}-${idx}`}
                  style={{
                    borderRadius: '8px',
                    background: 'rgba(255, 255, 255, 0.03)',
                    border: `1px solid ${isValOverrule ? 'rgba(255, 0, 85, 0.4)' : 'rgba(255, 255, 255, 0.08)'}`,
                    overflow: 'hidden',
                    transition: 'all 0.2s ease',
                  }}
                >
                  {/* Card Header */}
                  <div
                    onClick={() => setExpandedTraceIndex(isExpanded ? null : idx)}
                    style={{
                      padding: '10px 14px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      cursor: 'pointer',
                      background: isExpanded ? 'rgba(255, 255, 255, 0.05)' : 'transparent',
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                      <span
                        style={{
                          fontFamily: 'var(--font-mono)',
                          fontSize: '10px',
                          color: 'var(--text-muted)',
                        }}
                      >
                        0{idx + 1}
                      </span>
                      <div>
                        <div
                          style={{
                            fontFamily: 'var(--font-display)',
                            fontSize: '13px',
                            fontWeight: 700,
                            color: 'var(--text-primary)',
                          }}
                        >
                          {trace.agent_name}
                        </div>
                        <div
                          style={{
                            fontSize: '10px',
                            fontFamily: 'var(--font-mono)',
                            color: 'var(--text-muted)',
                          }}
                        >
                          {trace.stage}
                        </div>
                      </div>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <span
                        style={{
                          fontSize: '10px',
                          fontFamily: 'var(--font-mono)',
                          color: 'var(--text-muted)',
                        }}
                      >
                        {trace.duration_ms.toFixed(1)}ms
                      </span>
                      <span
                        className="glass-pill"
                        style={{
                          borderColor: badgeColor,
                          color: badgeColor,
                          fontSize: '9px',
                          fontWeight: 700,
                        }}
                      >
                        {trace.status}
                      </span>
                      {isExpanded ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
                    </div>
                  </div>

                  {/* Reasoning Preview */}
                  <div
                    style={{
                      padding: '0 14px 10px 14px',
                      fontSize: '11px',
                      color: 'var(--text-secondary)',
                      lineHeight: 1.4,
                    }}
                  >
                    {trace.reasoning}
                  </div>

                  {/* Expanded JSON Inspector */}
                  {isExpanded && (
                    <div
                      style={{
                        padding: '12px 14px',
                        background: 'rgba(0, 0, 0, 0.6)',
                        borderTop: '1px solid rgba(255, 255, 255, 0.06)',
                        fontSize: '10px',
                        fontFamily: 'var(--font-mono)',
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: 'var(--cyan-core)', marginBottom: '4px' }}>
                        <Terminal size={11} />
                        <span>INPUT SUMMARY</span>
                      </div>
                      <pre
                        style={{
                          background: 'rgba(255, 255, 255, 0.02)',
                          padding: '8px',
                          borderRadius: '4px',
                          margin: '0 0 10px 0',
                          overflowX: 'auto',
                          color: '#b0c4de',
                        }}
                      >
                        {JSON.stringify(trace.input_summary, null, 2)}
                      </pre>

                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#00ff88', marginBottom: '4px' }}>
                        <Terminal size={11} />
                        <span>OUTPUT SUMMARY</span>
                      </div>
                      <pre
                        style={{
                          background: 'rgba(255, 255, 255, 0.02)',
                          padding: '8px',
                          borderRadius: '4px',
                          margin: 0,
                          overflowX: 'auto',
                          color: '#b0c4de',
                        }}
                      >
                        {JSON.stringify(trace.output_summary, null, 2)}
                      </pre>

                      <div style={{ marginTop: '8px', fontSize: '9px', color: 'var(--text-muted)' }}>
                        Timestamp: {new Date(trace.timestamp).toLocaleTimeString()}
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}

        {/* ============================================================ */}
        {/* TAB 3: BKT MATHEMATICS INSPECTOR                              */}
        {/* ============================================================ */}
        {activeTelemetryTab === 'bkt' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            {/* Mathematical Formula Banner */}
            <div
              className="glass-panel"
              style={{
                padding: '12px 16px',
                background: 'rgba(0, 240, 255, 0.03)',
                borderColor: 'var(--border-cyan)',
              }}
            >
              <div
                style={{
                  fontSize: '10px',
                  fontFamily: 'var(--font-mono)',
                  color: 'var(--cyan-core)',
                  letterSpacing: '0.08em',
                  textTransform: 'uppercase',
                  marginBottom: '6px',
                }}
              >
                BAYESIAN KNOWLEDGE TRACING EQUATIONS
              </div>

              <div
                style={{
                  fontSize: '11px',
                  fontFamily: 'var(--font-mono)',
                  color: 'var(--text-primary)',
                  lineHeight: 1.6,
                }}
              >
                <div>1. Observation Update (Bayes Rule):</div>
                <div style={{ color: 'var(--cyan-core)', paddingLeft: '8px', fontSize: '10px' }}>
                  P(L|obs) = [P(L) &times; P(obs|L)] / [P(L) &times; P(obs|L) + (1 &minus; P(L)) &times; P(obs|&not;L)]
                </div>
                <div style={{ marginTop: '4px' }}>2. Learning State Transition:</div>
                <div style={{ color: '#00ff88', paddingLeft: '8px', fontSize: '10px' }}>
                  P(L&#8288;<sub>t</sub>) = P(L|obs) + (1 &minus; P(L|obs)) &times; P(T)
                </div>
              </div>
            </div>

            {/* Current Belief Step-by-Step Breakdown */}
            {latestBktTrace && (
              <div className="glass-panel" style={{ padding: '14px 16px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontSize: '11px', fontFamily: 'var(--font-mono)', fontWeight: 700, color: 'var(--text-primary)' }}>
                    ACTIVE STEP: {latestBktTrace.concept.toUpperCase()} CONCEPT
                  </span>
                  <span
                    className="glass-pill"
                    style={{
                      borderColor: latestBktTrace.correct ? '#00ff88' : '#ff0055',
                      color: latestBktTrace.correct ? '#00ff88' : '#ff0055',
                      fontSize: '9px',
                      fontWeight: 700,
                    }}
                  >
                    {latestBktTrace.correct ? 'EVIDENCE: CORRECT (+1)' : 'EVIDENCE: INCORRECT (0)'}
                  </span>
                </div>

                {/* Substituted Numbers */}
                <div
                  style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(3, 1fr)',
                    gap: '8px',
                    fontSize: '10px',
                    fontFamily: 'var(--font-mono)',
                  }}
                >
                  <div style={{ background: 'rgba(255, 255, 255, 0.03)', padding: '8px', borderRadius: '4px' }}>
                    <div style={{ color: 'var(--text-muted)' }}>PRIOR P(L&#8288;<sub>t-1</sub>)</div>
                    <div style={{ color: 'var(--cyan-core)', fontSize: '13px', fontWeight: 700, marginTop: '2px' }}>
                      {latestBktTrace.prior.toFixed(2)}
                    </div>
                  </div>

                  <div style={{ background: 'rgba(255, 255, 255, 0.03)', padding: '8px', borderRadius: '4px' }}>
                    <div style={{ color: 'var(--text-muted)' }}>SLIP P(S)</div>
                    <div style={{ color: 'var(--text-primary)', fontSize: '13px', fontWeight: 700, marginTop: '2px' }}>
                      {latestBktTrace.p_slip.toFixed(2)}
                    </div>
                  </div>

                  <div style={{ background: 'rgba(255, 255, 255, 0.03)', padding: '8px', borderRadius: '4px' }}>
                    <div style={{ color: 'var(--text-muted)' }}>GUESS P(G)</div>
                    <div style={{ color: 'var(--text-primary)', fontSize: '13px', fontWeight: 700, marginTop: '2px' }}>
                      {latestBktTrace.p_guess.toFixed(2)}
                    </div>
                  </div>
                </div>

                {/* Calculation Steps */}
                <div
                  style={{
                    background: 'rgba(0, 0, 0, 0.3)',
                    padding: '10px',
                    borderRadius: '6px',
                    fontSize: '10px',
                    fontFamily: 'var(--font-mono)',
                    color: 'var(--text-secondary)',
                    lineHeight: 1.6,
                  }}
                >
                  <div>
                    &bull; Likelihood Numerator: {latestBktTrace.numerator.toFixed(4)}
                  </div>
                  <div>
                    &bull; Likelihood Denominator: {latestBktTrace.denominator.toFixed(4)}
                  </div>
                  <div>
                    &bull; Posterior Given Observation P(L|obs): {latestBktTrace.p_obs.toFixed(3)}
                  </div>
                  <div>
                    &bull; Transition Rate P(T): {latestBktTrace.p_transit.toFixed(2)}
                  </div>
                  <div style={{ color: '#00ff88', fontWeight: 700, marginTop: '4px' }}>
                    &rarr; Final Posterior P(L&#8288;<sub>t</sub>): {latestBktTrace.posterior.toFixed(2)} (&Delta; ={' '}
                    {latestBktTrace.delta >= 0 ? `+${latestBktTrace.delta.toFixed(2)}` : latestBktTrace.delta.toFixed(2)})
                  </div>
                </div>

                {/* Threshold Delta Status */}
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: '11px', fontFamily: 'var(--font-mono)' }}>
                  <span style={{ color: 'var(--text-muted)' }}>70% Gate Crossing Status:</span>
                  <span
                    style={{
                      color: latestBktTrace.posterior >= 0.7 ? '#00ff88' : '#ff0055',
                      fontWeight: 700,
                    }}
                  >
                    {latestBktTrace.posterior >= 0.7
                      ? 'THRESHOLD CROSSED (WING UNLOCKED)'
                      : `DEFICIT: -${Math.round((0.7 - latestBktTrace.posterior) * 100)}%`}
                  </span>
                </div>
              </div>
            )}

            {/* Live Interactive Simulator Box */}
            <div
              className="glass-panel"
              style={{
                padding: '14px 16px',
                border: '1px solid rgba(0, 240, 255, 0.25)',
                display: 'flex',
                flexDirection: 'column',
                gap: '10px',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Zap size={14} color="var(--cyan-core)" />
                <span
                  style={{
                    fontSize: '11px',
                    fontFamily: 'var(--font-mono)',
                    fontWeight: 700,
                    color: 'var(--cyan-core)',
                    letterSpacing: '0.05em',
                  }}
                >
                  LIVE BKT INTERACTION SIMULATOR
                </span>
              </div>
              <div style={{ fontSize: '11px', color: 'var(--text-secondary)', lineHeight: 1.4 }}>
                Simulate student responses to observe real-time Bayesian belief updating, parameter
                contributions, and posterior delta:
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', marginTop: '4px' }}>
                <button
                  disabled={isSimulating}
                  onClick={() => handleSimulateAnswer(true)}
                  className="cyber-button"
                  style={{
                    borderColor: '#00ff88',
                    color: '#00ff88',
                    background: 'rgba(0, 255, 136, 0.12)',
                    fontSize: '10px',
                    padding: '8px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '6px',
                  }}
                >
                  <CheckCircle2 size={12} /> Correct (+Evidence)
                </button>

                <button
                  disabled={isSimulating}
                  onClick={() => handleSimulateAnswer(false)}
                  className="cyber-button"
                  style={{
                    borderColor: '#ff0055',
                    color: '#ff0055',
                    background: 'rgba(255, 0, 85, 0.12)',
                    fontSize: '10px',
                    padding: '8px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '6px',
                  }}
                >
                  <ShieldAlert size={12} /> Incorrect (&minus;Evidence)
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Drawer Footer */}
      <footer
        style={{
          padding: '12px 20px',
          borderTop: '1px solid rgba(255, 255, 255, 0.08)',
          background: 'rgba(0, 0, 0, 0.5)',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          fontSize: '10px',
          fontFamily: 'var(--font-mono)',
          color: 'var(--text-muted)',
          flexShrink: 0,
        }}
      >
        <span>STATUS: LIVE_TELEMETRY_SYNCED</span>
        <span>GATE THRESHOLD: 70%</span>
      </footer>
    </aside>
  );
};
export default TelemetryDrawer;
