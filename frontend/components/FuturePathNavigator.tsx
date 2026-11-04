'use client';

import React, { useState, useEffect } from 'react';
import { 
  Compass, Briefcase, CheckCircle2, Target, Award, AlertCircle
} from 'lucide-react';
import api from '@/lib/api-client';

export default function FuturePathNavigator() {
  const [subject, setSubject] = useState('electronics');
  const [pathways, setPathways] = useState<any[]>([]);
  const [selectedPathway, setSelectedPathway] = useState<any>(null);
  const [gapAnalysis, setGapAnalysis] = useState<any>(null);
  const [roadmap, setRoadmap] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadPathways(subject);
  }, [subject]);

  const loadPathways = async (sub: string) => {
    setLoading(true);
    try {
      const list = await api.getCareerPathways(sub);
      setPathways(list || []);
      if (list && list.length > 0) {
        handleSelectPathway(list[0]);
      }
    } catch (err) {
      console.error("Failed to load career pathways:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleSelectPathway = async (p: any) => {
    setSelectedPathway(p);
    try {
      const gap = await api.analyzeCareerSkillGap(p.title);
      setGapAnalysis(gap);

      const rmap = await api.generateCareerRoadmap(p.title);
      setRoadmap(rmap);
    } catch (err) {
      console.error("Failed to analyze career pathway:", err);
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="bg-[#141414] border border-white/10 rounded-2xl p-6 shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-xs uppercase font-bold text-cyan-400 tracking-wider px-2 py-0.5 rounded-full bg-cyan-400/10 border border-cyan-400/20 flex items-center gap-1.5">
              <Compass size={12} /> FUTUREPATH AI
            </span>
            <span className="text-xs text-slate-400">Career & Skill Guidance Engine</span>
          </div>
          <h2 className="text-2xl font-bold text-white tracking-tight">
            Connect Academic Studies to High-Impact Careers
          </h2>
          <p className="text-xs text-slate-400 mt-1 max-w-xl">
            Exploratory pathways, real industry requirements, technical skill gap analysis, and hands-on milestone roadmaps.
          </p>
        </div>

        {/* Subject Filter Pills */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1 md:pb-0">
          {[
            { id: "electronics", label: "Electronics & Hardware" },
            { id: "computer_science", label: "Computer Science & AI" },
            { id: "physics", label: "Applied Physics & Quantum" }
          ].map((sub) => (
            <button
              key={sub.id}
              onClick={() => setSubject(sub.id)}
              className={`text-xs px-3.5 py-2 rounded-xl whitespace-nowrap transition-all border font-semibold ${
                subject === sub.id
                  ? "bg-cyan-500 text-black border-cyan-500 shadow-md"
                  : "bg-white/5 text-slate-300 border-white/10 hover:bg-white/10 hover:text-white"
              }`}
            >
              {sub.label}
            </button>
          ))}
        </div>
      </div>

      {/* Pathways Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {loading && pathways.length === 0 && (
          <div className="bg-[#141414] border border-white/10 rounded-2xl p-8 text-center text-xs text-slate-400">
            Loading career pathways…
          </div>
        )}
        {pathways.map((p) => {
          const isSelected = selectedPathway?.title === p.title;
          return (
            <div
              key={p.id}
              onClick={() => handleSelectPathway(p)}
              className={`bg-[#141414] rounded-2xl p-5 border cursor-pointer transition-all shadow-lg space-y-3 ${
                isSelected
                  ? "border-cyan-500 bg-cyan-500/5 ring-1 ring-cyan-500/30"
                  : "border-white/10 hover:border-white/20"
              }`}
            >
              <div className="flex items-center justify-between">
                <span className="text-sm font-bold text-white">{p.title}</span>
                <span className="text-[11px] text-cyan-400 font-semibold">{p.average_salary_range}</span>
              </div>
              <p className="text-xs text-slate-300 leading-relaxed font-normal">
                {p.description}
              </p>

              {/* Technical skills tags */}
              <div className="flex flex-wrap gap-1.5 pt-1">
                {p.technical_skills?.slice(0, 4).map((skill: string, i: number) => (
                  <span key={i} className="text-[10px] px-2 py-0.5 rounded bg-white/5 text-slate-300 border border-white/10">
                    {skill}
                  </span>
                ))}
              </div>
            </div>
          );
        })}
      </div>

      {/* Selected Pathway Deep Dive: Skill Gap & Roadmap */}
      {selectedPathway && (
        <div className="space-y-6 animate-fade-in">
          {/* Skill Gap Analysis Box */}
          {gapAnalysis && (
            <div className="bg-[#141414] border border-white/10 rounded-2xl p-6 shadow-xl space-y-5">
              <div className="flex items-center justify-between flex-wrap gap-2">
                <div className="flex items-center gap-2">
                  <Target className="text-cyan-400" size={18} />
                  <h3 className="font-bold text-base text-white">
                    Skill Gap Analysis: {selectedPathway.title}
                  </h3>
                </div>
                <span className="text-xs text-slate-400">Benchmarked against verified industry competencies</span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {/* Existing Strengths */}
                <div className="bg-[#0D0D0D] border border-white/5 rounded-xl p-4 space-y-2">
                  <span className="text-xs font-bold text-emerald-400 uppercase tracking-wide flex items-center gap-1.5">
                    <CheckCircle2 size={13} /> Your Existing Strengths
                  </span>
                  <ul className="space-y-1.5 text-xs text-slate-300">
                    {gapAnalysis.existing_strengths?.map((s: string, i: number) => (
                      <li key={i} className="flex items-center gap-2">
                        <span className="text-emerald-400">✓</span> {s}
                      </li>
                    ))}
                  </ul>
                </div>

                {/* Skills to Develop */}
                <div className="bg-[#0D0D0D] border border-white/5 rounded-xl p-4 space-y-2">
                  <span className="text-xs font-bold text-amber-400 uppercase tracking-wide flex items-center gap-1.5">
                    <AlertCircle size={13} /> Skills To Develop
                  </span>
                  <ul className="space-y-1.5 text-xs text-slate-300">
                    {gapAnalysis.skills_to_develop?.map((s: string, i: number) => (
                      <li key={i} className="flex items-center gap-2">
                        <span className="text-amber-400">⚡</span> {s}
                      </li>
                    ))}
                  </ul>
                </div>

                {/* Recommended Projects */}
                <div className="bg-[#0D0D0D] border border-white/5 rounded-xl p-4 space-y-2">
                  <span className="text-xs font-bold text-cyan-400 uppercase tracking-wide flex items-center gap-1.5">
                    <Award size={13} /> Recommended Projects
                  </span>
                  <ul className="space-y-1.5 text-xs text-slate-300">
                    {gapAnalysis.recommended_projects?.map((proj: string, i: number) => (
                      <li key={i} className="flex items-center gap-2">
                        <span className="text-cyan-400">📁</span> {proj}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>

              {/* Learning Resources */}
              {gapAnalysis.learning_resources && (
                <div className="pt-2 border-t border-white/5">
                  <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wide block mb-2">Vetted Learning Resources:</span>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                    {gapAnalysis.learning_resources.map((res: any, i: number) => (
                      <div key={i} className="flex items-center justify-between p-2.5 rounded-lg bg-white/5 border border-white/10 text-slate-200">
                        <span>{res.name} ({res.type})</span>
                        <span className="text-cyan-400 text-[10px]">Verified Resource</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Project Milestone Roadmap */}
          {roadmap && (
            <div className="bg-[#141414] border border-white/10 rounded-2xl p-6 shadow-xl space-y-4">
              <div className="flex items-center gap-2">
                <Briefcase className="text-indigo-400" size={18} />
                <h3 className="font-bold text-base text-white">
                  Step-by-Step Pathway Project Roadmap
                </h3>
              </div>

              <div className="space-y-3">
                {roadmap.milestones?.map((m: any, i: number) => (
                  <div key={i} className="flex items-start gap-4 bg-[#0D0D0D] p-4 rounded-xl border border-white/5">
                    <div className="w-8 h-8 rounded-full bg-indigo-500/20 text-indigo-400 font-bold flex items-center justify-center shrink-0 text-sm">
                      {m.step_number}
                    </div>
                    <div className="space-y-1 flex-1">
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-bold text-white">{m.milestone_title}</span>
                        <span className="text-[10px] text-slate-400">{m.suggested_timeline}</span>
                      </div>
                      <p className="text-xs text-slate-300">{m.recommended_project}</p>
                      <div className="text-[11px] text-emerald-400 font-medium pt-1">
                        ✓ Verification: {m.verification_check}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
