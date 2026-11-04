import axios from 'axios';
import type {
  Conversation,
  ConversationDetail,
  ConversationList,
  ConversationCreateRequest,
  ConversationUpdateRequest,
  ContextInfo,
} from '@/types/conversation';
import type {
  Quiz,
  QuizDetail,
  QuizList,
  QuizCreateRequest,
  QuizSession,
  QuizSessionStart,
  AnswerSubmit,
  QuestionResponse,
  QuizResults,
} from '@/types/quiz';
import type {
  Topic,
  TopicMastery,
  OverallStats,
  TopicPerformance,
  QuizHistoryItem,
  LearningRecommendations,
  ExtractedTopic,
  MasteryUpdate,
} from '@/types/analytics';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

export interface ChatRequest {
  query: string;
  conversation_id?: string;
  document_ids?: string[];
  include_sources?: boolean;
  generate_diagram?: boolean;
}

export interface SourceChunk {
  content: string;
  document_name: string;
  page_number?: number;
  similarity_score: number;
}

export interface ChatResponse {
  response: string;
  sources: SourceChunk[];
  mermaid_diagram?: string;
  conversation_id: string;
  timestamp: string;
}

export interface DocumentUploadResponse {
  document_id: string;
  filename: string;
  file_size: number;
  chunks_created: number;
  status: string;
  message: string;
}

export interface DocumentListItem {
  document_id: string;
  filename: string;
  file_type: string;
  file_size: number;
  chunks_created: number;
  upload_date: string;
}

export interface HealthCheck {
  ollama_connected: boolean;
  vector_db_status: string;
  documents_indexed: number;
}

async function streamSSE(
  path: string,
  body: unknown,
  onToken: (token: string) => void,
  signal?: AbortSignal
): Promise<void> {
  const res = await fetch(`${API_BASE_URL}${path}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
    signal,
  });
  if (!res.ok || !res.body) throw new Error(`Stream failed: ${res.status}`);

  const reader = res.body.getReader();
  const decoder = new TextDecoder();
  let buffer = '';

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    buffer += decoder.decode(value, { stream: true });

    let match: RegExpMatchArray | null;
    while ((match = buffer.match(/\r?\n\r?\n/)) && match.index !== undefined) {
      const rawEvent = buffer.slice(0, match.index);
      buffer = buffer.slice(match.index + match[0].length);
      const data = rawEvent
        .split(/\r?\n/)
        .filter((line) => line.startsWith('data:'))
        .map((line) => line.slice(5).replace(/^ /, ''))
        .join('\n');
      if (data === '[DONE]') return;
      if (data) onToken(data);
    }
  }
}

// API Methods
export const api = {
  // Chat endpoints
  async sendQuery(request: ChatRequest): Promise<ChatResponse> {
    const response = await apiClient.post<ChatResponse>('/chat/query', request);
    return response.data;
  },

  async getHealth(): Promise<HealthCheck> {
    const response = await apiClient.get<HealthCheck>('/chat/health');
    return response.data;
  },

  // Document endpoints
  async uploadDocument(file: File): Promise<DocumentUploadResponse> {
    const formData = new FormData();
    formData.append('file', file);

    const response = await apiClient.post<DocumentUploadResponse>(
      '/documents/upload',
      formData,
      {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      }
    );

    return response.data;
  },

  async getDocumentCount(): Promise<{ total_chunks: number }> {
    const response = await apiClient.get('/documents/count');
    return response.data;
  },

  async listDocuments(): Promise<{ documents: DocumentListItem[]; total: number }> {
    const response = await apiClient.get('/documents');
    return response.data;
  },

  // Phase 3: Conversation Management endpoints
  async listConversations(
    limit?: number,
    offset?: number,
    include_archived?: boolean
  ): Promise<ConversationList> {
    const params = new URLSearchParams();
    if (limit !== undefined) params.append('limit', limit.toString());
    if (offset !== undefined) params.append('offset', offset.toString());
    if (include_archived !== undefined) params.append('include_archived', include_archived.toString());

    const response = await apiClient.get<ConversationList>(
      `/conversations?${params.toString()}`
    );
    return response.data;
  },

  async createConversation(
    request?: ConversationCreateRequest
  ): Promise<Conversation> {
    const response = await apiClient.post<Conversation>('/conversations', request || {});
    return response.data;
  },

  async getConversation(conversationId: string): Promise<ConversationDetail> {
    const response = await apiClient.get<ConversationDetail>(
      `/conversations/${conversationId}`
    );
    return response.data;
  },

  async updateConversation(
    conversationId: string,
    request: ConversationUpdateRequest
  ): Promise<Conversation> {
    const response = await apiClient.patch<Conversation>(
      `/conversations/${conversationId}`,
      request
    );
    return response.data;
  },

  async deleteConversation(conversationId: string): Promise<{ success: boolean }> {
    const response = await apiClient.delete(`/conversations/${conversationId}`);
    return response.data;
  },

  async getConversationContext(conversationId: string): Promise<ContextInfo> {
    const response = await apiClient.get<ContextInfo>(
      `/conversations/${conversationId}/context`
    );
    return response.data;
  },

  // Phase 4: Assessment & Quiz endpoints
  async generateQuiz(request: QuizCreateRequest): Promise<Quiz> {
    const response = await apiClient.post<Quiz>('/assessments/generate', request);
    return response.data;
  },

  async listQuizzes(limit?: number, offset?: number): Promise<QuizList> {
    const params = new URLSearchParams();
    if (limit !== undefined) params.append('limit', limit.toString());
    if (offset !== undefined) params.append('offset', offset.toString());

    const response = await apiClient.get<QuizList>(
      `/assessments/quizzes?${params.toString()}`
    );
    return response.data;
  },

  async getQuiz(quizId: string, includeAnswers: boolean = false): Promise<QuizDetail> {
    const params = new URLSearchParams();
    if (includeAnswers) params.append('include_answers', 'true');

    const response = await apiClient.get<QuizDetail>(
      `/assessments/quizzes/${quizId}?${params.toString()}`
    );
    return response.data;
  },

  async deleteQuiz(quizId: string): Promise<{ success: boolean }> {
    const response = await apiClient.delete(`/assessments/quizzes/${quizId}`);
    return response.data;
  },

  async startQuizSession(request: QuizSessionStart): Promise<QuizSession> {
    const response = await apiClient.post<QuizSession>('/assessments/sessions', request);
    return response.data;
  },

  async submitAnswer(sessionId: string, answer: AnswerSubmit): Promise<QuestionResponse> {
    const response = await apiClient.post<QuestionResponse>(
      `/assessments/sessions/${sessionId}/submit`,
      answer
    );
    return response.data;
  },

  async completeQuiz(sessionId: string): Promise<QuizResults> {
    const response = await apiClient.post<QuizResults>(
      `/assessments/sessions/${sessionId}/complete`
    );
    return response.data;
  },

  async getQuizResults(sessionId: string): Promise<QuizResults> {
    const response = await apiClient.get<QuizResults>(
      `/assessments/sessions/${sessionId}/results`
    );
    return response.data;
  },

  // Phase 4 Week 2: Learning Analytics endpoints
  async getOverallStats(conversationId?: string, days: number = 30): Promise<OverallStats> {
    const params = new URLSearchParams();
    if (conversationId) params.append('conversation_id', conversationId);
    params.append('days', days.toString());

    const response = await apiClient.get<OverallStats>(
      `/analytics/stats?${params.toString()}`
    );
    return response.data;
  },

  async getAllTopics(limit: number = 100): Promise<{ topics: Topic[]; total: number }> {
    const response = await apiClient.get(`/analytics/topics?limit=${limit}`);
    return response.data;
  },

  async extractTopics(
    documentIds?: string[],
    maxTopics: number = 10
  ): Promise<{ topics: ExtractedTopic[]; count: number }> {
    const response = await apiClient.post('/analytics/topics/extract', {
      document_ids: documentIds,
      max_topics: maxTopics,
    });
    return response.data;
  },

  async extractQuizTopics(quizId: string): Promise<{ topics: string[]; count: number }> {
    const response = await apiClient.post(`/analytics/topics/extract-quiz/${quizId}`);
    return response.data;
  },

  async getAllMastery(
    conversationId?: string,
    limit: number = 100
  ): Promise<{ mastery: TopicMastery[]; total: number }> {
    const params = new URLSearchParams();
    if (conversationId) params.append('conversation_id', conversationId);
    params.append('limit', limit.toString());

    const response = await apiClient.get(`/analytics/mastery?${params.toString()}`);
    return response.data;
  },

  async getTopicMastery(topicId: string, conversationId?: string): Promise<TopicMastery> {
    const params = new URLSearchParams();
    if (conversationId) params.append('conversation_id', conversationId);

    const response = await apiClient.get<TopicMastery>(
      `/analytics/mastery/topic/${topicId}?${params.toString()}`
    );
    return response.data;
  },

  async getTopicsForReview(
    conversationId?: string,
    limit: number = 10
  ): Promise<{ topics: TopicMastery[]; count: number; should_review: boolean }> {
    const params = new URLSearchParams();
    if (conversationId) params.append('conversation_id', conversationId);
    params.append('limit', limit.toString());

    const response = await apiClient.get(`/analytics/mastery/review?${params.toString()}`);
    return response.data;
  },

  async updateMasteryFromSession(sessionId: string): Promise<MasteryUpdate> {
    const response = await apiClient.post<MasteryUpdate>(
      `/analytics/mastery/update-session/${sessionId}`
    );
    return response.data;
  },

  async getTopicPerformance(
    conversationId?: string,
    limit: number = 20
  ): Promise<{ topics: TopicPerformance[]; count: number }> {
    const params = new URLSearchParams();
    if (conversationId) params.append('conversation_id', conversationId);
    params.append('limit', limit.toString());

    const response = await apiClient.get(`/analytics/performance/topics?${params.toString()}`);
    return response.data;
  },

  async getQuizHistory(
    conversationId?: string,
    limit: number = 20
  ): Promise<{ quizzes: QuizHistoryItem[]; count: number }> {
    const params = new URLSearchParams();
    if (conversationId) params.append('conversation_id', conversationId);
    params.append('limit', limit.toString());

    const response = await apiClient.get(`/analytics/performance/quizzes?${params.toString()}`);
    return response.data;
  },

  async getRecommendations(conversationId?: string): Promise<LearningRecommendations> {
    const params = new URLSearchParams();
    if (conversationId) params.append('conversation_id', conversationId);

    const response = await apiClient.get<LearningRecommendations>(
      `/analytics/recommendations?${params.toString()}`
    );
    return response.data;
  },

  // Phase 3: Code Execution
  async executeCode(code: string, language: string = 'python', conversationId?: string): Promise<{
    execution_id: string; output: string; error: string | null; execution_time: number; language: string;
  }> {
    const response = await apiClient.post('/code/execute', { code, language, conversation_id: conversationId });
    return response.data;
  },

  async getCodeHistory(conversationId?: string, limit: number = 20): Promise<{
    executions: any[]; count: number;
  }> {
    const params = new URLSearchParams();
    if (conversationId) params.append('conversation_id', conversationId);
    params.append('limit', limit.toString());
    const response = await apiClient.get(`/code/history?${params.toString()}`);
    return response.data;
  },

  // Phase 5: Study Planner
  async getStudyPlans(status?: string, daysAhead: number = 7): Promise<{
    plans: any[]; count: number;
  }> {
    const params = new URLSearchParams();
    if (status) params.append('status', status);
    params.append('days_ahead', daysAhead.toString());
    const response = await apiClient.get(`/planner/plans?${params.toString()}`);
    return response.data;
  },

  async createStudyPlan(plan: { topic_id?: string; title: string; description?: string; scheduled_date: string; duration_minutes?: number }): Promise<any> {
    const response = await apiClient.post('/planner/plans', plan);
    return response.data;
  },

  async updateStudyPlan(planId: string, update: { status?: string; scheduled_date?: string; duration_minutes?: number }): Promise<any> {
    const response = await apiClient.patch(`/planner/plans/${planId}`, update);
    return response.data;
  },

  async deleteStudyPlan(planId: string): Promise<{ success: boolean }> {
    const response = await apiClient.delete(`/planner/plans/${planId}`);
    return response.data;
  },

  async generateStudyPlan(days: number = 7): Promise<{ plans_created: number; plans: any[] }> {
    const response = await apiClient.post(`/planner/generate?days=${days}`);
    return response.data;
  },

  // Phase 5: Gamification
  async getBadges(): Promise<{ badges: any[]; earned: number; total: number }> {
    const response = await apiClient.get('/gamification/badges');
    return response.data;
  },

  async checkBadges(): Promise<{ newly_earned: string[]; stats: any; count: number }> {
    const response = await apiClient.post('/gamification/check-badges');
    return response.data;
  },

  async getGamificationStats(): Promise<{
    badges_earned: number; total_badges: number; quizzes_completed: number;
    streak_days: number; total_study_minutes: number; topics_mastered: number; level: number;
  }> {
    const response = await apiClient.get('/gamification/stats');
    return response.data;
  },

  // Phase 4: Podcast Generation
  async generatePodcastScript(topic?: string, duration?: string, style?: string): Promise<{
    title: string; speakers: string[]; segments: { speaker: string; text: string }[];
    duration_estimate: string; style: string; segment_count: number;
  }> {
    const response = await apiClient.post('/podcast/generate-script', { topic, duration, style });
    return response.data;
  },

  // Phase 4: Protege Effect (Teach-Back Mode)
  async startProtegeSession(topic?: string, difficulty?: string): Promise<{
    topic: string; difficulty: string; ai_message: string; instructions: string;
  }> {
    const response = await apiClient.post('/protege/start', { topic, difficulty });
    return response.data;
  },

  async protegeEvaluate(sessionTopic: string, conversationHistory: { role: string; content: string }[]): Promise<{
    scores: Record<string, number>;
    overall_score: number;
    max_score: number;
    percentage: number;
    feedback: string;
    strengths: string;
    improvements: string;
    grade: string;
  }> {
    const response = await apiClient.post('/protege/evaluate', {
      session_topic: sessionTopic,
      conversation_history: conversationHistory
    });
    return response.data;
  },

  async protegeRespond(sessionTopic: string, userExplanation: string, history: { role: string; content: string }[]): Promise<{
    ai_message: string;
  }> {
    const response = await apiClient.post('/protege/respond', {
      session_topic: sessionTopic,
      user_explanation: userExplanation,
      conversation_history: history
    });
    return response.data;
  },

  async evaluateTeaching(sessionTopic: string, history: { role: string; content: string }[]): Promise<{
    scores: Record<string, number>; overall_score: number; max_score: number;
    percentage: number; feedback: string; strengths: string; improvements: string; grade: string;
  }> {
    const response = await apiClient.post('/protege/evaluate', {
      session_topic: sessionTopic, conversation_history: history
    });
    return response.data;
  },

  // Multimodal: TTS
  async synthesizeSpeech(text: string, language?: string): Promise<Blob> {
    const response = await apiClient.post('/multimodal/synthesize-speech',
      { text, language: language || 'en' },
      { responseType: 'blob' }
    );
    return response.data;
  },

  // Badges system
  async checkBadgeProgress(): Promise<any> {
    const response = await apiClient.get('/badges/check-progress');
    return response.data;
  },

  // Document management
  async deleteDocument(documentId: string): Promise<{ message: string }> {
    const response = await apiClient.delete(`/documents/${documentId}`);
    return response.data;
  },

  // ================= GuruCortex 2.0 APIs =================
  // Visual Intelligence Studio
  async extractConcepts(documentId: string): Promise<any[]> {
    const res = await apiClient.post(`/api/v1/visual/extract/${documentId}`);
    return res.data;
  },

  async getConcepts(documentId: string): Promise<any[]> {
    const res = await apiClient.get(`/api/v1/visual/concepts/${documentId}`);
    return res.data;
  },

  async getVisualExplanation(conceptId: string): Promise<any> {
    const res = await apiClient.get(`/api/v1/visual/explanation/${conceptId}`);
    return res.data;
  },

  async getVisualExplanationByTitle(title: string): Promise<any> {
    const res = await apiClient.post('/api/v1/visual/explanation/by-title', { title });
    return res.data;
  },

  async getRealityConnection(topicName: string, conceptId?: string): Promise<any> {
    const url = conceptId 
      ? `/api/v1/visual/reality/${encodeURIComponent(topicName)}?concept_id=${conceptId}`
      : `/api/v1/visual/reality/${encodeURIComponent(topicName)}`;
    const res = await apiClient.post(url);
    return res.data;
  },

  async streamReality(
    topic: string,
    onToken: (token: string) => void,
    depth: string = 'comprehensive',
    signal?: AbortSignal
  ): Promise<void> {
    return streamSSE('/api/v1/visual/reality/stream', { concept: topic, depth }, onToken, signal);
  },

  // Revision Intelligence (SM-2 & Flashcards)
  async getRevisionDashboard(): Promise<any> {
    const res = await apiClient.get('/api/v1/revision/dashboard');
    return res.data;
  },

  async getDueFlashcards(limit: number = 20): Promise<any[]> {
    const res = await apiClient.get(`/api/v1/revision/flashcards/due?limit=${limit}`);
    return res.data;
  },

  async generateFlashcards(documentId?: string, conceptId?: string, count: number = 5): Promise<any[]> {
    const res = await apiClient.post('/api/v1/revision/flashcards/generate', {
      document_id: documentId,
      concept_id: conceptId,
      count
    });
    return res.data;
  },

  async reviewFlashcard(flashcardId: string, grade: number): Promise<any> {
    const res = await apiClient.post('/api/v1/revision/flashcards/review', {
      flashcard_id: flashcardId,
      grade
    });
    return res.data;
  },

  // Cognitive Learning Coach & Growth Profile
  async getCoachRecommendations(studentId: string = 'default_student'): Promise<any[]> {
    const res = await apiClient.get(`/api/v1/coach/recommendations?student_id=${studentId}`);
    return res.data;
  },

  async updateCoachRecommendationStatus(recId: string, status: string): Promise<any> {
    const res = await apiClient.post(`/api/v1/coach/recommendations/${recId}/status?status=${status}`);
    return res.data;
  },

  async getLearningIdentity(studentId: string = 'default_student'): Promise<any> {
    const res = await apiClient.get(`/api/v1/coach/identity?student_id=${studentId}`);
    return res.data;
  },

  async addStudentProject(projectData: any, studentId: string = 'default_student'): Promise<any> {
    const res = await apiClient.post(`/api/v1/coach/projects?student_id=${studentId}`, projectData);
    return res.data;
  },

  async streamCoachAdvice(
    query: string,
    onToken: (token: string) => void,
    studentId: string = 'default_student',
    signal?: AbortSignal
  ): Promise<void> {
    return streamSSE('/api/v1/coach/stream', { student_id: studentId, query }, onToken, signal);
  },

  // FuturePath AI (Career & Skills Guidance)
  async getCareerPathways(subject: string = 'electronics'): Promise<any[]> {
    const res = await apiClient.get(`/api/v1/career/pathways/${encodeURIComponent(subject)}`);
    return res.data;
  },

  async analyzeCareerSkillGap(pathwayTitle: string, studentId: string = 'default_student'): Promise<any> {
    const res = await apiClient.get(`/api/v1/career/gap-analysis?pathway_title=${encodeURIComponent(pathwayTitle)}&student_id=${studentId}`);
    return res.data;
  },

  async generateCareerRoadmap(pathwayTitle: string, studentId: string = 'default_student'): Promise<any> {
    const res = await apiClient.post(`/api/v1/career/roadmap?pathway_title=${encodeURIComponent(pathwayTitle)}&student_id=${studentId}`);
    return res.data;
  },

  // Focus Intelligence & Wellness
  async getFocusDashboard(): Promise<any> {
    const res = await apiClient.get('/api/v1/focus/dashboard');
    return res.data;
  },

  async startFocusSession(subject: string, targetDurationMinutes: number = 25, studyGoals?: string): Promise<any> {
    const res = await apiClient.post('/api/v1/focus/session/start', {
      subject,
      target_duration_minutes: targetDurationMinutes,
      study_goals: studyGoals
    });
    return res.data;
  },

  async endFocusSession(data: {
    session_id: string;
    actual_duration_seconds: number;
    distraction_count?: number;
    distraction_notes?: string[];
    reflection?: string;
    productivity_rating?: number;
  }): Promise<any> {
    const res = await apiClient.post('/api/v1/focus/session/end', data);
    return res.data;
  },

  async logWellness(data: {
    log_date: string;
    bedtime: string;
    wake_time: string;
    sleep_duration_hours: number;
    energy_level: number;
    study_readiness: number;
    notes?: string;
  }): Promise<any> {
    const res = await apiClient.post('/api/v1/focus/wellness', data);
    return res.data;
  },

  // Parent Connect Portal
  async getStudentLinkCode(studentId: string = 'default_student'): Promise<{ link_code: string; student_id: string }> {
    const res = await apiClient.get(`/api/v1/parent/code?student_id=${studentId}`);
    return res.data;
  },

  async linkParentAccount(parentName: string, parentEmail: string, linkCode: string): Promise<any> {
    const res = await apiClient.post('/api/v1/parent/link', {
      parent_name: parentName,
      parent_email: parentEmail,
      link_code: linkCode
    });
    return res.data;
  },

  async getParentDashboard(studentId: string = 'default_student'): Promise<any> {
    const res = await apiClient.get(`/api/v1/parent/dashboard?student_id=${studentId}`);
    return res.data;
  },

  // Institution / Teacher Mode
  async getInstitutionDashboard(): Promise<any> {
    const res = await apiClient.get('/api/v1/institution/dashboard');
    return res.data;
  },

  async createClassroom(name: string, subject: string, teacherName: string): Promise<any> {
    const res = await apiClient.post('/api/v1/institution/classrooms', {
      name,
      subject,
      teacher_name: teacherName
    }, { headers: { 'X-Guru-Role': 'teacher' } });
    return res.data;
  },

  async createAssignment(data: {
    classroom_id: string;
    title: string;
    topic?: string;
    document_id?: string;
    due_date: string;
    instructions: string;
  }): Promise<any> {
    const res = await apiClient.post('/api/v1/institution/assignments', data, {
      headers: { 'X-Guru-Role': 'teacher' }
    });
    return res.data;
  },
};

export default api;
