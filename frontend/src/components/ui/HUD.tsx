import React from 'react';
import { Volume2, VolumeX, ShieldAlert, CheckCircle2, RotateCcw, Compass, UserCheck, Sparkles } from 'lucide-react';
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

          <button
            className="cyber-button"
            onClick={resetWorldSeed}
            title="Reset to Initial Seed"
            style={{ padding: '6px 10px', background: 'rgba(255, 255, 255, 0.04)', borderColor: 'var(--border-subtle)' }}
          >
            <RotateCcw size={12} color="var(--text-muted)" />
          </button>
        </div>

        {/* Right: Audio Synthesizer Mute Toggle */}
        <div className="ui-interactive">
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
                return (
                  <div key={concept} style={{ flex: 1, textAlign: 'center' }}>
                    <div style={{ fontSize: '9px', fontFamily: 'var(--font-mono)', color: 'var(--text-muted)', textTransform: 'uppercase' }}>
                      {concept === 'linked_list' ? 'List' : concept}
                    </div>
                    <div style={{ fontSize: '11px', fontFamily: 'var(--font-mono)', fontWeight: 700, color }}>
                      {pct}%
                    </div>
                    <div style={{ width: '100%', height: '3px', backgroundColor: 'rgba(255,255,255,0.08)', borderRadius: '2px', overflow: 'hidden', marginTop: '2px' }}>
                      <div style={{ width: `${pct}%`, height: '100%', backgroundColor: color }}></div>
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
