with open('lib/api-client.ts', 'r', encoding='utf-8') as f:
    content = f.read()

content = content.replace("|| 'http://localhost:8001'", "|| 'http://localhost:8000'")

new_methods = """
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

  async getRealityConnection(topicName: string, conceptId?: string): Promise<any> {
    const url = conceptId 
      ? `/api/v1/visual/reality/${encodeURIComponent(topicName)}?concept_id=${conceptId}`
      : `/api/v1/visual/reality/${encodeURIComponent(topicName)}`;
    const res = await apiClient.post(url);
    return res.data;
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
    });
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
    const res = await apiClient.post('/api/v1/institution/assignments', data);
    return res.data;
  },
"""

if 'getVisualExplanation' not in content:
    idx = content.rfind('};')
    if idx != -1:
        content = content[:idx] + new_methods + content[idx:]
        with open('lib/api-client.ts', 'w', encoding='utf-8') as f:
            f.write(content)
        print('SUCCESS: frontend/lib/api-client.ts updated!')
    else:
        print('Could not find end of object')
else:
    print('Methods already present')
