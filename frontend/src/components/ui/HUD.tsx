import React, { useState, useEffect, useMemo, useCallback } from 'react';
import {
  Volume2,
  VolumeX,
  ShieldAlert,
  CheckCircle2,
  RotateCcw,
  Compass,
  UserCheck,
  Sparkles,
  Zap,
  Brain,
  HelpCircle,
  Activity,
  Camera,
  Eye,
} from 'lucide-react';
import { useClassroomStore } from '../../store/useClassroomStore';
import { AIMentorDialogue } from './AIMentorDialogue';
import { FeynmanModal } from './FeynmanModal';

export const HUD: React.FC = () => {
  const [showPitchGuide, setShowPitchGuide] = useState(false);
  const [activeKeys, setActiveKeys] = useState<{ [key: string]: boolean }>({});
  const [isIsometric, setIsIsometric] = useState(false);

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
    closeMentor,
    simulateMasteryJump,
    lastMasteryDelta,
    isTelemetryOpen,
    toggleTelemetry,
    openFeynman,
    perspectiveMode,
    togglePerspectiveMode,
    setPerspectiveMode,
    teleportAvatar,
    isGoldenHour,
    toggleGoldenHour,
    toastMessage,
    showToast,
    clearToast,
    jumpToArrayIndex,
    runArrayLinearSearch,
    traverseLinkedList,
    insertLinkedListNode,
    triggerRecursionReturn,
    pushRecursionCall,
    runTreeInOrderTraversal,
    runTreeSearch,
    pushStackDisc,
    arrayBays,
    recursionFrames,
  } = useClassroomStore();

  // Zone Detection and Proximity Apparatus
  const [posX, , posZ] = avatar.position;

  const { currentWingKey, zoneTitle, nearbyLab } = useMemo(() => {
    let wingKey = 'main';
    let title = '🏛️ Main Classroom Central Hub';
    let lab: { name: string; action: () => void } | null = null;

    const dArray = Math.hypot(posX - -20, posZ - 0);
    const dList = Math.hypot(posX - 20, posZ - 0);
    const dRec = Math.hypot(posX - 0, posZ - -20);
    const dTree = Math.hypot(posX - 12, posZ - 20.8);
    const dStack = Math.hypot(posX - 0, posZ - 20);
    const dCenter = Math.hypot(posX, posZ);

    if (posX < -10.0) {
      wingKey = 'array';
      title = '🟦 Array Station Lab (West Wing)';
      if (dArray < 6.0) {
        lab = {
          name: 'ARRAY MEMORY APPARATUS',
          action: () => {
            const idx = Math.floor(Math.random() * 5);
            jumpToArrayIndex(idx);
            const val = arrayBays[idx]?.value ?? 45;
            showToast(`Array Access [Index ${idx}]: Value = ${val} (Direct O(1) Pointer)`);
          },
        };
      }
    } else if (posX > 10.0) {
      wingKey = 'list';
      title = '🟩 Linked List Lab (East Wing)';
      if (dList < 6.0) {
        lab = {
          name: 'LINKED LIST NODE CHAIN',
          action: () => {
            traverseLinkedList();
            showToast('Traversing Node Pointers: HEAD -> Next -> Next -> NULL (O(N))');
          },
        };
      }
    } else if (posZ < -10.0) {
      wingKey = 'recursion';
      title = '🟪 Recursion Chamber (North Wing)';
      if (dRec < 6.0) {
        lab = {
          name: 'RECURSION CALL TOWER',
          action: () => {
            triggerRecursionReturn();
            showToast('Base Case Reached! Unwinding Call Stack & Returning Results...');
          },
        };
      }
    } else if (posZ > 10.0 && posX > 6.0) {
      wingKey = 'tree';
      title = '🌲 Tree & BST Lab (South-East Wing)';
      if (dTree < 6.0) {
        lab = {
          name: 'BINARY SEARCH TREE CANOPY',
          action: () => {
            runTreeInOrderTraversal();
            showToast('Running In-Order Traversal (Left -> Root -> Right)...');
          },
        };
      }
    } else if (posZ > 10.0) {
      wingKey = 'stack';
      title = '🟧 Stack Lab (South Wing)';
      if (dStack < 6.0) {
        lab = {
          name: 'STACK FORTRESS APPARATUS',
          action: () => {
            pushStackDisc();
            showToast(`Pushed Disc onto Stack Apparatus (LIFO order)`);
          },
        };
      }
    } else if (dCenter < 3.5 || isNearMentor) {
      lab = {
        name: 'AI MENTOR BEACON',
        action: () => {
          if (!isMentorOpen) openMentor();
          else closeMentor();
        },
      };
    }

    return { currentWingKey: wingKey, zoneTitle: title, nearbyLab: lab };
  }, [
    posX,
    posZ,
    arrayBays,
    isNearMentor,
    isMentorOpen,
    jumpToArrayIndex,
    traverseLinkedList,
    triggerRecursionReturn,
    runTreeInOrderTraversal,
    pushStackDisc,
    openMentor,
    closeMentor,
    showToast,
  ]);

  const handleProximityInteract = useCallback(() => {
    if (nearbyLab) {
      nearbyLab.action();
    } else {
      showToast('Walk toward any of the lab apparatuses or Central Dais mentor and press [E]!');
    }
  }, [nearbyLab, showToast]);

  // Keyboard shortcut listeners
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (['INPUT', 'TEXTAREA'].includes((e.target as HTMLElement)?.tagName)) return;
      setActiveKeys((prev) => ({ ...prev, [e.code]: true }));

      if (e.key.toLowerCase() === 'f' && !e.ctrlKey && !e.metaKey) {
        e.preventDefault();
        openFeynman();
      } else if (e.code === 'KeyV' && !e.ctrlKey && !e.altKey && !e.metaKey) {
        e.preventDefault();
        setIsIsometric(false);
        useClassroomStore.setState({ cinematicCamera: null });
        togglePerspectiveMode();
      } else if (e.code === 'KeyE') {
        handleProximityInteract();
      }
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      setActiveKeys((prev) => ({ ...prev, [e.code]: false }));
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, [openFeynman, togglePerspectiveMode, handleProximityInteract]);

  // Toast Auto-Dismiss
  useEffect(() => {
    if (!toastMessage) return;
    const timer = setTimeout(() => {
      clearToast();
    }, 3200);
    return () => clearTimeout(timer);
  }, [toastMessage, clearToast]);

  const isLearnerB = learner?.learner_id === 'learner_b';
  const isRemedial = learner?.learning_state.status === 'remediation_required';
  const targetWing = worldState?.wings[worldState.conduits_target_wing]?.name || 'Stack Lab';

  return (
    <div className="ui-overlay">
      {/* Toast Notification Box */}
      <div className={`toast-box ${toastMessage ? 'show' : ''}`} id="toast-box">
        {toastMessage || 'Apparatus Telemetry Output'}
      </div>

      {/* Floating In-World Proximity Interaction Prompt */}
      <div
        className={`interact-prompt ui-interactive ${nearbyLab ? 'show' : ''}`}
        id="interact-prompt"
        onClick={handleProximityInteract}
      >
        <span className="interact-key">E</span>
        <span id="interact-text">
          {nearbyLab ? `PRESS [E] TO OPERATE ${nearbyLab.name}` : 'PRESS [E] TO OPERATE APPARATUS'}
        </span>
      </div>

      {/* Campus Wings Navigator Bar (Centered Top) */}
      <div className="wings-bar ui-interactive">
        <button
          className={`wing-pill ${currentWingKey === 'main' ? 'active' : ''}`}
          id="pill-main"
          onClick={() => {
            teleportAvatar([0, 0, 0]);
            setIsIsometric(false);
            useClassroomStore.setState({ cinematicCamera: null });
            showToast('Navigated to: Main Classroom Central Hub');
          }}
        >
          🏛️ Main Class
        </button>
        <button
          className={`wing-pill ${currentWingKey === 'array' ? 'active' : ''}`}
          id="pill-array"
          onClick={() => {
            teleportAvatar([-20, 0, 0]);
            setIsIsometric(false);
            useClassroomStore.setState({ cinematicCamera: null });
            showToast('Navigated to: Array Station Lab (West)');
          }}
        >
          🟦 Array Station (West)
        </button>
        <button
          className={`wing-pill ${currentWingKey === 'list' ? 'active' : ''}`}
          id="pill-list"
          onClick={() => {
            teleportAvatar([20, 0, 0]);
            setIsIsometric(false);
            useClassroomStore.setState({ cinematicCamera: null });
            showToast('Navigated to: Linked List Lab (East)');
          }}
        >
          🟩 Linked List Lab (East)
        </button>
        <button
          className={`wing-pill ${currentWingKey === 'recursion' ? 'active' : ''}`}
          id="pill-recursion"
          onClick={() => {
            teleportAvatar([0, 0, -20]);
            setIsIsometric(false);
            useClassroomStore.setState({ cinematicCamera: null });
            showToast('Navigated to: Recursion Chamber (North)');
          }}
        >
          🟪 Recursion Chamber (North)
        </button>
        <button
          className={`wing-pill ${currentWingKey === 'tree' ? 'active' : ''}`}
          id="pill-tree"
          onClick={() => {
            teleportAvatar([12, 0, 20.8]);
            setIsIsometric(false);
            useClassroomStore.setState({ cinematicCamera: null });
            showToast('Navigated to: Tree & BST Lab (South-East)');
          }}
        >
          🌲 Tree & BST Lab (South-East)
        </button>
        <button
          className={`wing-pill ${currentWingKey === 'stack' ? 'active' : ''}`}
          id="pill-stack"
          onClick={() => {
            teleportAvatar([0, 0, 20]);
            setIsIsometric(false);
            useClassroomStore.setState({ cinematicCamera: null });
            showToast('Navigated to: Stack Lab (South)');
          }}
        >
          🟧 Stack Lab (South)
        </button>
      </div>

      {/* AI Mentor Glassmorphic Dialogue Overlay */}
      <AIMentorDialogue />

      {/* Feynman Multimodal Adaptive Explanation Modal */}
      <FeynmanModal />

      {/* Top Header Bar */}
      <header
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'flex-start',
          width: '100%',
          marginTop: '4px',
        }}
      >
        {/* Left: Project Branding & Zone Indicator */}
        <div className="hud-header ui-interactive" style={{ pointerEvents: 'auto', maxWidth: '440px' }}>
          <div style={{ display: 'flex', alignItems: 'center', marginBottom: '6px' }}>
            <span className="badge">Adaptive Virtual Campus</span>
            <div className="zone-indicator" id="zone-badge">
              <div className="zone-dot"></div>
              <span id="zone-name">{zoneTitle}</span>
            </div>
          </div>
          <h1 className="hud-title">3D Adaptive Classroom Campus</h1>
          <p className="subtitle">
            WASD to walk through doors • Auto-follow perspective camera • Press [E] near apparatuses
          </p>
        </div>

        {/* Right: Hero Demo Controls, Agent Brain, Feynman, Camera & Audio */}
        <div
          className="ui-interactive"
          style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'flex-end',
            gap: '8px',
          }}
        >
          <div
            className="glass-panel"
            style={{
              padding: '6px 12px',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              background: 'rgba(25, 12, 18, 0.88)',
              borderColor: 'rgba(255, 255, 255, 0.14)',
            }}
          >
            <span
              style={{
                fontSize: '10px',
                fontFamily: 'var(--font-mono)',
                color: '#fb923c',
                textTransform: 'uppercase',
                letterSpacing: '0.06em',
                fontWeight: 700,
                marginRight: '2px',
              }}
            >
              Demo:
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
                padding: '5px 9px',
                fontWeight: isLearnerB ? 700 : 500,
              }}
              title="Learner B (Remedial): 38% Stack, sealed Recursion Lab"
            >
              <ShieldAlert size={12} />
              <span>Learner B (38%)</span>
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
                padding: '5px 9px',
                fontWeight: !isLearnerB ? 700 : 500,
              }}
              title="Learner A (Advanced): 84% Stack, unlocked Recursion Lab"
            >
              <CheckCircle2 size={12} />
              <span>Learner A (Adv)</span>
            </button>

            <button
              id="btn-simulate-jump"
              className="cyber-button"
              onClick={() => simulateMasteryJump('learner_b', 'stack', 0.74)}
              title="Simulate Mastery Jump (38% → 74%) with cinematic barrier dissolve"
              style={{
                borderColor: '#ea580c',
                background: 'linear-gradient(135deg, rgba(234, 88, 12, 0.3), rgba(249, 115, 22, 0.2))',
                color: '#fdba74',
                fontSize: '10px',
                padding: '5px 10px',
                display: 'flex',
                alignItems: 'center',
                gap: '5px',
                fontWeight: 800,
                boxShadow: '0 0 12px rgba(234, 88, 12, 0.4)',
              }}
            >
              <Zap size={12} color="#fdba74" />
              <span>Jump (38% → 74%)</span>
            </button>

            <button
              id="btn-reset-seed"
              className="cyber-button"
              onClick={resetWorldSeed}
              title="Reset Seed to Initial Clean Demonstration Conditions"
              style={{
                padding: '5px 8px',
                background: 'rgba(255, 255, 255, 0.05)',
                borderColor: 'var(--border-subtle)',
                color: 'var(--text-primary)',
                fontSize: '10px',
                display: 'flex',
                alignItems: 'center',
                gap: '4px',
              }}
            >
              <RotateCcw size={11} color="var(--text-muted)" />
              <span>Reset</span>
            </button>

            <button
              id="btn-pitch-guide-toggle"
              className="cyber-button"
              onClick={() => setShowPitchGuide(!showPitchGuide)}
              title="Toggle 90-Second Hero Pitch Flow Guide"
              style={{
                padding: '5px 8px',
                background: showPitchGuide ? 'rgba(240, 116, 91, 0.25)' : 'rgba(255, 255, 255, 0.04)',
                borderColor: showPitchGuide ? '#ea580c' : 'var(--border-subtle)',
                color: showPitchGuide ? '#fdba74' : 'var(--text-muted)',
                fontSize: '10px',
                display: 'flex',
                alignItems: 'center',
                gap: '4px',
              }}
            >
              <HelpCircle size={11} />
              <span>90s Guide</span>
            </button>

            <button
              id="btn-agent-brain"
              onClick={toggleTelemetry}
              className="cyber-button"
              style={{
                padding: '5px 10px',
                cursor: 'pointer',
                color: isTelemetryOpen ? '#00f0ff' : 'var(--text-primary)',
                borderColor: isTelemetryOpen ? 'var(--cyan-core)' : 'var(--border-subtle)',
                background: isTelemetryOpen ? 'rgba(0, 240, 255, 0.16)' : 'rgba(255, 255, 255, 0.04)',
                boxShadow: isTelemetryOpen ? '0 0 14px var(--cyan-glow)' : 'none',
                fontSize: '10px',
                fontWeight: 700,
              }}
              title="Inspect 5-Agent Deliberation Pipeline, Guardrails & BKT Belief State"
            >
              <Brain size={12} color={isTelemetryOpen ? '#00f0ff' : 'var(--cyan-core)'} />
              <span>[🧠 BRAIN]</span>
            </button>

            <button
              id="btn-ask-feynman"
              className="cyber-button"
              onClick={() => openFeynman()}
              title="Open Feynman Multimodal Adaptive Explanation Agent [F]"
              style={{
                padding: '5px 9px',
                background: 'rgba(168, 85, 247, 0.2)',
                borderColor: '#a855f7',
                color: '#e9d5ff',
                fontSize: '10px',
                fontWeight: 700,
              }}
            >
              <Sparkles size={11} color="#c084fc" />
              <span>Feynman [F]</span>
            </button>

            <button
              onClick={toggleAudioMute}
              className="cyber-button"
              style={{
                padding: '5px 8px',
                color: isMuted ? 'var(--text-muted)' : '#fdba74',
                borderColor: isMuted ? 'var(--border-subtle)' : 'rgba(240, 116, 91, 0.5)',
              }}
              title={isMuted ? 'Unmute Ambient Sound' : 'Mute Ambient Sound'}
            >
              {isMuted ? <VolumeX size={12} /> : <Volume2 size={12} />}
            </button>
          </div>

          {/* Collapsible 90-Second Hero Pitch Stepper Card */}
          {showPitchGuide && (
            <div
              id="hero-pitch-guide"
              className="glass-panel"
              style={{
                padding: '12px 16px',
                width: '100%',
                maxWidth: '680px',
                background: 'rgba(25, 12, 18, 0.95)',
                borderColor: 'rgba(240, 116, 91, 0.4)',
                boxShadow: '0 8px 30px rgba(0, 0, 0, 0.8)',
                animation: 'fadeIn 0.25s ease-out',
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
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <Activity size={13} color="#fb923c" />
                  <span
                    style={{
                      fontFamily: 'var(--font-display)',
                      fontSize: '11px',
                      fontWeight: 800,
                      color: '#fb923c',
                      letterSpacing: '0.06em',
                      textTransform: 'uppercase',
                    }}
                  >
                    90-Second Hero Pitch Sequence
                  </span>
                </div>
                <div style={{ display: 'flex', gap: '8px', fontSize: '9px', fontFamily: 'var(--font-mono)' }}>
                  <span className="glass-pill" style={{ color: '#00ff88' }}>
                    60 FPS RENDER
                  </span>
                  <span className="glass-pill" style={{ color: '#00f0ff' }}>
                    &lt;200ms LATENCY
                  </span>
                  <span className="glass-pill" style={{ color: '#ffb700' }}>
                    0 ASSET DOWNLOADS
                  </span>
                </div>
              </div>

              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(5, 1fr)',
                  gap: '6px',
                  fontSize: '10px',
                  fontFamily: 'var(--font-mono)',
                }}
              >
                <div
                  style={{
                    padding: '6px',
                    borderRadius: '4px',
                    background: 'rgba(255, 0, 85, 0.1)',
                    border: '1px solid rgba(255, 0, 85, 0.3)',
                  }}
                >
                  <div style={{ color: '#ff6699', fontWeight: 700 }}>1. Learner B</div>
                  <div style={{ color: 'var(--text-muted)', fontSize: '9px' }}>
                    Stack 38%, Recursion sealed, conduits guide
                  </div>
                </div>
                <div
                  style={{
                    padding: '6px',
                    borderRadius: '4px',
                    background: 'rgba(245, 158, 11, 0.1)',
                    border: '1px solid rgba(245, 158, 11, 0.3)',
                  }}
                >
                  <div style={{ color: '#f59e0b', fontWeight: 700 }}>2. Stack Lab</div>
                  <div style={{ color: 'var(--text-muted)', fontSize: '9px' }}>
                    Enter archway, [E] Console, answer challenge
                  </div>
                </div>
                <div
                  style={{
                    padding: '6px',
                    borderRadius: '4px',
                    background: 'rgba(0, 240, 255, 0.1)',
                    border: '1px solid rgba(0, 240, 255, 0.3)',
                  }}
                >
                  <div style={{ color: '#00f0ff', fontWeight: 700 }}>3. 1-Click Jump</div>
                  <div style={{ color: 'var(--text-muted)', fontSize: '9px' }}>Click Simulate Jump (38% → 74%)</div>
                </div>
                <div
                  style={{
                    padding: '6px',
                    borderRadius: '4px',
                    background: 'rgba(0, 255, 136, 0.1)',
                    border: '1px solid rgba(0, 255, 136, 0.3)',
                  }}
                >
                  <div style={{ color: '#00ff88', fontWeight: 700 }}>4. Dissolve</div>
                  <div style={{ color: 'var(--text-muted)', fontSize: '9px' }}>
                    Camera pans, arpeggio, 360 cyan particles
                  </div>
                </div>
                <div
                  style={{
                    padding: '6px',
                    borderRadius: '4px',
                    background: 'rgba(168, 85, 247, 0.1)',
                    border: '1px solid rgba(168, 85, 247, 0.3)',
                  }}
                >
                  <div style={{ color: '#c084fc', fontWeight: 700 }}>5. Brain Proof</div>
                  <div style={{ color: 'var(--text-muted)', fontSize: '9px' }}>[🧠 BRAIN] verifies 5-agent trace</div>
                </div>
              </div>
            </div>
          )}
        </div>
      </header>

      {/* Bottom Controls Panel (Centered Action Bar + View Toggles) */}
      <div className="controls-panel ui-interactive">
        <div className="apparatus-action-bar">
          {/* Array Actions */}
          <button
            className="act-btn"
            id="btn-arr-scan"
            onClick={() => {
              const idx = Math.floor(Math.random() * 5);
              jumpToArrayIndex(idx);
              const val = arrayBays[idx]?.value ?? 45;
              showToast(`Array Access [Index ${idx}]: Value = ${val} (Direct O(1) Pointer)`);
            }}
          >
            <span>🔍 Array O(1) Access</span>
          </button>
          <button
            className="act-btn"
            id="btn-arr-linear"
            onClick={() => {
              showToast('Scanning Array Memory: O(N) Sequential Search...');
              runArrayLinearSearch(78);
            }}
          >
            <span>⚡ Linear Search O(N)</span>
          </button>

          {/* Linked List Actions */}
          <button
            className="act-btn green"
            id="btn-list-traverse"
            onClick={() => {
              showToast('Traversing Node Pointers: HEAD -> Next -> Next -> NULL...');
              traverseLinkedList();
            }}
          >
            <span>✨ Traverse Links</span>
          </button>
          <button
            className="act-btn green"
            id="btn-list-add"
            onClick={() => {
              const rndVal = (Math.floor(Math.random() * 8) + 1) * 10;
              insertLinkedListNode(2, rndVal);
              showToast(`Inserted Dynamic Heap Node: Node(${rndVal}) at tail`);
            }}
          >
            <span>➕ Insert Node</span>
          </button>

          {/* Recursion Actions */}
          <button
            className="act-btn purple"
            id="btn-rec-unwind"
            onClick={() => {
              showToast('Base Case Reached! Unwinding Call Stack & Returning Results...');
              triggerRecursionReturn();
            }}
          >
            <span>🔄 Unwind Call Stack</span>
          </button>
          <button
            className="act-btn purple"
            id="btn-rec-push"
            onClick={() => {
              pushRecursionCall();
              showToast(`Pushed Activation Frame to Call Stack (Depth: ${recursionFrames.length + 1})`);
            }}
          >
            <span>⬇️ Push Frame</span>
          </button>

          {/* Tree Actions */}
          <button
            className="act-btn emerald"
            id="btn-tree-inorder"
            onClick={() => {
              showToast('Running In-Order Traversal (Left -> Root -> Right)...');
              runTreeInOrderTraversal();
            }}
          >
            <span>🌿 In-Order Traversal</span>
          </button>
          <button
            className="act-btn emerald"
            id="btn-tree-search"
            onClick={() => {
              showToast('Searching BST for Key = 60: Path (50 -> 70 -> 60)...');
              runTreeSearch(60);
            }}
          >
            <span>🎯 BST Search (60)</span>
          </button>
        </div>

        <div className="view-toggles">
          <button
            className={`demo-btn ${perspectiveMode === '3rd_person' && !isIsometric ? 'active' : ''}`}
            id="btn-3rd-person"
            onClick={() => {
              setIsIsometric(false);
              useClassroomStore.setState({ cinematicCamera: null });
              setPerspectiveMode('3rd_person');
              showToast('Switched to 3rd-Person Chase Cam');
            }}
          >
            <Camera size={13} />
            <span>3rd-Person Chase Cam</span>
          </button>
          <button
            className={`demo-btn ${perspectiveMode === '1st_person' && !isIsometric ? 'active' : ''}`}
            id="btn-1st-person"
            onClick={() => {
              setIsIsometric(false);
              useClassroomStore.setState({ cinematicCamera: null });
              setPerspectiveMode('1st_person');
              showToast('Switched to 1st-Person Eye Cam');
            }}
          >
            <Eye size={13} />
            <span>1st-Person Eye Cam</span>
          </button>
          <button
            className={`demo-btn ${isIsometric ? 'active' : ''}`}
            id="btn-isometric"
            onClick={() => {
              setIsIsometric(true);
              useClassroomStore.setState({
                cinematicCamera: {
                  active: true,
                  position: [32, 34, 32],
                  lookAt: [0, 1.6, 0],
                },
              });
              showToast('Switched to Isometric Campus Overview');
            }}
          >
            <span>📐 Isometric Campus Overview</span>
          </button>
          <button
            className={`demo-btn ${isGoldenHour ? 'active' : ''}`}
            id="btn-lighting"
            onClick={() => {
              toggleGoldenHour();
              showToast(isGoldenHour ? 'Standard Campus Daylight Enabled' : 'Golden Hour Atmosphere Enabled');
            }}
          >
            <span>☀️ Golden Hour</span>
          </button>
          <button
            className="demo-btn"
            id="btn-reset-pos"
            onClick={() => {
              teleportAvatar([0, 0, 0]);
              setIsIsometric(false);
              useClassroomStore.setState({ cinematicCamera: null });
              showToast('Reset Avatar Position to Center Atrium');
            }}
          >
            <span>🎯 Reset to Center</span>
          </button>
        </div>
      </div>

      {/* Bottom Row: Learner Profile & WASD Card */}
      <footer
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'flex-end',
          width: '100%',
        }}
      >
        {/* Active Learner Knowledge Profile Card (Bottom Left) */}
        {learner && (
          <div
            className="glass-panel ui-interactive"
            style={{
              padding: '12px 16px',
              maxWidth: '420px',
              background: 'rgba(25, 12, 18, 0.88)',
              borderColor: 'rgba(255, 255, 255, 0.14)',
            }}
          >
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginBottom: '4px',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <UserCheck size={14} color="#fb923c" />
                <span
                  style={{
                    fontFamily: 'var(--font-display)',
                    fontSize: '13px',
                    fontWeight: 700,
                    color: 'var(--text-primary)',
                  }}
                >
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

            <p
              style={{
                fontSize: '11px',
                color: 'var(--text-secondary)',
                lineHeight: '1.4',
                margin: '2px 0 4px 0',
              }}
            >
              {learner.learning_state.summary}
            </p>

            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '5px',
                fontSize: '10px',
                fontFamily: 'var(--font-mono)',
                color: '#38bdf8',
                marginBottom: '4px',
              }}
            >
              <Compass size={11} color="#38bdf8" />
              <span>Conduit Focus: {targetWing}</span>
            </div>

            {/* Quick Mastery Gauges */}
            <div style={{ display: 'flex', gap: '8px', marginTop: '4px' }}>
              {Object.entries(learner.mastery_map).map(([concept, value]) => {
                const pct = Math.round(value * 100);
                const color =
                  value >= 0.7
                    ? 'var(--emerald-mastery)'
                    : value >= 0.45
                    ? 'var(--amber-mastery)'
                    : 'var(--crimson-alert)';
                const delta = lastMasteryDelta[concept];
                return (
                  <div key={concept} style={{ flex: 1, textAlign: 'center', position: 'relative' }}>
                    <div
                      style={{
                        fontSize: '9px',
                        fontFamily: 'var(--font-mono)',
                        color: 'var(--text-muted)',
                        textTransform: 'uppercase',
                      }}
                    >
                      {concept === 'linked_list' ? 'List' : concept}
                    </div>
                    <div
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '3px',
                      }}
                    >
                      <span
                        style={{
                          fontSize: '11px',
                          fontFamily: 'var(--font-mono)',
                          fontWeight: 700,
                          color,
                        }}
                      >
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
                          {delta.delta >= 0
                            ? `+${Math.round(delta.delta * 100)}%`
                            : `${Math.round(delta.delta * 100)}%`}
                        </span>
                      )}
                    </div>
                    <div
                      style={{
                        width: '100%',
                        height: '4px',
                        backgroundColor: 'rgba(255,255,255,0.08)',
                        borderRadius: '2px',
                        overflow: 'hidden',
                        marginTop: '2px',
                      }}
                    >
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

        {/* Interactive WASD Movement Card (Bottom Right) */}
        <div className="wasd-card ui-interactive">
          <div className="wasd-title">Movement</div>
          <div className="wasd-row">
            <div
              className={`key-btn ${activeKeys.KeyW || activeKeys.ArrowUp ? 'active' : ''}`}
              id="key-w"
            >
              W
            </div>
          </div>
          <div className="wasd-row">
            <div
              className={`key-btn ${activeKeys.KeyA || activeKeys.ArrowLeft ? 'active' : ''}`}
              id="key-a"
            >
              A
            </div>
            <div
              className={`key-btn ${activeKeys.KeyS || activeKeys.ArrowDown ? 'active' : ''}`}
              id="key-s"
            >
              S
            </div>
            <div
              className={`key-btn ${activeKeys.KeyD || activeKeys.ArrowRight ? 'active' : ''}`}
              id="key-d"
            >
              D
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};
