import React, { useEffect } from 'react';
import {
  X,
  Play,
  ArrowDown,
  ArrowUp,
  AlertTriangle,
  RotateCcw,
  Layers,
  Zap,
  BookOpen,
  Sparkles,
  Brain,
  Activity,
} from 'lucide-react';
import { useClassroomStore } from '../../store/useClassroomStore';

export const RecursionConsole: React.FC = () => {
  const activeStation = useClassroomStore((s) => s.activeStation);
  const setActiveStation = useClassroomStore((s) => s.setActiveStation);
  const openFeynman = useClassroomStore((s) => s.openFeynman);
  const demonstrateFeynmanAgent = useClassroomStore((s) => s.demonstrateFeynmanAgent);

  const recursionFrames = useClassroomStore((s) => s.recursionFrames);
  const recursionMaxDepth = useClassroomStore((s) => s.recursionMaxDepth);
  const recursionIsExecuting = useClassroomStore((s) => s.recursionIsExecuting);
  const recursionIsUnwinding = useClassroomStore((s) => s.recursionIsUnwinding);
  const recursionReturnStep = useClassroomStore((s) => s.recursionReturnStep);
  const recursionStackOverflow = useClassroomStore((s) => s.recursionStackOverflow);
  const recursionOperation = useClassroomStore((s) => s.recursionOperation);

  const pushRecursionCall = useClassroomStore((s) => s.pushRecursionCall);
  const popRecursionCall = useClassroomStore((s) => s.popRecursionCall);
  const triggerRecursionReturn = useClassroomStore((s) => s.triggerRecursionReturn);
  const triggerStackOverflowError = useClassroomStore((s) => s.triggerStackOverflowError);
  const resetRecursionChamber = useClassroomStore((s) => s.resetRecursionChamber);
  const runRecursiveFactorialDemo = useClassroomStore((s) => s.runRecursiveFactorialDemo);

  const latestDeliberation = useClassroomStore((s) => s.latestDeliberation);
  const openTelemetry = useClassroomStore((s) => s.openTelemetry);
  const diagnosticResult = useClassroomStore((s) => s.diagnosticResult);

  const delib = diagnosticResult?.deliberation || latestDeliberation;
  const assignedMission = delib?.world_instructions?.active_mission;
  const decision = delib?.final_decision;
  const isRecursionAssigned =
    delib?.world_instructions?.recommended_station === 'recursion_lab' ||
    delib?.final_decision?.concept === 'recursion';

  // Keyboard shortcut listener: [ESC] to exit
  useEffect(() => {
    if (activeStation !== 'recursion_lab') return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (['INPUT', 'TEXTAREA'].includes((e.target as HTMLElement)?.tagName)) return;

      if (e.key === 'Escape') {
        e.preventDefault();
        setActiveStation(null);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [activeStation, setActiveStation]);

  if (activeStation !== 'recursion_lab') return null;

  const depthRatio = Math.min(1, recursionFrames.length / recursionMaxDepth);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-in fade-in duration-200">
      <div className="relative w-full max-w-5xl max-h-[90vh] flex flex-col rounded-2xl border border-purple-500/30 bg-slate-900/95 shadow-2xl shadow-purple-950/50 overflow-hidden text-slate-100 font-sans">
        {/* Top Header Bar */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-purple-500/20 bg-gradient-to-r from-purple-950/40 via-slate-900/60 to-cyan-950/40">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-purple-500/10 border border-purple-400/30 text-purple-400 shadow-inner">
              <Layers className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg font-bold tracking-wide text-transparent bg-clip-text bg-gradient-to-r from-purple-300 via-pink-200 to-cyan-300">
                  RECURSION CALL-STACK ELEVATOR
                </h2>
                <span className="px-2 py-0.5 text-xs font-semibold rounded-full bg-purple-500/20 border border-purple-400/30 text-purple-300">
                  LIFO EXECUTION
                </span>
                {recursionStackOverflow && (
                  <span className="px-2 py-0.5 text-xs font-bold rounded-full bg-red-500/20 border border-red-500/40 text-red-400 animate-pulse">
                    ⚠️ STACK OVERFLOW
                  </span>
                )}
                {recursionIsUnwinding && (
                  <span className="px-2 py-0.5 text-xs font-bold rounded-full bg-emerald-500/20 border border-emerald-500/40 text-emerald-300 animate-pulse">
                    ⚡ UNWINDING (STEP {recursionReturnStep})
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-400">
                Visualizing nested invocations f(n) → f(n-1), Base Case resolution, and Call Stack return unwinding
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button
              id="btn-recursion-telemetry"
              onClick={() => openTelemetry('agents')}
              className="px-3 py-1.5 rounded-lg bg-purple-500/20 hover:bg-purple-500/30 border border-purple-500/40 text-purple-200 text-xs font-semibold flex items-center gap-1.5 transition-colors"
              title="Inspect 5-Agent Deliberation in Telemetry Drawer"
            >
              <Activity className="w-3.5 h-3.5 text-purple-400" />
              <span>Telemetry</span>
            </button>
            <button
              id="btn-recursion-demonstrate-feynman"
              onClick={() => demonstrateFeynmanAgent('recursion')}
              title="Demonstrate Feynman Multimodal Adaptive Explanation Agent for Recursion"
              className="px-3 py-1.5 rounded-lg bg-gradient-to-r from-purple-500/30 to-cyan-500/20 hover:from-purple-500/40 hover:to-cyan-500/30 border border-purple-400/50 text-purple-100 text-xs font-bold flex items-center gap-1.5 transition-all shadow-sm shadow-purple-500/30"
            >
              <Sparkles className="w-3.5 h-3.5 text-cyan-300" />
              <span>Demonstrate Feynman Agent</span>
            </button>
            <button
              onClick={() => resetRecursionChamber()}
              title="Reset Elevator State"
              className="p-2 rounded-lg bg-slate-800/80 hover:bg-slate-700 border border-slate-700 text-slate-300 transition-colors"
            >
              <RotateCcw className="w-4 h-4" />
            </button>
            <button
              onClick={() => setActiveStation(null)}
              className="p-2 rounded-lg bg-slate-800/80 hover:bg-rose-500/20 border border-slate-700 hover:border-rose-500/40 text-slate-400 hover:text-rose-300 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Content Body Grid */}
        <div className="flex-1 overflow-y-auto p-6 flex flex-col gap-6">
          {/* LangGraph Mission Banner if Assigned */}
          {isRecursionAssigned && (
            <div
              id="recursion-langgraph-mission-card"
              className="p-4 rounded-xl bg-gradient-to-r from-purple-950/50 via-slate-900/80 to-purple-900/40 border border-purple-500/30 shadow-lg"
            >
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold font-mono uppercase bg-purple-500/20 text-purple-200 border border-purple-400/30">
                    <Brain className="w-3 h-3 text-purple-400" />
                    LangGraph Assigned Mission
                  </span>
                  <span className="px-2 py-0.5 rounded text-[10px] font-bold font-mono uppercase bg-cyan-500/20 text-cyan-300 border border-cyan-400/30">
                    {decision?.action || 'ADVANCE'} ({decision?.difficulty || 'medium'})
                  </span>
                </div>
                <button
                  onClick={() => openTelemetry('agents')}
                  className="px-2.5 py-1 text-xs rounded bg-purple-500/20 border border-purple-400/30 text-purple-200 hover:bg-purple-500/30 transition-all flex items-center gap-1"
                >
                  <Activity className="w-3 h-3 text-purple-400" />
                  <span>Inspect Traces</span>
                </button>
              </div>
              <div className="text-sm font-bold text-slate-100 mb-1">
                {assignedMission?.title || 'Operation Call-Frame: Dynamic Activation Records'}
              </div>
              <p className="text-xs text-slate-300">
                <strong>Objective: </strong>
                {assignedMission?.objective || 'Track nested activation records and observe stack frame allocation.'}
              </p>
            </div>
          )}

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Left Column: Call Stack Elevator Visualizer & Code (7 cols) */}
          <div className="lg:col-span-7 flex flex-col gap-5">
            {/* Stack Depth Meter */}
            <div className="p-4 rounded-xl bg-slate-950/60 border border-slate-800 flex flex-col gap-2">
              <div className="flex items-center justify-between text-xs">
                <span className="text-slate-400 font-medium">CALL STACK DEPTH</span>
                <span
                  className={`font-mono font-bold ${
                    recursionStackOverflow
                      ? 'text-red-400'
                      : depthRatio >= 0.8
                      ? 'text-amber-400'
                      : 'text-purple-300'
                  }`}
                >
                  {recursionFrames.length} / {recursionMaxDepth} Frames
                </span>
              </div>
              <div className="w-full h-2.5 rounded-full bg-slate-800 overflow-hidden relative">
                <div
                  className={`h-full transition-all duration-300 rounded-full ${
                    recursionStackOverflow
                      ? 'bg-red-500 shadow-[0_0_12px_#ef4444]'
                      : depthRatio >= 0.8
                      ? 'bg-amber-400 shadow-[0_0_8px_#f59e0b]'
                      : 'bg-gradient-to-r from-purple-500 to-cyan-400 shadow-[0_0_8px_#00f0ff]'
                  }`}
                  style={{ width: `${depthRatio * 100}%` }}
                />
              </div>
            </div>

            {/* Stack Overflow Warning Alert */}
            {recursionStackOverflow && (
              <div className="p-4 rounded-xl bg-red-950/50 border border-red-500/50 flex items-start gap-3 text-red-200 animate-in slide-in-from-top-2">
                <AlertTriangle className="w-5 h-5 text-red-400 shrink-0 mt-0.5" />
                <div className="text-xs space-y-1">
                  <div className="font-bold text-red-300">StackOverflowException: Call Stack Exceeded!</div>
                  <div className="text-red-200/90">
                    Recursion continued without reaching a valid Base Case. In production systems, runaway recursive invocations exhaust available memory stack space, terminating the program.
                  </div>
                </div>
              </div>
            )}

            {/* Ambient Intervention Banner When Stack Overflow Occurs */}
            {recursionStackOverflow && (
              <div
                id="feynman-ambient-intervention-banner-recursion"
                className="p-3 rounded-xl bg-purple-950/40 border border-purple-500/50 flex flex-col gap-2 animate-in slide-in-from-top-2"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-xs font-bold text-purple-200">
                    <Sparkles className="w-4 h-4 text-purple-400" />
                    <span>⚡ AMBIENT INTERVENTION: FEYNMAN AGENT READY</span>
                  </div>
                  <span className="text-[10px] text-cyan-400 font-mono">5 MODALITIES</span>
                </div>
                <p className="text-xs text-slate-300">
                  You triggered a StackOverflowException! The Feynman Agent can break down how base cases prevent endless call-stack frames using visual diagrams and physical analogies.
                </p>
                <div className="flex justify-end">
                  <button
                    id="btn-feynman-ambient-help-recursion"
                    onClick={() => {
                      const query = 'Why did my recursion cause a Stack Overflow? How does a base case stop it?';
                      openFeynman('recursion', 'recursion_lab', query);
                      useClassroomStore.getState().requestFeynmanExplanation(query, 'TEXT', 'VISUAL');
                    }}
                    className="cyber-button text-xs px-3 py-1.5 rounded-lg border-purple-500 text-purple-200 bg-purple-900/30 flex items-center gap-1.5"
                  >
                    <Brain className="w-3.5 h-3.5 text-purple-400" />
                    <span>Ask Feynman For Help</span>
                  </button>
                </div>
              </div>
            )}

            {/* Active Stack Frames List (LIFO Order) */}
            <div className="flex flex-col gap-2 p-4 rounded-xl bg-slate-950/60 border border-slate-800">
              <div className="flex items-center justify-between text-xs font-semibold text-slate-400 pb-1">
                <span>ACTIVE STACK FRAMES (TOP ↓ BOTTOM)</span>
                <span className="text-[11px] text-slate-500">LIFO ORDER</span>
              </div>

              <div className="flex flex-col gap-2 min-h-[160px] max-h-[260px] overflow-y-auto pr-1">
                {recursionFrames.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-8 text-slate-500 text-xs gap-1">
                    <span>Call stack is currently empty.</span>
                    <span className="text-slate-600">Click &quot;Step Push&quot; or &quot;Auto-Run Demo&quot; to invoke.</span>
                  </div>
                ) : (
                  recursionFrames.map((frame, index) => {
                    const isTop = index === 0;
                    const isBase = frame.status === 'base_case' || frame.n === 1;
                    const isResolved = frame.status === 'resolved';

                    return (
                      <div
                        key={frame.id}
                        className={`p-3 rounded-lg border transition-all flex items-center justify-between ${
                          isResolved
                            ? 'bg-emerald-950/40 border-emerald-500/40 text-emerald-100 shadow-[0_0_10px_rgba(16,185,129,0.15)]'
                            : isBase
                            ? 'bg-amber-950/40 border-amber-500/40 text-amber-100'
                            : 'bg-slate-900/80 border-slate-700 text-slate-200'
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <div
                            className={`w-7 h-7 rounded-md flex items-center justify-center font-mono font-bold text-xs ${
                              isResolved
                                ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-400/40'
                                : isBase
                                ? 'bg-amber-500/20 text-amber-300 border border-amber-400/40'
                                : 'bg-cyan-500/20 text-cyan-300 border border-cyan-400/40'
                            }`}
                          >
                            {frame.n}
                          </div>
                          <div>
                            <div className="font-mono font-bold text-sm tracking-wide flex items-center gap-2">
                              <span>{frame.callLabel}</span>
                              {isTop && (
                                <span className="text-[10px] font-sans px-1.5 py-0.2 rounded bg-purple-500/30 text-purple-300 border border-purple-400/40">
                                  TOP OF STACK
                                </span>
                              )}
                            </div>
                            <div className="text-[11px] text-slate-400 font-mono">
                              arg: n = {frame.argValue}
                            </div>
                          </div>
                        </div>

                        <div className="text-right font-mono text-xs">
                          {isResolved ? (
                            <span className="font-bold text-emerald-400">
                              return {frame.returnValue}
                            </span>
                          ) : isBase ? (
                            <span className="text-amber-400 font-semibold">
                              Base Case (n=1)
                            </span>
                          ) : (
                            <span className="text-slate-400">
                              waiting for return...
                            </span>
                          )}
                        </div>
                      </div>
                    );
                  })
                )}
              </div>

              {/* Base Case Anchor Foundation */}
              <div className="mt-1 p-2.5 rounded-lg bg-amber-950/20 border border-amber-500/30 flex items-center justify-between text-xs text-amber-200/90 font-mono">
                <div className="flex items-center gap-2">
                  <Zap className="w-3.5 h-3.5 text-amber-400" />
                  <span className="font-bold">BASE CASE PLATFORM:</span>
                  <span>if (n &lt;= 1) return 1;</span>
                </div>
                <span className="text-[11px] text-amber-400 font-sans">TERMINATION ANCHOR</span>
              </div>
            </div>

            {/* Factorial Algorithm Code Walkthrough */}
            <div className="p-4 rounded-xl bg-slate-950/70 border border-slate-800 flex flex-col gap-2">
              <div className="flex items-center justify-between text-xs font-semibold text-slate-400">
                <div className="flex items-center gap-2">
                  <BookOpen className="w-3.5 h-3.5 text-purple-400" />
                  <span>ALGORITHM: FACTORIAL CALL TRACE</span>
                </div>
                <span className="font-mono text-[11px] text-cyan-400">O(n) Time • O(n) Space</span>
              </div>
              <pre className="p-3 rounded-lg bg-slate-900/90 border border-slate-800 text-xs font-mono text-slate-300 overflow-x-auto leading-relaxed">
{`function factorial(n: number): number {
  // 1. BASE CASE: Stops stack allocation
  if (n <= 1) {
    return 1;
  }
  // 2. RECURSIVE STEP: Pushes new frame f(n-1) to Call Stack
  return n * factorial(n - 1);
}`}
              </pre>
            </div>
          </div>

          {/* Right Column: Interactive Controls & Education (5 cols) */}
          <div className="lg:col-span-5 flex flex-col gap-5">
            {/* Interactive Control Deck */}
            <div className="p-4 rounded-xl bg-slate-950/60 border border-slate-800 flex flex-col gap-3">
              <span className="text-xs font-semibold text-slate-400 tracking-wide">
                ELEVATOR CONTROLS
              </span>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                <button
                  onClick={() => pushRecursionCall()}
                  disabled={recursionIsExecuting || recursionIsUnwinding}
                  className="px-3 py-2.5 rounded-lg bg-purple-600/20 hover:bg-purple-600/30 border border-purple-500/40 text-purple-200 font-medium text-xs flex items-center justify-center gap-2 transition-colors disabled:opacity-50"
                >
                  <ArrowDown className="w-4 h-4 text-purple-400" />
                  <span>Step Push f(n-1)</span>
                </button>

                <button
                  onClick={() => popRecursionCall()}
                  disabled={recursionIsExecuting || recursionIsUnwinding || recursionFrames.length === 0}
                  className="px-3 py-2.5 rounded-lg bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-300 font-medium text-xs flex items-center justify-center gap-2 transition-colors disabled:opacity-50"
                >
                  <ArrowUp className="w-4 h-4 text-slate-400" />
                  <span>Pop Top Frame</span>
                </button>
              </div>

              <button
                onClick={() => triggerRecursionReturn()}
                disabled={recursionIsExecuting || recursionIsUnwinding || recursionFrames.length === 0}
                className="w-full px-4 py-3 rounded-xl bg-gradient-to-r from-emerald-600/30 to-cyan-600/30 hover:from-emerald-600/40 hover:to-cyan-600/40 border border-emerald-500/40 text-emerald-200 font-bold text-xs flex items-center justify-center gap-2 transition-all shadow-lg shadow-emerald-950/30 disabled:opacity-50"
              >
                <Sparkles className="w-4 h-4 text-emerald-400" />
                <span>Trigger Base-Case Unwind & Cascade</span>
              </button>

              <button
                onClick={() => runRecursiveFactorialDemo(3)}
                disabled={recursionIsExecuting || recursionIsUnwinding}
                className="w-full px-4 py-2.5 rounded-lg bg-cyan-600/20 hover:bg-cyan-600/30 border border-cyan-500/40 text-cyan-200 font-semibold text-xs flex items-center justify-center gap-2 transition-colors disabled:opacity-50"
              >
                <Play className="w-4 h-4 text-cyan-400" />
                <span>Auto-Run Factorial Demo f(3)</span>
              </button>

              <button
                onClick={() => triggerStackOverflowError()}
                disabled={recursionIsExecuting || recursionIsUnwinding}
                className="w-full px-4 py-2 rounded-lg bg-rose-950/40 hover:bg-rose-950/60 border border-rose-500/30 text-rose-300 text-xs flex items-center justify-center gap-2 transition-colors"
              >
                <AlertTriangle className="w-3.5 h-3.5 text-rose-400" />
                <span>Simulate Stack Overflow Test</span>
              </button>
            </div>

            {/* Educational Prerequisite Card: Stack -> Recursion */}
            <div className="p-4 rounded-xl bg-gradient-to-br from-purple-950/40 to-slate-950 border border-purple-500/20 flex flex-col gap-2 text-xs">
              <div className="font-bold text-purple-300 flex items-center gap-2">
                <span>WHY STACK IS A PREREQUISITE</span>
              </div>
              <p className="text-slate-400 leading-relaxed">
                Recursive functions do not run in isolation. Every time a function calls itself, the computer suspends current execution and pushes a new <strong className="text-slate-200">Stack Frame</strong> onto the memory Call Stack.
              </p>
              <p className="text-slate-400 leading-relaxed">
                When the <strong className="text-amber-300">Base Case</strong> terminates the loop, return values unwind in <strong className="text-purple-300">LIFO order (Last In, First Out)</strong>—directly mirroring the mechanics you mastered in the Stack Lab!
              </p>
            </div>

            {/* Live Telemetry Operation Log */}
            {recursionOperation && (
              <div className="p-4 rounded-xl bg-slate-950/60 border border-slate-800 flex flex-col gap-1.5 text-xs">
                <span className="font-semibold text-slate-400 text-[11px] tracking-wide">
                  RECENT OPERATION TELEMETRY
                </span>
                <div className="font-mono font-bold text-purple-300">
                  {recursionOperation.title}
                </div>
                <div className="text-slate-400 text-[11px] leading-relaxed">
                  {recursionOperation.description}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  </div>
  );
};
