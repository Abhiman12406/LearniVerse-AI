import React, { useState } from 'react';
import {
  Sparkles,
  X,
  BookOpen,
  HelpCircle,
  Compass,
  ShieldAlert,
  CheckCircle2,
  Layers,
  Cpu,
  ArrowRight,
} from 'lucide-react';
import { useClassroomStore } from '../../store/useClassroomStore';

export const AIMentorDialogue: React.FC = () => {
  const {
    isMentorOpen,
    closeMentor,
    mentorGuidance,
    learner,
  } = useClassroomStore();

  const [activeTab, setActiveTab] = useState<'feynman' | 'diagnostic' | 'qa'>('feynman');
  const [selectedQuestionId, setSelectedQuestionId] = useState<string | null>(null);

  if (!isMentorOpen || !mentorGuidance) return null;

  const isRemedial = mentorGuidance.status === 'remediation_required';
  const themeColor = isRemedial ? 'var(--purple-bright)' : 'var(--cyan-core)';
  const themeGlow = isRemedial ? 'var(--violet-glow)' : 'var(--cyan-glow)';
  const badgeColor = isRemedial ? 'var(--crimson-alert)' : 'var(--emerald-mastery)';

  const activeQuestion = mentorGuidance.interactive_questions.find(
    (q) => q.id === (selectedQuestionId || mentorGuidance.interactive_questions[0]?.id)
  );

  return (
    <div
      className="ui-interactive"
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 50,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: 'rgba(3, 5, 12, 0.75)',
        backdropFilter: 'blur(10px)',
        padding: '24px',
        animation: 'fadeIn 0.25s cubic-bezier(0.16, 1, 0.3, 1)',
      }}
      onClick={(e) => {
        if (e.target === e.currentTarget) closeMentor();
      }}
    >
      <div
        className="glass-panel"
        style={{
          width: '100%',
          maxWidth: '740px',
          maxHeight: '90vh',
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
          borderColor: isRemedial ? 'rgba(168, 85, 247, 0.4)' : 'rgba(0, 240, 255, 0.4)',
          boxShadow: `0 16px 48px rgba(0, 0, 0, 0.8), 0 0 32px ${themeGlow}`,
        }}
      >
        {/* Header Bar */}
        <header
          style={{
            padding: '16px 22px',
            borderBottom: '1px solid var(--border-subtle)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            background: 'linear-gradient(90deg, rgba(168, 85, 247, 0.08) 0%, rgba(0, 240, 255, 0.04) 100%)',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div
              style={{
                width: '36px',
                height: '36px',
                borderRadius: '8px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                background: 'rgba(168, 85, 247, 0.18)',
                border: '1px solid rgba(168, 85, 247, 0.4)',
                boxShadow: '0 0 12px rgba(168, 85, 247, 0.3)',
              }}
            >
              <Sparkles size={20} color={themeColor} />
            </div>

            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span
                  style={{
                    fontFamily: 'var(--font-display)',
                    fontSize: '15px',
                    fontWeight: 700,
                    color: 'var(--text-primary)',
                    letterSpacing: '0.04em',
                  }}
                >
                  AI Mentor // Feynman Cognitive Beacon
                </span>
                <span
                  className="glass-pill"
                  style={{
                    color: badgeColor,
                    borderColor: badgeColor,
                    fontSize: '10px',
                    padding: '2px 8px',
                  }}
                >
                  {isRemedial ? <ShieldAlert size={10} /> : <CheckCircle2 size={10} />}
                  {mentorGuidance.persona_type}
                </span>
              </div>
              <span
                style={{
                  fontSize: '11px',
                  fontFamily: 'var(--font-mono)',
                  color: 'var(--text-muted)',
                }}
              >
                Pedagogical Guidance & Prerequisite Knowledge Architecture
              </span>
            </div>
          </div>

          {/* Close Button */}
          <button
            onClick={closeMentor}
            className="glass-pill"
            style={{
              padding: '6px 12px',
              cursor: 'pointer',
              color: 'var(--text-secondary)',
              border: '1px solid var(--border-subtle)',
              transition: 'all 0.15s ease',
            }}
            title="Dismiss dialogue [ESC]"
          >
            <span style={{ fontSize: '10px', fontWeight: 600 }}>ESC</span>
            <X size={14} />
          </button>
        </header>

        {/* Navigation Tabs */}
        <div
          style={{
            display: 'flex',
            padding: '8px 22px',
            gap: '8px',
            borderBottom: '1px solid var(--border-subtle)',
            backgroundColor: 'rgba(8, 12, 22, 0.5)',
          }}
        >
          <button
            className="cyber-button"
            onClick={() => setActiveTab('feynman')}
            style={{
              fontSize: '11px',
              padding: '6px 14px',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              borderColor: activeTab === 'feynman' ? themeColor : 'transparent',
              color: activeTab === 'feynman' ? themeColor : 'var(--text-secondary)',
              background: activeTab === 'feynman' ? 'rgba(255, 255, 255, 0.06)' : 'transparent',
            }}
          >
            <BookOpen size={13} />
            Feynman Conceptual Bridge
          </button>

          <button
            className="cyber-button"
            onClick={() => setActiveTab('diagnostic')}
            style={{
              fontSize: '11px',
              padding: '6px 14px',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              borderColor: activeTab === 'diagnostic' ? themeColor : 'transparent',
              color: activeTab === 'diagnostic' ? themeColor : 'var(--text-secondary)',
              background: activeTab === 'diagnostic' ? 'rgba(255, 255, 255, 0.06)' : 'transparent',
            }}
          >
            <Layers size={13} />
            Prerequisite Diagnostics
          </button>

          <button
            className="cyber-button"
            onClick={() => setActiveTab('qa')}
            style={{
              fontSize: '11px',
              padding: '6px 14px',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              borderColor: activeTab === 'qa' ? themeColor : 'transparent',
              color: activeTab === 'qa' ? themeColor : 'var(--text-secondary)',
              background: activeTab === 'qa' ? 'rgba(255, 255, 255, 0.06)' : 'transparent',
            }}
          >
            <HelpCircle size={13} />
            Interactive Q&A ({mentorGuidance.interactive_questions.length})
          </button>
        </div>

        {/* Scrollable Content Body */}
        <div
          style={{
            padding: '22px',
            overflowY: 'auto',
            flex: 1,
            display: 'flex',
            flexDirection: 'column',
            gap: '18px',
          }}
        >
          {/* Greeting Box */}
          <div
            style={{
              padding: '12px 16px',
              borderRadius: '8px',
              background: 'rgba(255, 255, 255, 0.03)',
              borderLeft: `3px solid ${themeColor}`,
              fontSize: '13px',
              color: 'var(--text-primary)',
              lineHeight: '1.5',
            }}
          >
            <span style={{ fontWeight: 600, color: themeColor }}>AI Mentor: </span>
            "{mentorGuidance.greeting}"
          </div>

          {/* TAB 1: FEYNMAN CONCEPTUAL BRIDGE */}
          {activeTab === 'feynman' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              {/* Analogy Card */}
              <div
                className="glass-panel"
                style={{
                  padding: '16px',
                  backgroundColor: 'rgba(15, 22, 38, 0.65)',
                }}
              >
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    marginBottom: '8px',
                    fontSize: '11px',
                    fontFamily: 'var(--font-mono)',
                    color: 'var(--cyan-core)',
                    textTransform: 'uppercase',
                    letterSpacing: '0.08em',
                  }}
                >
                  <BookOpen size={14} />
                  Feynman Real-World Analogy
                </div>
                <p style={{ fontSize: '13px', lineHeight: '1.6', color: 'var(--text-primary)' }}>
                  {mentorGuidance.feynman_explanation.analogy}
                </p>
              </div>

              {/* Conceptual Bridge (Why A before B) */}
              <div
                className="glass-panel"
                style={{
                  padding: '16px',
                  backgroundColor: 'rgba(15, 22, 38, 0.65)',
                }}
              >
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    marginBottom: '8px',
                    fontSize: '11px',
                    fontFamily: 'var(--font-mono)',
                    color: themeColor,
                    textTransform: 'uppercase',
                    letterSpacing: '0.08em',
                  }}
                >
                  <Cpu size={14} />
                  Structural & Hardware Mechanism
                </div>
                <p style={{ fontSize: '13px', lineHeight: '1.6', color: 'var(--text-secondary)' }}>
                  {mentorGuidance.feynman_explanation.conceptual_bridge}
                </p>
                <div
                  style={{
                    marginTop: '10px',
                    padding: '10px 12px',
                    borderRadius: '6px',
                    background: 'rgba(0, 0, 0, 0.35)',
                    border: '1px solid var(--border-subtle)',
                    fontSize: '11px',
                    fontFamily: 'var(--font-mono)',
                    color: 'var(--text-muted)',
                  }}
                >
                  <strong style={{ color: 'var(--text-secondary)' }}>Hardware Execution Note: </strong>
                  {mentorGuidance.feynman_explanation.hardware_software_context}
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: PREREQUISITE DIAGNOSTICS */}
          {activeTab === 'diagnostic' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div
                className="glass-panel"
                style={{
                  padding: '16px',
                  backgroundColor: 'rgba(15, 22, 38, 0.65)',
                }}
              >
                <div
                  style={{
                    fontSize: '11px',
                    fontFamily: 'var(--font-mono)',
                    color: 'var(--cyan-core)',
                    marginBottom: '8px',
                    textTransform: 'uppercase',
                  }}
                >
                  Prerequisite Evaluation
                </div>
                <p style={{ fontSize: '13px', lineHeight: '1.55', color: 'var(--text-primary)' }}>
                  {mentorGuidance.diagnostic_summary}
                </p>

                {mentorGuidance.feynman_explanation.prerequisite_gap && (
                  <div
                    style={{
                      marginTop: '12px',
                      padding: '10px 14px',
                      borderRadius: '6px',
                      background: 'rgba(255, 0, 85, 0.12)',
                      border: '1px solid rgba(255, 0, 85, 0.3)',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '10px',
                      fontSize: '12px',
                      fontFamily: 'var(--font-mono)',
                      color: '#ff6699',
                    }}
                  >
                    <ShieldAlert size={16} />
                    <span>{mentorGuidance.feynman_explanation.prerequisite_gap}</span>
                  </div>
                )}
              </div>

              {/* Mastery Comparison */}
              {learner && (
                <div className="glass-panel" style={{ padding: '16px' }}>
                  <div
                    style={{
                      fontSize: '11px',
                      fontFamily: 'var(--font-mono)',
                      color: 'var(--text-muted)',
                      marginBottom: '12px',
                      textTransform: 'uppercase',
                    }}
                  >
                    Active Learner Mastery Graph
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: '10px' }}>
                    {Object.entries(learner.mastery_map).map(([c, val]) => {
                      const pct = Math.round(val * 100);
                      const isPassing = val >= 0.7;
                      const col = isPassing ? 'var(--emerald-mastery)' : val >= 0.45 ? 'var(--amber-mastery)' : 'var(--crimson-alert)';
                      return (
                        <div
                          key={c}
                          style={{
                            textAlign: 'center',
                            padding: '8px',
                            borderRadius: '6px',
                            background: 'rgba(255, 255, 255, 0.02)',
                            border: '1px solid var(--border-subtle)',
                          }}
                        >
                          <div style={{ fontSize: '10px', fontFamily: 'var(--font-mono)', color: 'var(--text-muted)', textTransform: 'uppercase' }}>
                            {c === 'linked_list' ? 'List' : c}
                          </div>
                          <div style={{ fontSize: '14px', fontFamily: 'var(--font-mono)', fontWeight: 700, color: col, margin: '4px 0' }}>
                            {pct}%
                          </div>
                          <div style={{ fontSize: '9px', color: isPassing ? 'var(--emerald-mastery)' : 'var(--crimson-alert)' }}>
                            {isPassing ? 'VERIFIED' : 'DEFICIENT'}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* TAB 3: INTERACTIVE Q&A */}
          {activeTab === 'qa' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>
                Select a conceptual question to receive direct Feynman-guided answers:
              </div>

              {/* Question Selection Chips */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {mentorGuidance.interactive_questions.map((q) => {
                  const isSelected = activeQuestion?.id === q.id;
                  return (
                    <button
                      key={q.id}
                      onClick={() => setSelectedQuestionId(q.id)}
                      className="glass-panel"
                      style={{
                        padding: '10px 14px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        cursor: 'pointer',
                        textAlign: 'left',
                        borderColor: isSelected ? themeColor : 'var(--border-subtle)',
                        background: isSelected ? 'rgba(168, 85, 247, 0.12)' : 'rgba(255, 255, 255, 0.02)',
                        transition: 'all 0.15s ease',
                      }}
                    >
                      <span style={{ fontSize: '12px', fontWeight: 600, color: isSelected ? 'var(--text-primary)' : 'var(--text-secondary)' }}>
                        {q.label}
                      </span>
                      <ArrowRight size={14} color={isSelected ? themeColor : 'var(--text-muted)'} />
                    </button>
                  );
                })}
              </div>

              {/* Active Answer Card */}
              {activeQuestion && (
                <div
                  className="glass-panel"
                  style={{
                    padding: '16px',
                    backgroundColor: 'rgba(10, 16, 30, 0.85)',
                    borderLeft: `4px solid ${themeColor}`,
                    marginTop: '6px',
                  }}
                >
                  <div
                    style={{
                      fontSize: '11px',
                      fontFamily: 'var(--font-mono)',
                      color: themeColor,
                      marginBottom: '6px',
                      textTransform: 'uppercase',
                    }}
                  >
                    AI Mentor Explanation
                  </div>
                  <p style={{ fontSize: '13px', lineHeight: '1.6', color: 'var(--text-primary)' }}>
                    {activeQuestion.answer}
                  </p>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Action Recommendation Footer */}
        <footer
          style={{
            padding: '16px 22px',
            borderTop: '1px solid var(--border-subtle)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            background: 'rgba(6, 9, 18, 0.75)',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', maxWidth: '440px' }}>
            <Compass size={16} color={themeColor} />
            <span style={{ fontSize: '11px', color: 'var(--text-secondary)', lineHeight: '1.4' }}>
              {mentorGuidance.action_recommendation}
            </span>
          </div>

          <div style={{ display: 'flex', gap: '10px' }}>
            <button
              className="cyber-button"
              onClick={closeMentor}
              style={{
                fontSize: '11px',
                padding: '8px 16px',
                borderColor: themeColor,
                color: '#ffffff',
                background: isRemedial
                  ? 'linear-gradient(135deg, rgba(168, 85, 247, 0.4) 0%, rgba(121, 40, 202, 0.4) 100%)'
                  : 'linear-gradient(135deg, rgba(0, 240, 255, 0.35) 0%, rgba(0, 150, 255, 0.35) 100%)',
              }}
            >
              Resume Exploration
            </button>
          </div>
        </footer>
      </div>
    </div>
  );
};
