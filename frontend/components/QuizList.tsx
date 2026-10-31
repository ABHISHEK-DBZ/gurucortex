'use client';

import { useState, useEffect } from 'react';
import api from '@/lib/api-client';
import type { Quiz, QuizCreateRequest } from '@/types/quiz';

interface QuizListProps {
  onSelectQuiz: (quizId: string) => void;
  selectedDocumentIds?: string[];
  selectedDocumentNames?: string[];
}

export default function QuizList({
  onSelectQuiz,
  selectedDocumentIds = [],
  selectedDocumentNames = [],
}: QuizListProps) {
  const [quizzes, setQuizzes] = useState<Quiz[]>([]);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [showGenerateForm, setShowGenerateForm] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Quiz generation form state
  const [numQuestions, setNumQuestions] = useState(10);
  const [difficulty, setDifficulty] = useState('mixed');

  useEffect(() => {
    loadQuizzes();
  }, []);

  const loadQuizzes = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await api.listQuizzes(50, 0);
      setQuizzes(data.quizzes);
    } catch (err) {
      console.error('Failed to load quizzes:', err);
      setError('Failed to load quizzes');
    } finally {
      setLoading(false);
    }
  };

  const handleGenerateQuiz = async () => {
    if (generating) return;

    try {
      setGenerating(true);
      setError(null);

      // Debug logging
      console.log('🔍 Quiz Generation Debug:');
      console.log('  Selected Document IDs:', selectedDocumentIds);
      console.log('  Selected Document Names:', selectedDocumentNames);
      console.log('  Number of Questions:', numQuestions);
      console.log('  Difficulty:', difficulty);

      const request: QuizCreateRequest = {
        document_ids: selectedDocumentIds.length > 0 ? selectedDocumentIds : undefined,
        num_questions: numQuestions,
        difficulty: difficulty,
      };

      console.log('  Request payload:', JSON.stringify(request, null, 2));

      const newQuiz = await api.generateQuiz(request);

      console.log('✅ Quiz generated successfully:', newQuiz.id);
      console.log('  Questions count:', newQuiz.question_count || (newQuiz as any).questions?.length || 0);

      // Add to list
      setQuizzes([newQuiz, ...quizzes]);
      setShowGenerateForm(false);

      // Auto-select new quiz
      onSelectQuiz(newQuiz.id);
    } catch (err: any) {
      console.error('❌ Failed to generate quiz:', err);
      console.error('  Error details:', err.response?.data);
      setError(err.response?.data?.detail || 'Failed to generate quiz. Make sure documents are uploaded.');
    } finally {
      setGenerating(false);
    }
  };

  const handleDeleteQuiz = async (quizId: string, e: React.MouseEvent) => {
    e.stopPropagation();

    if (!confirm('Delete this quiz?')) return;

    try {
      await api.deleteQuiz(quizId);
      setQuizzes(quizzes.filter((q) => q.id !== quizId));
    } catch (err) {
      console.error('Failed to delete quiz:', err);
      alert('Failed to delete quiz');
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString();
  };

  return (
    <div className="flex flex-col h-full">
      {/* Header - Cyberpunk Style */}
      <div className="gc-card p-6 mb-6 border-b-2 border-cyan-500/20">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-3xl font-display font-bold text-white mb-1">
              Assessment Hub
            </h2>
            <p className="text-sm text-slate-400 font-mono">
              AI-generated quizzes from your study materials
            </p>
          </div>
          <button
            onClick={() => setShowGenerateForm(!showGenerateForm)}
            className="gc-btn-primary flex items-center gap-2"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            Generate Quiz
          </button>
        </div>

        {/* Generate Quiz Form - Cyberpunk */}
        {showGenerateForm && (
          <div className="mt-6 gc-card p-6 border-2 border-cyan-500/30 bg-[rgb(var(--bg-elevated))] space-y-6">
            <h3 className="text-xl font-display font-semibold tracking-tight text-white flex items-center gap-2">
              <span className="w-2 h-2 bg-cyan-400 rounded-full animate-pulse"></span>
              Generate New Quiz
            </h3>

            {/* Document Selection Indicator */}
            {selectedDocumentIds.length > 0 ? (
              <div className="gc-card p-4 border-l-4 border-l-cyan-500 bg-cyan-500/10">
                <div className="flex items-start gap-3">
                  <svg className="w-5 h-5 text-cyan-400 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <div>
                    <div className="text-sm font-semibold text-cyan-400 mb-1">Using Selected Documents</div>
                    <div className="text-xs text-slate-400 font-mono">
                      {selectedDocumentNames.length > 0 ? selectedDocumentNames.join(', ') : `${selectedDocumentIds.length} document(s) selected`}
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <div className="gc-card p-4 border-l-4 border-l-amber-500 bg-amber-500/10">
                <div className="flex items-start gap-3">
                  <svg className="w-5 h-5 text-amber-400 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                  </svg>
                  <div>
                    <div className="text-sm font-semibold text-amber-400 mb-1">All Documents Mode</div>
                    <div className="text-xs text-slate-400 font-mono">
                      Quiz will be generated from all uploaded documents
                    </div>
                  </div>
                </div>
              </div>
            )}

            <div className="space-y-6">
              {/* Number of Questions */}
              <div>
                <label className="block text-sm font-semibold text-slate-300 mb-3">
                  Number of Questions: <span className="text-lime-400 font-mono">{numQuestions}</span>
                </label>
                <div className="relative">
                  <input
                    type="range"
                    min="5"
                    max="20"
                    value={numQuestions}
                    onChange={(e) => setNumQuestions(parseInt(e.target.value))}
                    className="w-full h-2 bg-slate-700 rounded-lg appearance-none cursor-pointer 
                    [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-4 [&::-webkit-slider-thumb]:h-4 
                    [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-[#22C55E] [&::-webkit-slider-thumb]:shadow-[0_0_10px_rgba(34,197,94,0.5)]
                    [&::-webkit-slider-thumb]:cursor-pointer"
                  />
                  <div className="flex justify-between text-xs text-slate-500 font-mono mt-2">
                    <span>5</span>
                    <span>20</span>
                  </div>
                </div>
              </div>

              {/* Difficulty */}
              <div>
                <label className="block text-sm font-semibold text-slate-300 mb-3">
                  Difficulty Level
                </label>
                <div className="grid grid-cols-4 gap-2">
                  {['easy', 'medium', 'hard', 'mixed'].map((level) => (
                    <button
                      key={level}
                      onClick={() => setDifficulty(level)}
                      className={`py-2.5 px-4 rounded-lg font-semibold text-sm transition-all capitalize ${
                        difficulty === level
                          ? 'bg-[#22C55E] text-[#0D0D0D] shadow-[0_0_15px_rgba(34,197,94,0.4)]'
                          : 'bg-slate-700/50 text-slate-400 hover:bg-slate-700 hover:text-slate-200'
                      }`}
                    >
                      {level}
                    </button>
                  ))}
                </div>
              </div>

              {/* Generate Buttons */}
              <div className="flex gap-3 pt-2">
                <button
                  onClick={handleGenerateQuiz}
                  disabled={generating}
                  className="gc-btn-primary flex-1 flex items-center justify-center gap-2"
                >
                  {generating ? (
                    <>
                      <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      Generating Quiz...
                    </>
                  ) : (
                    <>
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                      </svg>
                      Generate Quiz
                    </>
                  )}
                </button>
                <button
                  onClick={() => setShowGenerateForm(false)}
                  className="gc-btn-secondary px-6"
                >
                  Cancel
                </button>
              </div>

              {error && (
                <div className="gc-card p-4 border-l-4 border-l-red-500 bg-red-500/10 animate-fade-in">
                  <p className="text-sm text-red-400 font-medium">{error}</p>
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Quiz List */}
      <div className="flex-1 overflow-y-auto px-6 pb-6">
        {loading && (
          <div className="text-center py-16">
            <div className="w-12 h-12 border-4 border-cyan-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
            <p className="text-slate-400 font-mono text-sm">Loading quizzes...</p>
          </div>
        )}

        {!loading && quizzes.length === 0 && (
          <div className="text-center py-16">
            <div className="w-20 h-20 mx-auto mb-6 rounded-xl bg-gradient-to-br from-cyan-500/20 to-purple-500/20 flex items-center justify-center text-4xl">
              📝
            </div>
            <p className="text-xl font-display font-semibold tracking-tight text-white mb-2">No Quizzes Yet</p>
            <p className="text-sm text-slate-400 font-mono mb-6">Upload documents and generate your first quiz!</p>
            <button
              onClick={() => setShowGenerateForm(true)}
              className="gc-btn-primary"
            >
              Create First Quiz
            </button>
          </div>
        )}

        {!loading && quizzes.length > 0 && (
          <div className="grid gap-4">
            {quizzes.map((quiz) => (
              <div
                key={quiz.id}
                onClick={() => onSelectQuiz(quiz.id)}
                className="group gc-card p-6 cursor-pointer transition-all duration-300 hover:border-cyan-500/50 hover:shadow-[0_0_20px_rgba(0,212,255,0.15)] hover:-translate-y-0.5"
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <h3 className="text-xl font-display font-bold text-white mb-2 group-hover:text-cyan-400 transition-colors">
                      {quiz.title}
                    </h3>
                    {quiz.description && (
                      <p className="text-sm text-slate-400 mb-4 line-clamp-2">
                        {quiz.description}
                      </p>
                    )}
                    <div className="flex items-center gap-4 text-xs font-mono">
                      <span className="flex items-center gap-1.5 text-slate-400">
                        <svg className="w-4 h-4 text-cyan-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                        </svg>
                        {quiz.question_count} questions
                      </span>
                      <span className={`px-3 py-1 rounded-full font-semibold capitalize ${
                        quiz.difficulty === 'easy' ? 'bg-emerald-500/20 text-emerald-400' :
                        quiz.difficulty === 'medium' ? 'bg-amber-500/20 text-amber-400' :
                        quiz.difficulty === 'hard' ? 'bg-red-500/20 text-red-400' :
                        'bg-purple-500/20 text-purple-400'
                      }`}>
                        {quiz.difficulty}
                      </span>
                      <span className="text-slate-500">•</span>
                      <span className="text-slate-400">{formatDate(quiz.created_at)}</span>
                    </div>
                  </div>

                  {/* Delete Button */}
                  <button
                    onClick={(e) => handleDeleteQuiz(quiz.id, e)}
                    className="opacity-0 group-hover:opacity-100 p-2.5 hover:bg-red-500/20 rounded-lg transition-all"
                    title="Delete quiz"
                  >
                    <svg className="w-5 h-5 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
