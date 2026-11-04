'use client';

import React, { useState, useEffect } from 'react';
import { 
  Play, Pause, RotateCcw, AlertTriangle, Moon, 
  Clock, Sparkles, Shield
} from 'lucide-react';
import api from '@/lib/api-client';

export default function FocusIntelligence() {
  const [dashboard, setDashboard] = useState<any>(null);

  // Timer state
  const [timerDurationMinutes, setTimerDurationMinutes] = useState(25);
  const [secondsRemaining, setSecondsRemaining] = useState(25 * 60);
  const [isActive, setIsActive] = useState(false);
  const sessionSubject = "Semiconductor Physics";
  const studyGoals = "Complete PN junction derivations and 5 flashcards";
  const [activeSessionId, setActiveSessionId] = useState<string | null>(null);

  // Distraction tracking
  const [distractionCount, setDistractionCount] = useState(0);
  const [distractionNote, setDistractionNote] = useState("");
  const [distractionNotes, setDistractionNotes] = useState<string[]>([]);
  const sessionReflection = "";
  const [distractionAlert, setDistractionAlert] = useState<string | null>(null);

  // Wellness form
  const [bedtime, setBedtime] = useState("23:00");
  const [wakeTime, setWakeTime] = useState("07:00");
  const [sleepHours, setSleepHours] = useState(8.0);
  const energyLevel = 4;
  const [studyReadiness, setStudyReadiness] = useState(5);
  const [wellnessLogged, setWellnessLogged] = useState(false);

  useEffect(() => {
    loadFocusDashboard();
  }, []);

  const loadFocusDashboard = async () => {
    try {
      const res = await api.getFocusDashboard();
      setDashboard(res);
    } catch (err) {
      console.error("Failed to load focus dashboard:", err);
    }
  };

  // Timer interval
  useEffect(() => {
    let interval: any;
    if (isActive && secondsRemaining > 0) {
      interval = setInterval(() => {
        setSecondsRemaining(prev => prev - 1);
      }, 1000);
    } else if (secondsRemaining === 0 && isActive) {
      handleCompleteSession();
    }
    return () => clearInterval(interval);
  }, [isActive, secondsRemaining]);

  // Tab Visibility / Distraction Detection (Opt-in study tracking)
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.hidden && isActive) {
        setDistractionCount(prev => prev + 1);
        setDistractionAlert("You switched away from the active study session. Remember to stay focused!");
      }
    };

    document.addEventListener("visibilitychange", handleVisibilityChange);
    return () => document.removeEventListener("visibilitychange", handleVisibilityChange);
  }, [isActive]);

  const handleStartSession = async () => {
    try {
      const res = await api.startFocusSession(sessionSubject, timerDurationMinutes, studyGoals);
      setActiveSessionId(res.id);
      setSecondsRemaining(timerDurationMinutes * 60);
      setIsActive(true);
      setDistractionCount(0);
      setDistractionNotes([]);
      setDistractionAlert(null);
    } catch (err) {
      console.error("Failed to start focus session:", err);
      setIsActive(true);
    }
  };

  const handlePauseSession = () => {
    setIsActive(false);
  };

  const handleResetSession = () => {
    setIsActive(false);
    setSecondsRemaining(timerDurationMinutes * 60);
    setDistractionAlert(null);
  };

  const handleCompleteSession = async () => {
    setIsActive(false);
    const actualSecs = (timerDurationMinutes * 60) - secondsRemaining;
    if (activeSessionId) {
      try {
        await api.endFocusSession({
          session_id: activeSessionId,
          actual_duration_seconds: actualSecs > 0 ? actualSecs : timerDurationMinutes * 60,
          distraction_count: distractionCount,
          distraction_notes: distractionNotes,
          reflection: sessionReflection || "Focused on understanding core concepts.",
          productivity_rating: distractionCount === 0 ? 5 : distractionCount <= 2 ? 4 : 3
        });
        loadFocusDashboard();
      } catch (err) {
        console.error("Failed to complete focus session:", err);
      }
    }
    setDistractionAlert("🎉 Focus Session Completed! Outstanding effort.");
  };

  const handleAddDistractionNote = (e: React.FormEvent) => {
    e.preventDefault();
    if (distractionNote.trim()) {
      setDistractionNotes(prev => [...prev, distractionNote.trim()]);
      setDistractionNote("");
    }
  };

  const handleSaveWellness = async (e: React.FormEvent) => {
    e.preventDefault();
    const todayStr = new Date().toISOString().split('T')[0];
    try {
      await api.logWellness({
        log_date: todayStr,
        bedtime,
        wake_time: wakeTime,
        sleep_duration_hours: Number(sleepHours),
        energy_level: energyLevel,
        study_readiness: studyReadiness,
        notes: "Self-reported sleep routine for cognitive readiness."
      });
      setWellnessLogged(true);
      loadFocusDashboard();
      setTimeout(() => setWellnessLogged(false), 3000);
    } catch (err) {
      console.error("Failed to log wellness:", err);
    }
  };

  const formatTime = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="bg-[#141414] border border-white/10 rounded-2xl p-6 shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-xs uppercase font-bold text-emerald-400 tracking-wider px-2 py-0.5 rounded-full bg-emerald-400/10 border border-emerald-400/20 flex items-center gap-1.5">
              <Clock size={12} /> FOCUS INTELLIGENCE
            </span>
            <span className="text-xs text-slate-400">Pomodoro Companion & Wellness Tracker</span>
          </div>
          <h2 className="text-2xl font-bold text-white tracking-tight">
            Build Deep Focus & Healthy Study Habits
          </h2>
          <p className="text-xs text-slate-400 mt-1 max-w-xl">
            Gentle distraction tracking, Pomodoro focus intervals, session reflections, and cognitive rest routines.
          </p>
        </div>

        {/* Quick Stats Pill */}
        <div className="flex items-center gap-4 bg-[#0D0D0D] border border-white/10 rounded-2xl p-4 shadow-inner text-center shrink-0">
          <div>
            <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider block">Today's Focus</span>
            <span className="text-2xl font-extrabold text-[#22C55E]">
              {dashboard?.total_study_minutes ?? 0} mins
            </span>
          </div>
          <div className="w-px h-8 bg-white/10" />
          <div>
            <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider block">Distractions Avoided</span>
            <span className="text-2xl font-extrabold text-indigo-400">
              {dashboard?.total_distractions_avoided ?? 0}
            </span>
          </div>
        </div>
      </div>

      {/* Main Focus Companion Timer */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Timer Panel */}
        <div className="lg:col-span-2 bg-[#141414] border border-white/10 rounded-2xl p-8 shadow-xl flex flex-col justify-between space-y-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className={`w-3 h-3 rounded-full ${isActive ? "bg-emerald-500 animate-ping" : "bg-slate-600"}`} />
              <span className="text-xs font-bold text-white uppercase tracking-wider">
                {isActive ? "Deep Focus Session Active" : "Session Paused / Ready"}
              </span>
            </div>

            {/* Interval Selector */}
            <div className="flex items-center bg-white/5 p-1 rounded-xl border border-white/10 text-xs">
              {[
                { mins: 25, label: "25m Sprint" },
                { mins: 50, label: "50m Deep" }
              ].map((it) => (
                <button
                  key={it.mins}
                  disabled={isActive}
                  onClick={() => {
                    setTimerDurationMinutes(it.mins);
                    setSecondsRemaining(it.mins * 60);
                  }}
                  className={`px-3 py-1.5 rounded-lg font-semibold transition-all ${
                    timerDurationMinutes === it.mins
                      ? "bg-emerald-600 text-white shadow"
                      : "text-slate-400 hover:text-white"
                  }`}
                >
                  {it.label}
                </button>
              ))}
            </div>
          </div>

          {/* Huge Timer Clock Display */}
          <div className="text-center py-6">
            <div className="text-7xl md:text-8xl font-mono font-black text-white tracking-tight drop-shadow-[0_0_24px_rgba(34,197,94,0.3)]">
              {formatTime(secondsRemaining)}
            </div>
            <p className="text-xs text-slate-400 mt-3 font-medium">
              Goal: {studyGoals}
            </p>
          </div>

          {/* Distraction Alert Toast */}
          {distractionAlert && (
            <div className="bg-amber-500/10 border border-amber-500/20 p-3.5 rounded-xl text-xs text-amber-300 flex items-center justify-between animate-fade-in">
              <span>{distractionAlert}</span>
              <button onClick={() => setDistractionAlert(null)} className="text-slate-400 hover:text-white text-xs">✕</button>
            </div>
          )}

          {/* Timer Actions */}
          <div className="flex items-center justify-center gap-3 pt-2">
            {!isActive ? (
              <button
                onClick={handleStartSession}
                className="px-6 py-3 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-bold text-sm shadow-lg flex items-center gap-2 transition-all hover:scale-[1.02]"
              >
                <Play size={16} /> Start Focus Sprint
              </button>
            ) : (
              <button
                onClick={handlePauseSession}
                className="px-6 py-3 rounded-xl bg-amber-600 hover:bg-amber-500 text-white font-bold text-sm shadow-lg flex items-center gap-2 transition-all"
              >
                <Pause size={16} /> Pause Sprint
              </button>
            )}

            <button
              onClick={handleResetSession}
              className="p-3 rounded-xl bg-white/5 border border-white/10 text-slate-300 hover:bg-white/10 hover:text-white transition-colors"
              title="Reset Timer"
            >
              <RotateCcw size={16} />
            </button>

            {isActive && (
              <button
                onClick={handleCompleteSession}
                className="px-5 py-3 rounded-xl bg-white/10 border border-white/20 text-white text-xs font-semibold hover:bg-white/15 transition-colors"
              >
                Finish & Log Session
              </button>
            )}
          </div>
        </div>

        {/* Distraction Pad & Reflection Drawer */}
        <div className="bg-[#141414] border border-white/10 rounded-2xl p-6 shadow-xl flex flex-col justify-between space-y-4">
          <div>
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-1.5">
                <AlertTriangle size={14} className="text-amber-400" /> Distraction Pad
              </span>
              <span className="text-xs font-semibold text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded-full border border-amber-500/20">
                {distractionCount} Interruptions
              </span>
            </div>
            <p className="text-[11px] text-slate-400 leading-relaxed">
              When a random thought or urge arrives during study, park it here instead of switching tabs. Review during your break.
            </p>

            {/* Add Distraction Note */}
            <form onSubmit={handleAddDistractionNote} className="flex gap-2 mt-3">
              <input
                type="text"
                value={distractionNote}
                onChange={e => setDistractionNote(e.target.value)}
                placeholder="Jot down distracting thought..."
                className="flex-1 bg-[#0D0D0D] border border-white/10 rounded-xl px-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none"
              />
              <button
                type="submit"
                className="px-3 py-2 bg-white/10 hover:bg-white/15 text-white text-xs font-bold rounded-xl transition-colors"
              >
                Park
              </button>
            </form>

            {/* List of parked thoughts */}
            <div className="space-y-1.5 mt-3 max-h-36 overflow-y-auto">
              {distractionNotes.map((note, i) => (
                <div key={i} className="text-xs text-slate-300 bg-[#0D0D0D] p-2 rounded-lg border border-white/5 flex items-center justify-between">
                  <span>📌 {note}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="pt-3 border-t border-white/10 text-xs text-slate-400 flex items-center gap-1.5">
            <Shield size={14} className="text-emerald-400 shrink-0" />
            <span>Privacy First: No screen capture or keyboard monitoring.</span>
          </div>
        </div>
      </div>

      {/* Sleep & Wellness Routine Tracker */}
      <div className="bg-[#141414] border border-white/10 rounded-2xl p-6 shadow-xl space-y-4">
        <div className="flex items-center justify-between flex-wrap gap-2">
          <div className="flex items-center gap-2">
            <Moon className="text-indigo-400" size={18} />
            <h3 className="font-bold text-base text-white">Daily Cognitive Wellness & Sleep Log</h3>
          </div>
          <span className="text-xs text-slate-400">Self-reported routine to monitor mental alertness</span>
        </div>

        <form onSubmit={handleSaveWellness} className="grid grid-cols-1 sm:grid-cols-5 gap-4 items-end text-xs">
          <div>
            <label className="text-[11px] font-semibold text-slate-400 block mb-1">Bedtime</label>
            <input 
              type="time" 
              value={bedtime} 
              onChange={e => setBedtime(e.target.value)}
              className="w-full bg-[#0D0D0D] border border-white/10 rounded-xl p-2.5 text-white" 
            />
          </div>

          <div>
            <label className="text-[11px] font-semibold text-slate-400 block mb-1">Wake Time</label>
            <input 
              type="time" 
              value={wakeTime} 
              onChange={e => setWakeTime(e.target.value)}
              className="w-full bg-[#0D0D0D] border border-white/10 rounded-xl p-2.5 text-white" 
            />
          </div>

          <div>
            <label className="text-[11px] font-semibold text-slate-400 block mb-1">Duration (Hours)</label>
            <input 
              type="number" 
              step="0.5" 
              value={sleepHours} 
              onChange={e => setSleepHours(Number(e.target.value))}
              className="w-full bg-[#0D0D0D] border border-white/10 rounded-xl p-2.5 text-white" 
            />
          </div>

          <div>
            <label className="text-[11px] font-semibold text-slate-400 block mb-1">Study Readiness (1-5)</label>
            <select
              value={studyReadiness}
              onChange={e => setStudyReadiness(Number(e.target.value))}
              className="w-full bg-[#0D0D0D] border border-white/10 rounded-xl p-2.5 text-white"
            >
              {[1, 2, 3, 4, 5].map(v => (
                <option key={v} value={v}>{v} - {v === 5 ? "Fully Alert" : v === 3 ? "Moderate" : "Fatigued"}</option>
              ))}
            </select>
          </div>

          <button
            type="submit"
            className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white font-bold rounded-xl shadow transition-colors"
          >
            {wellnessLogged ? "✓ Recorded!" : "Save Wellness Log"}
          </button>
        </form>

        {/* Wellness Advice Banner */}
        <div className="bg-[#0D0D0D] p-4 rounded-xl border border-white/5 text-xs text-slate-300 leading-relaxed flex items-start gap-2.5">
          <Sparkles size={16} className="text-amber-400 shrink-0 mt-0.5" />
          <span>
            {dashboard?.wellness_advice?.[0] || "Consistent sleep schedules stabilize cognitive consolidation. Aim for 7.5 to 8.5 hours of rest."}
          </span>
        </div>
      </div>
    </div>
  );
}
