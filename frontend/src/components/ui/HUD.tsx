import React from 'react';
import { Volume2, VolumeX, ShieldAlert, CheckCircle2, RotateCcw, Compass, UserCheck, Sparkles, Zap, Brain } from 'lucide-react';
import { useClassroomStore } from '../../store/useClassroomStore';
import { AIMentorDialogue } from './AIMentorDialogue';

export const HUD: React.FC = () => {
  const {
    learner,
    isMuted,
    toggleAudioMute,
    switchLearner,
    resetWorldSeed,
    avatar,
    worldState,
    isNearMentor,
    isMentorOpen,
    openMentor,
    simulateMasteryJump,
    lastMasteryDelta,
    isTelemetryOpen,
    toggleTelemetry,
  } = useClassroomStore();

  const isLearnerB = learner?.learner_id === 'learner_b';
  const isRemedial = learner?.learning_state.status === 'remediation_required';
  const targetWing = worldState?.wings[worldState.conduits_target_wing]?.name || 'Stack Lab';

  return (
    <div className="ui-overlay">
      {/* Central Dais AI Mentor Floating Proximity Prompt */}
      {isNearMentor && !isMentorOpen && (
        <div
          className="ui-interactive"
          style={{
            position: 'absolute',
            top: '80px',
            left: '50%',
            transform: 'translateX(-50%)',
            zIndex: 40,
            animation: 'pulseGlow 2s infinite ease-in-out',
          }}
        >
          <button
            onClick={openMentor}
            className="glass-panel"
            style={{
              padding: '10px 20px',
              display: 'flex',
              alignItems: 'center',
              gap: '10px',
              cursor: 'pointer',
              borderColor: 'var(--purple-bright)',
              background: 'rgba(168, 85, 247, 0.18)',
              boxShadow: '0 0 20px rgba(168, 85, 247, 0.4)',
              color: '#ffffff',
            }}
          >
            <Sparkles size={16} color="var(--purple-bright)" />
            <span style={{ fontFamily: 'var(--font-mono)', fontSize: '13px', fontWeight: 700, letterSpacing: '0.04em' }}>
              [E] CONSULT AI MENTOR
            </span>
            <span className="glass-pill" style={{ fontSize: '10px', color: 'var(--text-muted)' }}>
              Feynman Guidance
            </span>
          </button>
        </div>
      )}

      {/* AI Mentor Glassmorphic Dialogue Overlay */}
      <AIMentorDialogue />
      {/* Top Header Bar */}
      <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', width: '100%' }}>
        {/* Left: Project Branding & Zone Indicator */}
        <div className="glass-panel ui-interactive" style={{ padding: '12px 18px', maxWidth: '420px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
            <span style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: 'var(--cyan-core)', boxShadow: '0 0 8px var(--cyan-glow)' }}></span>
            <span style={{ fontFamily: 'var(--font-display)', fontSize: '12px', letterSpacing: '0.12em', color: 'var(--cyan-core)', textTransform: 'uppercase' }}>
              Adaptive Virtual Classroom
            </span>
            <span className="glass-pill" style={{ color: 'var(--text-muted)' }}>v1.0-MVP</span>
          </div>

          <h1 style={{ fontFamily: 'var(--font-display)', fontSize: '18px', fontWeight: 800, color: 'var(--text-primary)', letterSpacing: '0.04em' }}>
            Central Atrium
          </h1>

          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '6px' }}>
            <Compass size={13} color="var(--cyan-core)" />
            <span style={{ fontSize: '11px', fontFamily: 'var(--font-mono)', color: 'var(--text-secondary)' }}>
              Active Guidance Conduit:
            </span>
            <span style={{ fontSize: '11px', fontFamily: 'var(--font-mono)', color: 'var(--cyan-core)', fontWeight: 600 }}>
              {targetWing}
            </span>
          </div>
        </div>

        {/* Center: Learner Profile Switcher for Live Demo */}
        <div className="glass-panel ui-interactive" style={{ padding: '8px 14px', display: 'flex', alignItems: 'center', gap: '10px' }}>
          <span style={{ fontSize: '10px', fontFamily: 'var(--font-mono)', color: 'var(--text-muted)', textTransform: 'uppercase' }}>
            Learner Persona:
          </span>

          <button
            className="cyber-button"
            onClick={() => switchLearner('learner_b')}
            style={{
              borderColor: isLearnerB ? 'var(--crimson-alert)' : 'transparent',
              background: isLearnerB ? 'rgba(255, 0, 85, 0.18)' : 'rgba(255, 255, 255, 0.05)',
              color: isLearnerB ? '#ff6699' : 'var(--text-secondary)',
              fontSize: '10px',
              padding: '6px 12px',
            }}
          >
            <ShieldAlert size={12} />
            Learner B (Remedial)
          </button>

          <button
            className="cyber-button"
            onClick={() => switchLearner('learner_a')}
            style={{
              borderColor: !isLearnerB ? 'var(--emerald-mastery)' : 'transparent',
              background: !isLearnerB ? 'rgba(0, 255, 136, 0.18)' : 'rgba(255, 255, 255, 0.05)',
              color: !isLearnerB ? '#00ffaa' : 'var(--text-secondary)',
              fontSize: '10px',
              padding: '6px 12px',
            }}
          >
            <CheckCircle2 size={12} />
            Learner A (Advanced)
          </button>

          {learner && learner.mastery_map.stack < 0.7 && (
            <button
              className="cyber-button"
              onClick={() => simulateMasteryJump()}
              title="Cross 70% Stack threshold to trigger Barrier Dissolve & unlock Recursion Wing"
              style={{
                borderColor: 'var(--cyan-core)',
                background: 'rgba(0, 240, 255, 0.18)',
                color: '#00f0ff',
                fontSize: '10px',
                padding: '6px 12px',
                fontWeight: 700,
                boxShadow: '0 0 12px var(--cyan-glow)',
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
              }}
            >
              <Zap size={12} color="#00f0ff" />
              Simulate 75% Mastery Jump
            </button>
          )}

          <button
            className="cyber-button"
            onClick={resetWorldSeed}
            title="Reset to Initial Seed"
            style={{ padding: '6px 10px', background: 'rgba(255, 255, 255, 0.04)', borderColor: 'var(--border-subtle)' }}
          >
            <RotateCcw size={12} color="var(--text-muted)" />
          </button>

          <button
            id="btn-demo-jump"
            className="cyber-button"
            onClick={() => simulateMasteryJump(learner?.learner_id || 'learner_b', 'stack')}
            title="Demo Acceleration: Instantly advance Stack Mastery past 70% to trigger Recursion Lab unlock"
            style={{
              borderColor: '#f59e0b',
              background: 'linear-gradient(135deg, rgba(245, 158, 11, 0.18), rgba(0, 255, 136, 0.18))',
              color: '#f59e0b',
              fontSize: '10px',
              padding: '6px 10px',
              display: 'flex',
              alignItems: 'center',
              gap: '5px',
              fontWeight: 700,
            }}
          >
            <Zap size={12} color="#f59e0b" />
            <span>Demo Jump (38% → 74%)</span>
          </button>
        </div>

        {/* Right: Telemetry Drawer Toggle & Audio Synthesizer Mute Toggle */}
        <div className="ui-interactive" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <button
            id="btn-agent-brain"
            onClick={toggleTelemetry}
            className="glass-panel"
            style={{
              padding: '10px 16px',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              color: isTelemetryOpen ? '#00f0ff' : 'var(--text-primary)',
              borderColor: isTelemetryOpen ? 'var(--cyan-core)' : 'var(--border-subtle)',
              background: isTelemetryOpen ? 'rgba(0, 240, 255, 0.16)' : 'rgba(255, 255, 255, 0.04)',
              boxShadow: isTelemetryOpen ? '0 0 16px var(--cyan-glow)' : 'none',
              transition: 'all 0.2s ease',
            }}
            title="Inspect 5-Agent Deliberation Pipeline, Guardrails & BKT Belief State"
          >
            <Brain size={18} color={isTelemetryOpen ? '#00f0ff' : 'var(--cyan-core)'} />
            <span style={{ fontSize: '11px', fontFamily: 'var(--font-mono)', fontWeight: 700, letterSpacing: '0.04em' }}>
              [🧠 AGENT BRAIN]
            </span>
            <span
              style={{
                width: '6px',
                height: '6px',
                borderRadius: '50%',
                backgroundColor: isTelemetryOpen ? '#00f0ff' : '#00ff88',
                boxShadow: isTelemetryOpen ? '0 0 6px #00f0ff' : '0 0 6px #00ff88',
              }}
            />
          </button>

          <button
            onClick={toggleAudioMute}
            className="glass-panel"
            style={{
              padding: '10px 16px',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              color: isMuted ? 'var(--text-muted)' : 'var(--cyan-core)',
              borderColor: isMuted ? 'var(--border-subtle)' : 'var(--border-cyan)',
              transition: 'all 0.2s ease',
            }}
            title={isMuted ? 'Unmute Ambient Sound' : 'Mute Ambient Sound'}
          >
            {isMuted ? <VolumeX size={18} /> : <Volume2 size={18} />}
            <span style={{ fontSize: '11px', fontFamily: 'var(--font-mono)', fontWeight: 600 }}>
              {isMuted ? 'AUDIO MUTED' : '55Hz AMBIENT ACTIVE'}
            </span>
          </button>
        </div>
      </header>

      {/* Bottom Area: Controls Guide & Active Learner Card */}
      <footer style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', width: '100%' }}>
        {/* Navigation Controls Help Card */}
        <div className="glass-panel ui-interactive" style={{ padding: '12px 16px', minWidth: '280px' }}>
          <div style={{ fontSize: '10px', fontFamily: 'var(--font-mono)', color: 'var(--cyan-core)', marginBottom: '8px', letterSpacing: '0.08em', textTransform: 'uppercase' }}>
            NAVIGATION CONTROLS
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'auto 1fr', gap: '6px 12px', fontSize: '11px', fontFamily: 'var(--font-mono)' }}>
            <span className="glass-pill" style={{ color: 'var(--text-primary)', padding: '2px 8px' }}>WASD / Arrows</span>
            <span style={{ color: 'var(--text-secondary)' }}>Translate Avatar</span>

            <span className="glass-pill" style={{ color: 'var(--text-primary)', padding: '2px 8px' }}>Shift</span>
            <span style={{ color: 'var(--text-secondary)' }}>Cyber Thruster Sprint</span>

            <span className="glass-pill" style={{ color: 'var(--text-primary)', padding: '2px 8px' }}>Mouse Drag</span>
            <span style={{ color: 'var(--text-secondary)' }}>Spherical Camera Orbit</span>
          </div>

          <div style={{ marginTop: '10px', paddingTop: '8px', borderTop: '1px solid var(--border-subtle)', display: 'flex', justifyContent: 'space-between', fontSize: '10px', fontFamily: 'var(--font-mono)', color: 'var(--text-muted)' }}>
            <span>POS: [{avatar.position[0].toFixed(1)}, {avatar.position[1].toFixed(1)}, {avatar.position[2].toFixed(1)}]</span>
            <span style={{ color: avatar.isMoving ? 'var(--cyan-core)' : 'var(--text-muted)' }}>
              {avatar.isMoving ? 'AVATAR MOVING' : 'IDLE'}
            </span>
          </div>
        </div>

        {/* Active Learner Knowledge Profile Card */}
        {learner && (
          <div className="glass-panel ui-interactive" style={{ padding: '14px 18px', maxWidth: '440px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <UserCheck size={14} color="var(--cyan-core)" />
                <span style={{ fontFamily: 'var(--font-display)', fontSize: '13px', fontWeight: 700, color: 'var(--text-primary)' }}>
                  {learner.name}
                </span>
              </div>
              <span
                className="glass-pill"
                style={{
                  color: isRemedial ? 'var(--crimson-alert)' : 'var(--emerald-mastery)',
                  borderColor: isRemedial ? 'rgba(255, 0, 85, 0.3)' : 'rgba(0, 255, 136, 0.3)',
                }}
              >
                {learner.persona_type}
              </span>
            </div>

            <p style={{ fontSize: '11px', color: 'var(--text-secondary)', lineHeight: '1.45', margin: '4px 0 8px 0' }}>
              {learner.learning_state.summary}
            </p>

            {/* Quick Mastery Gauges */}
            <div style={{ display: 'flex', gap: '10px', marginTop: '6px' }}>
              {Object.entries(learner.mastery_map).map(([concept, value]) => {
                const pct = Math.round(value * 100);
                const color = value >= 0.7 ? 'var(--emerald-mastery)' : value >= 0.45 ? 'var(--amber-mastery)' : 'var(--crimson-alert)';
                const delta = lastMasteryDelta[concept];
                return (
                  <div key={concept} style={{ flex: 1, textAlign: 'center', position: 'relative' }}>
                    <div style={{ fontSize: '9px', fontFamily: 'var(--font-mono)', color: 'var(--text-muted)', textTransform: 'uppercase' }}>
                      {concept === 'linked_list' ? 'List' : concept}
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '4px' }}>
                      <span style={{ fontSize: '11px', fontFamily: 'var(--font-mono)', fontWeight: 700, color }}>
                        {pct}%
                      </span>
                      {delta && (
                        <span
                          style={{
                            fontSize: '9px',
                            fontFamily: 'var(--font-mono)',
                            fontWeight: 700,
                            color: delta.delta >= 0 ? '#00ff88' : '#ff0055',
                          }}
                        >
                          {delta.delta >= 0 ? `+${Math.round(delta.delta * 100)}%` : `${Math.round(delta.delta * 100)}%`}
                        </span>
                      )}
                    </div>
                    <div style={{ width: '100%', height: '4px', backgroundColor: 'rgba(255,255,255,0.08)', borderRadius: '2px', overflow: 'hidden', marginTop: '3px' }}>
                      <div
                        style={{
                          width: `${pct}%`,
                          height: '100%',
                          backgroundColor: color,
                          boxShadow: `0 0 8px ${color}`,
                          transition: 'width 0.6s cubic-bezier(0.34, 1.56, 0.64, 1)',
                        }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </footer>
    </div>
  );
};
