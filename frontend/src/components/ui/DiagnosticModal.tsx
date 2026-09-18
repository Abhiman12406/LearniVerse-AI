import React, { useState } from 'react';
import {
  X,
  Sparkles,
  HelpCircle,
  ChevronLeft,
  ChevronRight,
  CheckCircle2,
  AlertTriangle,
  RotateCcw,
  Zap,
  Code2,
  BookOpen,
  Check,
  Flame,
  Award,
} from 'lucide-react';
import { useClassroomStore } from '../../store/useClassroomStore';
import { DEFAULT_DIAGNOSTIC_ASSESSMENT } from '../../data/diagnosticQuestions';

const CONCEPT_THEMES: Record<
  string,
  { name: string; color: string; bg: string; border: string; glow: string }
> = {
  array: {
    name: 'Array Station',
    color: '#38bdf8',
    bg: 'rgba(56, 189, 248, 0.12)',
    border: 'rgba(56, 189, 248, 0.4)',
    glow: 'rgba(56, 189, 248, 0.25)',
  },
  linked_list: {
    name: 'Linked List Lab',
    color: '#34d399',
    bg: 'rgba(52, 211, 153, 0.12)',
    border: 'rgba(52, 211, 153, 0.4)',
    glow: 'rgba(52, 211, 153, 0.25)',
  },
  stack: {
    name: 'Stack Lab',
    color: '#fb923c',
    bg: 'rgba(251, 146, 60, 0.12)',
    border: 'rgba(251, 146, 60, 0.4)',
    glow: 'rgba(251, 146, 60, 0.25)',
  },
  recursion: {
    name: 'Recursion Chamber',
    color: '#c084fc',
    bg: 'rgba(192, 132, 252, 0.12)',
    border: 'rgba(192, 132, 252, 0.4)',
    glow: 'rgba(192, 132, 252, 0.25)',
  },
  tree: {
    name: 'Tree & BST Lab',
    color: '#10b981',
    bg: 'rgba(16, 185, 129, 0.12)',
    border: 'rgba(16, 185, 129, 0.4)',
    glow: 'rgba(16, 185, 129, 0.25)',
  },
};

export const DiagnosticModal: React.FC = () => {
  const {
    isDiagnosticOpen,
    closeDiagnostic,
    diagnosticAssessment,
    diagnosticAnswers,
    diagnosticCurrentIndex,
    diagnosticSubmitted,
    diagnosticResult,
    isDiagnosticLoading,
    isDiagnosticSubmitting,
    setDiagnosticAnswer,
    setDiagnosticIndex,
    submitDiagnosticAssessment,
    resetDiagnosticAssessment,
  } = useClassroomStore();

  const [showHint, setShowHint] = useState(false);

  if (!isDiagnosticOpen) return null;

  const assessment = diagnosticAssessment || DEFAULT_DIAGNOSTIC_ASSESSMENT;
  const questions = assessment.questions || [];
  const currentQ = questions[diagnosticCurrentIndex] || questions[0];
  const currentConcept = currentQ?.concept || 'array';
  const theme = CONCEPT_THEMES[currentConcept] || CONCEPT_THEMES.array;

  const answeredCount = Object.keys(diagnosticAnswers).length;
  const totalQuestions = questions.length;
  const progressPercent = Math.round((answeredCount / totalQuestions) * 100);
  const isCurrentAnswered = currentQ ? !!diagnosticAnswers[currentQ.id] : false;
  const allAnswered = answeredCount === totalQuestions;

  const handleSelectOption = (optionId: string) => {
    if (diagnosticSubmitted || isDiagnosticSubmitting) return;
    setDiagnosticAnswer(currentQ.id, optionId);
  };

  const handleNext = () => {
    if (diagnosticCurrentIndex < totalQuestions - 1) {
      setDiagnosticIndex(diagnosticCurrentIndex + 1);
      setShowHint(false);
    }
  };

  const handlePrev = () => {
    if (diagnosticCurrentIndex > 0) {
      setDiagnosticIndex(diagnosticCurrentIndex - 1);
      setShowHint(false);
    }
  };

  return (
    <div
      className="diagnostic-modal-backdrop"
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 9999,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'rgba(5, 7, 12, 0.85)',
        backdropFilter: 'blur(20px)',
        WebkitBackdropFilter: 'blur(20px)',
        padding: '16px',
        boxSizing: 'border-box',
      }}
      onClick={(e) => {
        if (e.target === e.currentTarget) closeDiagnostic();
      }}
    >
      <div
        className="diagnostic-modal-container glass-panel"
        style={{
          width: '100%',
          maxWidth: '920px',
          maxHeight: '92vh',
          display: 'flex',
          flexDirection: 'column',
          background: 'rgba(13, 17, 26, 0.96)',
          border: `1px solid ${theme.border}`,
          borderRadius: '16px',
          boxShadow: `0 0 35px ${theme.glow}, 0 25px 60px rgba(0, 0, 0, 0.8)`,
          overflow: 'hidden',
          transition: 'border-color 0.3s ease, box-shadow 0.3s ease',
        }}
      >
        {/* Header Bar */}
        <div
          style={{
            padding: '16px 22px',
            borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            background: 'rgba(10, 14, 22, 0.98)',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div
              style={{
                width: '32px',
                height: '32px',
                borderRadius: '8px',
                background: theme.bg,
                border: `1px solid ${theme.border}`,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: theme.color,
              }}
            >
              <Sparkles size={18} />
            </div>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <h2
                  style={{
                    fontSize: '15px',
                    fontWeight: 800,
                    letterSpacing: '0.04em',
                    textTransform: 'uppercase',
                    color: '#f8fafc',
                    margin: 0,
                    fontFamily: 'var(--font-mono, monospace)',
                  }}
                >
                  AI Cognitive Diagnostic Assessment
                </h2>
                <span
                  style={{
                    fontSize: '10px',
                    fontWeight: 700,
                    padding: '2px 8px',
                    borderRadius: '10px',
                    background: assessment.generated_by === 'gemini' ? 'rgba(168, 85, 247, 0.2)' : 'rgba(56, 189, 248, 0.2)',
                    color: assessment.generated_by === 'gemini' ? '#c084fc' : '#38bdf8',
                    border: `1px solid ${assessment.generated_by === 'gemini' ? '#a855f7' : '#38bdf8'}`,
                    fontFamily: 'var(--font-mono, monospace)',
                  }}
                >
                  {assessment.generated_by === 'gemini' ? '⚡ GEMINI-2.5 AI' : '🛡️ CURATED DAG BANK'}
                </span>
              </div>
              <p
                style={{
                  fontSize: '11px',
                  color: 'var(--text-secondary, #94a3b8)',
                  margin: '2px 0 0 0',
                }}
              >
                Evaluating baseline prerequisite readiness across 5 DSA curriculum nodes
              </p>
            </div>
          </div>

          <button
            onClick={closeDiagnostic}
            style={{
              background: 'rgba(255, 255, 255, 0.06)',
              border: '1px solid rgba(255, 255, 255, 0.12)',
              borderRadius: '8px',
              padding: '6px',
              cursor: 'pointer',
              color: '#94a3b8',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              transition: 'all 0.2s ease',
            }}
            title="Close Assessment Modal"
          >
            <X size={18} />
          </button>
        </div>

        {/* Stepper Bar */}
        <div
          style={{
            padding: '10px 22px',
            background: 'rgba(17, 24, 39, 0.7)',
            borderBottom: '1px solid rgba(255, 255, 255, 0.06)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: '8px',
            overflowX: 'auto',
          }}
        >
          {questions.map((q, idx) => {
            const qConcept = q.concept;
            const qTheme = CONCEPT_THEMES[qConcept] || CONCEPT_THEMES.array;
            const isActive = idx === diagnosticCurrentIndex;
            const isAnswered = !!diagnosticAnswers[q.id];

            return (
              <button
                key={q.id}
                onClick={() => {
                  setDiagnosticIndex(idx);
                  setShowHint(false);
                }}
                style={{
                  flex: 1,
                  minWidth: '120px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  padding: '7px 10px',
                  borderRadius: '8px',
                  border: `1px solid ${isActive ? qTheme.color : isAnswered ? 'rgba(52, 211, 153, 0.35)' : 'rgba(255, 255, 255, 0.08)'}`,
                  background: isActive ? qTheme.bg : isAnswered ? 'rgba(52, 211, 153, 0.07)' : 'rgba(255, 255, 255, 0.03)',
                  boxShadow: isActive ? `0 0 12px ${qTheme.glow}` : 'none',
                  cursor: 'pointer',
                  transition: 'all 0.2s ease',
                }}
              >
                <div
                  style={{
                    width: '20px',
                    height: '20px',
                    borderRadius: '50%',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '10px',
                    fontWeight: 800,
                    background: isAnswered ? '#10b981' : isActive ? qTheme.color : 'rgba(255, 255, 255, 0.1)',
                    color: isAnswered || isActive ? '#090d16' : '#94a3b8',
                  }}
                >
                  {isAnswered ? <Check size={12} strokeWidth={3} /> : idx + 1}
                </div>
                <div style={{ textAlign: 'left', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  <div
                    style={{
                      fontSize: '10px',
                      fontWeight: 700,
                      color: isActive ? qTheme.color : '#e2e8f0',
                      textTransform: 'uppercase',
                      fontFamily: 'var(--font-mono, monospace)',
                    }}
                  >
                    {q.concept.replace('_', ' ')}
                  </div>
                  <div style={{ fontSize: '9px', color: '#64748b' }}>
                    {isAnswered ? 'Answered' : 'Pending'}
                  </div>
                </div>
              </button>
            );
          })}
        </div>

        {/* Content Body */}
        <div
          style={{
            flex: 1,
            overflowY: 'auto',
            padding: '20px 24px',
            display: 'flex',
            flexDirection: 'column',
            gap: '18px',
          }}
        >
          {diagnosticSubmitted && diagnosticResult ? (
            /* Results & Evaluation State */
            <div
              style={{
                display: 'flex',
                flexDirection: 'column',
                gap: '20px',
                animation: 'fadeIn 0.3s ease',
              }}
            >
              <div
                style={{
                  padding: '20px',
                  borderRadius: '12px',
                  background: 'linear-gradient(135deg, rgba(16, 185, 129, 0.12), rgba(56, 189, 248, 0.08))',
                  border: '1px solid rgba(16, 185, 129, 0.3)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  flexWrap: 'wrap',
                  gap: '16px',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                  <div
                    style={{
                      width: '48px',
                      height: '48px',
                      borderRadius: '12px',
                      background: 'rgba(16, 185, 129, 0.2)',
                      border: '1px solid #10b981',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      color: '#10b981',
                    }}
                  >
                    <Award size={28} />
                  </div>
                  <div>
                    <h3
                      style={{
                        margin: 0,
                        fontSize: '18px',
                        fontWeight: 800,
                        color: '#f8fafc',
                        fontFamily: 'var(--font-mono, monospace)',
                      }}
                    >
                      Diagnostic Evaluation Complete
                    </h3>
                    <p style={{ margin: '4px 0 0 0', fontSize: '12px', color: '#94a3b8' }}>
                      Learner Baseline Recorded: {diagnosticResult.correct_count} / {diagnosticResult.total_questions} Concepts Verified ({diagnosticResult.score_percentage}%)
                    </p>
                  </div>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <button
                    onClick={resetDiagnosticAssessment}
                    className="cyber-button"
                    style={{
                      padding: '8px 14px',
                      fontSize: '11px',
                      fontWeight: 700,
                      background: 'rgba(255, 255, 255, 0.06)',
                      borderColor: 'rgba(255, 255, 255, 0.15)',
                      color: '#e2e8f0',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '6px',
                    }}
                  >
                    <RotateCcw size={13} />
                    <span>Retake Test</span>
                  </button>

                  <button
                    onClick={closeDiagnostic}
                    className="cyber-button"
                    style={{
                      padding: '8px 16px',
                      fontSize: '11px',
                      fontWeight: 800,
                      background: 'linear-gradient(135deg, rgba(56, 189, 248, 0.4), rgba(16, 185, 129, 0.4))',
                      borderColor: '#38bdf8',
                      color: '#f8fafc',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '6px',
                    }}
                  >
                    <CheckCircle2 size={13} />
                    <span>Continue to Classroom</span>
                  </button>
                </div>
              </div>

              {/* Concept Breakdown Grid */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: '10px' }}>
                {questions.map((q) => {
                  const isCorrect = diagnosticResult.concept_breakdown[q.concept];
                  const qTheme = CONCEPT_THEMES[q.concept] || CONCEPT_THEMES.array;

                  return (
                    <div
                      key={q.id}
                      style={{
                        padding: '12px',
                        borderRadius: '10px',
                        background: 'rgba(255, 255, 255, 0.03)',
                        border: `1px solid ${isCorrect ? 'rgba(52, 211, 153, 0.4)' : 'rgba(244, 63, 94, 0.4)'}`,
                        display: 'flex',
                        flexDirection: 'column',
                        gap: '6px',
                      }}
                    >
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <span
                          style={{
                            fontSize: '10px',
                            fontWeight: 800,
                            color: qTheme.color,
                            textTransform: 'uppercase',
                            fontFamily: 'var(--font-mono, monospace)',
                          }}
                        >
                          {q.concept.replace('_', ' ')}
                        </span>
                        {isCorrect ? (
                          <span style={{ fontSize: '10px', fontWeight: 700, color: '#34d399', display: 'flex', alignItems: 'center', gap: '2px' }}>
                            <CheckCircle2 size={12} /> Mastered
                          </span>
                        ) : (
                          <span style={{ fontSize: '10px', fontWeight: 700, color: '#fb7185', display: 'flex', alignItems: 'center', gap: '2px' }}>
                            <AlertTriangle size={12} /> Gap
                          </span>
                        )}
                      </div>
                      <div style={{ fontSize: '12px', fontWeight: 600, color: '#e2e8f0' }}>{q.title}</div>
                    </div>
                  );
                })}
              </div>

              {/* Question-by-Question Review */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginTop: '8px' }}>
                <h4
                  style={{
                    fontSize: '12px',
                    fontWeight: 700,
                    color: '#94a3b8',
                    textTransform: 'uppercase',
                    letterSpacing: '0.06em',
                    margin: '0 0 4px 0',
                    fontFamily: 'var(--font-mono, monospace)',
                  }}
                >
                  Diagnostic Question Review
                </h4>
                {diagnosticResult.reviews.map((r, idx) => {
                  const qItem = questions.find((q) => q.id === r.question_id);
                  const qTheme = CONCEPT_THEMES[r.concept] || CONCEPT_THEMES.array;

                  return (
                    <div
                      key={r.question_id}
                      style={{
                        padding: '14px',
                        borderRadius: '10px',
                        background: 'rgba(255, 255, 255, 0.02)',
                        border: '1px solid rgba(255, 255, 255, 0.07)',
                        display: 'flex',
                        flexDirection: 'column',
                        gap: '8px',
                      }}
                    >
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                        <div>
                          <span
                            style={{
                              fontSize: '10px',
                              fontWeight: 700,
                              color: qTheme.color,
                              fontFamily: 'var(--font-mono, monospace)',
                              textTransform: 'uppercase',
                            }}
                          >
                            Q{idx + 1} • {r.concept.replace('_', ' ')}
                          </span>
                          <h5 style={{ margin: '2px 0 0 0', fontSize: '13px', color: '#f1f5f9', fontWeight: 700 }}>
                            {r.title}
                          </h5>
                        </div>
                        <span
                          style={{
                            fontSize: '11px',
                            fontWeight: 700,
                            padding: '3px 8px',
                            borderRadius: '6px',
                            background: r.is_correct ? 'rgba(52, 211, 153, 0.15)' : 'rgba(244, 63, 94, 0.15)',
                            color: r.is_correct ? '#34d399' : '#fb7185',
                            border: `1px solid ${r.is_correct ? '#34d399' : '#fb7185'}`,
                          }}
                        >
                          {r.is_correct ? '✓ Correct' : '✗ Prerequisite Gap'}
                        </span>
                      </div>

                      <div
                        style={{
                          fontSize: '11px',
                          color: '#cbd5e1',
                          background: 'rgba(0, 0, 0, 0.35)',
                          padding: '8px 12px',
                          borderRadius: '6px',
                          lineHeight: '1.5',
                        }}
                      >
                        <strong>Pedagogical Review: </strong> {r.explanation}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          ) : isDiagnosticSubmitting ? (
            /* Submitting & Synthesizing State */
            <div
              style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                padding: '60px 20px',
                gap: '16px',
                textAlign: 'center',
              }}
            >
              <div
                style={{
                  width: '54px',
                  height: '54px',
                  borderRadius: '50%',
                  border: '3px solid rgba(56, 189, 248, 0.2)',
                  borderTopColor: '#38bdf8',
                  animation: 'spin 1s linear infinite',
                }}
              />
              <div>
                <h3
                  style={{
                    margin: 0,
                    fontSize: '16px',
                    fontWeight: 800,
                    color: '#f8fafc',
                    fontFamily: 'var(--font-mono, monospace)',
                  }}
                >
                  Synthesizing Cognitive Baseline...
                </h3>
                <p style={{ margin: '4px 0 0 0', fontSize: '12px', color: '#94a3b8' }}>
                  Evaluating response vector against 5 curriculum DAG nodes with Bayesian Knowledge Tracing
                </p>
              </div>
            </div>
          ) : (
            /* Question Active Form State */
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              {/* Question Header */}
              <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '12px' }}>
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                    <span
                      style={{
                        fontSize: '10px',
                        fontWeight: 800,
                        padding: '2px 8px',
                        borderRadius: '6px',
                        background: theme.bg,
                        color: theme.color,
                        border: `1px solid ${theme.border}`,
                        fontFamily: 'var(--font-mono, monospace)',
                        textTransform: 'uppercase',
                      }}
                    >
                      {currentQ.concept.replace('_', ' ')} • {currentQ.difficulty}
                    </span>
                    <span style={{ fontSize: '11px', color: '#64748b' }}>
                      Question {diagnosticCurrentIndex + 1} of {totalQuestions}
                    </span>
                  </div>
                  <h3
                    style={{
                      margin: 0,
                      fontSize: '16px',
                      fontWeight: 800,
                      color: '#f8fafc',
                      lineHeight: '1.4',
                    }}
                  >
                    {currentQ.title}
                  </h3>
                </div>

                <button
                  onClick={() => setShowHint(!showHint)}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '5px',
                    fontSize: '11px',
                    fontWeight: 700,
                    padding: '5px 10px',
                    borderRadius: '6px',
                    background: showHint ? 'rgba(234, 179, 8, 0.2)' : 'rgba(255, 255, 255, 0.05)',
                    border: `1px solid ${showHint ? '#eab308' : 'rgba(255, 255, 255, 0.12)'}`,
                    color: showHint ? '#fde047' : '#94a3b8',
                    cursor: 'pointer',
                    transition: 'all 0.2s ease',
                  }}
                  title="Reveal pedagogical hint and Feynman analogy"
                >
                  <HelpCircle size={13} />
                  <span>{showHint ? 'Hide Hint' : 'Need a Hint?'}</span>
                </button>
              </div>

              {/* Scenario Narrative */}
              <div
                style={{
                  fontSize: '13px',
                  lineHeight: '1.6',
                  color: '#cbd5e1',
                  background: 'rgba(255, 255, 255, 0.02)',
                  padding: '12px 16px',
                  borderRadius: '8px',
                  borderLeft: `3px solid ${theme.color}`,
                }}
              >
                {currentQ.scenario}
              </div>

              {/* Code Snippet */}
              {currentQ.code_snippet && currentQ.code_snippet.length > 0 && (
                <div
                  style={{
                    background: '#090d16',
                    border: '1px solid rgba(255, 255, 255, 0.1)',
                    borderRadius: '8px',
                    overflow: 'hidden',
                  }}
                >
                  <div
                    style={{
                      padding: '5px 12px',
                      background: 'rgba(255, 255, 255, 0.04)',
                      borderBottom: '1px solid rgba(255, 255, 255, 0.06)',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '6px',
                      fontSize: '10px',
                      fontWeight: 700,
                      color: '#94a3b8',
                      fontFamily: 'var(--font-mono, monospace)',
                    }}
                  >
                    <Code2 size={12} color={theme.color} />
                    <span>DSA EXECUTION BUFFER</span>
                  </div>
                  <pre
                    style={{
                      margin: 0,
                      padding: '12px 14px',
                      fontFamily: 'var(--font-mono, monospace)',
                      fontSize: '12px',
                      lineHeight: '1.55',
                      color: '#38bdf8',
                      overflowX: 'auto',
                    }}
                  >
                    {currentQ.code_snippet.map((line, lIdx) => (
                      <div key={lIdx} style={{ display: 'flex' }}>
                        <span
                          style={{
                            width: '26px',
                            color: '#475569',
                            userSelect: 'none',
                            textAlign: 'right',
                            marginRight: '12px',
                          }}
                        >
                          {lIdx + 1}
                        </span>
                        <span style={{ color: line.startsWith('//') ? '#64748b' : '#e2e8f0' }}>{line}</span>
                      </div>
                    ))}
                  </pre>
                </div>
              )}

              {/* Hint Box (Expandable) */}
              {showHint && (
                <div
                  style={{
                    padding: '12px 16px',
                    borderRadius: '8px',
                    background: 'rgba(234, 179, 8, 0.08)',
                    border: '1px solid rgba(234, 179, 8, 0.3)',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '6px',
                    animation: 'fadeIn 0.2s ease',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#fde047', fontSize: '11px', fontWeight: 800 }}>
                    <Flame size={13} />
                    <span>FEYNMAN INTUITION & PEDAGOGICAL HINT</span>
                  </div>
                  <div style={{ fontSize: '12px', color: '#fef08a', lineHeight: '1.5' }}>
                    <strong>Analogy: </strong> {currentQ.feynman_analogy}
                  </div>
                  <div style={{ fontSize: '11px', color: '#e2e8f0', lineHeight: '1.4' }}>
                    <strong>Hint: </strong> {currentQ.hint}
                  </div>
                </div>
              )}

              {/* Multiple Choice Options */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                <div
                  style={{
                    fontSize: '11px',
                    fontWeight: 700,
                    color: '#94a3b8',
                    textTransform: 'uppercase',
                    letterSpacing: '0.05em',
                    fontFamily: 'var(--font-mono, monospace)',
                  }}
                >
                  Select the Most Accurate Technical Answer:
                </div>

                {currentQ.options.map((opt) => {
                  const isSelected = diagnosticAnswers[currentQ.id] === opt.id;

                  return (
                    <button
                      key={opt.id}
                      onClick={() => handleSelectOption(opt.id)}
                      style={{
                        padding: '12px 16px',
                        borderRadius: '10px',
                        background: isSelected ? theme.bg : 'rgba(255, 255, 255, 0.03)',
                        border: `1px solid ${isSelected ? theme.color : 'rgba(255, 255, 255, 0.1)'}`,
                        boxShadow: isSelected ? `0 0 16px ${theme.glow}` : 'none',
                        display: 'flex',
                        alignItems: 'flex-start',
                        gap: '12px',
                        textAlign: 'left',
                        cursor: 'pointer',
                        transition: 'all 0.2s ease',
                        outline: 'none',
                      }}
                    >
                      <div
                        style={{
                          width: '24px',
                          height: '24px',
                          borderRadius: '6px',
                          background: isSelected ? theme.color : 'rgba(255, 255, 255, 0.08)',
                          color: isSelected ? '#090d16' : '#94a3b8',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          fontSize: '11px',
                          fontWeight: 800,
                          flexShrink: 0,
                          marginTop: '1px',
                          fontFamily: 'var(--font-mono, monospace)',
                        }}
                      >
                        {opt.label}
                      </div>

                      <div style={{ flex: 1, fontSize: '13px', lineHeight: '1.5', color: isSelected ? '#f8fafc' : '#cbd5e1' }}>
                        {opt.text}
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        {/* Footer Navigation & Progress */}
        {!diagnosticSubmitted && !isDiagnosticSubmitting && (
          <div
            style={{
              padding: '14px 22px',
              background: 'rgba(10, 14, 22, 0.98)',
              borderTop: '1px solid rgba(255, 255, 255, 0.08)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: '16px',
            }}
          >
            {/* Progress Bar & Counter */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flex: 1, maxWidth: '280px' }}>
              <div style={{ flex: 1, height: '6px', background: 'rgba(255, 255, 255, 0.1)', borderRadius: '3px', overflow: 'hidden' }}>
                <div
                  style={{
                    height: '100%',
                    width: `${progressPercent}%`,
                    background: 'linear-gradient(90deg, #38bdf8, #10b981)',
                    transition: 'width 0.3s ease',
                  }}
                />
              </div>
              <span
                style={{
                  fontSize: '11px',
                  fontWeight: 700,
                  color: '#94a3b8',
                  fontFamily: 'var(--font-mono, monospace)',
                  whiteSpace: 'nowrap',
                }}
              >
                {answeredCount} / {totalQuestions} ({progressPercent}%)
              </span>
            </div>

            {/* Stepper Buttons */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <button
                onClick={handlePrev}
                disabled={diagnosticCurrentIndex === 0}
                className="cyber-button"
                style={{
                  padding: '7px 12px',
                  fontSize: '11px',
                  fontWeight: 700,
                  display: 'flex',
                  alignItems: 'center',
                  gap: '4px',
                  opacity: diagnosticCurrentIndex === 0 ? 0.4 : 1,
                  cursor: diagnosticCurrentIndex === 0 ? 'not-allowed' : 'pointer',
                }}
              >
                <ChevronLeft size={14} />
                <span>Prev</span>
              </button>

              {diagnosticCurrentIndex < totalQuestions - 1 ? (
                <button
                  onClick={handleNext}
                  className="cyber-button"
                  style={{
                    padding: '7px 14px',
                    fontSize: '11px',
                    fontWeight: 800,
                    background: 'rgba(255, 255, 255, 0.08)',
                    borderColor: theme.border,
                    color: '#f8fafc',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '4px',
                  }}
                >
                  <span>Next</span>
                  <ChevronRight size={14} />
                </button>
              ) : null}

              {/* Submit Button */}
              <button
                id="btn-submit-diagnostic-assessment"
                onClick={submitDiagnosticAssessment}
                className="cyber-button"
                style={{
                  padding: '7px 16px',
                  fontSize: '11px',
                  fontWeight: 800,
                  background: allAnswered
                    ? 'linear-gradient(135deg, rgba(16, 185, 129, 0.6), rgba(56, 189, 248, 0.5))'
                    : 'rgba(16, 185, 129, 0.2)',
                  borderColor: '#10b981',
                  color: '#f8fafc',
                  boxShadow: allAnswered ? '0 0 16px rgba(16, 185, 129, 0.5)' : 'none',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  cursor: 'pointer',
                }}
                title={allAnswered ? 'Submit your answers for diagnostic evaluation' : 'Submit available answers'}
              >
                <Zap size={13} color="#34d399" />
                <span>{allAnswered ? 'SUBMIT TEST' : `SUBMIT (${answeredCount}/${totalQuestions})`}</span>
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
