'use client';

import React, { useState, useEffect, useRef } from 'react';
import { 
  Brain, Sparkles, CheckCircle2, Clock, Trophy, Target, FolderGit2
} from 'lucide-react';
import api from '@/lib/api-client';

export default function CognitiveCoach() {
  const [recommendations, setRecommendations] = useState<any[]>([]);
  const [identity, setIdentity] = useState<any>(null);
  const [activeTab, setActiveTab] = useState<'coach' | 'identity'>('coach');

  const [coachQuery, setCoachQuery] = useState('');
  const [coachReply, setCoachReply] = useState('');
  const [coachStreaming, setCoachStreaming] = useState(false);
  const coachAbort = useRef<AbortController | null>(null);

  useEffect(() => () => coachAbort.current?.abort(), []);

  const handleAskCoach = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!coachQuery.trim()) return;
    coachAbort.current?.abort();
    const controller = new AbortController();
    coachAbort.current = controller;
    setCoachReply('');
    setCoachStreaming(true);
    try {
      await api.streamCoachAdvice(
        coachQuery.trim(),
        (token) => setCoachReply((prev) => prev + token),
        'default_student',
        controller.signal
      );
    } catch (err: any) {
      if (err?.name !== 'AbortError') {
        console.error('Coach stream failed:', err);
        setCoachReply('Live coaching unavailable. Check the backend connection.');
      }
    } finally {
      if (coachAbort.current === controller) setCoachStreaming(false);
    }
  };

  // New project modal
  const [isAddingProject, setIsAddingProject] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newSubject, setNewSubject] = useState('');
  const [newDesc, setNewDesc] = useState('');
  const [newSkills, setNewSkills] = useState('');

  useEffect(() => {
    loadCoachData();
  }, []);

  const loadCoachData = async () => {
    try {
      const recs = await api.getCoachRecommendations();
      setRecommendations(recs || []);

      const ident = await api.getLearningIdentity();
      setIdentity(ident);
    } catch (err) {
      console.error("Failed to load coach data:", err);
    }
  };

  const handleUpdateStatus = async (id: string, newStatus: string) => {
    try {
      await api.updateCoachRecommendationStatus(id, newStatus);
      setRecommendations(prev => prev.map(r => r.id === id ? { ...r, status: newStatus } : r));
    } catch (err) {
      console.error("Failed to update status:", err);
    }
  };

  const handleCreateProject = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim()) return;

    try {
      const skillsArray = newSkills.split(',').map(s => s.trim()).filter(Boolean);
      const added = await api.addStudentProject({
        title: newTitle,
        subject: newSubject || "General Engineering",
        description: newDesc,
        skills_demonstrated: skillsArray,
        status: "completed"
      });
      setIdentity((prev: any) => ({
        ...prev,
        projects: [added, ...(prev?.projects || [])]
      }));
      setIsAddingProject(false);
      setNewTitle('');
      setNewSubject('');
      setNewDesc('');
      setNewSkills('');
    } catch (err) {
      console.error("Failed to add project:", err);
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="bg-[#141414] border border-white/10 rounded-2xl p-6 shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-xs uppercase font-bold text-indigo-400 tracking-wider px-2 py-0.5 rounded-full bg-indigo-400/10 border border-indigo-400/20 flex items-center gap-1.5">
              <Brain size={12} /> COGNITIVE LEARNING COACH
            </span>
            <span className="text-xs text-slate-400">Metacognition & Student Growth Portfolio</span>
          </div>
          <h2 className="text-2xl font-bold text-white tracking-tight">
            Learn How to Learn Effectively
          </h2>
          <p className="text-xs text-slate-400 mt-1 max-w-xl">
            Translates evidence from cognitive psychology into custom study routines tailored to your specific conceptual roadblocks.
          </p>
        </div>

        {/* View Switcher Tabs */}
        <div className="flex items-center bg-[#0D0D0D] border border-white/10 rounded-xl p-1 gap-1">
          <button
            onClick={() => setActiveTab('coach')}
            className={`px-4 py-2 rounded-lg text-xs font-semibold transition-all ${
              activeTab === 'coach'
                ? "bg-indigo-600 text-white shadow-md"
                : "text-slate-400 hover:text-white"
            }`}
          >
            🧠 Coach Recommendations
          </button>
          <button
            onClick={() => setActiveTab('identity')}
            className={`px-4 py-2 rounded-lg text-xs font-semibold transition-all ${
              activeTab === 'identity'
                ? "bg-indigo-600 text-white shadow-md"
                : "text-slate-400 hover:text-white"
            }`}
          >
            👤 My Learning Identity
          </button>
        </div>
      </div>

      {activeTab === 'coach' ? (
        /* Cognitive Coach Recommendations View */
        <div className="space-y-4">
          <div className="bg-[#141414] border border-indigo-500/30 rounded-2xl p-5 space-y-3 shadow-xl">
            <span className="text-xs font-bold text-indigo-400 uppercase tracking-wider flex items-center gap-1.5">
              <Sparkles size={14} /> Ask the Coach (Live)
            </span>
            <form onSubmit={handleAskCoach} className="flex gap-2">
              <input
                type="text"
                value={coachQuery}
                onChange={(e) => setCoachQuery(e.target.value)}
                placeholder="What are you stuck on right now?"
                className="flex-1 bg-[#0D0D0D] border border-white/10 rounded-xl px-4 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 transition-colors"
              />
              <button
                type="submit"
                disabled={coachStreaming}
                className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-60 text-white text-xs font-bold rounded-xl transition-colors shrink-0"
              >
                {coachStreaming ? 'Thinking…' : 'Ask'}
              </button>
            </form>
            {(coachStreaming || coachReply) && (
              <pre className="whitespace-pre-wrap text-xs text-slate-200 font-sans leading-relaxed bg-[#0D0D0D] border border-white/5 rounded-xl p-3">
                {coachReply || 'Coaching stream connected…'}
              </pre>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {recommendations.map((rec) => (
              <div 
                key={rec.id}
                className="bg-[#141414] border border-white/10 rounded-2xl p-6 space-y-4 shadow-xl flex flex-col justify-between"
              >
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-indigo-400 uppercase tracking-wider flex items-center gap-1.5">
                      <Sparkles size={14} /> {rec.strategy_title}
                    </span>
                    <span className="px-2.5 py-1 rounded-md bg-white/5 border border-white/10 text-[11px] text-slate-300 flex items-center gap-1">
                      <Clock size={12} /> {rec.recommended_duration_mins} mins
                    </span>
                  </div>

                  <div className="bg-[#0D0D0D] p-3 rounded-xl border border-white/5 text-xs text-slate-300">
                    <span className="font-semibold text-slate-200 block mb-1">Why this strategy is suggested:</span>
                    <p className="leading-relaxed">{rec.rationale}</p>
                  </div>

                  <div className="space-y-1.5">
                    <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wide block">Your Action Plan:</span>
                    <p className="text-xs text-slate-200 leading-relaxed bg-white/5 p-3 rounded-xl border border-white/5">
                      {rec.action_plan}
                    </p>
                  </div>

                  <div className="text-[11px] text-slate-400 space-y-1 pt-1">
                    <div>
                      <span className="font-semibold text-slate-300">Progress Evaluation: </span>
                      {rec.evaluation_criteria}
                    </div>
                    <div className="text-slate-500 italic">
                      Scientific Foundation: {rec.evidence_source}
                    </div>
                  </div>
                </div>

                {/* Status Actions */}
                <div className="flex items-center justify-between pt-3 border-t border-white/10 text-xs">
                  <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${
                    rec.status === 'completed'
                      ? "bg-emerald-500/20 text-emerald-400"
                      : rec.status === 'in_progress'
                      ? "bg-amber-500/20 text-amber-300"
                      : "bg-indigo-500/20 text-indigo-300"
                  }`}>
                    {rec.status.replace("_", " ")}
                  </span>

                  <div className="flex items-center gap-2">
                    {rec.status !== 'completed' && (
                      <button
                        onClick={() => handleUpdateStatus(rec.id, 'completed')}
                        className="px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-xs transition-colors"
                      >
                        ✓ Mark Completed
                      </button>
                    )}
                    {rec.status === 'suggested' && (
                      <button
                        onClick={() => handleUpdateStatus(rec.id, 'in_progress')}
                        className="px-3 py-1.5 rounded-lg bg-white/10 hover:bg-white/15 text-white text-xs transition-colors"
                      >
                        Start Sprint
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      ) : (
        /* My Learning Identity View */
        <div className="space-y-6 animate-fade-in">
          {/* Key Metrics Overview */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <div className="bg-[#141414] border border-white/10 rounded-2xl p-4 shadow-sm">
              <span className="text-[11px] font-semibold text-slate-400 block">Overall Progress</span>
              <span className="text-2xl font-bold text-[#22C55E] mt-1 block">
                {identity ? `${identity.overall_progress_score}%` : '—'}
              </span>
            </div>
            <div className="bg-[#141414] border border-white/10 rounded-2xl p-4 shadow-sm">
              <span className="text-[11px] font-semibold text-slate-400 block">Revision Consistency</span>
              <span className="text-2xl font-bold text-indigo-400 mt-1 block">
                {identity ? `${identity.revision_consistency_rate}%` : '—'}
              </span>
            </div>
            <div className="bg-[#141414] border border-white/10 rounded-2xl p-4 shadow-sm">
              <span className="text-[11px] font-semibold text-slate-400 block">Focus Study Hours</span>
              <span className="text-2xl font-bold text-amber-400 mt-1 block">
                {identity ? `${identity.total_study_hours} hrs` : '—'}
              </span>
            </div>
            <div className="bg-[#141414] border border-white/10 rounded-2xl p-4 shadow-sm">
              <span className="text-[11px] font-semibold text-slate-400 block">Verified Projects</span>
              <span className="text-2xl font-bold text-purple-400 mt-1 block">
                {identity?.projects?.length ?? 0}
              </span>
            </div>
          </div>

          {/* Strengths & Knowledge Gaps */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Strengths */}
            <div className="bg-[#141414] border border-white/10 rounded-2xl p-5 space-y-3">
              <span className="text-xs font-bold text-emerald-400 uppercase tracking-wider flex items-center gap-1.5">
                <CheckCircle2 size={15} /> Verified Subject Strengths
              </span>
              <div className="space-y-2 text-xs">
                {identity?.subject_strengths?.map((s: any, i: number) => (
                  <div key={i} className="flex items-center justify-between p-2.5 rounded-xl bg-[#0D0D0D] border border-white/5">
                    <div>
                      <span className="font-semibold text-white block">{s.topic}</span>
                      <span className="text-[10px] text-slate-400">{s.subject}</span>
                    </div>
                    <span className="text-emerald-400 font-bold">{s.score}%</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Knowledge Gaps */}
            <div className="bg-[#141414] border border-white/10 rounded-2xl p-5 space-y-3">
              <span className="text-xs font-bold text-amber-400 uppercase tracking-wider flex items-center gap-1.5">
                <Target size={15} /> Targeted Knowledge Gaps
              </span>
              <div className="space-y-2 text-xs">
                {identity?.knowledge_gaps?.map((g: any, i: number) => (
                  <div key={i} className="flex items-center justify-between p-2.5 rounded-xl bg-[#0D0D0D] border border-white/5">
                    <div>
                      <span className="font-semibold text-white block">{g.topic}</span>
                      <span className="text-[10px] text-amber-400">Scheduled for Retrieval Practice</span>
                    </div>
                    <span className="text-amber-400 font-bold">{g.score}%</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Acquired Skills Cloud */}
          <div className="bg-[#141414] border border-white/10 rounded-2xl p-5 space-y-3">
            <span className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-1.5">
              <Trophy size={15} className="text-amber-400" /> Acquired Skills & Technical Competencies
            </span>
            <div className="flex flex-wrap gap-2">
              {identity?.acquired_skills?.map((skill: string, i: number) => (
                <span key={i} className="px-3 py-1 bg-white/5 border border-white/10 rounded-lg text-xs font-medium text-slate-200">
                  ⚡ {skill}
                </span>
              ))}
            </div>
          </div>

          {/* Project Portfolio */}
          <div className="bg-[#141414] border border-white/10 rounded-2xl p-6 shadow-xl space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <FolderGit2 className="text-purple-400" size={18} />
                <h3 className="font-bold text-base text-white">Student Project Portfolio</h3>
              </div>
              <button
                onClick={() => setIsAddingProject(!isAddingProject)}
                className="px-3 py-1.5 bg-purple-600 hover:bg-purple-500 text-white rounded-xl text-xs font-semibold transition-colors"
              >
                + Add Project
              </button>
            </div>

            {/* Add Project Form */}
            {isAddingProject && (
              <form onSubmit={handleCreateProject} className="bg-[#0D0D0D] border border-purple-500/30 rounded-xl p-4 space-y-3 animate-fade-in text-xs">
                <span className="font-bold text-purple-300 block">Record Completed Practical Project</span>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <input
                    type="text"
                    value={newTitle}
                    onChange={e => setNewTitle(e.target.value)}
                    placeholder="Project Title (e.g. 4-Bit ALU Simulator)"
                    className="w-full bg-[#18181B] border border-white/10 rounded-lg p-2.5 text-white"
                    required
                  />
                  <input
                    type="text"
                    value={newSubject}
                    onChange={e => setNewSubject(e.target.value)}
                    placeholder="Subject Domain (e.g. Electronics)"
                    className="w-full bg-[#18181B] border border-white/10 rounded-lg p-2.5 text-white"
                  />
                </div>
                <textarea
                  value={newDesc}
                  onChange={e => setNewDesc(e.target.value)}
                  placeholder="Description of what you built and verified..."
                  rows={2}
                  className="w-full bg-[#18181B] border border-white/10 rounded-lg p-2.5 text-white"
                />
                <input
                  type="text"
                  value={newSkills}
                  onChange={e => setNewSkills(e.target.value)}
                  placeholder="Skills demonstrated (comma separated: Python, Circuits, SPICE)"
                  className="w-full bg-[#18181B] border border-white/10 rounded-lg p-2.5 text-white"
                />
                <div className="flex justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => setIsAddingProject(false)}
                    className="px-3 py-1.5 rounded-lg bg-white/5 text-slate-300 hover:bg-white/10"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-1.5 rounded-lg bg-purple-600 hover:bg-purple-500 text-white font-bold"
                  >
                    Save to Portfolio
                  </button>
                </div>
              </form>
            )}

            {/* Projects List */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {identity?.projects?.map((proj: any) => (
                <div key={proj.id} className="bg-[#0D0D0D] border border-white/10 rounded-xl p-5 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-bold text-white">{proj.title}</span>
                    <span className="text-[10px] px-2 py-0.5 rounded bg-purple-500/10 text-purple-300 border border-purple-500/20 font-semibold">
                      {proj.subject}
                    </span>
                  </div>
                  <p className="text-xs text-slate-300 leading-relaxed font-normal">
                    {proj.description}
                  </p>
                  {proj.skills_demonstrated && (
                    <div className="flex flex-wrap gap-1.5 pt-1">
                      {proj.skills_demonstrated.map((s: string, idx: number) => (
                        <span key={idx} className="text-[10px] px-2 py-0.5 rounded bg-white/5 text-slate-300 border border-white/10">
                          {s}
                        </span>
                      ))}
                    </div>
                  )}
                  {proj.reflections && (
                    <p className="text-[11px] text-slate-400 italic pt-1 border-t border-white/5">
                      " {proj.reflections} "
                    </p>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
