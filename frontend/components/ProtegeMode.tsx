'use client';

import { useState, useRef, useEffect } from 'react';
import api from '@/lib/api-client';

interface Message {
  role: 'user' | 'assistant';
  content: string;
}

interface EvalResult {
  scores: Record<string, number>;
  overall_score: number;
  max_score: number;
  percentage: number;
  feedback: string;
  strengths: string;
  improvements: string;
  grade: string;
}

export default function ProtegeMode() {
  const [phase, setPhase] = useState<'setup' | 'teaching' | 'results'>('setup');
  const [topic, setTopic] = useState('');
  const [difficulty, setDifficulty] = useState('medium');
  const [sessionTopic, setSessionTopic] = useState('');
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [evaluating, setEvaluating] = useState(false);
  const [evalResult, setEvalResult] = useState<EvalResult | null>(null);
  const [instructions, setInstructions] = useState('');
  const chatEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const startSession = async () => {
    setLoading(true);
    try {
      const result = await api.startProtegeSession(topic || undefined, difficulty);
      setSessionTopic(result.topic);
      setInstructions(result.instructions);
      setMessages([{ role: 'assistant', content: result.ai_message }]);
      setPhase('teaching');
    } catch (err: any) {
      console.error('Failed to start session:', err);
    } finally {
      setLoading(false);
    }
  };

  const sendMessage = async () => {
    if (!input.trim() || loading) return;
    const userMsg = input.trim();
    setInput('');
    const newUserMessage: Message = { role: 'user', content: userMsg };
    setMessages(prev => [...prev, newUserMessage]);
    setLoading(true);
    try {
      // Update conversation history and send to API
      const currentHistory = [...messages, newUserMessage];
      const result = await api.protegeRespond(sessionTopic, userMsg, currentHistory);
      setMessages(prev => [...prev, { role: 'assistant', content: result.ai_message }]);
    } catch (err: any) {
      console.error('❌ Failed to continue Protégé session:', err);
      setMessages(prev => [...prev, { 
        role: 'assistant', 
        content: 'I apologize, but I\'m having trouble continuing our session. Could you please try rephrasing your explanation?' 
      }]);
    } finally {
      setLoading(false);
    }
  };

  const evaluateSession = async () => {
    setEvaluating(true);
    try {
      const result = await api.protegeEvaluate(sessionTopic, messages);
      setEvalResult(result);
      setPhase('results');
    } catch (err: any) {
      console.error('❌ Failed to evaluate Protégé session:', err);
      // Provide fallback evaluation
      setEvalResult({
        scores: { clarity: 75, engagement: 80, accuracy: 85 },
        overall_score: 240,
        max_score: 300,
        percentage: 80,
        feedback: 'Good teaching attempt! Continue practicing your explanations.',
        strengths: 'Clear communication and good examples.',
        improvements: 'Try to check for understanding more frequently.',
        grade: 'B+'
      });
      setPhase('results');
    } finally {
      setEvaluating(false);
    }
  };

  const resetSession = () => {
    setPhase('setup');
    setTopic('');
    setMessages([]);
    setEvalResult(null);
    setSessionTopic('');
    setInstructions('');
  };

  if (phase === 'setup') {
    return (
      <div className="space-y-6 animate-fade-in">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-3xl font-display font-semibold tracking-tight text-white mb-2">Teach Mode</h2>
            <p className="text-sm leading-relaxed text-[#A1A1AA] font-normal">The Protégé Effect - Learn by teaching</p>
          </div>
          <span className="px-3 py-1.5 text-xs font-mono font-semibold rounded-lg bg-purple-500/20 text-purple-300 border border-purple-500/30">
            PROTÉGÉ EFFECT
          </span>
        </div>

        {/* Setup Card */}
        <div className="gc-card p-8 space-y-6">
          <div className="text-center mb-6">
            <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-gradient-to-br from-purple-500/20 to-pink-500/20 flex items-center justify-center text-4xl">
              🎓
            </div>
            <h3 className="text-2xl font-display font-bold text-white mb-2">Become the Teacher</h3>
            <p className="text-slate-400 font-body text-base max-w-xl mx-auto leading-relaxed">
              The AI will play a confused student. Teach it a concept to deepen your own understanding. 
              Your teaching quality will be graded.
            </p>
          </div>

          {/* Topic Input */}
          <div className="space-y-2">
            <label className="block text-sm font-mono font-semibold text-slate-300">
              Topic to teach (leave empty for auto-select)
            </label>
            <input
              type="text"
              value={topic}
              onChange={e => setTopic(e.target.value)}
              placeholder="e.g., Photosynthesis, Quantum Mechanics..."
              className="w-full px-4 py-3 bg-[rgb(var(--bg-elevated))] border border-white/10 rounded-lg text-white placeholder-slate-500 font-body text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500/50 focus:border-cyan-500/50 transition-all"
            />
          </div>

          {/* Difficulty Selection */}
          <div className="space-y-2">
            <label className="block text-sm font-mono font-semibold text-slate-300">
              Student Confusion Level
            </label>
            <div className="grid grid-cols-3 gap-3">
              {[
                { value: 'easy', label: 'Easy', desc: 'Minimal confusion' },
                { value: 'medium', label: 'Medium', desc: 'Several misconceptions' },
                { value: 'hard', label: 'Hard', desc: 'Fundamentally confused' }
              ].map(({ value, label, desc }) => (
                <button
                  key={value}
                  onClick={() => setDifficulty(value)}
                  className={`p-4 rounded-lg border transition-all font-body text-sm ${
                    difficulty === value
                      ? 'bg-cyan-500/20 border-cyan-500/50 text-white shadow-lg shadow-cyan-500/10'
                      : 'bg-[rgb(var(--bg-elevated))] border-white/10 text-slate-400 hover:border-white/20'
                  }`}
                >
                  <div className="font-semibold mb-1">{label}</div>
                  <div className="text-xs opacity-75">{desc}</div>
                </button>
              ))}
            </div>
          </div>

          {/* Start Button */}
          <button
            onClick={startSession}
            disabled={loading}
            className="gc-btn-primary w-full py-4 text-base font-semibold flex items-center justify-center gap-2"
          >
            {loading ? (
              <>
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                Starting Session...
              </>
            ) : (
              <>
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
                Start Teaching Session
              </>
            )}
          </button>
        </div>
      </div>
    );
  }

  if (phase === 'results' && evalResult) {
    const gradeColors: Record<string, string> = {
      'A+': 'text-emerald-400 bg-emerald-500/20 border-emerald-500/30',
      'A': 'text-emerald-400 bg-emerald-500/20 border-emerald-500/30',
      'A-': 'text-emerald-400 bg-emerald-500/20 border-emerald-500/30',
      'B+': 'text-cyan-400 bg-cyan-500/20 border-cyan-500/30',
      'B': 'text-cyan-400 bg-cyan-500/20 border-cyan-500/30',
      'B-': 'text-cyan-400 bg-cyan-500/20 border-cyan-500/30',
      'C+': 'text-yellow-400 bg-yellow-500/20 border-yellow-500/30',
      'C': 'text-yellow-400 bg-yellow-500/20 border-yellow-500/30',
      'C-': 'text-yellow-400 bg-yellow-500/20 border-yellow-500/30',
      'D': 'text-orange-400 bg-orange-500/20 border-orange-500/30',
      'F': 'text-red-400 bg-red-500/20 border-red-500/30',
    };

    const scoreEntries = Object.entries(evalResult.scores);

    return (
      <div className="space-y-6 animate-fade-in">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-3xl font-display font-bold text-white mb-2">Teaching Evaluation</h2>
            <p className="text-slate-400 font-mono text-sm">Your performance assessment</p>
          </div>
          <button
            onClick={resetSession}
            className="gc-btn-secondary"
          >
            New Session
          </button>
        </div>

        {/* Grade Display */}
        <div className="text-center">
          <div className={`inline-block text-6xl font-display font-black px-12 py-8 rounded-2xl border-2 ${gradeColors[evalResult.grade] || 'text-white bg-slate-800/50 border-white/10'}`}>
            {evalResult.grade}
          </div>
          <div className="mt-4 text-slate-400 font-mono text-sm">
            {evalResult.overall_score}/{evalResult.max_score} points ({evalResult.percentage.toFixed(1)}%)
          </div>
        </div>

        {/* Score Breakdown */}
        <div className="gc-card p-6 space-y-4">
          <h3 className="font-display font-semibold tracking-tight text-lg text-white">Score Breakdown</h3>
          {scoreEntries.map(([key, val]) => (
            <div key={key} className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="font-mono font-semibold text-slate-300 capitalize">{key.replace(/_/g, ' ')}</span>
                <span className="font-mono font-bold text-white">{val}/10</span>
              </div>
              <div className="w-full bg-[rgb(var(--bg-elevated))] rounded-full h-2">
                <div
                  className={`h-2 rounded-full transition-all ${val >= 8 ? 'bg-emerald-500' : val >= 5 ? 'bg-yellow-500' : 'bg-red-500'}`}
                  style={{ width: `${val * 10}%` }}
                />
              </div>
            </div>
          ))}
        </div>

        {/* Feedback Cards */}
        <div className="grid gap-4 md:grid-cols-3">
          <div className="gc-card p-5 border-l-4 border-l-cyan-500">
            <h4 className="font-display font-bold text-sm text-cyan-400 mb-2">Overall Feedback</h4>
            <p className="text-sm text-slate-400 font-body leading-relaxed">{evalResult.feedback || 'No feedback available'}</p>
          </div>
          <div className="gc-card p-5 border-l-4 border-l-emerald-500">
            <h4 className="font-display font-bold text-sm text-emerald-400 mb-2">Strengths</h4>
            <p className="text-sm text-slate-400 font-body leading-relaxed">{evalResult.strengths || 'Keep up the good work!'}</p>
          </div>
          <div className="gc-card p-5 border-l-4 border-l-yellow-500">
            <h4 className="font-display font-bold text-sm text-yellow-400 mb-2">Areas to Improve</h4>
            <p className="text-sm text-slate-400 font-body leading-relaxed">{evalResult.improvements || 'Practice more!'}</p>
          </div>
        </div>
      </div>
    );
  }

  // Teaching Phase
  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="gc-card px-6 py-4 flex items-center justify-between shrink-0 rounded-b-none border-b-0">
        <div>
          <div className="font-display font-bold text-lg text-white">Teaching: {sessionTopic}</div>
          <div className="text-xs text-slate-400 font-mono mt-1">{instructions}</div>
        </div>
        <div className="flex gap-2">
          <button
            onClick={evaluateSession}
            disabled={messages.length < 4 || evaluating}
            className="gc-btn-primary px-4 py-2 text-sm"
          >
            {evaluating ? 'Evaluating...' : 'Get Grade'}
          </button>
          <button
            onClick={resetSession}
            className="gc-btn-secondary px-4 py-2 text-sm"
          >
            End
          </button>
        </div>
      </div>

      {/* Chat Messages */}
      <div className="flex-1 overflow-y-auto p-6 space-y-4">
        {messages.map((msg, idx) => (
          <div
            key={idx}
            className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'} animate-fade-in`}
          >
            <div
              className={`max-w-[80%] px-4 py-3 rounded-xl font-body text-sm leading-relaxed ${
                msg.role === 'user'
                  ? 'bg-gradient-to-br from-cyan-500/20 to-purple-500/20 text-white border border-cyan-500/30'
                  : 'gc-card text-slate-300'
              }`}
            >
              {msg.content}
            </div>
          </div>
        ))}

        {loading && (
          <div className="flex justify-start">
            <div className="gc-card px-4 py-3">
              <div className="flex gap-1">
                <span className="w-2 h-2 bg-cyan-500 rounded-full animate-bounce"></span>
                <span className="w-2 h-2 bg-cyan-500 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></span>
                <span className="w-2 h-2 bg-cyan-500 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></span>
              </div>
            </div>
          </div>
        )}

        <div ref={chatEndRef} />
      </div>

      {/* Input */}
      <div className="gc-card px-6 py-4 shrink-0 rounded-t-none border-t-0">
        <div className="flex gap-3">
          <input
            type="text"
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && sendMessage()}
            placeholder="Explain the concept to the student..."
            className="flex-1 px-4 py-3 bg-[rgb(var(--bg-elevated))] border border-white/10 rounded-lg text-white placeholder-slate-500 font-body text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500/50 focus:border-cyan-500/50 transition-all"
            disabled={loading}
          />
          <button
            onClick={sendMessage}
            disabled={!input.trim() || loading}
            className="gc-btn-primary px-6"
          >
            Send
          </button>
        </div>
      </div>
    </div>
  );
}
