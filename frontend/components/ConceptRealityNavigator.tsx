'use client';

import React, { useState, useEffect, useRef } from 'react';
import { 
  Globe, Building2, Cpu, Wrench, CheckCircle, 
  AlertTriangle, Lightbulb, Compass, Search, 
  Bookmark, Sparkles
} from 'lucide-react';
import api from '@/lib/api-client';

interface ConceptRealityNavigatorProps {
  initialTopic?: string;
  onOpenVisualStudio?: (topic: string) => void;
}

export default function ConceptRealityNavigator({ 
  initialTopic = "PN Junction Diode Operation",
  onOpenVisualStudio 
}: ConceptRealityNavigatorProps) {
  const [topic, setTopic] = useState(initialTopic);
  const [searchQuery, setSearchQuery] = useState(initialTopic);
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState<any>(null);
  const [liveText, setLiveText] = useState('');
  const [streaming, setStreaming] = useState(false);
  const streamAbort = useRef<AbortController | null>(null);

  useEffect(() => {
    fetchRealityData(topic);
  }, [topic]);

  useEffect(() => () => streamAbort.current?.abort(), []);

  const handleLiveDeepDive = async () => {
    streamAbort.current?.abort();
    const controller = new AbortController();
    streamAbort.current = controller;
    setLiveText('');
    setStreaming(true);
    try {
      await api.streamReality(
        topic,
        (token) => setLiveText((prev) => prev + token),
        'comprehensive',
        controller.signal
      );
    } catch (err: any) {
      if (err?.name !== 'AbortError') {
        console.error('Live deep dive failed:', err);
        setLiveText('Live stream unavailable. Check the backend connection.');
      }
    } finally {
      if (streamAbort.current === controller) setStreaming(false);
    }
  };

  const fetchRealityData = async (targetTopic: string) => {
    setLoading(true);
    try {
      const res = await api.getRealityConnection(targetTopic);
      setData(res);
    } catch (err) {
      console.error("Failed to load reality connection:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      setTopic(searchQuery.trim());
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Header & Search Bar */}
      <div className="bg-[#141414] border border-white/10 rounded-2xl p-6 shadow-xl space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="text-xs uppercase font-bold text-teal-400 tracking-wider px-2 py-0.5 rounded-full bg-teal-400/10 border border-teal-400/20 flex items-center gap-1.5">
                <Compass size={12} /> CONCEPT-TO-REALITY NAVIGATOR
              </span>
              <span className="text-xs text-slate-400">Industry & Future Discovery Engine</span>
            </div>
            <h2 className="text-2xl font-bold text-white tracking-tight">
              Connect Theory to Real-World Impact
            </h2>
            <p className="text-xs text-slate-400 mt-1 max-w-2xl">
              Discover how textbook equations power commercial products, space exploration, and hands-on engineering portfolios.
            </p>
          </div>

          {onOpenVisualStudio && (
            <button
              onClick={() => onOpenVisualStudio(topic)}
              className="shrink-0 px-4 py-2 bg-white/10 hover:bg-white/15 border border-white/20 text-white font-semibold text-xs rounded-xl shadow-md transition-all flex items-center gap-2"
            >
              <Sparkles size={14} className="text-[#22C55E]" /> Launch Animated Simulation
            </button>
          )}
          <button
            onClick={handleLiveDeepDive}
            disabled={streaming}
            className="shrink-0 px-4 py-2 bg-teal-600 hover:bg-teal-500 disabled:opacity-60 text-white font-semibold text-xs rounded-xl shadow-md transition-all flex items-center gap-2"
          >
            <Sparkles size={14} /> {streaming ? 'Streaming…' : 'Live Deep Dive'}
          </button>
        </div>

        {/* Search Input */}
        <form onSubmit={handleSearch} className="flex gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search any concept (e.g. PN Junction, Transformer, Fast Fourier Transform)..."
              className="w-full bg-[#0D0D0D] border border-white/10 rounded-xl pl-10 pr-4 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-teal-500 transition-colors"
            />
          </div>
          <button
            type="submit"
            className="px-5 py-2.5 bg-teal-600 hover:bg-teal-500 text-white text-xs font-bold rounded-xl transition-colors shrink-0 shadow"
          >
            Explore
          </button>
        </form>

        {/* Quick Topics */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1 text-xs text-slate-400">
          <span className="shrink-0 font-medium">Quick Explore:</span>
          {["Semiconductor Physics", "Logic Gates & ALU", "Bipolar Transistors", "Optical Fiber Reflection", "Convolutional Neural Networks"].map((t) => (
            <button
              key={t}
              onClick={() => {
                setSearchQuery(t);
                setTopic(t);
              }}
              className="px-2.5 py-1 rounded-md bg-white/5 border border-white/10 hover:bg-white/10 hover:text-white transition-colors whitespace-nowrap"
            >
              {t}
            </button>
          ))}
        </div>
      </div>

      {(streaming || liveText) && (
        <div className="bg-[#141414] border border-teal-500/30 rounded-2xl p-5 space-y-2 shadow-xl">
          <span className="text-[11px] font-bold text-teal-400 uppercase tracking-wide flex items-center gap-1.5">
            <Sparkles size={13} /> Live Deep Dive — {topic}
          </span>
          <pre className="whitespace-pre-wrap text-xs text-slate-200 font-sans leading-relaxed">
            {liveText || 'Connecting to live reasoning stream…'}
          </pre>
        </div>
      )}

      {loading ? (
        <div className="bg-[#141414] border border-white/10 rounded-2xl p-12 text-center space-y-3">
          <div className="w-8 h-8 border-2 border-teal-500 border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-xs text-slate-400">Synthesizing real-world industrial data and verified case studies...</p>
        </div>
      ) : data ? (
        <div className="space-y-6">
          {/* Summary & Genesis Story */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="bg-[#141414] border border-white/10 rounded-2xl p-5 shadow-sm space-y-2">
              <span className="text-[11px] font-bold text-teal-400 uppercase tracking-wide flex items-center gap-1.5">
                <Globe size={13} /> 1. Concept Definition & Scope
              </span>
              <p className="text-sm text-slate-200 leading-relaxed font-normal">
                {data.concept_summary}
              </p>
            </div>

            <div className="bg-[#141414] border border-white/10 rounded-2xl p-5 shadow-sm space-y-2">
              <span className="text-[11px] font-bold text-amber-400 uppercase tracking-wide flex items-center gap-1.5">
                <Lightbulb size={13} /> 2. Why Was It Developed?
              </span>
              <p className="text-sm text-slate-200 leading-relaxed font-normal">
                {data.why_developed}
              </p>
            </div>
          </div>

          {/* Real-World Uses, Industries, & Products */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Real World Applications */}
            <div className="bg-[#141414] border border-white/10 rounded-2xl p-5 space-y-3">
              <span className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-2">
                <CheckCircle size={15} className="text-[#22C55E]" /> 3. Real-World Applications
              </span>
              <ul className="space-y-2 text-xs text-slate-300">
                {data.real_world_uses?.map((use: string, i: number) => (
                  <li key={i} className="flex items-start gap-2 bg-[#0D0D0D] p-2.5 rounded-lg border border-white/5">
                    <span className="text-[#22C55E] mt-0.5">•</span>
                    <span>{use}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* Impacted Industries */}
            <div className="bg-[#141414] border border-white/10 rounded-2xl p-5 space-y-3">
              <span className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-2">
                <Building2 size={15} className="text-[#3B82F6]" /> 4. Key Industries
              </span>
              <div className="flex flex-wrap gap-2">
                {data.industries?.map((ind: string, i: number) => (
                  <span key={i} className="px-3 py-1.5 bg-[#3B82F6]/10 border border-[#3B82F6]/30 text-[#60A5FA] text-xs font-medium rounded-lg">
                    {ind}
                  </span>
                ))}
              </div>
            </div>

            {/* Commercial Products */}
            <div className="bg-[#141414] border border-white/10 rounded-2xl p-5 space-y-3">
              <span className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-2">
                <Cpu size={15} className="text-purple-400" /> 5. Commercial Products
              </span>
              <ul className="space-y-2 text-xs text-slate-300">
                {data.products?.map((prod: string, i: number) => (
                  <li key={i} className="flex items-center gap-2 bg-[#0D0D0D] p-2.5 rounded-lg border border-white/5">
                    <span className="text-purple-400">⚡</span>
                    <span className="font-medium text-white">{prod}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          {/* Research & Problems Solved */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="bg-[#141414] border border-white/10 rounded-2xl p-5 space-y-2">
              <span className="text-xs font-bold text-indigo-400 uppercase tracking-wider">
                6. Active University & Laboratory Research
              </span>
              <p className="text-xs text-slate-300 leading-relaxed">
                {data.research_applications}
              </p>
            </div>

            <div className="bg-[#141414] border border-white/10 rounded-2xl p-5 space-y-2">
              <span className="text-xs font-bold text-emerald-400 uppercase tracking-wider">
                7. Problems & Bottlenecks Solved
              </span>
              <p className="text-xs text-slate-300 leading-relaxed">
                {data.problems_solved}
              </p>
            </div>
          </div>

          {/* Limitations vs Future Developments */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="bg-rose-500/5 border border-rose-500/20 rounded-2xl p-5 space-y-2">
              <span className="text-xs font-bold text-rose-400 uppercase tracking-wider flex items-center gap-1.5">
                <AlertTriangle size={14} /> 8. Physical & Material Limitations
              </span>
              <p className="text-xs text-slate-300 leading-relaxed">
                {data.limitations}
              </p>
            </div>

            <div className="bg-cyan-500/5 border border-cyan-500/20 rounded-2xl p-5 space-y-2">
              <span className="text-xs font-bold text-cyan-400 uppercase tracking-wider flex items-center gap-1.5">
                <Sparkles size={14} /> 9. Future 5-10 Year Frontiers
              </span>
              <p className="text-xs text-slate-300 leading-relaxed">
                {data.future_developments}
              </p>
            </div>
          </div>

          {/* Hands-On Student Mini-Project */}
          {data.mini_project && (
            <div className="bg-gradient-to-br from-[#18181B] to-[#111827] border border-teal-500/30 rounded-2xl p-6 shadow-xl space-y-4">
              <div className="flex items-center justify-between flex-wrap gap-2">
                <div className="flex items-center gap-2">
                  <Wrench className="text-teal-400" size={18} />
                  <h3 className="font-bold text-base text-white">10. Practical Hands-On Student Project</h3>
                </div>
                {data.mini_project.estimated_time && (
                  <span className="px-2.5 py-1 bg-teal-500/10 border border-teal-500/20 text-teal-300 text-xs font-semibold rounded-lg">
                    ⏱️ {data.mini_project.estimated_time}
                  </span>
                )}
              </div>

              <div>
                <h4 className="text-sm font-bold text-white">{data.mini_project.title}</h4>
                <p className="text-xs text-slate-300 mt-1">{data.mini_project.objective}</p>
              </div>

              {/* Materials */}
              {data.mini_project.materials && (
                <div>
                  <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wide block mb-1.5">Required Tools & Materials:</span>
                  <div className="flex flex-wrap gap-1.5">
                    {data.mini_project.materials.map((mat: string, i: number) => (
                      <span key={i} className="px-2.5 py-1 bg-white/5 border border-white/10 rounded-md text-xs text-slate-300">
                        {mat}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Steps */}
              {data.mini_project.steps && (
                <div className="space-y-2">
                  <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wide block">Execution Steps:</span>
                  <div className="space-y-2">
                    {data.mini_project.steps.map((step: string, i: number) => (
                      <div key={i} className="flex items-start gap-2.5 bg-[#0D0D0D] p-3 rounded-xl border border-white/5 text-xs text-slate-200">
                        <span className="w-5 h-5 rounded-full bg-teal-500/20 text-teal-400 font-bold flex items-center justify-center shrink-0 text-[10px]">
                          {i + 1}
                        </span>
                        <span className="leading-relaxed">{step}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Expected Outcome */}
              {data.mini_project.expected_outcome && (
                <div className="bg-teal-500/10 border border-teal-500/20 p-3.5 rounded-xl text-xs text-teal-200">
                  <span className="font-bold">Expected Verification Outcome: </span>
                  {data.mini_project.expected_outcome}
                </div>
              )}
            </div>
          )}

          {/* Real-World Case Studies */}
          {data.case_studies && data.case_studies.length > 0 && (
            <div className="bg-[#141414] border border-white/10 rounded-2xl p-6 space-y-4">
              <h3 className="font-bold text-base text-white flex items-center gap-2">
                <Bookmark className="text-[#3B82F6]" size={16} /> Verified Industrial Case Studies
              </h3>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {data.case_studies.map((cs: any, i: number) => (
                  <div key={i} className="bg-[#0D0D0D] border border-white/10 rounded-xl p-4 space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-white">{cs.title}</span>
                      <span className="text-[10px] font-semibold text-[#3B82F6] px-2 py-0.5 rounded bg-[#3B82F6]/10 border border-[#3B82F6]/20">
                        {cs.organization}
                      </span>
                    </div>
                    <p className="text-xs text-slate-300 leading-relaxed">{cs.description}</p>
                    <div className="text-[11px] text-emerald-400 font-medium">
                      📈 Impact: {cs.impact}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Citations & Evidence */}
          {data.citations && data.citations.length > 0 && (
            <div className="bg-[#0D0D0D] border border-white/5 rounded-xl p-4 text-[11px] text-slate-400 space-y-1">
              <span className="font-semibold text-slate-300 block">Verified Scientific & Industrial Citations:</span>
              <ul className="list-disc list-inside space-y-0.5">
                {data.citations.map((c: any, i: number) => (
                  <li key={i}>
                    <span className="text-slate-300 font-medium">{c.source}</span> — {c.reference}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      ) : null}
    </div>
  );
}
