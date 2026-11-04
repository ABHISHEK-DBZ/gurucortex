'use client';

import React, { useState, useEffect } from 'react';
import { 
  Calendar, Sparkles, Award, Brain, Zap, Layers
} from 'lucide-react';
import api from '@/lib/api-client';

export default function RevisionIntelligence() {
  const [dashboard, setDashboard] = useState<any>(null);
  const [flashcards, setFlashcards] = useState<any[]>([]);
  const [currentCardIndex, setCurrentCardIndex] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);
  const [reviewResult, setReviewResult] = useState<string | null>(null);

  useEffect(() => {
    loadDashboardAndCards();
  }, []);

  const loadDashboardAndCards = async () => {
    try {
      const dash = await api.getRevisionDashboard();
      setDashboard(dash);

      const cards = await api.getDueFlashcards();
      if (cards && cards.length > 0) {
        setFlashcards(cards);
      } else {
        // Generate seed flashcards if none exist
        const genCards = await api.generateFlashcards();
        setFlashcards(genCards || []);
      }
    } catch (err) {
      console.error("Failed to load revision data:", err);
    }
  };

  const handleRateCard = async (grade: number) => {
    if (!flashcards[currentCardIndex]) return;
    const cardId = flashcards[currentCardIndex].id;
    try {
      const res = await api.reviewFlashcard(cardId, grade);
      setReviewResult(`Rated ${grade}/5: ${res.status === 'passed' ? `Scheduled in ${res.interval_days} day(s)` : 'Scheduled tomorrow'}`);
      
      setTimeout(() => {
        setIsFlipped(false);
        setReviewResult(null);
        if (currentCardIndex < flashcards.length - 1) {
          setCurrentCardIndex(prev => prev + 1);
        } else {
          // Finished deck
          setCurrentCardIndex(0);
          loadDashboardAndCards();
        }
      }, 1200);
    } catch (err) {
      console.error("Failed to submit card review:", err);
    }
  };

  const activeCard = flashcards[currentCardIndex];

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="bg-[#141414] border border-white/10 rounded-2xl p-6 shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-xs uppercase font-bold text-amber-400 tracking-wider px-2 py-0.5 rounded-full bg-amber-400/10 border border-amber-400/20 flex items-center gap-1.5">
              <Zap size={12} /> REVISION INTELLIGENCE
            </span>
            <span className="text-xs text-slate-400">SM-2 Spaced Repetition & Active Recall</span>
          </div>
          <h2 className="text-2xl font-bold text-white tracking-tight">
            Adaptive Mastery & Spaced Retrieval
          </h2>
          <p className="text-xs text-slate-400 mt-1 max-w-xl">
            Schedules topic reviews precisely at the moment of predicted memory decay using empirical assessment evidence.
          </p>
        </div>

        {/* Overall Mastery Gauge */}
        <div className="bg-[#0D0D0D] border border-white/10 rounded-2xl p-4 flex items-center gap-4 shrink-0 shadow-inner">
          <div className="text-center">
            <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider block">Overall Mastery</span>
            <span className="text-3xl font-extrabold text-[#22C55E]">
              {dashboard ? `${dashboard.overall_mastery}%` : '—'}
            </span>
          </div>
          <div className="w-px h-10 bg-white/10" />
          <div className="text-xs text-slate-300 space-y-0.5">
            <div>🟢 {dashboard?.strong_topics?.length ?? 0} Strong Topics</div>
            <div>🟠 {dashboard?.needs_revision_topics?.length ?? 0} Needs Revision</div>
          </div>
        </div>
      </div>

      {/* Intelligent Revision Recommendation Alert */}
      {dashboard?.recommendations && dashboard.recommendations.length > 0 && (
        <div className="bg-gradient-to-r from-amber-500/10 via-amber-500/5 to-transparent border border-amber-500/20 rounded-2xl p-5 space-y-2">
          <div className="flex items-center gap-2">
            <Sparkles className="text-amber-400" size={16} />
            <span className="text-xs font-bold text-amber-300 uppercase tracking-wider">
              Diagnostic Revision Recommendation
            </span>
          </div>
          <p className="text-xs text-slate-200 leading-relaxed font-normal">
            "{dashboard.recommendations[0].message}"
          </p>
          <div className="text-xs font-medium text-amber-400 bg-amber-500/10 p-2.5 rounded-xl border border-amber-500/20 inline-block">
            👉 Action Plan: {dashboard.recommendations[0].recommended_action}
          </div>
        </div>
      )}

      {/* Interactive Active Recall Flashcard Deck (SM-2) */}
      <div className="bg-[#141414] border border-white/10 rounded-2xl p-6 shadow-xl space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Brain className="text-[#3B82F6]" size={18} />
            <h3 className="font-bold text-base text-white">Active Recall Flashcard Deck</h3>
          </div>
          <span className="text-xs text-slate-400">
            Card {flashcards.length > 0 ? currentCardIndex + 1 : 0} of {flashcards.length}
          </span>
        </div>

        {activeCard ? (
          <div className="space-y-4">
            {/* Flashcard Card View */}
            <div 
              onClick={() => setIsFlipped(!isFlipped)}
              className="min-h-[220px] bg-gradient-to-b from-[#1C1C22] to-[#121216] border border-white/15 hover:border-white/25 rounded-2xl p-8 flex flex-col justify-between cursor-pointer select-none transition-all shadow-2xl relative overflow-hidden"
            >
              <div className="flex items-center justify-between text-xs text-slate-400">
                <span className="uppercase font-bold tracking-wider text-[#3B82F6] flex items-center gap-1.5">
                  <Layers size={13} /> {isFlipped ? "Answer & Core Law" : "Active Recall Challenge"}
                </span>
                <span className="text-slate-500 text-[11px]">Click to flip card ↻</span>
              </div>

              <div className="my-auto py-4 text-center">
                {isFlipped ? (
                  <p className="text-base md:text-lg font-semibold text-emerald-300 leading-relaxed animate-fade-in">
                    {activeCard.back_answer}
                  </p>
                ) : (
                  <p className="text-base md:text-lg font-bold text-white leading-relaxed">
                    {activeCard.front_prompt}
                  </p>
                )}
              </div>

              <div className="flex items-center justify-between text-[11px] text-slate-400 pt-2 border-t border-white/5">
                <span>Repetitions: {activeCard.repetition_count}</span>
                <span>Ease Factor: {activeCard.ease_factor}</span>
                <span>Interval: {activeCard.interval_days} day(s)</span>
              </div>
            </div>

            {/* SM-2 Recall Rating Scale (0 to 5) */}
            {isFlipped && (
              <div className="space-y-2 animate-fade-in">
                <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wide block text-center">
                  Rate your active recall quality (SM-2 Interval Recalculation):
                </span>
                <div className="grid grid-cols-2 sm:grid-cols-6 gap-2">
                  {[
                    { grade: 0, label: "0 - Blackout", color: "bg-rose-500/20 text-rose-300 border-rose-500/30" },
                    { grade: 1, label: "1 - Wrong", color: "bg-red-500/20 text-red-300 border-red-500/30" },
                    { grade: 2, label: "2 - Hard Error", color: "bg-orange-500/20 text-orange-300 border-orange-500/30" },
                    { grade: 3, label: "3 - Effortful Pass", color: "bg-yellow-500/20 text-yellow-300 border-yellow-500/30" },
                    { grade: 4, label: "4 - Good Recall", color: "bg-emerald-500/20 text-emerald-300 border-emerald-500/30" },
                    { grade: 5, label: "5 - Perfect Recall", color: "bg-teal-500/20 text-teal-300 border-teal-500/30 font-bold" }
                  ].map((btn) => (
                    <button
                      key={btn.grade}
                      onClick={() => handleRateCard(btn.grade)}
                      className={`p-2.5 rounded-xl border text-xs font-medium text-center transition-all hover:scale-[1.02] ${btn.color}`}
                    >
                      {btn.label}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {reviewResult && (
              <div className="bg-emerald-500/10 border border-emerald-500/20 p-3 rounded-xl text-center text-xs text-emerald-300 font-semibold animate-fade-in">
                {reviewResult}
              </div>
            )}
          </div>
        ) : (
          <div className="text-center py-10 text-slate-400 text-xs">
            No due flashcards for today! You are all caught up on spaced repetition.
          </div>
        )}
      </div>

      {/* Topic Mastery & Exam Countdown Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Topic Breakdown */}
        <div className="bg-[#141414] border border-white/10 rounded-2xl p-5 space-y-3">
          <span className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-1.5">
            <Award size={15} className="text-[#22C55E]" /> Topic Mastery Diagnostic
          </span>

          <div className="space-y-2 text-xs">
            {dashboard?.strong_topics?.map((t: any, i: number) => (
              <div key={i} className="flex items-center justify-between p-2.5 rounded-xl bg-[#0D0D0D] border border-white/5">
                <div>
                  <span className="font-semibold text-white block">{t.topic_name}</span>
                  <span className="text-[10px] text-slate-400">{t.category}</span>
                </div>
                <span className="px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 font-bold">
                  {t.mastery_percentage}%
                </span>
              </div>
            ))}

            {dashboard?.needs_revision_topics?.map((t: any, i: number) => (
              <div key={i} className="flex items-center justify-between p-2.5 rounded-xl bg-[#0D0D0D] border border-white/5">
                <div>
                  <span className="font-semibold text-white block">{t.topic_name}</span>
                  <span className="text-[10px] text-amber-400 font-medium">Needs Retrieval Practice</span>
                </div>
                <span className="px-2 py-0.5 rounded bg-amber-500/10 text-amber-400 border border-amber-500/20 font-bold">
                  {t.mastery_percentage}%
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Exam Countdown & Schedule */}
        <div className="bg-[#141414] border border-white/10 rounded-2xl p-5 space-y-3">
          <span className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-1.5">
            <Calendar size={15} className="text-indigo-400" /> Upcoming Examinations & Deadlines
          </span>

          <div className="space-y-2 text-xs">
            {dashboard?.exam_countdowns?.map((ex: any, i: number) => (
              <div key={i} className="flex items-center justify-between p-3 rounded-xl bg-[#0D0D0D] border border-white/5">
                <div>
                  <span className="font-semibold text-white block">{ex.subject}</span>
                  <span className="text-[10px] text-slate-400">{ex.exam_date}</span>
                </div>
                <span className="px-3 py-1 rounded-xl bg-indigo-500/10 text-indigo-300 border border-indigo-500/20 font-bold">
                  {ex.days_remaining} Days Left
                </span>
              </div>
            ))}
          </div>

          <div className="pt-2">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wide block mb-1.5">Upcoming Spaced Sessions:</span>
            <div className="space-y-1.5 text-xs text-slate-300">
              {dashboard?.upcoming_revision_schedule?.map((item: any, i: number) => (
                <div key={i} className="flex items-center justify-between bg-white/5 px-2.5 py-1.5 rounded-lg">
                  <span>{item.topic} ({item.type})</span>
                  <span className="text-slate-400 text-[10px]">{item.date} • {item.duration_mins}m</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
