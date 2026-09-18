import React, { useEffect } from 'react';
import {
  ArrowDownToLine,
  ArrowUpFromLine,
  X,
  CheckCircle2,
  AlertTriangle,
  Lightbulb,
  ChevronLeft,
  ChevronRight,
  Sparkles,
  Layers,
  RotateCcw,
  Zap,
  Unlock,
  TrendingUp,
  TrendingDown,
  Play,
} from 'lucide-react';
import { useClassroomStore } from '../../store/useClassroomStore';

export const StationConsoleModal: React.FC = () => {
  const activeStation = useClassroomStore((s) => s.activeStation);
  const setActiveStation = useClassroomStore((s) => s.setActiveStation);

  // Stack apparatus state & actions
  const stackDiscs = useClassroomStore((s) => s.stackDiscs);
  const pushStackDisc = useClassroomStore((s) => s.pushStackDisc);
  const popStackDisc = useClassroomStore((s) => s.popStackDisc);

  // Challenge console state & actions
  const stackMission = useClassroomStore((s) => s.stackMission);
  const activeChallengeIndex = useClassroomStore((s) => s.activeChallengeIndex);
  const selectedAnswers = useClassroomStore((s) => s.selectedAnswers);
  const submittedAnswers = useClassroomStore((s) => s.submittedAnswers);
  const setChallengeAnswer = useClassroomStore((s) => s.setChallengeAnswer);
  const submitChallengeAnswer = useClassroomStore((s) => s.submitChallengeAnswer);
  const setActiveChallengeIndex = useClassroomStore((s) => s.setActiveChallengeIndex);
  const nextChallenge = useClassroomStore((s) => s.nextChallenge);
  const prevChallenge = useClassroomStore((s) => s.prevChallenge);
  const loadChallengeOntoApparatus = useClassroomStore((s) => s.loadChallengeOntoApparatus);
  const animateChallengeTrace = useClassroomStore((s) => s.animateChallengeTrace);

  // BKT & Learner State
  const learner = useClassroomStore((s) => s.learner);
  const lastMasteryDelta = useClassroomStore((s) => s.lastMasteryDelta);
  const isThresholdCrossed = useClassroomStore((s) => s.isThresholdCrossed);
  const unlockedWingId = useClassroomStore((s) => s.unlockedWingId);
  const simulateMasteryJump = useClassroomStore((s) => s.simulateMasteryJump);

  const currentChallenge = stackMission.challenges[activeChallengeIndex];
  const selectedOptionId = currentChallenge ? selectedAnswers[currentChallenge.id] : undefined;
  const submission = currentChallenge ? submittedAnswers[currentChallenge.id] : undefined;
  const deltaInfo = currentChallenge ? lastMasteryDelta[currentChallenge.concept] : undefined;

  const topDisc = stackDiscs[stackDiscs.length - 1];
  const isFull = stackDiscs.length >= 6;
  const isEmpty = stackDiscs.length === 0;

  // Keyboard navigation: [ESC] to exit, [1-4] to select option, [ENTER] to submit
  useEffect(() => {
    if (activeStation !== 'stack_lab') return;

    const handleKeyDown = (e: KeyboardEvent) => {
      // Avoid firing when typing in an input/textarea if any
      if (['INPUT', 'TEXTAREA'].includes((e.target as HTMLElement)?.tagName)) return;

      if (e.key === 'Escape') {
        e.preventDefault();
        setActiveStation(null);
      } else if (e.key >= '1' && e.key <= '4' && currentChallenge) {
        const optIndex = parseInt(e.key, 10) - 1;
        if (currentChallenge.options[optIndex]) {
          setChallengeAnswer(currentChallenge.id, currentChallenge.options[optIndex].id);
        }
      } else if (e.key === 'Enter' && currentChallenge && selectedOptionId && !submission) {
        e.preventDefault();
        submitChallengeAnswer(currentChallenge.id);
      } else if (e.key.toLowerCase() === 'p' && !e.ctrlKey && !e.metaKey) {
        // Quick Push shortcut
        if (!isFull) pushStackDisc();
      } else if (e.key.toLowerCase() === 'o' && !e.ctrlKey && !e.metaKey) {
        // Quick Pop shortcut
        if (!isEmpty) popStackDisc();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [
    activeStation,
    currentChallenge,
    selectedOptionId,
    submission,
    isFull,
    isEmpty,
    setActiveStation,
    setChallengeAnswer,
    submitChallengeAnswer,
    pushStackDisc,
    popStackDisc,
  ]);

  if (activeStation !== 'stack_lab' || !currentChallenge) return null;

  const difficultyColors = {
    easy: { text: '#00f0ff', bg: 'rgba(0, 240, 255, 0.12)', border: 'rgba(0, 240, 255, 0.3)' },
    medium: { text: '#ffb700', bg: 'rgba(255, 183, 0, 0.12)', border: 'rgba(255, 183, 0, 0.3)' },
    hard: { text: '#ff0055', bg: 'rgba(255, 0, 85, 0.12)', border: 'rgba(255, 0, 85, 0.3)' },
  };

  const diffStyle = difficultyColors[currentChallenge.difficulty];

  return (
    <div
      id="challenge-console-overlay"
      className="ui-interactive"
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 50,
        pointerEvents: 'none',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between',
        padding: '16px 24px',
      }}
    >
      {/* Top Header Bar */}
      <header
        className="glass-panel"
        style={{
          pointerEvents: 'auto',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          padding: '12px 20px',
          borderColor: 'rgba(245, 158, 11, 0.4)',
          boxShadow: '0 0 25px rgba(245, 158, 11, 0.15)',
        }}
      >
        {/* Left: Wing & Mission Breadcrumbs */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span
              style={{
                width: '10px',
                height: '10px',
                borderRadius: '50%',
                backgroundColor: '#f59e0b',
                boxShadow: '0 0 10px #f59e0b',
              }}
            />
            <span
              style={{
                fontFamily: 'var(--font-display)',
                fontSize: '13px',
                letterSpacing: '0.12em',
                color: '#f59e0b',
                fontWeight: 700,
                textTransform: 'uppercase',
              }}
            >
              Stack Lab // Sector 150°
            </span>
          </div>

          <span style={{ color: 'var(--text-muted)', fontSize: '13px' }}>|</span>

          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Layers size={15} color="#00f0ff" />
            <span style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-primary)' }}>
              {stackMission.title}
            </span>
          </div>

          {learner && (
            <div
              id="header-stack-mastery-indicator"
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
                padding: '2px 8px',
                borderRadius: '12px',
                background: 'rgba(245, 158, 11, 0.12)',
                border: '1px solid rgba(245, 158, 11, 0.3)',
                fontSize: '11px',
                fontFamily: 'var(--font-mono)',
              }}
            >
              <span style={{ color: 'var(--text-muted)' }}>Stack Mastery:</span>
              <span style={{ color: '#f59e0b', fontWeight: 700 }}>
                {Math.round((learner.mastery_map['stack'] ?? 0.38) * 100)}%
              </span>
            </div>
          )}
        </div>

        {/* Center: Pagination Steps */}
        <nav aria-label="Challenges" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          {stackMission.challenges.map((c, idx) => {
            const isCurrent = idx === activeChallengeIndex;
            const sub = submittedAnswers[c.id];
            let badgeBg = 'rgba(255, 255, 255, 0.05)';
            let badgeBorder = 'var(--border-subtle)';
            let badgeColor = 'var(--text-muted)';

            if (sub) {
              if (sub.isCorrect) {
                badgeBg = 'rgba(0, 255, 136, 0.15)';
                badgeBorder = '#00ff88';
                badgeColor = '#00ff88';
              } else {
                badgeBg = 'rgba(255, 0, 85, 0.15)';
                badgeBorder = '#ff0055';
                badgeColor = '#ff0055';
              }
            } else if (isCurrent) {
              badgeBg = 'rgba(0, 240, 255, 0.2)';
              badgeBorder = 'var(--cyan-core)';
              badgeColor = 'var(--cyan-core)';
            }

            return (
              <button
                key={c.id}
                onClick={() => setActiveChallengeIndex(idx)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  padding: '4px 10px',
                  borderRadius: '6px',
                  background: badgeBg,
                  border: `1px solid ${badgeBorder}`,
                  color: badgeColor,
                  fontFamily: 'var(--font-mono)',
                  fontSize: '11px',
                  fontWeight: isCurrent ? 700 : 500,
                  cursor: 'pointer',
                  transition: 'all 0.2s',
                }}
                title={`Challenge ${idx + 1}: ${c.title}`}
              >
                <span>CH {idx + 1}</span>
                {sub?.isCorrect && <CheckCircle2 size={12} />}
                {sub && !sub.isCorrect && <AlertTriangle size={12} />}
              </button>
            );
          })}
        </nav>

        {/* Right: Exit Action & Pitch Jump Accelerator */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          {(learner?.mastery_map['stack'] ?? 0.38) < 0.70 && (
            <button
              id="btn-console-mastery-jump"
              className="cyber-button"
              onClick={() => simulateMasteryJump('learner_b', 'stack', 0.74)}
              style={{
                borderColor: '#f59e0b',
                background: 'linear-gradient(135deg, rgba(245, 158, 11, 0.25), rgba(0, 240, 255, 0.2))',
                color: '#f59e0b',
                fontSize: '11px',
                padding: '5px 10px',
                display: 'flex',
                alignItems: 'center',
                gap: '5px',
                fontWeight: 700,
                boxShadow: '0 0 10px rgba(245, 158, 11, 0.25)',
              }}
              title="Simulate Mastery Jump (38% → 74%) & trigger barrier dissolve"
            >
              <Zap size={12} color="#f59e0b" />
              <span>Simulate Jump (38% → 74%)</span>
            </button>
          )}

          <span className="glass-pill" style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
            [ESC] to return
          </span>

          <button
            id="btn-exit-console"
            onClick={() => setActiveStation(null)}
            className="cyber-button"
            style={{
              padding: '6px 12px',
              fontSize: '11px',
              color: 'var(--text-primary)',
              borderColor: 'rgba(255, 255, 255, 0.2)',
            }}
            title="Exit Console [ESC]"
          >
            <X size={14} />
            <span>Exit</span>
          </button>
        </div>
      </header>

      {/* Main Dual-Layer Body Area */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'stretch',
          gap: '24px',
          marginTop: '16px',
          marginBottom: '8px',
          flex: 1,
          minHeight: 0,
          pointerEvents: 'none',
        }}
      >
        {/* ============================================================ */}
        {/* LAYER 1: Left Primary Workspace - Interactive Challenge Panel */}
        {/* ============================================================ */}
        <section
          id="challenge-workspace-panel"
          className="glass-panel"
          aria-label="Challenge Workspace"
          style={{
            pointerEvents: 'auto',
            width: 'min(620px, 48vw)',
            display: 'flex',
            flexDirection: 'column',
            padding: '22px',
            overflowY: 'auto',
            border: '1px solid rgba(0, 240, 255, 0.3)',
            boxShadow: '0 8px 32px rgba(0, 0, 0, 0.7), inset 0 0 16px rgba(0, 240, 255, 0.08)',
          }}
        >
          {/* Challenge Header & Difficulty Badge */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '12px' }}>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                <span style={{ color: 'var(--cyan-core)', fontFamily: 'var(--font-mono)', fontSize: '12px', fontWeight: 700 }}>
                  CHALLENGE {currentChallenge.stepNumber} OF {currentChallenge.totalSteps}
                </span>
                <span
                  style={{
                    padding: '2px 8px',
                    borderRadius: '4px',
                    fontSize: '10px',
                    fontFamily: 'var(--font-mono)',
                    fontWeight: 700,
                    textTransform: 'uppercase',
                    color: diffStyle.text,
                    backgroundColor: diffStyle.bg,
                    border: `1px solid ${diffStyle.border}`,
                  }}
                >
                  {currentChallenge.difficulty}
                </span>
              </div>

              <h1 style={{ fontFamily: 'var(--font-display)', fontSize: '20px', fontWeight: 800, color: 'var(--text-primary)', margin: 0 }}>
                {currentChallenge.title}
              </h1>
            </div>

            {/* Test on 3D Apparatus & Animate Trace action buttons */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              {currentChallenge.simulatedStackInitial && (
                <button
                  id="btn-stage-apparatus"
                  onClick={() => loadChallengeOntoApparatus(currentChallenge.id)}
                  className="cyber-button"
                  style={{
                    padding: '6px 10px',
                    fontSize: '10px',
                    background: 'rgba(245, 158, 11, 0.12)',
                    borderColor: 'rgba(245, 158, 11, 0.4)',
                    color: '#f59e0b',
                  }}
                  title="Stage this challenge's disc values onto the 3D kinetic apparatus"
                >
                  <RotateCcw size={12} />
                  <span>Stage in 3D</span>
                </button>
              )}

              <button
                id="btn-animate-trace"
                onClick={() => animateChallengeTrace(currentChallenge.id)}
                className="cyber-button"
                style={{
                  padding: '6px 10px',
                  fontSize: '10px',
                  background: 'rgba(0, 240, 255, 0.12)',
                  borderColor: 'rgba(0, 240, 255, 0.4)',
                  color: '#00f0ff',
                }}
                title="Animate this challenge's physical execution trace in the 3D cylinder"
              >
                <Play size={12} />
                <span>Animate Trace in 3D</span>
              </button>
            </div>
          </div>

          {/* Objective Statement */}
          <div
            style={{
              fontSize: '12px',
              color: 'var(--text-secondary)',
              background: 'rgba(0, 0, 0, 0.3)',
              borderRadius: '6px',
              padding: '8px 12px',
              marginBottom: '14px',
              borderLeft: '3px solid var(--cyan-core)',
            }}
          >
            <strong style={{ color: 'var(--text-primary)' }}>Objective: </strong>
            {currentChallenge.objective}
          </div>

          {/* Scenario Text */}
          <p
            style={{
              fontSize: '13px',
              lineHeight: 1.5,
              color: 'var(--text-primary)',
              marginBottom: '14px',
              whiteSpace: 'pre-line',
            }}
          >
            {currentChallenge.scenario}
          </p>

          {/* Code Snippet Box (if provided) */}
          {currentChallenge.codeSnippet && currentChallenge.codeSnippet.length > 0 && (
            <div
              style={{
                backgroundColor: 'rgba(5, 8, 14, 0.85)',
                border: '1px solid var(--border-subtle)',
                borderRadius: '8px',
                padding: '12px 14px',
                fontFamily: 'var(--font-mono)',
                fontSize: '11px',
                color: '#38bdf8',
                lineHeight: 1.6,
                marginBottom: '16px',
                overflowX: 'auto',
              }}
            >
              {currentChallenge.codeSnippet.map((line, lidx) => (
                <div key={lidx} style={{ opacity: line.startsWith('//') ? 0.6 : 1 }}>
                  {line}
                </div>
              ))}
            </div>
          )}

          {/* Interactive Multiple-Choice Options */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginBottom: '18px' }}>
            {currentChallenge.options.map((option) => {
              const isSelected = selectedOptionId === option.id;
              const isCorrectOption = option.id === currentChallenge.correctOptionId;
              const isSubmitted = !!submission;

              let optionBg = 'rgba(10, 15, 26, 0.6)';
              let optionBorder = 'var(--border-subtle)';
              let labelBg = 'rgba(255, 255, 255, 0.05)';
              let labelColor = 'var(--text-muted)';

              if (isSelected) {
                optionBg = 'rgba(0, 240, 255, 0.1)';
                optionBorder = 'var(--cyan-core)';
                labelBg = 'var(--cyan-core)';
                labelColor = '#05070a';
              }

              if (isSubmitted) {
                if (isCorrectOption) {
                  optionBg = 'rgba(0, 255, 136, 0.12)';
                  optionBorder = '#00ff88';
                  labelBg = '#00ff88';
                  labelColor = '#05070a';
                } else if (isSelected && !submission.isCorrect) {
                  optionBg = 'rgba(255, 0, 85, 0.12)';
                  optionBorder = '#ff0055';
                  labelBg = '#ff0055';
                  labelColor = '#ffffff';
                }
              }

              return (
                <button
                  key={option.id}
                  id={`option-${option.id}`}
                  onClick={() => setChallengeAnswer(currentChallenge.id, option.id)}
                  style={{
                    display: 'flex',
                    alignItems: 'flex-start',
                    gap: '12px',
                    padding: '12px 14px',
                    borderRadius: '8px',
                    background: optionBg,
                    border: `1px solid ${optionBorder}`,
                    cursor: 'pointer',
                    textAlign: 'left',
                    transition: 'all 0.18s cubic-bezier(0.4, 0, 0.2, 1)',
                    boxShadow: isSelected ? '0 0 16px rgba(0, 240, 255, 0.2)' : 'none',
                  }}
                >
                  {/* Letter Badge */}
                  <span
                    style={{
                      width: '24px',
                      height: '24px',
                      borderRadius: '50%',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontFamily: 'var(--font-mono)',
                      fontSize: '11px',
                      fontWeight: 700,
                      background: labelBg,
                      color: labelColor,
                      flexShrink: 0,
                      marginTop: '1px',
                    }}
                  >
                    {option.label}
                  </span>

                  {/* Option Text & Description */}
                  <div style={{ flex: 1 }}>
                    <div
                      style={{
                        fontSize: '13px',
                        fontWeight: isSelected ? 600 : 400,
                        color: isSelected ? '#ffffff' : 'var(--text-primary)',
                        fontFamily: option.text.includes('[') ? 'var(--font-mono)' : 'var(--font-body)',
                        lineHeight: 1.4,
                      }}
                    >
                      {option.text}
                    </div>

                    {isSubmitted && option.explanation && (
                      <div
                        style={{
                          marginTop: '6px',
                          fontSize: '11px',
                          color: isCorrectOption ? '#00ff88' : '#ff99aa',
                          lineHeight: 1.4,
                        }}
                      >
                        {option.explanation}
                      </div>
                    )}
                  </div>

                  {/* Status Indicator Icon */}
                  {isSubmitted && isCorrectOption && (
                    <CheckCircle2 size={16} color="#00ff88" style={{ flexShrink: 0, marginTop: '4px' }} />
                  )}
                  {isSubmitted && isSelected && !submission.isCorrect && (
                    <AlertTriangle size={16} color="#ff0055" style={{ flexShrink: 0, marginTop: '4px' }} />
                  )}
                </button>
              );
            })}
          </div>

          {/* Submission / Validation Area */}
          <div style={{ marginTop: 'auto' }}>
            {!submission ? (
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '12px' }}>
                <div style={{ fontSize: '11px', color: selectedOptionId ? '#00f0ff' : 'var(--text-muted)' }}>
                  {selectedOptionId ? (
                    <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                      <Zap size={12} color="#00f0ff" />
                      Option selected — Press [ENTER] or Validate
                    </span>
                  ) : (
                    'Select an option above to validate answer'
                  )}
                </div>

                <button
                  id="btn-submit-answer"
                  onClick={() => submitChallengeAnswer(currentChallenge.id)}
                  disabled={!selectedOptionId}
                  className="cyber-button"
                  style={{
                    padding: '10px 20px',
                    fontSize: '12px',
                    fontWeight: 700,
                    opacity: selectedOptionId ? 1 : 0.4,
                    cursor: selectedOptionId ? 'pointer' : 'not-allowed',
                    background: selectedOptionId
                      ? 'linear-gradient(135deg, rgba(0, 240, 255, 0.3), rgba(121, 40, 202, 0.4))'
                      : 'rgba(255, 255, 255, 0.05)',
                  }}
                >
                  <Sparkles size={14} />
                  <span>Validate Solution</span>
                </button>
              </div>
            ) : (
              /* Post-submission Result & Pedagogical Feedback Card */
              <>
                <div
                  id="challenge-feedback-card"
                  style={{
                    borderRadius: '8px',
                    padding: '14px',
                    background: submission.isCorrect
                      ? 'rgba(0, 255, 136, 0.08)'
                      : 'rgba(255, 0, 85, 0.08)',
                    border: `1px solid ${submission.isCorrect ? 'rgba(0, 255, 136, 0.4)' : 'rgba(255, 0, 85, 0.4)'}`,
                    marginBottom: '12px',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      {submission.isCorrect ? (
                        <>
                          <CheckCircle2 size={16} color="#00ff88" />
                          <span style={{ color: '#00ff88', fontWeight: 700, fontSize: '13px' }}>
                            Verification Confirmed (+Mastery Belief)
                          </span>
                        </>
                      ) : (
                        <>
                          <AlertTriangle size={16} color="#ff0055" />
                          <span style={{ color: '#ff0055', fontWeight: 700, fontSize: '13px' }}>
                            Discrepancy Detected — Try Testing in 3D Sandbox
                          </span>
                        </>
                      )}
                    </div>

                    {deltaInfo && (
                      <div
                        id="bkt-delta-badge"
                        style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '5px',
                          padding: '3px 8px',
                          borderRadius: '4px',
                          fontSize: '11px',
                          fontWeight: 700,
                          fontFamily: 'var(--font-mono)',
                          backgroundColor: deltaInfo.delta >= 0 ? 'rgba(0, 255, 136, 0.15)' : 'rgba(255, 0, 85, 0.15)',
                          border: `1px solid ${deltaInfo.delta >= 0 ? 'rgba(0, 255, 136, 0.4)' : 'rgba(255, 0, 85, 0.4)'}`,
                          color: deltaInfo.delta >= 0 ? '#00ff88' : '#ff4d79',
                        }}
                      >
                        {deltaInfo.delta >= 0 ? <TrendingUp size={13} /> : <TrendingDown size={13} />}
                        <span>
                          {deltaInfo.delta >= 0 ? `+${Math.round(deltaInfo.delta * 100)}%` : `${Math.round(deltaInfo.delta * 100)}%`}
                        </span>
                        <span style={{ color: 'var(--text-muted)', fontWeight: 400 }}>
                          (Now {Math.round(deltaInfo.newMastery * 100)}%)
                        </span>
                      </div>
                    )}
                  </div>

                  {/* Feynman Analogy Section */}
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'flex-start',
                      gap: '8px',
                      fontSize: '12px',
                      color: 'var(--text-secondary)',
                      marginBottom: '10px',
                      lineHeight: 1.45,
                    }}
                  >
                    <Lightbulb size={15} color="#ffb700" style={{ flexShrink: 0, marginTop: '2px' }} />
                    <span>
                      <strong style={{ color: '#ffb700' }}>Feynman Mental Model: </strong>
                      {currentChallenge.feynmanAnalogy}
                    </span>
                  </div>

                  {/* Pedagogical Explanation */}
                  <div
                    style={{
                      fontSize: '11px',
                      color: 'var(--text-muted)',
                      lineHeight: 1.5,
                      borderTop: '1px solid var(--border-subtle)',
                      paddingTop: '8px',
                    }}
                  >
                    {currentChallenge.pedagogicalExplanation}
                  </div>
                </div>

                {/* Prerequisite Threshold Crossing Alert Banner */}
                {isThresholdCrossed && unlockedWingId === 'recursion_lab' && (
                  <div
                    id="threshold-crossed-banner"
                    style={{
                      marginBottom: '12px',
                      padding: '10px 14px',
                      borderRadius: '8px',
                      background: 'linear-gradient(135deg, rgba(0, 255, 136, 0.15), rgba(0, 240, 255, 0.15))',
                      border: '1px solid rgba(0, 255, 136, 0.6)',
                      boxShadow: '0 0 15px rgba(0, 255, 136, 0.25)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      gap: '10px',
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <Unlock size={18} color="#00ff88" />
                      <div>
                        <div style={{ color: '#00ff88', fontWeight: 800, fontSize: '12px', letterSpacing: '0.05em' }}>
                          PREREQUISITE THRESHOLD REACHED (≥70%)
                        </div>
                        <div style={{ color: 'var(--text-secondary)', fontSize: '11px' }}>
                          Recursion Lab Door UNLOCKED! Conduit energy rerouted to Sector 210°.
                        </div>
                      </div>
                    </div>
                    <button
                      onClick={() => setActiveStation(null)}
                      className="cyber-button"
                      style={{
                        padding: '5px 12px',
                        fontSize: '11px',
                        borderColor: '#00ff88',
                        color: '#00ff88',
                        whiteSpace: 'nowrap',
                      }}
                    >
                      Inspect Wing Door →
                    </button>
                  </div>
                )}
              </>
            )}

            {/* Pagination Controls */}
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginTop: '12px',
                paddingTop: '10px',
                borderTop: '1px solid var(--border-subtle)',
              }}
            >
              <button
                id="btn-prev-challenge"
                onClick={prevChallenge}
                disabled={activeChallengeIndex === 0}
                className="cyber-button"
                style={{
                  padding: '6px 12px',
                  fontSize: '11px',
                  opacity: activeChallengeIndex === 0 ? 0.3 : 1,
                  cursor: activeChallengeIndex === 0 ? 'not-allowed' : 'pointer',
                }}
              >
                <ChevronLeft size={14} />
                <span>Prev</span>
              </button>

              <span style={{ fontSize: '11px', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>
                {activeChallengeIndex + 1} / {stackMission.challenges.length}
              </span>

              <button
                id="btn-next-challenge"
                onClick={nextChallenge}
                disabled={activeChallengeIndex === stackMission.challenges.length - 1}
                className="cyber-button"
                style={{
                  padding: '6px 12px',
                  fontSize: '11px',
                  opacity: activeChallengeIndex === stackMission.challenges.length - 1 ? 0.3 : 1,
                  cursor: activeChallengeIndex === stackMission.challenges.length - 1 ? 'not-allowed' : 'pointer',
                }}
              >
                <span>Next</span>
                <ChevronRight size={14} />
              </button>
            </div>
          </div>
        </section>

        {/* ============================================================ */}
        {/* LAYER 2: Right Secondary Layer - Kinetic Sandbox & Telemetry */}
        {/* ============================================================ */}
        <aside
          id="apparatus-sandbox-panel"
          className="glass-panel"
          aria-label="Kinetic Sandbox Controls"
          style={{
            pointerEvents: 'auto',
            width: 'min(400px, 34vw)',
            display: 'flex',
            flexDirection: 'column',
            padding: '20px',
            border: '1px solid rgba(245, 158, 11, 0.35)',
            boxShadow: '0 8px 32px rgba(0, 0, 0, 0.7), inset 0 0 16px rgba(245, 158, 11, 0.06)',
            overflowY: 'auto',
          }}
        >
          {/* Header */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
            <span
              style={{
                fontFamily: 'var(--font-display)',
                fontSize: '12px',
                fontWeight: 700,
                color: '#f59e0b',
                letterSpacing: '0.1em',
                textTransform: 'uppercase',
              }}
            >
              Kinetic Apparatus Sandbox
            </span>
            <span className="glass-pill" style={{ color: '#00f0ff', fontSize: '10px' }}>
              Live 3D Sync
            </span>
          </div>

          <h2 style={{ fontSize: '16px', fontWeight: 700, color: 'var(--text-primary)', margin: '0 0 6px 0' }}>
            Physical LIFO Cylinder
          </h2>
          <p style={{ fontSize: '11px', color: 'var(--text-muted)', margin: '0 0 14px 0', lineHeight: 1.4 }}>
            Observe the 3D cylinder directly in the background. Push and pop discs to visually verify your execution reasoning.
          </p>

          {/* Live Telemetry Display */}
          <div
            style={{
              background: 'rgba(5, 8, 14, 0.65)',
              borderRadius: '8px',
              padding: '12px',
              marginBottom: '16px',
              border: '1px solid var(--border-subtle)',
            }}
          >
            {/* Top Element / Peek */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
              <span style={{ color: 'var(--text-muted)', fontSize: '11px', fontFamily: 'var(--font-mono)' }}>
                Top Element (Peek):
              </span>
              <span
                style={{
                  color: topDisc ? '#00f0ff' : 'var(--text-muted)',
                  fontWeight: 700,
                  fontFamily: 'var(--font-mono)',
                  fontSize: '12px',
                  padding: '2px 8px',
                  borderRadius: '4px',
                  backgroundColor: topDisc ? 'rgba(0, 240, 255, 0.12)' : 'transparent',
                }}
              >
                {topDisc ? `[ ${topDisc.value} ]` : 'NULL (EMPTY)'}
              </span>
            </div>

            {/* Capacity Meter */}
            <div style={{ marginBottom: '10px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', marginBottom: '4px' }}>
                <span style={{ color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>Buffer Capacity:</span>
                <span style={{ color: isFull ? '#ff0055' : '#f59e0b', fontWeight: 600, fontFamily: 'var(--font-mono)' }}>
                  {stackDiscs.length} / 6 {isFull && '(OVERFLOW GUARD)'}
                </span>
              </div>

              {/* Progress Bar */}
              <div
                style={{
                  height: '6px',
                  backgroundColor: 'rgba(255, 255, 255, 0.08)',
                  borderRadius: '3px',
                  overflow: 'hidden',
                }}
              >
                <div
                  style={{
                    height: '100%',
                    width: `${(stackDiscs.length / 6) * 100}%`,
                    backgroundColor: isFull ? '#ff0055' : '#f59e0b',
                    boxShadow: isFull ? '0 0 8px #ff0055' : '0 0 8px #f59e0b',
                    transition: 'width 0.25s ease-out',
                  }}
                />
              </div>
            </div>

            {/* Stack Array (Top → Base) */}
            <div style={{ fontSize: '11px' }}>
              <span style={{ color: 'var(--text-muted)', fontFamily: 'var(--font-mono)', display: 'block', marginBottom: '2px' }}>
                Memory Stack (Top → Base):
              </span>
              <div
                style={{
                  color: 'var(--text-primary)',
                  fontFamily: 'var(--font-mono)',
                  fontSize: '11px',
                  padding: '4px 6px',
                  backgroundColor: 'rgba(0, 0, 0, 0.3)',
                  borderRadius: '4px',
                  wordBreak: 'break-all',
                }}
              >
                {isEmpty ? '[]' : stackDiscs.slice().reverse().map((d) => d.value).join(' → ')}
              </div>
            </div>
          </div>

          {/* Manual Testing Controls */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginBottom: '12px' }}>
            <button
              id="btn-manual-push"
              onClick={() => pushStackDisc()}
              disabled={isFull}
              className="cyber-button"
              style={{
                padding: '12px 10px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px',
                background: isFull ? 'rgba(255,255,255,0.02)' : 'rgba(0, 240, 255, 0.15)',
                borderColor: isFull ? 'transparent' : 'var(--cyan-core)',
                color: isFull ? 'var(--text-muted)' : 'var(--cyan-core)',
                cursor: isFull ? 'not-allowed' : 'pointer',
                fontWeight: 600,
              }}
              title="Push new disc into cylinder [P]"
            >
              <ArrowDownToLine size={16} />
              <span>PUSH [P]</span>
            </button>

            <button
              id="btn-manual-pop"
              onClick={() => popStackDisc()}
              disabled={isEmpty}
              className="cyber-button"
              style={{
                padding: '12px 10px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px',
                background: isEmpty ? 'rgba(255,255,255,0.02)' : 'rgba(255, 0, 85, 0.15)',
                borderColor: isEmpty ? 'transparent' : 'var(--crimson-alert)',
                color: isEmpty ? 'var(--text-muted)' : '#ff6699',
                cursor: isEmpty ? 'not-allowed' : 'pointer',
                fontWeight: 600,
              }}
              title="Pop top disc from cylinder [O]"
            >
              <ArrowUpFromLine size={16} />
              <span>POP [O]</span>
            </button>
          </div>

          {/* Underflow / Overflow Warnings */}
          {isEmpty && (
            <div
              style={{
                fontSize: '11px',
                color: '#ff99aa',
                backgroundColor: 'rgba(255, 0, 85, 0.08)',
                padding: '6px 10px',
                borderRadius: '6px',
                marginBottom: '12px',
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
              }}
            >
              <AlertTriangle size={12} />
              <span>Stack is empty. POP will trigger Underflow!</span>
            </div>
          )}

          {isFull && (
            <div
              style={{
                fontSize: '11px',
                color: '#f59e0b',
                backgroundColor: 'rgba(245, 158, 11, 0.08)',
                padding: '6px 10px',
                borderRadius: '6px',
                marginBottom: '12px',
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
              }}
            >
              <AlertTriangle size={12} />
              <span>Buffer full (6/6). PUSH will trigger Overflow!</span>
            </div>
          )}

          {/* Spring Physics & Call Stack Note */}
          <div
            style={{
              marginTop: 'auto',
              padding: '10px 12px',
              borderRadius: '6px',
              background: 'rgba(245, 158, 11, 0.06)',
              border: '1px solid rgba(245, 158, 11, 0.2)',
              fontSize: '11px',
              color: 'var(--text-secondary)',
              lineHeight: 1.45,
            }}
          >
            <strong style={{ color: '#f59e0b' }}>Call Stack Correlation: </strong>
            Every function invocation pauses the CPU and pushes an activation record. Return statements pop frames in reverse order until the base caller resolves.
          </div>
        </aside>
      </div>

      {/* Subtle Bottom Instruction Pill */}
      <footer style={{ display: 'flex', justifyContent: 'center', pointerEvents: 'auto' }}>
        <div className="glass-pill" style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
          Tip: Press <strong style={{ color: 'var(--cyan-core)' }}>[1 - 4]</strong> to select option,{' '}
          <strong style={{ color: 'var(--cyan-core)' }}>[ENTER]</strong> to submit,{' '}
          <strong style={{ color: 'var(--cyan-core)' }}>[ESC]</strong> to exit
        </div>
      </footer>
    </div>
  );
};
