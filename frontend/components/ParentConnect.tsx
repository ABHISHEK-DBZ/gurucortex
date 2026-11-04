'use client';

import React, { useState, useEffect } from 'react';
import { 
  Users, HeartHandshake, Bell, Calendar, MessageCircleHeart, Lock
} from 'lucide-react';
import api from '@/lib/api-client';

export default function ParentConnect() {
  const [dashboard, setDashboard] = useState<any>(null);
  const [linkCode, setLinkCode] = useState<string>('');

  // Parent login / link form state
  const [parentName, setParentName] = useState('');
  const [inputCode, setInputCode] = useState('');
  const [linkSuccess, setLinkSuccess] = useState(false);

  useEffect(() => {
    loadParentPortal();
  }, []);

  const loadParentPortal = async () => {
    try {
      const codeRes = await api.getStudentLinkCode();
      setLinkCode(codeRes.link_code);

      const dash = await api.getParentDashboard();
      setDashboard(dash);
    } catch (err) {
      console.error("Failed to load parent dashboard:", err);
    }
  };

  const handleLinkAccount = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputCode.trim()) return;

    try {
      await api.linkParentAccount(parentName || "Guardian", "guardian@gurucortex.edu", inputCode);
      setLinkSuccess(true);
      loadParentPortal();
      setTimeout(() => setLinkSuccess(false), 4000);
    } catch (err) {
      console.error("Failed to link account:", err);
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="bg-[#141414] border border-white/10 rounded-2xl p-6 shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-xs uppercase font-bold text-rose-400 tracking-wider px-2 py-0.5 rounded-full bg-rose-400/10 border border-rose-400/20 flex items-center gap-1.5">
              <HeartHandshake size={12} /> PARENT CONNECT PORTAL
            </span>
            <span className="text-xs text-slate-400">Collaborative Family Guidance & Transparency</span>
          </div>
          <h2 className="text-2xl font-bold text-white tracking-tight">
            Supporting Progress, Not Micromanaging
          </h2>
          <p className="text-xs text-slate-400 mt-1 max-w-xl">
            Gives parents clear visibility into real study milestones and actionable ways to help, while protecting private student thinking spaces.
          </p>
        </div>

        {/* Student Link Authorization Code Card */}
        <div className="bg-[#0D0D0D] border border-white/10 rounded-2xl p-4 shadow-inner text-center shrink-0">
          <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider block">
            Student Family Linking Code
          </span>
          <span className="text-2xl font-mono font-black text-rose-400 tracking-widest mt-0.5 block select-all">
            {linkCode || "—"}
          </span>
          <span className="text-[10px] text-slate-500 block mt-1">Share this code with your parent / guardian</span>
        </div>
      </div>

      {/* Parent Account Authorization Bar */}
      <div className="bg-[#18181B] border border-white/10 rounded-2xl p-5 shadow-lg flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-rose-500/10 text-rose-400 flex items-center justify-center shrink-0">
            <Users size={20} />
          </div>
          <div>
            <h4 className="text-sm font-bold text-white">Parent / Guardian Secure Sign-In</h4>
            <p className="text-xs text-slate-400">Enter the student linking code above to access authorized progress insights.</p>
          </div>
        </div>

        <form onSubmit={handleLinkAccount} className="flex flex-wrap gap-2 w-full md:w-auto">
          <input
            type="text"
            value={parentName}
            onChange={e => setParentName(e.target.value)}
            placeholder="Parent Name"
            className="bg-[#0D0D0D] border border-white/10 rounded-xl px-3 py-2 text-xs text-white placeholder-slate-500"
          />
          <input
            type="text"
            value={inputCode}
            onChange={e => setInputCode(e.target.value)}
            placeholder="GURU-XXXX"
            className="bg-[#0D0D0D] border border-white/10 rounded-xl px-3 py-2 text-xs text-white uppercase font-mono tracking-wider placeholder-slate-500"
          />
          <button
            type="submit"
            className="px-4 py-2 bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs rounded-xl shadow transition-colors shrink-0"
          >
            {linkSuccess ? "✓ Linked!" : "Authorize Link"}
          </button>
        </form>
      </div>

      {/* Real Progress Metrics Summary (Grounded & Evidence-Based) */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="bg-[#141414] border border-white/10 rounded-2xl p-4 shadow-sm">
          <span className="text-[11px] font-semibold text-slate-400 block">Overall Learning Mastery</span>
          <span className="text-2xl font-bold text-[#22C55E] mt-1 block">
            {dashboard ? `${dashboard.overall_progress}%` : '—'}
          </span>
        </div>
        <div className="bg-[#141414] border border-white/10 rounded-2xl p-4 shadow-sm">
          <span className="text-[11px] font-semibold text-slate-400 block">Weekly Study Dedication</span>
          <span className="text-2xl font-bold text-indigo-400 mt-1 block">
            {dashboard ? `${dashboard.weekly_study_hours} hrs` : '—'}
          </span>
        </div>
        <div className="bg-[#141414] border border-white/10 rounded-2xl p-4 shadow-sm">
          <span className="text-[11px] font-semibold text-slate-400 block">Quiz Diagnostic Average</span>
          <span className="text-2xl font-bold text-amber-400 mt-1 block">
            {dashboard ? `${dashboard.quiz_average_score}%` : '—'}
          </span>
        </div>
        <div className="bg-[#141414] border border-white/10 rounded-2xl p-4 shadow-sm">
          <span className="text-[11px] font-semibold text-slate-400 block">Revision Consistency</span>
          <span className="text-2xl font-bold text-rose-400 mt-1 block">
            {dashboard ? `${dashboard.revision_consistency_rate}%` : '—'}
          </span>
        </div>
      </div>

      {/* Parent Guidance Recommendations: "How Parents Can Help" */}
      <div className="bg-[#141414] border border-white/10 rounded-2xl p-6 shadow-xl space-y-4">
        <div className="flex items-center gap-2">
          <MessageCircleHeart className="text-rose-400" size={18} />
          <h3 className="font-bold text-base text-white">
            Constructive Parent Guidance: How You Can Help
          </h3>
        </div>
        <p className="text-xs text-slate-400">
          Specific, non-punitive suggestions based on recent diagnostic evidence to spark supportive conversations at home.
        </p>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-1">
          {dashboard?.guidance_recommendations?.map((guide: any) => (
            <div key={guide.id} className="bg-[#0D0D0D] border border-white/10 rounded-xl p-5 space-y-3 flex flex-col justify-between">
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-rose-300 text-xs font-bold">
                  <span>● OBSERVATION:</span>
                  <span>{guide.observation}</span>
                </div>

                <div className="text-[11px] text-slate-400 bg-white/5 p-2 rounded-lg">
                  <span className="font-semibold text-slate-300">Supporting Evidence: </span>
                  {guide.supporting_evidence}
                </div>

                <div className="space-y-1">
                  <span className="text-[11px] font-bold text-amber-400 uppercase tracking-wide block">
                    💬 Suggested Conversation Starter:
                  </span>
                  <p className="text-xs text-slate-200 italic bg-amber-500/10 p-2.5 rounded-lg border border-amber-500/20">
                    {guide.suggested_conversation_starter}
                  </p>
                </div>

                <div className="space-y-1">
                  <span className="text-[11px] font-bold text-emerald-400 uppercase tracking-wide block">
                    🤝 Practical Actionable Assistance:
                  </span>
                  <p className="text-xs text-slate-200">
                    {guide.actionable_assistance}
                  </p>
                </div>
              </div>

              <div className="text-[10px] text-slate-500 pt-2 border-t border-white/5">
                Suggested Follow-Up: {guide.suggested_follow_up}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Parent Notifications & Exam Alerts */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Positive Achievements & Notifications */}
        <div className="bg-[#141414] border border-white/10 rounded-2xl p-5 space-y-3">
          <span className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-1.5">
            <Bell size={15} className="text-rose-400" /> Notifications & Milestones
          </span>
          <div className="space-y-2 text-xs">
            {dashboard?.notifications?.map((notif: any) => (
              <div key={notif.id} className="p-3 rounded-xl bg-[#0D0D0D] border border-white/5 space-y-1">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-white">{notif.title}</span>
                  <span className="text-[10px] text-slate-500">Recent</span>
                </div>
                <p className="text-slate-300 text-xs leading-relaxed">{notif.message}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Upcoming Examinations & Privacy Controls */}
        <div className="bg-[#141414] border border-white/10 rounded-2xl p-5 space-y-3">
          <span className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-1.5">
            <Calendar size={15} className="text-indigo-400" /> Upcoming Examinations
          </span>
          <div className="space-y-2 text-xs">
            {dashboard?.upcoming_exams?.map((ex: any, i: number) => (
              <div key={i} className="flex items-center justify-between p-3 rounded-xl bg-[#0D0D0D] border border-white/5">
                <div>
                  <span className="font-semibold text-white block">{ex.subject}</span>
                  <span className="text-[10px] text-slate-400">{ex.date}</span>
                </div>
                <span className="px-2.5 py-1 rounded-lg bg-indigo-500/10 text-indigo-300 font-bold">
                  {ex.days_remaining} Days Remaining
                </span>
              </div>
            ))}
          </div>

          {/* Privacy Transparency Gating */}
          <div className="pt-2">
            <div className="bg-[#0D0D0D] border border-emerald-500/20 p-3.5 rounded-xl text-xs space-y-1">
              <span className="font-bold text-emerald-400 flex items-center gap-1.5">
                <Lock size={13} /> Strict Student Privacy Policy
              </span>
              <p className="text-slate-400 text-[11px] leading-relaxed">
                Private student chat conversations, personal study drafts, and camera feeds are permanently hidden from parental viewing to encourage independent exploration.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
