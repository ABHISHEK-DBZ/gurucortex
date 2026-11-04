'use client';

import React, { useState, useEffect, useRef } from 'react';
import { 
  Play, Pause, RotateCcw, Maximize2, Minimize2, 
  Sparkles, CheckCircle2, AlertCircle, Layers, Lightbulb, 
  HelpCircle, ArrowRight, Compass, Info
} from 'lucide-react';
import api from '@/lib/api-client';

interface VisualIntelligenceStudioProps {
  initialConceptTitle?: string;
  onNavigateToReality?: (topic: string) => void;
}

export default function VisualIntelligenceStudio({ 
  initialConceptTitle = "PN Junction Diode Operation",
  onNavigateToReality
}: VisualIntelligenceStudioProps) {
  const [activeConceptTitle, setActiveConceptTitle] = useState(initialConceptTitle);
  const [data, setData] = useState<any>(null);

  // Animation Controls
  const [currentStep, setCurrentStep] = useState(0);
  const [isPlaying, setIsPlaying] = useState(true);
  const [playbackSpeed, setPlaybackSpeed] = useState(1);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [selectedElement, setSelectedElement] = useState<any>(null);

  // Multi-Level Explanation Tab
  const [explanationLevel, setExplanationLevel] = useState<
    'beginner' | 'intermediate' | 'advanced' | 'eli12' | 'exam_oriented' | 'practical_application' | 'common_misconceptions'
  >('intermediate');

  // Knowledge Check
  const [selectedOption, setSelectedOption] = useState<string | null>(null);
  const [hasAnswered, setHasAnswered] = useState(false);

  const containerRef = useRef<HTMLDivElement>(null);

  // Load or generate visual explanation
  useEffect(() => {
    loadVisualData(activeConceptTitle);
  }, [activeConceptTitle]);

  const loadVisualData = async (title: string) => {
    setSelectedOption(null);
    setHasAnswered(false);
    setSelectedElement(null);
    setCurrentStep(0);
    try {
      const res = await api.getVisualExplanationByTitle(title);
      setData(res);
    } catch (err) {
      console.error("Failed to load visual explanation:", err);
    }
  };

  // Playback timer
  useEffect(() => {
    let interval: any;
    if (isPlaying && data?.scene_spec?.steps) {
      const stepDuration = 5000 / playbackSpeed;
      interval = setInterval(() => {
        setCurrentStep((prev) => (prev + 1) % data.scene_spec.steps.length);
      }, stepDuration);
    }
    return () => clearInterval(interval);
  }, [isPlaying, playbackSpeed, data]);

  const step = data?.scene_spec?.steps?.[currentStep] || data?.scene_spec?.steps?.[0];

  return (
    <div className="space-y-6">
      {/* Header & Concept Quick Selector */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-[#141414] border border-white/10 rounded-2xl p-5 shadow-lg">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-xs uppercase font-bold text-[#22C55E] tracking-wider px-2 py-0.5 rounded-full bg-[#22C55E]/10 border border-[#22C55E]/20 flex items-center gap-1.5">
              <Sparkles size={12} className="animate-spin" /> VISUAL INTELLIGENCE STUDIO
            </span>
            <span className="text-xs text-slate-400">Interactive Simulation Engine</span>
          </div>
          <h2 className="text-2xl font-bold text-white tracking-tight flex items-center gap-2">
            {activeConceptTitle}
          </h2>
          <p className="text-xs text-slate-400 mt-1 max-w-2xl">
            {data?.learning_objective || "Step-by-step interactive animated physics & circuit model."}
          </p>
        </div>

        {/* Quick Topics */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1 md:pb-0">
          {[
            "PN Junction Diode Operation",
            "Bipolar Junction Transistor",
            "Quantum Tunneling Effect",
            "Fourier Series Decomposition"
          ].map((topic) => (
            <button
              key={topic}
              onClick={() => setActiveConceptTitle(topic)}
              className={`text-xs px-3 py-1.5 rounded-lg whitespace-nowrap transition-all border ${
                activeConceptTitle === topic
                  ? "bg-[#22C55E] text-black font-semibold border-[#22C55E]"
                  : "bg-white/5 text-slate-300 border-white/10 hover:bg-white/10 hover:text-white"
              }`}
            >
              {topic}
            </button>
          ))}
        </div>
      </div>

      {/* Main Simulation Viewport & Controls */}
      <div 
        ref={containerRef}
        className={`bg-[#0D0D0D] border border-white/10 rounded-2xl overflow-hidden shadow-2xl transition-all ${
          isFullscreen ? "fixed inset-0 z-50 rounded-none p-6 flex flex-col justify-between" : ""
        }`}
      >
        {/* Viewport Top Bar */}
        <div className="flex items-center justify-between px-5 py-3 border-b border-white/10 bg-[#141414]/80 backdrop-blur-md">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
            <span className="text-xs font-semibold text-white tracking-wide">
              {step?.title || "Simulation Stage"}
            </span>
          </div>

          <div className="flex items-center gap-3">
            {data?.scene_spec?.steps?.length ? (
              <span className="text-xs font-medium text-slate-400">
                Stage {currentStep + 1} of {data.scene_spec.steps.length}
              </span>
            ) : null}
            <button 
              onClick={() => setIsFullscreen(!isFullscreen)}
              className="text-slate-400 hover:text-white transition-colors"
              title="Toggle Fullscreen"
            >
              {isFullscreen ? <Minimize2 size={16} /> : <Maximize2 size={16} />}
            </button>
          </div>
        </div>

        {/* Interactive SVG / Canvas Simulation Stage */}
        <div className="relative w-full h-[360px] md:h-[440px] bg-gradient-to-b from-[#0D0D0D] to-[#121212] flex items-center justify-center p-4 overflow-hidden select-none">
          {/* Background Grid Lines */}
          <div 
            className="absolute inset-0 opacity-15 pointer-events-none"
            style={{
              backgroundImage: "radial-gradient(#3B82F6 1px, transparent 1px), radial-gradient(#22C55E 1px, transparent 1px)",
              backgroundSize: "32px 32px",
              backgroundPosition: "0 0, 16px 16px"
            }}
          />

          {/* SVG Animated Circuit / Field Scene */}
          <svg 
            viewBox="0 0 800 480" 
            className="w-full h-full max-h-[420px]"
          >
            <defs>
              <filter id="glow" x="-20%" y="-20%" width="140%" height="140%">
                <feGaussianBlur stdDeviation="6" result="blur" />
                <feComposite in="SourceGraphic" in2="blur" operator="over" />
              </filter>
              <marker id="sceneArrow" markerWidth="10" markerHeight="10" refX="9" refY="3" orient="auto" markerUnits="strokeWidth">
                <path d="M0,0 L0,6 L9,3 z" fill="#22C55E" />
              </marker>
            </defs>

            {/* Scene elements generated by the backend for this concept */}
            {step?.elements?.map((el: any) => (
              el.type === "arrow" ? (
                <g
                  key={el.id}
                  onClick={() => setSelectedElement({ name: el.label, detail: el.subtext || el.label })}
                  className="cursor-pointer"
                >
                  <line
                    x1={el.x - 70} y1={el.y} x2={el.x + 70} y2={el.y}
                    stroke={el.color || "#22C55E"} strokeWidth="4" markerEnd="url(#sceneArrow)"
                  />
                  <text x={el.x} y={el.y - 12} fill={el.color || "#22C55E"} fontSize="12" fontWeight="bold" textAnchor="middle">
                    {el.label}
                  </text>
                </g>
              ) : (
                <g
                  key={el.id}
                  onClick={() => setSelectedElement({ name: el.label, detail: el.subtext || el.label })}
                  className="cursor-pointer transition-transform hover:scale-[1.01]"
                >
                  <rect
                    x={el.x} y={el.y}
                    width={el.width || 180} height={el.height || 120} rx="12"
                    fill={el.color || "#3B82F6"} opacity={el.highlight ? "1" : "0.85"}
                    stroke="#FFFFFF" strokeOpacity="0.5" strokeWidth="2" filter="url(#glow)"
                  />
                  <text x={el.x + (el.width || 180) / 2} y={el.y + 32} fill="#FFFFFF" fontSize="15" fontWeight="bold" textAnchor="middle">
                    {el.label}
                  </text>
                  {el.subtext && (
                    <text x={el.x + (el.width || 180) / 2} y={el.y + 54} fill="#FFFFFF" fillOpacity="0.8" fontSize="11" textAnchor="middle">
                      {el.subtext}
                    </text>
                  )}
                </g>
              )
            ))}

            {/* Animated particles for the active step */}
            {step?.active_particles && (
              <g opacity="0.9">
                {Array.from({ length: 6 }).map((_, i) => (
                  <circle
                    key={i} cx={200 + i * 80} cy={340} r="6"
                    fill={step.particle_type === "photons" ? "#FDE047" : step.particle_type === "molecules" ? "#A78BFA" : "#22C55E"}
                  >
                    <animate attributeName="cx" values={`${200 + i * 80};${260 + i * 80};${200 + i * 80}`} dur={`${1.5 + i * 0.2}s`} repeatCount="indefinite" />
                  </circle>
                ))}
              </g>
            )}
          </svg>

          {/* Interactive Inspection Tooltip / Drawer */}
          {selectedElement && (
            <div className="absolute bottom-4 right-4 bg-[#18181B]/95 backdrop-blur-md border border-[#3B82F6]/40 p-4 rounded-xl max-w-xs shadow-2xl animate-fade-in">
              <div className="flex items-center justify-between mb-1">
                <span className="text-xs font-bold text-[#60A5FA] flex items-center gap-1.5">
                  <Info size={14} /> {selectedElement.name}
                </span>
                <button 
                  onClick={() => setSelectedElement(null)} 
                  className="text-slate-400 hover:text-white text-xs"
                >
                  ✕
                </button>
              </div>
              <p className="text-xs text-slate-300 leading-relaxed">
                {selectedElement.detail}
              </p>
            </div>
          )}
        </div>

        {/* Dynamic Caption & Narration Bar */}
        <div className="bg-[#141414] px-6 py-4 border-t border-white/10 flex flex-col md:flex-row items-start md:items-center justify-between gap-3">
          <div className="space-y-1 max-w-3xl">
            <div className="text-xs font-semibold text-[#22C55E] tracking-wider uppercase flex items-center gap-1.5">
              <span>● STEP {currentStep + 1} NARRATION</span>
            </div>
            <p className="text-sm text-slate-200 leading-relaxed font-normal">
              {step?.narration}
            </p>
            <p className="text-xs text-slate-400 italic">
              💡 {step?.interactive_hint}
            </p>
          </div>

          {/* Connect to Reality Button */}
          <button
            onClick={() => onNavigateToReality ? onNavigateToReality(activeConceptTitle) : null}
            className="shrink-0 px-4 py-2 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-semibold text-xs rounded-xl shadow-md transition-all flex items-center gap-2"
          >
            <Compass size={15} /> Real-World Reality Navigator <ArrowRight size={13} />
          </button>
        </div>

        {/* Playback Controls & Timeline Scrubber */}
        <div className="bg-[#18181B] px-6 py-3 border-t border-white/10 flex flex-wrap items-center justify-between gap-4">
          {/* Step Timeline Buttons */}
          <div className="flex items-center gap-2">
            {data?.scene_spec?.steps?.map((_: any, idx: number) => (
              <button
                key={idx}
                onClick={() => {
                  setCurrentStep(idx);
                  setIsPlaying(false);
                }}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                  currentStep === idx
                    ? "bg-[#22C55E] text-black shadow-md"
                    : "bg-white/5 text-slate-400 hover:bg-white/10 hover:text-white"
                }`}
              >
                Step {idx + 1}
              </button>
            ))}
          </div>

          {/* Player Action Buttons */}
          <div className="flex items-center gap-2">
            <button
              onClick={() => {
                setCurrentStep(0);
                setIsPlaying(true);
              }}
              className="p-2 rounded-lg bg-white/5 text-slate-300 hover:bg-white/10 hover:text-white transition-colors"
              title="Replay from start"
            >
              <RotateCcw size={16} />
            </button>

            <button
              onClick={() => setIsPlaying(!isPlaying)}
              className="px-4 py-2 rounded-xl bg-white text-black font-bold text-xs hover:bg-slate-200 transition-colors flex items-center gap-1.5 shadow"
            >
              {isPlaying ? <Pause size={15} /> : <Play size={15} />}
              <span>{isPlaying ? "Pause" : "Play"}</span>
            </button>

            {/* Playback Speed Toggle */}
            <div className="flex items-center bg-white/5 rounded-lg border border-white/10 p-0.5 text-xs">
              {[0.5, 1, 1.5, 2].map((sp) => (
                <button
                  key={sp}
                  onClick={() => setPlaybackSpeed(sp)}
                  className={`px-2 py-1 rounded-md transition-all ${
                    playbackSpeed === sp
                      ? "bg-white/20 text-white font-bold"
                      : "text-slate-400 hover:text-white"
                  }`}
                >
                  {sp}x
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Interactive Labels & Characteristic Parameters */}
      {data?.scene_spec?.interactive_labels && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {data.scene_spec.interactive_labels.map((lbl: any, i: number) => (
            <div key={i} className="bg-[#141414] border border-white/10 rounded-xl p-3 shadow-sm">
              <span className="text-[11px] font-medium text-slate-400 block">{lbl.key}</span>
              <span className="text-sm font-bold text-white mt-0.5 block">{lbl.value}</span>
            </div>
          ))}
        </div>
      )}

      {/* Multiple Explanation Levels (7-Level Mastery) */}
      <div className="bg-[#141414] border border-white/10 rounded-2xl p-6 shadow-xl space-y-4">
        <div className="flex items-center justify-between flex-wrap gap-2">
          <div className="flex items-center gap-2">
            <Layers className="text-[#3B82F6]" size={18} />
            <h3 className="font-bold text-base text-white">Multi-Level Conceptual Explanations</h3>
          </div>
          <span className="text-xs text-slate-400">Switch explanation perspective according to your study needs</span>
        </div>

        {/* Level Tabs */}
        <div className="flex flex-wrap gap-1.5 border-b border-white/10 pb-3">
          {[
            { id: "beginner", label: "Beginner", icon: "🌱" },
            { id: "intermediate", label: "Intermediate", icon: "📘" },
            { id: "advanced", label: "Advanced", icon: "🔬" },
            { id: "eli12", label: "ELI12", icon: "🧒" },
            { id: "exam_oriented", label: "Exam-Oriented", icon: "🎯" },
            { id: "practical_application", label: "Practical Use", icon: "⚡" },
            { id: "common_misconceptions", label: "Misconceptions", icon: "⚠️" }
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setExplanationLevel(tab.id as any)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all flex items-center gap-1.5 ${
                explanationLevel === tab.id
                  ? "bg-[#3B82F6] text-white shadow-md font-bold"
                  : "bg-white/5 text-slate-400 hover:bg-white/10 hover:text-white"
              }`}
            >
              <span>{tab.icon}</span>
              <span>{tab.label}</span>
            </button>
          ))}
        </div>

        {/* Explanation Content Box */}
        <div className="bg-[#0D0D0D] border border-white/5 rounded-xl p-5 text-sm text-slate-200 leading-relaxed">
          <p className="whitespace-pre-line font-normal">
            {data?.multi_level_explanations?.[explanationLevel] || "Select an explanation level above."}
          </p>
        </div>

        {/* Real-World Analogy Banner */}
        {data?.real_world_analogy && (
          <div className="bg-amber-500/10 border border-amber-500/20 rounded-xl p-4 flex items-start gap-3">
            <Lightbulb className="text-amber-400 shrink-0 mt-0.5" size={18} />
            <div>
              <span className="text-xs font-bold text-amber-400 uppercase tracking-wide block">Real-World Analogy</span>
              <p className="text-xs text-amber-200/90 mt-0.5 leading-relaxed">
                {data.real_world_analogy}
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Quick Knowledge Check */}
      {data?.knowledge_check && (
        <div className="bg-[#141414] border border-white/10 rounded-2xl p-6 shadow-xl space-y-4">
          <div className="flex items-center gap-2">
            <HelpCircle className="text-[#22C55E]" size={18} />
            <h3 className="font-bold text-base text-white">Interactive Knowledge Check</h3>
          </div>

          <p className="text-sm font-medium text-slate-200">
            {data.knowledge_check.question}
          </p>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-2">
            {data.knowledge_check.options.map((opt: string, i: number) => {
              const isSelected = selectedOption === opt;
              const isCorrect = opt === data.knowledge_check.correct_answer;
              let btnStyle = "bg-white/5 border-white/10 text-slate-300 hover:bg-white/10 hover:border-white/20";

              if (hasAnswered) {
                if (isCorrect) {
                  btnStyle = "bg-emerald-500/20 border-emerald-500 text-emerald-300 font-semibold";
                } else if (isSelected) {
                  btnStyle = "bg-rose-500/20 border-rose-500 text-rose-300";
                }
              } else if (isSelected) {
                btnStyle = "bg-white/20 border-white/30 text-white font-semibold";
              }

              return (
                <button
                  key={i}
                  disabled={hasAnswered}
                  onClick={() => {
                    setSelectedOption(opt);
                    setHasAnswered(true);
                  }}
                  className={`text-left p-3.5 rounded-xl border text-xs leading-relaxed transition-all flex items-center justify-between ${btnStyle}`}
                >
                  <span>{opt}</span>
                  {hasAnswered && isCorrect && <CheckCircle2 size={16} className="text-emerald-400 shrink-0" />}
                  {hasAnswered && isSelected && !isCorrect && <AlertCircle size={16} className="text-rose-400 shrink-0" />}
                </button>
              );
            })}
          </div>

          {hasAnswered && (
            <div className="bg-[#0D0D0D] border border-white/10 rounded-xl p-4 text-xs text-slate-300 animate-fade-in flex items-start gap-2">
              <span className="text-emerald-400 font-bold shrink-0">Explanation:</span>
              <span>{data.knowledge_check.explanation}</span>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
