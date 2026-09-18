import React, { useState } from 'react';
import { Volume2, VolumeX, ShieldAlert, CheckCircle2, RotateCcw, Compass, UserCheck, Sparkles, Zap, Brain, HelpCircle, Activity } from 'lucide-react';
import { useClassroomStore } from '../../store/useClassroomStore';
import { AIMentorDialogue } from './AIMentorDialogue';

export const HUD: React.FC = () => {
  const [showPitchGuide, setShowPitchGuide] = useState(false);
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

        {/* Center: Learner Profile Switcher & 90-Second Hero Pitch Demo Controls */}
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '6px' }}>
          <div
            className="glass-panel ui-interactive"
            style={{
              padding: '8px 14px',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              borderColor: 'rgba(0, 240, 255, 0.25)',
              boxShadow: '0 0 20px rgba(0, 0, 0, 0.6)',
            }}
          >
            <span style={{ fontSize: '10px', fontFamily: 'var(--font-mono)', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              Hero Demo:
            </span>

            <button
              id="btn-learner-b"
              className="cyber-button"
              onClick={() => switchLearner('learner_b')}
              style={{
                borderColor: isLearnerB ? 'var(--crimson-alert)' : 'transparent',
                background: isLearnerB ? 'rgba(255, 0, 85, 0.18)' : 'rgba(255, 255, 255, 0.05)',
                color: isLearnerB ? '#ff6699' : 'var(--text-secondary)',
                fontSize: '10px',
                padding: '6px 10px',
                fontWeight: isLearnerB ? 700 : 500,
              }}
              title="Learner B (Remedial): 38% Stack, sealed Recursion Lab"
            >
              <ShieldAlert size={12} />
              <span>Learner B (38% Stack)</span>
            </button>

            <button
              id="btn-learner-a"
              className="cyber-button"
              onClick={() => switchLearner('learner_a')}
              style={{
                borderColor: !isLearnerB ? 'var(--emerald-mastery)' : 'transparent',
                background: !isLearnerB ? 'rgba(0, 255, 136, 0.18)' : 'rgba(255, 255, 255, 0.05)',
                color: !isLearnerB ? '#00ffaa' : 'var(--text-secondary)',
                fontSize: '10px',
                padding: '6px 10px',
                fontWeight: !isLearnerB ? 700 : 500,
              }}
              title="Learner A (Advanced): 84% Stack, unlocked Recursion Lab"
            >
              <CheckCircle2 size={12} />
              <span>Learner A (Advanced)</span>
            </button>

            {/* Single click on "Simulate Mastery Jump (38% → 74%)" triggers dramatic camera pan, sound arpeggio, and cyan particle Barrier Dissolve */}
            <button
              id="btn-simulate-jump"
              className="cyber-button"
              onClick={() => simulateMasteryJump('learner_b', 'stack', 0.74)}
              title="Single click on Simulate Mastery Jump (38% → 74%) triggers dramatic camera pan, sound arpeggio, and cyan particle Barrier Dissolve"
              style={{
                borderColor: '#f59e0b',
                background: 'linear-gradient(135deg, rgba(245, 158, 11, 0.25), rgba(0, 240, 255, 0.2))',
                color: '#f59e0b',
                fontSize: '10px',
                padding: '6px 12px',
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                fontWeight: 800,
                boxShadow: '0 0 14px rgba(245, 158, 11, 0.3)',
              }}
            >
              <Zap size={12} color="#f59e0b" />
              <span>Simulate Mastery Jump (38% → 74%)</span>
            </button>

            <button
              id="btn-reset-seed"
              className="cyber-button"
              onClick={resetWorldSeed}
              title="Reset Seed to Initial Clean Demonstration Conditions"
              style={{
                padding: '6px 12px',
                background: 'rgba(255, 255, 255, 0.05)',
                borderColor: 'var(--border-subtle)',
                color: 'var(--text-primary)',
                fontSize: '10px',
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
              }}
            >
              <RotateCcw size={12} color="var(--text-muted)" />
              <span>Reset Seed</span>
            </button>

            <button
              id="btn-pitch-guide-toggle"
              className="cyber-button"
              onClick={() => setShowPitchGuide(!showPitchGuide)}
              title="Toggle 90-Second Hero Pitch Flow Guide"
              style={{
                padding: '6px 8px',
                background: showPitchGuide ? 'rgba(0, 240, 255, 0.18)' : 'rgba(255, 255, 255, 0.04)',
                borderColor: showPitchGuide ? 'var(--cyan-core)' : 'var(--border-subtle)',
                color: showPitchGuide ? '#00f0ff' : 'var(--text-muted)',
                fontSize: '10px',
                display: 'flex',
                alignItems: 'center',
                gap: '4px',
              }}
            >
              <HelpCircle size={12} />
              <span>90s Pitch</span>
            </button>
          </div>

          {/* Collapsible 90-Second Hero Pitch Stepper Card */}
          {showPitchGuide && (
            <div
              id="hero-pitch-guide"
              className="glass-panel ui-interactive"
              style={{
                padding: '12px 16px',
                width: '100%',
                maxWidth: '680px',
                background: 'rgba(11, 16, 32, 0.95)',
                borderColor: 'rgba(0, 240, 255, 0.4)',
                boxShadow: '0 8px 30px rgba(0, 0, 0, 0.8)',
                animation: 'fadeIn 0.25s ease-out',
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <Activity size={13} color="var(--cyan-core)" />
                  <span style={{ fontFamily: 'var(--font-display)', fontSize: '11px', fontWeight: 800, color: 'var(--cyan-core)', letterSpacing: '0.06em', textTransform: 'uppercase' }}>
                    90-Second Hero Pitch Sequence
                  </span>
                </div>
                <div style={{ display: 'flex', gap: '8px', fontSize: '9px', fontFamily: 'var(--font-mono)' }}>
                  <span className="glass-pill" style={{ color: '#00ff88' }}>60 FPS RENDER</span>
                  <span className="glass-pill" style={{ color: '#00f0ff' }}>&lt;200ms LATENCY</span>
                  <span className="glass-pill" style={{ color: '#ffb700' }}>0 ASSET DOWNLOADS</span>
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: '6px', fontSize: '10px', fontFamily: 'var(--font-mono)' }}>
                <div style={{ padding: '6px', borderRadius: '4px', background: 'rgba(255, 0, 85, 0.1)', border: '1px solid rgba(255, 0, 85, 0.3)' }}>
                  <div style={{ color: '#ff6699', fontWeight: 700 }}>1. Learner B</div>
                  <div style={{ color: 'var(--text-muted)', fontSize: '9px' }}>Stack 38%, Recursion sealed, conduits guide</div>
                </div>
                <div style={{ padding: '6px', borderRadius: '4px', background: 'rgba(245, 158, 11, 0.1)', border: '1px solid rgba(245, 158, 11, 0.3)' }}>
                  <div style={{ color: '#f59e0b', fontWeight: 700 }}>2. Stack Lab</div>
                  <div style={{ color: 'var(--text-muted)', fontSize: '9px' }}>Enter archway, [E] Console, answer challenge</div>
                </div>
                <div style={{ padding: '6px', borderRadius: '4px', background: 'rgba(0, 240, 255, 0.1)', border: '1px solid rgba(0, 240, 255, 0.3)' }}>
                  <div style={{ color: '#00f0ff', fontWeight: 700 }}>3. 1-Click Jump</div>
                  <div style={{ color: 'var(--text-muted)', fontSize: '9px' }}>Click Simulate Jump (38% → 74%)</div>
                </div>
                <div style={{ padding: '6px', borderRadius: '4px', background: 'rgba(0, 255, 136, 0.1)', border: '1px solid rgba(0, 255, 136, 0.3)' }}>
                  <div style={{ color: '#00ff88', fontWeight: 700 }}>4. Dissolve</div>
                  <div style={{ color: 'var(--text-muted)', fontSize: '9px' }}>Camera pans, arpeggio, 360 cyan particles</div>
                </div>
                <div style={{ padding: '6px', borderRadius: '4px', background: 'rgba(168, 85, 247, 0.1)', border: '1px solid rgba(168, 85, 247, 0.3)' }}>
                  <div style={{ color: '#c084fc', fontWeight: 700 }}>5. Brain Proof</div>
                  <div style={{ color: 'var(--text-muted)', fontSize: '9px' }}>[🧠 AGENT BRAIN] verifies 5-agent trace</div>
                </div>
              </div>
            </div>
          )}
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
