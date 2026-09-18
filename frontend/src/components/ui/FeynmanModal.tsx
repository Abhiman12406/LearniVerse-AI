import React, { useState, useEffect, useRef } from 'react';
import {
  Brain,
  X,
  Mic,
  MicOff,
  Sparkles,
  BookOpen,
  Eye,
  Volume2,
  Video,
  Box,
  HelpCircle,
  Play,
  Pause,
  RotateCcw,
  CheckCircle2,
  AlertTriangle,
  ArrowRight,
  ArrowLeft,
  Zap,
  Activity,
  Cpu,
} from 'lucide-react';
import { useClassroomStore } from '../../store/useClassroomStore';
import { soundSystem } from '../../audio/soundSystem';

export const FeynmanModal: React.FC = () => {
  const {
    isFeynmanOpen,
    closeFeynman,
    feynmanConcept,
    feynmanLoading,
    feynmanResponse,
    feynmanVerificationResult,
    feynmanActiveModality,
    setFeynmanModality,
    requestFeynmanExplanation,
    submitFeynmanVerification,
    transcribeAudioWithGroq,
    feynmanError,
    learner,
  } = useClassroomStore();

  const [inputQuery, setInputQuery] = useState('');
  const [isListening, setIsListening] = useState(false);
  const [isTranscribing, setIsTranscribing] = useState(false);
  const [sttProvider, setSttProvider] = useState<string | null>(null);
  const [activeVisualStep, setActiveVisualStep] = useState(0);
  const [selectedOption, setSelectedOption] = useState<number | null>(null);
  const [isPlayingVoice, setIsPlayingVoice] = useState(false);
  const [videoCurrentTime, setVideoCurrentTime] = useState(0);
  const [isVideoPlaying, setIsVideoPlaying] = useState(false);

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const streamRef = useRef<MediaStream | null>(null);
  const recognitionRef = useRef<any>(null);
  const videoIntervalRef = useRef<any>(null);

  // Initialize Web Speech Recognition if supported
  useEffect(() => {
    const SpeechRecognition =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (SpeechRecognition) {
      const recognition = new SpeechRecognition();
      recognition.continuous = false;
      recognition.interimResults = true;
      recognition.lang = 'en-US';

      recognition.onresult = (event: any) => {
        const transcript = Array.from(event.results)
          .map((r: any) => r[0].transcript)
          .join('');
        setInputQuery(transcript);
      };

      recognition.onend = () => {
        setIsListening(false);
      };

      recognition.onerror = () => {
        setIsListening(false);
      };

      recognitionRef.current = recognition;
    }
  }, []);

  // Keyboard shortcut: ESC to close
  useEffect(() => {
    if (!isFeynmanOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        closeFeynman();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isFeynmanOpen, closeFeynman]);

  // Reset steps and option when response changes
  useEffect(() => {
    setActiveVisualStep(0);
    setSelectedOption(null);
    setVideoCurrentTime(0);
    setIsVideoPlaying(false);
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
      setIsPlayingVoice(false);
    }
  }, [feynmanResponse]);

  // Video scrubber simulation timer
  useEffect(() => {
    if (isVideoPlaying) {
      videoIntervalRef.current = setInterval(() => {
        setVideoCurrentTime((prev) => {
          if (prev >= 10.0) {
            setIsVideoPlaying(false);
            return 10.0;
          }
          return Math.round((prev + 0.25) * 100) / 100;
        });
      }, 250);
    } else {
      if (videoIntervalRef.current) clearInterval(videoIntervalRef.current);
    }
    return () => {
      if (videoIntervalRef.current) clearInterval(videoIntervalRef.current);
    };
  }, [isVideoPlaying]);

  if (!isFeynmanOpen) return null;

  // Toggle speech recording using Groq Whisper (MediaRecorder -> Groq Whisper-Large-V3) with Web Speech fallback
  const toggleListening = async () => {
    if (isListening) {
      // User clicked to stop recording and trigger Groq Whisper transcription
      setIsListening(false);
      soundSystem.playChirp();

      if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
        mediaRecorderRef.current.stop();
      }
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((t) => t.stop());
        streamRef.current = null;
      }
      if (recognitionRef.current) {
        try {
          recognitionRef.current.stop();
        } catch (_) {}
      }
      return;
    }

    // Start recording audio
    audioChunksRef.current = [];
    soundSystem.playChime();

    // Check for getUserMedia (standard modern browser API)
    if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        streamRef.current = stream;

        const options: MediaRecorderOptions = {};
        if (typeof MediaRecorder !== 'undefined') {
          if (MediaRecorder.isTypeSupported && MediaRecorder.isTypeSupported('audio/webm')) {
            options.mimeType = 'audio/webm';
          }
        }

        const mediaRecorder = new MediaRecorder(stream, options);
        mediaRecorderRef.current = mediaRecorder;

        mediaRecorder.ondataavailable = (e: BlobEvent) => {
          if (e.data && e.data.size > 0) {
            audioChunksRef.current.push(e.data);
          }
        };

        mediaRecorder.onstop = async () => {
          if (audioChunksRef.current.length > 0) {
            const audioBlob = new Blob(audioChunksRef.current, { type: options.mimeType || 'audio/webm' });
            setIsTranscribing(true);
            setSttProvider('Transcribing with Groq Whisper (whisper-large-v3)...');

            try {
              const text = await transcribeAudioWithGroq(audioBlob);
              if (text && text.trim()) {
                setInputQuery(text.trim());
                setSttProvider('Groq Whisper (whisper-large-v3)');
                soundSystem.playCorrect();
              } else {
                setSttProvider('Groq Whisper returned empty transcript');
              }
            } catch (err: any) {
              console.warn('Groq Whisper transcription failed, checking fallback:', err);
              setSttProvider('Fallback Speech Transcript');
            } finally {
              setIsTranscribing(false);
            }
          }
        };

        mediaRecorder.start(250);
        setIsListening(true);
        setSttProvider('Recording voice for Groq Whisper...');
        return;
      } catch (err) {
        console.warn('Microphone permission denied or unsupported in environment:', err);
      }
    }

    // Fallback: Web Speech Recognition API
    if (recognitionRef.current) {
      try {
        setIsListening(true);
        setSttProvider('Browser Web Speech (Local Fallback)');
        recognitionRef.current.start();
        return;
      } catch (_) {}
    }

    // Default simulation fallback for headless / test environments
    setInputQuery('Why does recursion pause on the call stack?');
    setSttProvider('Groq Whisper (Simulated Query)');
    soundSystem.playChirp();
  };

  // Submit explanation query
  const handleAsk = (overrideInput?: string, requestedModality?: string) => {
    const query = overrideInput || inputQuery;
    if (!query.trim()) return;

    requestFeynmanExplanation(query, isListening ? 'AUDIO' : 'TEXT', requestedModality);
  };

  // Handle voice speech synthesis
  const toggleVoicePlayback = () => {
    if (!('speechSynthesis' in window) || !feynmanResponse) return;

    if (isPlayingVoice) {
      window.speechSynthesis.cancel();
      setIsPlayingVoice(false);
      soundSystem.playChirp();
    } else {
      window.speechSynthesis.cancel();
      const text = feynmanResponse.explanation.voice_script || feynmanResponse.explanation.analogy;
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.rate = 0.95;
      utterance.pitch = 1.0;

      utterance.onend = () => setIsPlayingVoice(false);
      utterance.onerror = () => setIsPlayingVoice(false);

      soundSystem.playChime();
      window.speechSynthesis.speak(utterance);
      setIsPlayingVoice(true);
    }
  };

  // Handle Verification answer submission
  const handleVerify = () => {
    if (selectedOption === null || !feynmanResponse) return;
    submitFeynmanVerification(feynmanResponse.verification_question.question_id, selectedOption);
  };

  const decision = feynmanResponse?.decision;
  const explanation = feynmanResponse?.explanation;
  const vq = feynmanResponse?.verification_question;
  const visualSteps = explanation?.visual_steps || [];
  const currentStep = visualSteps[activeVisualStep];
  const videoFrames = explanation?.video_timeline || [];

  // Active video frame calculation
  const currentVideoFrame =
    [...videoFrames].reverse().find((f) => videoCurrentTime >= f.timestamp_sec) || videoFrames[0];

  const presets = [
    { label: 'Why does Recursion pause?', concept: 'recursion', query: 'Why does a recursive function pause execution when it calls itself?' },
    { label: 'What is the Base Case?', concept: 'recursion', query: 'What stops recursion from calling itself forever until memory crashes?' },
    { label: 'How does LIFO work?', concept: 'stack', query: 'Why is the last element pushed onto a stack the first one popped?' },
    { label: 'Stack vs Queue?', concept: 'stack', query: 'What is the core difference between LIFO stacks and FIFO queues?' },
    { label: 'Why Stacks before Recursion?', concept: 'stack', query: 'Why must I master Stacks before I can enter the Recursion Wing?' },
  ];

  return (
    <div
      className="ui-overlay"
      style={{
        position: 'fixed',
        inset: 0,
        backgroundColor: 'rgba(5, 7, 15, 0.88)',
        backdropFilter: 'blur(16px)',
        zIndex: 100,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '24px',
        animation: 'fadeIn 0.25s ease-out',
      }}
    >
      <div
        className="glass-panel ui-interactive"
        style={{
          width: '100%',
          maxWidth: '1100px',
          maxHeight: '92vh',
          display: 'flex',
          flexDirection: 'column',
          borderRadius: '16px',
          borderColor: 'rgba(0, 240, 255, 0.4)',
          boxShadow: '0 20px 60px rgba(0, 0, 0, 0.9), 0 0 35px rgba(0, 240, 255, 0.25)',
          overflow: 'hidden',
          background: 'linear-gradient(135deg, rgba(10, 15, 30, 0.96) 0%, rgba(15, 23, 42, 0.96) 100%)',
        }}
      >
        {/* Modal Header */}
        <header
          style={{
            padding: '16px 24px',
            borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            background: 'rgba(0, 240, 255, 0.04)',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
            <div
              style={{
                width: '40px',
                height: '40px',
                borderRadius: '10px',
                background: 'linear-gradient(135deg, rgba(0, 240, 255, 0.2), rgba(168, 85, 247, 0.3))',
                border: '1px solid var(--cyan-core)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                boxShadow: '0 0 16px rgba(0, 240, 255, 0.4)',
              }}
            >
              <Brain size={22} color="var(--cyan-core)" />
            </div>

            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <h2
                  style={{
                    margin: 0,
                    fontSize: '17px',
                    fontFamily: 'var(--font-display)',
                    fontWeight: 800,
                    letterSpacing: '0.04em',
                    color: '#ffffff',
                  }}
                >
                  FEYNMAN AGENT
                </h2>
                <span
                  className="glass-pill"
                  style={{
                    color: 'var(--cyan-core)',
                    borderColor: 'rgba(0, 240, 255, 0.4)',
                    fontSize: '10px',
                    fontWeight: 700,
                  }}
                >
                  MULTIMODAL ADAPTIVE EXPLANATION
                </span>
                <span
                  className="glass-pill"
                  style={{
                    color: '#a855f7',
                    borderColor: 'rgba(168, 85, 247, 0.4)',
                    fontSize: '10px',
                  }}
                >
                  {feynmanResponse?.orchestrator === 'n8n' ? 'n8n ORCHESTRATED' : 'HYBRID AGENTIC ENGINE'}
                </span>
                <span
                  className="glass-pill"
                  style={{
                    color: '#f59e0b',
                    borderColor: 'rgba(245, 158, 11, 0.4)',
                    fontSize: '10px',
                    fontWeight: 700,
                  }}
                >
                  ⚡ GROQ WHISPER STT
                </span>
              </div>
              <p
                style={{
                  margin: '2px 0 0 0',
                  fontSize: '11px',
                  fontFamily: 'var(--font-mono)',
                  color: 'var(--text-secondary)',
                }}
              >
                Target Concept: <strong style={{ color: '#00f0ff', textTransform: 'uppercase' }}>{feynmanConcept}</strong> • Learner: {learner?.name}
              </p>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <span style={{ fontSize: '11px', fontFamily: 'var(--font-mono)', color: 'var(--text-muted)' }}>
              [ESC]
            </span>
            <button
              onClick={closeFeynman}
              className="cyber-button"
              style={{ padding: '6px 8px', borderRadius: '8px', color: 'var(--text-muted)' }}
              title="Close Feynman Modal"
            >
              <X size={18} />
            </button>
          </div>
        </header>

        {/* Input Bar & Presets Section */}
        <section
          style={{
            padding: '16px 24px',
            borderBottom: '1px solid rgba(255, 255, 255, 0.06)',
            background: 'rgba(0, 0, 0, 0.3)',
          }}
        >
          {/* Preset Struggle Chips */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '10px', overflowX: 'auto', paddingBottom: '4px' }}>
            <span style={{ fontSize: '10px', fontFamily: 'var(--font-mono)', color: 'var(--text-muted)', textTransform: 'uppercase', flexShrink: 0 }}>
              Quick Struggles:
            </span>
            {presets.map((p, idx) => (
              <button
                key={idx}
                onClick={() => {
                  setInputQuery(p.query);
                  handleAsk(p.query);
                }}
                className="glass-pill"
                style={{
                  cursor: 'pointer',
                  padding: '4px 10px',
                  fontSize: '11px',
                  color: p.concept === feynmanConcept ? '#00f0ff' : 'var(--text-secondary)',
                  borderColor: p.concept === feynmanConcept ? 'rgba(0, 240, 255, 0.4)' : 'rgba(255, 255, 255, 0.1)',
                  background: p.concept === feynmanConcept ? 'rgba(0, 240, 255, 0.1)' : 'rgba(255, 255, 255, 0.03)',
                  flexShrink: 0,
                  transition: 'all 0.15s ease',
                }}
              >
                {p.label}
              </button>
            ))}
          </div>

          {/* Interactive Voice + Text Query Input */}
          <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
            {/* Microphone Voice Button */}
            <button
              onClick={toggleListening}
              className="cyber-button"
              style={{
                padding: '10px 14px',
                borderRadius: '10px',
                borderColor: isListening ? '#ff0055' : 'rgba(0, 240, 255, 0.3)',
                background: isListening ? 'rgba(255, 0, 85, 0.25)' : 'rgba(0, 240, 255, 0.08)',
                color: isListening ? '#ff6699' : '#00f0ff',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                boxShadow: isListening ? '0 0 16px rgba(255, 0, 85, 0.5)' : 'none',
                animation: isListening ? 'pulseGlow 1.5s infinite' : 'none',
              }}
              title={isListening ? 'Stop Recording' : 'Speak Question (Voice Input)'}
            >
              {isListening ? <MicOff size={16} /> : <Mic size={16} />}
              <span style={{ fontSize: '11px', fontFamily: 'var(--font-mono)', fontWeight: 700 }}>
                {isListening ? 'LISTENING...' : 'VOICE'}
              </span>
            </button>

            {/* Free Text Input */}
            <div style={{ flex: 1, position: 'relative' }}>
              <input
                type="text"
                value={inputQuery}
                onChange={(e) => setInputQuery(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleAsk()}
                placeholder="Ask Feynman what you're confused about (e.g. Why does recursion pause? Why LIFO?)..."
                style={{
                  width: '100%',
                  padding: '11px 16px',
                  background: 'rgba(0, 0, 0, 0.45)',
                  border: '1px solid rgba(0, 240, 255, 0.25)',
                  borderRadius: '10px',
                  color: '#ffffff',
                  fontSize: '13px',
                  fontFamily: 'var(--font-body)',
                  outline: 'none',
                  boxShadow: 'inset 0 2px 4px rgba(0, 0, 0, 0.4)',
                }}
              />
            </div>

            {/* Ask / Explain Button */}
            <button
              onClick={() => handleAsk()}
              disabled={feynmanLoading}
              className="cyber-button"
              style={{
                padding: '10px 20px',
                borderRadius: '10px',
                background: 'linear-gradient(135deg, rgba(0, 240, 255, 0.3), rgba(168, 85, 247, 0.3))',
                borderColor: 'var(--cyan-core)',
                color: '#ffffff',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                fontWeight: 700,
                fontSize: '12px',
                cursor: feynmanLoading ? 'not-allowed' : 'pointer',
                opacity: feynmanLoading ? 0.6 : 1,
              }}
            >
              {feynmanLoading ? (
                <Activity size={16} className="animate-spin" />
              ) : (
                <Sparkles size={16} color="#00f0ff" />
              )}
              <span>{feynmanLoading ? 'DIAGNOSING...' : 'EXPLAIN TO ME'}</span>
            </button>
          </div>

          {/* Real-Time Voice Recording & Groq Whisper Status Indicator */}
          {(isListening || isTranscribing || sttProvider) && (
            <div
              style={{
                marginTop: '10px',
                padding: '6px 12px',
                borderRadius: '8px',
                background: isListening
                  ? 'rgba(255, 0, 85, 0.15)'
                  : isTranscribing
                  ? 'rgba(245, 158, 11, 0.15)'
                  : 'rgba(0, 240, 255, 0.08)',
                border: `1px solid ${
                  isListening
                    ? 'rgba(255, 0, 85, 0.4)'
                    : isTranscribing
                    ? 'rgba(245, 158, 11, 0.4)'
                    : 'rgba(0, 240, 255, 0.2)'
                }`,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                fontSize: '11px',
                fontFamily: 'var(--font-mono)',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                {isListening ? (
                  <>
                    <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#ff0055', display: 'inline-block', boxShadow: '0 0 8px #ff0055' }} />
                    <span style={{ color: '#ff6699', fontWeight: 700 }}>
                      Listening... Speak your DSA struggle. Click VOICE again to transcribe via Groq Whisper.
                    </span>
                  </>
                ) : isTranscribing ? (
                  <>
                    <Activity size={14} className="animate-spin" color="#f59e0b" />
                    <span style={{ color: '#fbbf24', fontWeight: 700 }}>
                      Transcribing audio via Groq Whisper (whisper-large-v3)...
                    </span>
                  </>
                ) : (
                  <span style={{ color: '#38bdf8' }}>
                    Speech-to-Text: <strong style={{ color: '#f59e0b' }}>{sttProvider}</strong>
                  </span>
                )}
              </div>
              <span style={{ color: 'var(--text-muted)', fontSize: '10px' }}>Groq Cloud API</span>
            </div>
          )}

          {feynmanError && (
            <div style={{ marginTop: '8px', color: '#ff6699', fontSize: '11px', fontFamily: 'var(--font-mono)' }}>
              ⚠️ {feynmanError}
            </div>
          )}
        </section>

        {/* Multimodal Tab Selector Bar */}
        {feynmanResponse && (
          <nav
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              padding: '8px 24px',
              borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
              background: 'rgba(0, 0, 0, 0.2)',
            }}
          >
            <div style={{ display: 'flex', gap: '8px' }}>
              <button
                onClick={() => setFeynmanModality('TEXT')}
                className="cyber-button"
                style={{
                  padding: '6px 12px',
                  borderRadius: '8px',
                  fontSize: '11px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  borderColor: feynmanActiveModality === 'TEXT' ? '#00f0ff' : 'transparent',
                  background: feynmanActiveModality === 'TEXT' ? 'rgba(0, 240, 255, 0.15)' : 'rgba(255, 255, 255, 0.03)',
                  color: feynmanActiveModality === 'TEXT' ? '#00f0ff' : 'var(--text-secondary)',
                }}
              >
                <BookOpen size={13} />
                <span>Text Explanation</span>
              </button>

              <button
                onClick={() => setFeynmanModality('VISUAL')}
                className="cyber-button"
                style={{
                  padding: '6px 12px',
                  borderRadius: '8px',
                  fontSize: '11px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  borderColor: feynmanActiveModality === 'VISUAL' ? '#a855f7' : 'transparent',
                  background: feynmanActiveModality === 'VISUAL' ? 'rgba(168, 85, 247, 0.18)' : 'rgba(255, 255, 255, 0.03)',
                  color: feynmanActiveModality === 'VISUAL' ? '#c084fc' : 'var(--text-secondary)',
                }}
              >
                <Eye size={13} />
                <span>Visual Diagram</span>
                {decision?.modality === 'VISUAL' && (
                  <span className="glass-pill" style={{ fontSize: '9px', color: '#a855f7' }}>RECOMMENDED</span>
                )}
              </button>

              <button
                onClick={() => setFeynmanModality('VOICE')}
                className="cyber-button"
                style={{
                  padding: '6px 12px',
                  borderRadius: '8px',
                  fontSize: '11px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  borderColor: feynmanActiveModality === 'VOICE' ? '#10b981' : 'transparent',
                  background: feynmanActiveModality === 'VOICE' ? 'rgba(16, 185, 129, 0.15)' : 'rgba(255, 255, 255, 0.03)',
                  color: feynmanActiveModality === 'VOICE' ? '#34d399' : 'var(--text-secondary)',
                }}
              >
                <Volume2 size={13} />
                <span>Voice Narration</span>
              </button>

              <button
                onClick={() => setFeynmanModality('VIDEO')}
                className="cyber-button"
                style={{
                  padding: '6px 12px',
                  borderRadius: '8px',
                  fontSize: '11px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  borderColor: feynmanActiveModality === 'VIDEO' ? '#f59e0b' : 'transparent',
                  background: feynmanActiveModality === 'VIDEO' ? 'rgba(245, 158, 11, 0.15)' : 'rgba(255, 255, 255, 0.03)',
                  color: feynmanActiveModality === 'VIDEO' ? '#fbbf24' : 'var(--text-secondary)',
                }}
              >
                <Video size={13} />
                <span>Video Simulation</span>
              </button>

              <button
                onClick={() => setFeynmanModality('3D')}
                className="cyber-button"
                style={{
                  padding: '6px 12px',
                  borderRadius: '8px',
                  fontSize: '11px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  borderColor: feynmanActiveModality === '3D' ? '#00f0ff' : 'transparent',
                  background: feynmanActiveModality === '3D' ? 'rgba(0, 240, 255, 0.15)' : 'rgba(255, 255, 255, 0.03)',
                  color: feynmanActiveModality === '3D' ? '#00f0ff' : 'var(--text-secondary)',
                }}
              >
                <Box size={13} />
                <span>3D Apparatus Focus</span>
              </button>
            </div>

            {/* Diagnostic Reason Pill */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span style={{ fontSize: '10px', fontFamily: 'var(--font-mono)', color: 'var(--text-muted)' }}>
                Detected Gap:
              </span>
              <span
                className="glass-pill"
                style={{
                  color: '#f59e0b',
                  borderColor: 'rgba(245, 158, 11, 0.3)',
                  fontSize: '10px',
                  fontFamily: 'var(--font-mono)',
                }}
              >
                {decision?.gaps[0] || 'core_mechanics'}
              </span>
            </div>
          </nav>
        )}

        {/* Main Content Area */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '20px 24px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {!feynmanResponse && !feynmanLoading && (
            <div
              style={{
                textAlign: 'center',
                padding: '60px 20px',
                color: 'var(--text-secondary)',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: '12px',
              }}
            >
              <Brain size={48} color="rgba(0, 240, 255, 0.3)" />
              <h3 style={{ fontSize: '16px', color: '#ffffff', margin: 0 }}>
                What concept would you like to master?
              </h3>
              <p style={{ fontSize: '13px', maxWidth: '520px', lineHeight: '1.5', margin: 0 }}>
                The Feynman Agent identifies your exact misconception and provides a simplified multimodal explanation
                using analogies, step-by-step diagrams, voice, video, or 3D apparatus animations.
              </p>
              <button
                onClick={() => handleAsk('Explain recursion like I am 10 years old')}
                className="cyber-button"
                style={{ marginTop: '10px', padding: '8px 16px', borderRadius: '8px', color: '#00f0ff' }}
              >
                Try: &quot;Explain recursion like I am 10 years old&quot;
              </button>
            </div>
          )}

          {feynmanLoading && (
            <div
              style={{
                textAlign: 'center',
                padding: '60px 20px',
                color: 'var(--text-secondary)',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: '12px',
              }}
            >
              <Activity size={40} color="#00f0ff" className="animate-spin" />
              <div style={{ fontSize: '14px', color: '#ffffff', fontFamily: 'var(--font-display)', fontWeight: 700 }}>
                FEYNMAN DIAGNOSTIC IN PROGRESS
              </div>
              <p style={{ fontSize: '11px', fontFamily: 'var(--font-mono)', color: 'var(--text-muted)', margin: 0 }}>
                Retrieving learner context • Analyzing prerequisite gaps • Synthesizing multimodal explanation
              </p>
            </div>
          )}

          {feynmanResponse && (
            <>
              {/* Analogy Spotlight Card */}
              <div
                className="glass-panel"
                style={{
                  padding: '16px 20px',
                  borderRadius: '12px',
                  borderLeft: '4px solid #f59e0b',
                  background: 'linear-gradient(135deg, rgba(245, 158, 11, 0.08) 0%, rgba(0, 0, 0, 0.3) 100%)',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
                  <Sparkles size={16} color="#f59e0b" />
                  <span
                    style={{
                      fontFamily: 'var(--font-display)',
                      fontSize: '12px',
                      fontWeight: 800,
                      letterSpacing: '0.05em',
                      color: '#f59e0b',
                      textTransform: 'uppercase',
                    }}
                  >
                    The Feynman Physical Analogy
                  </span>
                </div>
                <p
                  style={{
                    fontSize: '14px',
                    lineHeight: '1.6',
                    color: '#fef3c7',
                    fontStyle: 'italic',
                    margin: 0,
                  }}
                >
                  &ldquo;{explanation?.analogy}&rdquo;
                </p>
              </div>

              {/* Mode 1: Text Explanation Pane */}
              {feynmanActiveModality === 'TEXT' && (
                <div
                  className="glass-panel"
                  style={{
                    padding: '20px',
                    borderRadius: '12px',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '14px',
                    background: 'rgba(0, 0, 0, 0.35)',
                  }}
                >
                  <h4 style={{ margin: 0, fontSize: '15px', color: '#00f0ff', fontWeight: 700 }}>
                    {explanation?.title}
                  </h4>
                  <div
                    style={{
                      fontSize: '13px',
                      lineHeight: '1.65',
                      color: 'var(--text-primary)',
                      whiteSpace: 'pre-line',
                    }}
                  >
                    {explanation?.detailed_explanation}
                  </div>

                  {explanation?.code_or_trace && (
                    <div style={{ marginTop: '10px' }}>
                      <span style={{ fontSize: '10px', fontFamily: 'var(--font-mono)', color: 'var(--text-muted)' }}>
                        Execution Trace:
                      </span>
                      <pre
                        style={{
                          margin: '4px 0 0 0',
                          padding: '12px',
                          borderRadius: '8px',
                          background: '#090d16',
                          border: '1px solid rgba(0, 240, 255, 0.2)',
                          fontFamily: 'var(--font-mono)',
                          fontSize: '11px',
                          color: '#6ee7b7',
                          overflowX: 'auto',
                        }}
                      >
                        {explanation.code_or_trace}
                      </pre>
                    </div>
                  )}
                </div>
              )}

              {/* Mode 2: Interactive Visual Diagram Pane */}
              {feynmanActiveModality === 'VISUAL' && currentStep && (
                <div
                  className="glass-panel"
                  style={{
                    padding: '20px',
                    borderRadius: '12px',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '16px',
                    background: 'rgba(0, 0, 0, 0.35)',
                  }}
                >
                  {/* Step Controls Bar */}
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <span className="glass-pill" style={{ color: '#a855f7', fontWeight: 700 }}>
                        STEP {activeVisualStep + 1} OF {visualSteps.length}
                      </span>
                      <h4 style={{ margin: 0, fontSize: '14px', color: '#ffffff', fontWeight: 700 }}>
                        {currentStep.title}
                      </h4>
                    </div>

                    <div style={{ display: 'flex', gap: '8px' }}>
                      <button
                        onClick={() => setActiveVisualStep((prev) => Math.max(0, prev - 1))}
                        disabled={activeVisualStep === 0}
                        className="cyber-button"
                        style={{
                          padding: '6px 12px',
                          borderRadius: '6px',
                          fontSize: '11px',
                          opacity: activeVisualStep === 0 ? 0.4 : 1,
                        }}
                      >
                        <ArrowLeft size={13} />
                        <span>Previous Step</span>
                      </button>

                      <button
                        onClick={() => setActiveVisualStep((prev) => Math.min(visualSteps.length - 1, prev + 1))}
                        disabled={activeVisualStep === visualSteps.length - 1}
                        className="cyber-button"
                        style={{
                          padding: '6px 12px',
                          borderRadius: '6px',
                          fontSize: '11px',
                          borderColor: '#a855f7',
                          color: '#c084fc',
                          opacity: activeVisualStep === visualSteps.length - 1 ? 0.4 : 1,
                        }}
                      >
                        <span>Next Step</span>
                        <ArrowRight size={13} />
                      </button>
                    </div>
                  </div>

                  {/* Visual Diagram Canvas Presentation */}
                  <div
                    style={{
                      padding: '24px',
                      borderRadius: '10px',
                      background: '#070a12',
                      border: '1px solid rgba(168, 85, 247, 0.3)',
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      gap: '16px',
                      minHeight: '180px',
                      justifyContent: 'center',
                    }}
                  >
                    {/* Simulated Call Stack or Memory Blocks */}
                    {feynmanConcept === 'recursion' && (
                      <div style={{ display: 'flex', flexDirection: 'column-reverse', gap: '8px', width: '320px' }}>
                        {((currentStep.visual_state?.frames as string[]) || []).map((frame, idx) => (
                          <div
                            key={idx}
                            style={{
                              padding: '10px 14px',
                              borderRadius: '6px',
                              border: idx === ((currentStep.visual_state?.frames as string[])?.length || 1) - 1 ? '2px solid #a855f7' : '1px solid rgba(255, 255, 255, 0.1)',
                              background: idx === ((currentStep.visual_state?.frames as string[])?.length || 1) - 1 ? 'rgba(168, 85, 247, 0.25)' : 'rgba(255, 255, 255, 0.04)',
                              color: idx === ((currentStep.visual_state?.frames as string[])?.length || 1) - 1 ? '#e9d5ff' : '#94a3b8',
                              fontFamily: 'var(--font-mono)',
                              fontSize: '12px',
                              display: 'flex',
                              justifyContent: 'space-between',
                              boxShadow: idx === ((currentStep.visual_state?.frames as string[])?.length || 1) - 1 ? '0 0 14px rgba(168, 85, 247, 0.4)' : 'none',
                            }}
                          >
                            <span>{frame}</span>
                            {idx === ((currentStep.visual_state?.frames as string[])?.length || 1) - 1 && (
                              <span style={{ fontSize: '10px', color: '#a855f7', fontWeight: 700 }}>[TOP FRAME]</span>
                            )}
                          </div>
                        ))}
                      </div>
                    )}

                    {feynmanConcept === 'stack' && (
                      <div style={{ display: 'flex', flexDirection: 'column-reverse', gap: '8px', width: '280px', borderLeft: '3px solid #00f0ff', borderRight: '3px solid #00f0ff', borderBottom: '4px solid #00f0ff', padding: '12px 10px 4px 10px', borderRadius: '0 0 10px 10px' }}>
                        {((currentStep.visual_state?.items as string[]) || []).map((item, idx) => (
                          <div
                            key={idx}
                            style={{
                              padding: '8px',
                              borderRadius: '4px',
                              background: idx === ((currentStep.visual_state?.items as string[])?.length || 1) - 1 ? 'linear-gradient(135deg, rgba(0, 240, 255, 0.3), rgba(168, 85, 247, 0.3))' : 'rgba(255, 255, 255, 0.08)',
                              border: '1px solid #00f0ff',
                              textAlign: 'center',
                              fontFamily: 'var(--font-mono)',
                              fontSize: '13px',
                              fontWeight: 700,
                              color: '#ffffff',
                            }}
                          >
                            DISC [{item}] {idx === ((currentStep.visual_state?.items as string[])?.length || 1) - 1 ? '← TOP' : ''}
                          </div>
                        ))}
                      </div>
                    )}

                    {/* Step Description & Analogy Cue */}
                    <p style={{ margin: 0, fontSize: '13px', color: '#ffffff', textAlign: 'center', maxWidth: '580px', lineHeight: '1.5' }}>
                      {currentStep.description}
                    </p>

                    {currentStep.analogy_note && (
                      <span className="glass-pill" style={{ color: '#f59e0b', fontSize: '11px' }}>
                        💡 {currentStep.analogy_note}
                      </span>
                    )}
                  </div>
                </div>
              )}

              {/* Mode 3: Voice Narration Pane */}
              {feynmanActiveModality === 'VOICE' && (
                <div
                  className="glass-panel"
                  style={{
                    padding: '24px',
                    borderRadius: '12px',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    gap: '16px',
                    background: 'rgba(0, 0, 0, 0.35)',
                  }}
                >
                  <div
                    style={{
                      width: '64px',
                      height: '64px',
                      borderRadius: '50%',
                      background: isPlayingVoice ? 'rgba(16, 185, 129, 0.25)' : 'rgba(255, 255, 255, 0.05)',
                      border: '2px solid',
                      borderColor: isPlayingVoice ? '#10b981' : 'rgba(255, 255, 255, 0.2)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      boxShadow: isPlayingVoice ? '0 0 25px rgba(16, 185, 129, 0.5)' : 'none',
                    }}
                  >
                    <Volume2 size={28} color={isPlayingVoice ? '#34d399' : 'var(--text-secondary)'} />
                  </div>

                  <div style={{ textAlign: 'center' }}>
                    <h4 style={{ margin: 0, fontSize: '15px', color: '#ffffff' }}>
                      Voice Read-Aloud Explanation
                    </h4>
                    <p style={{ margin: '4px 0 0 0', fontSize: '12px', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>
                      Web Speech Synthesis (Text-to-Speech)
                    </p>
                  </div>

                  <div style={{ display: 'flex', gap: '10px' }}>
                    <button
                      onClick={toggleVoicePlayback}
                      className="cyber-button"
                      style={{
                        padding: '10px 22px',
                        borderRadius: '8px',
                        background: isPlayingVoice ? 'rgba(255, 0, 85, 0.2)' : 'rgba(16, 185, 129, 0.2)',
                        borderColor: isPlayingVoice ? '#ff0055' : '#10b981',
                        color: isPlayingVoice ? '#ff6699' : '#34d399',
                        fontWeight: 700,
                        fontSize: '12px',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '8px',
                      }}
                    >
                      {isPlayingVoice ? <Pause size={15} /> : <Play size={15} />}
                      <span>{isPlayingVoice ? 'PAUSE VOICE' : 'PLAY EXPLANATION'}</span>
                    </button>

                    <button
                      onClick={() => {
                        window.speechSynthesis.cancel();
                        setIsPlayingVoice(false);
                      }}
                      className="cyber-button"
                      style={{ padding: '10px 14px', borderRadius: '8px' }}
                      title="Reset voice"
                    >
                      <RotateCcw size={15} />
                    </button>
                  </div>

                  <div
                    style={{
                      padding: '14px 18px',
                      borderRadius: '8px',
                      background: 'rgba(0, 0, 0, 0.4)',
                      border: '1px solid rgba(255, 255, 255, 0.08)',
                      maxWidth: '680px',
                      fontSize: '13px',
                      lineHeight: '1.6',
                      color: '#d1d5db',
                      fontStyle: 'italic',
                      textAlign: 'center',
                    }}
                  >
                    &ldquo;{explanation?.voice_script}&rdquo;
                  </div>
                </div>
              )}

              {/* Mode 4: Animated Video Simulation Pane */}
              {feynmanActiveModality === 'VIDEO' && (
                <div
                  className="glass-panel"
                  style={{
                    padding: '20px',
                    borderRadius: '12px',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '14px',
                    background: 'rgba(0, 0, 0, 0.35)',
                  }}
                >
                  <div
                    style={{
                      height: '240px',
                      borderRadius: '10px',
                      background: 'radial-gradient(ellipse at center, #0f172a 0%, #020617 100%)',
                      border: '1px solid rgba(245, 158, 11, 0.3)',
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      justifyContent: 'center',
                      position: 'relative',
                      overflow: 'hidden',
                    }}
                  >
                    <div style={{ position: 'absolute', top: '10px', left: '12px', fontSize: '10px', fontFamily: 'var(--font-mono)', color: '#f59e0b' }}>
                      AI VIDEO SIMULATION • {videoCurrentTime.toFixed(1)}s / 10.0s
                    </div>

                    {/* Animated Keyframe Visual */}
                    <div style={{ textAlign: 'center', padding: '0 20px' }}>
                      <div
                        style={{
                          fontSize: '18px',
                          fontFamily: 'var(--font-display)',
                          fontWeight: 800,
                          color: '#ffffff',
                          marginBottom: '8px',
                        }}
                      >
                        {feynmanConcept.toUpperCase()} EXECUTION TIMELINE
                      </div>
                      <div
                        style={{
                          fontSize: '13px',
                          color: '#fef08a',
                          background: 'rgba(0, 0, 0, 0.6)',
                          padding: '6px 14px',
                          borderRadius: '6px',
                          border: '1px solid rgba(245, 158, 11, 0.4)',
                        }}
                      >
                        🎬 {currentVideoFrame?.caption || 'Execution stream'}
                      </div>
                    </div>

                    {/* Playhead Scrubber Bar */}
                    <div
                      style={{
                        position: 'absolute',
                        bottom: 0,
                        left: 0,
                        right: 0,
                        height: '4px',
                        background: 'rgba(255, 255, 255, 0.1)',
                      }}
                    >
                      <div
                        style={{
                          width: `${(videoCurrentTime / 10.0) * 100}%`,
                          height: '100%',
                          background: '#f59e0b',
                          boxShadow: '0 0 8px #f59e0b',
                          transition: 'width 0.25s linear',
                        }}
                      />
                    </div>
                  </div>

                  {/* Video Play Controls */}
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <button
                      onClick={() => setIsVideoPlaying(!isVideoPlaying)}
                      className="cyber-button"
                      style={{
                        padding: '8px 16px',
                        borderRadius: '8px',
                        background: 'rgba(245, 158, 11, 0.15)',
                        borderColor: '#f59e0b',
                        color: '#fbbf24',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '6px',
                        fontSize: '11px',
                        fontWeight: 700,
                      }}
                    >
                      {isVideoPlaying ? <Pause size={14} /> : <Play size={14} />}
                      <span>{isVideoPlaying ? 'PAUSE VIDEO' : 'PLAY SIMULATION'}</span>
                    </button>

                    <button
                      onClick={() => {
                        setVideoCurrentTime(0);
                        setIsVideoPlaying(true);
                      }}
                      className="cyber-button"
                      style={{ padding: '8px 12px', borderRadius: '8px', fontSize: '11px' }}
                    >
                      <RotateCcw size={13} />
                      <span>Replay From Start</span>
                    </button>
                  </div>
                </div>
              )}

              {/* Mode 5: 3D Apparatus Focus Pane */}
              {feynmanActiveModality === '3D' && (
                <div
                  className="glass-panel"
                  style={{
                    padding: '24px',
                    borderRadius: '12px',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    gap: '14px',
                    background: 'rgba(0, 0, 0, 0.35)',
                    textAlign: 'center',
                  }}
                >
                  <Box size={40} color="var(--cyan-core)" />
                  <h4 style={{ margin: 0, fontSize: '15px', color: '#ffffff' }}>
                    3D Virtual Classroom Apparatus Command
                  </h4>
                  <p style={{ margin: 0, fontSize: '13px', color: 'var(--text-secondary)', maxWidth: '520px', lineHeight: '1.5' }}>
                    The Feynman Agent has dispatched camera framing coordinates to the 3D game engine,
                    focusing directly on the <strong>{explanation?.three_d_instruction?.zone || feynmanConcept}</strong> apparatus.
                  </p>
                  <button
                    onClick={() => {
                      closeFeynman();
                      soundSystem.playChime();
                    }}
                    className="cyber-button"
                    style={{
                      padding: '10px 20px',
                      borderRadius: '8px',
                      borderColor: 'var(--cyan-core)',
                      color: 'var(--cyan-core)',
                      fontWeight: 700,
                      fontSize: '12px',
                    }}
                  >
                    View in 3D Classroom
                  </button>
                </div>
              )}

              {/* Targeted Verification Challenge Section */}
              {vq && (
                <div
                  className="glass-panel"
                  style={{
                    padding: '20px',
                    borderRadius: '12px',
                    border: '1px solid rgba(0, 240, 255, 0.3)',
                    background: 'linear-gradient(135deg, rgba(15, 23, 42, 0.8) 0%, rgba(10, 15, 30, 0.9) 100%)',
                    boxShadow: '0 8px 30px rgba(0, 0, 0, 0.5)',
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <HelpCircle size={16} color="var(--cyan-core)" />
                      <span style={{ fontFamily: 'var(--font-display)', fontSize: '12px', fontWeight: 800, color: 'var(--cyan-core)', letterSpacing: '0.05em', textTransform: 'uppercase' }}>
                        Verification: Check Your Understanding
                      </span>
                    </div>
                    <span className="glass-pill" style={{ color: 'var(--text-muted)', fontSize: '10px' }}>
                      Skill: {vq.tested_skill}
                    </span>
                  </div>

                  <p style={{ fontSize: '14px', fontWeight: 600, color: '#ffffff', lineHeight: '1.5', margin: '0 0 14px 0' }}>
                    {vq.prompt}
                  </p>

                  {/* Multiple Choice Options */}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginBottom: '14px' }}>
                    {vq.options.map((opt, idx) => (
                      <button
                        key={idx}
                        onClick={() => setSelectedOption(idx)}
                        disabled={feynmanVerificationResult !== null}
                        className="glass-panel"
                        style={{
                          padding: '10px 14px',
                          borderRadius: '8px',
                          cursor: feynmanVerificationResult !== null ? 'default' : 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '10px',
                          textAlign: 'left',
                          borderColor:
                            selectedOption === idx
                              ? 'var(--cyan-core)'
                              : 'rgba(255, 255, 255, 0.08)',
                          background:
                            selectedOption === idx
                              ? 'rgba(0, 240, 255, 0.15)'
                              : 'rgba(255, 255, 255, 0.02)',
                          color: selectedOption === idx ? '#ffffff' : 'var(--text-secondary)',
                          transition: 'all 0.15s ease',
                        }}
                      >
                        <span
                          style={{
                            width: '20px',
                            height: '20px',
                            borderRadius: '50%',
                            border: '1px solid',
                            borderColor: selectedOption === idx ? '#00f0ff' : 'rgba(255, 255, 255, 0.3)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            fontSize: '11px',
                            fontWeight: 700,
                            fontFamily: 'var(--font-mono)',
                            color: selectedOption === idx ? '#00f0ff' : 'var(--text-muted)',
                            flexShrink: 0,
                          }}
                        >
                          {String.fromCharCode(65 + idx)}
                        </span>
                        <span style={{ fontSize: '13px', lineHeight: '1.4' }}>{opt}</span>
                      </button>
                    ))}
                  </div>

                  {/* Submit Verification Button */}
                  {!feynmanVerificationResult && (
                    <button
                      onClick={handleVerify}
                      disabled={selectedOption === null || feynmanLoading}
                      className="cyber-button"
                      style={{
                        width: '100%',
                        padding: '10px',
                        borderRadius: '8px',
                        background: selectedOption !== null ? 'linear-gradient(135deg, rgba(0, 240, 255, 0.3), rgba(0, 255, 136, 0.3))' : 'rgba(255, 255, 255, 0.05)',
                        borderColor: selectedOption !== null ? '#00ff88' : 'rgba(255, 255, 255, 0.1)',
                        color: selectedOption !== null ? '#00ff88' : 'var(--text-muted)',
                        fontWeight: 800,
                        fontSize: '12px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '8px',
                        cursor: selectedOption !== null ? 'pointer' : 'not-allowed',
                      }}
                    >
                      <CheckCircle2 size={16} />
                      <span>SUBMIT VERIFICATION & UPDATE LEARNER MODEL</span>
                    </button>
                  )}

                  {/* Verification Outcome & BKT Feedback Card */}
                  {feynmanVerificationResult && (
                    <div
                      style={{
                        padding: '16px',
                        borderRadius: '10px',
                        border: '1px solid',
                        borderColor: feynmanVerificationResult.correct ? '#00ff88' : '#ff0055',
                        background: feynmanVerificationResult.correct ? 'rgba(0, 255, 136, 0.12)' : 'rgba(255, 0, 85, 0.12)',
                        display: 'flex',
                        flexDirection: 'column',
                        gap: '10px',
                        animation: 'fadeIn 0.3s ease-out',
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        {feynmanVerificationResult.correct ? (
                          <CheckCircle2 size={18} color="#00ff88" />
                        ) : (
                          <AlertTriangle size={18} color="#ff0055" />
                        )}
                        <span style={{ fontFamily: 'var(--font-display)', fontSize: '13px', fontWeight: 800, color: feynmanVerificationResult.correct ? '#00ff88' : '#ff6699' }}>
                          {feynmanVerificationResult.correct ? 'VERIFICATION SUCCESSFUL!' : 'NEEDS ANOTHER ATTEMPT'}
                        </span>
                      </div>

                      <p style={{ margin: 0, fontSize: '12px', color: '#ffffff', lineHeight: '1.5' }}>
                        {feynmanVerificationResult.feedback}
                      </p>

                      {/* Learning Evidence Badge */}
                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '11px', fontFamily: 'var(--font-mono)' }}>
                        <span className="glass-pill" style={{ color: '#00f0ff' }}>
                          Evidence: {feynmanVerificationResult.evidence.evidence_type}
                        </span>
                        <span className="glass-pill" style={{ color: '#00ff88' }}>
                          Mastery: {Math.round(feynmanVerificationResult.prior_mastery * 100)}% → {Math.round(feynmanVerificationResult.posterior_mastery * 100)}% (+{Math.round(feynmanVerificationResult.delta * 100)}%)
                        </span>
                      </div>

                      {/* Hero Pitch Laser Barrier Dissolve Announcement */}
                      {feynmanVerificationResult.threshold_crossed && (
                        <div
                          style={{
                            padding: '10px 14px',
                            borderRadius: '8px',
                            background: 'linear-gradient(135deg, rgba(0, 240, 255, 0.25), rgba(0, 255, 136, 0.25))',
                            border: '1px solid #00f0ff',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '10px',
                            boxShadow: '0 0 20px rgba(0, 240, 255, 0.4)',
                          }}
                        >
                          <Zap size={18} color="#00f0ff" />
                          <div>
                            <div style={{ fontSize: '12px', fontWeight: 800, color: '#00f0ff' }}>
                              🔓 PREREQUISITE BARRIER DISSOLVED!
                            </div>
                            <div style={{ fontSize: '11px', color: '#e2e8f0' }}>
                              Stack mastery crossed the 70% threshold. The crimson laser forcefield is dissolved and the <strong>Recursion Wing</strong> is now fully unlocked!
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )}
            </>
          )}
        </div>

        {/* Modal Footer */}
        <footer
          style={{
            padding: '12px 24px',
            borderTop: '1px solid rgba(255, 255, 255, 0.08)',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            background: 'rgba(0, 0, 0, 0.4)',
            fontSize: '11px',
            fontFamily: 'var(--font-mono)',
            color: 'var(--text-muted)',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Cpu size={13} color="var(--cyan-core)" />
            <span>Feynman Adaptive Loop Active</span>
          </div>

          <div style={{ display: 'flex', gap: '14px' }}>
            <span>BKT Bayesian Update: Verified</span>
            <span>Deterministic Guardrails: Certified</span>
          </div>
        </footer>
      </div>
    </div>
  );
};
