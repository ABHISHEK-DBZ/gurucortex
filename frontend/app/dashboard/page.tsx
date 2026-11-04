'use client';

import { useState } from 'react';
import dynamic from 'next/dynamic';
import { 
  MessageSquare, FileText, Code, CheckSquare, Presentation, 
  Headphones, BarChart, Trophy, Calendar, Sparkles, Compass, Zap, Brain, Briefcase, 
  Clock, HeartHandshake, Building2, Loader2
} from 'lucide-react';

const TabLoadingState = () => (
  <div className="flex flex-col items-center justify-center p-16 space-y-4 text-slate-400">
    <Loader2 className="w-8 h-8 animate-spin text-purple-500" />
    <span className="text-sm font-medium">Loading module...</span>
  </div>
);

// Core immediate components
import ChatInterface from '@/components/ChatInterface';
import DocumentUploader from '@/components/DocumentUploader';
import AccessibilityToggle from '@/components/AccessibilityToggle';

// GuruCortex 2.0 Dynamic Components (code-split per tab)
const VisualIntelligenceStudio = dynamic(() => import('@/components/VisualIntelligenceStudio'), { loading: TabLoadingState });
const ConceptRealityNavigator = dynamic(() => import('@/components/ConceptRealityNavigator'), { loading: TabLoadingState });
const RevisionIntelligence = dynamic(() => import('@/components/RevisionIntelligence'), { loading: TabLoadingState });
const CognitiveCoach = dynamic(() => import('@/components/CognitiveCoach'), { loading: TabLoadingState });
const FuturePathNavigator = dynamic(() => import('@/components/FuturePathNavigator'), { loading: TabLoadingState });
const FocusIntelligence = dynamic(() => import('@/components/FocusIntelligence'), { loading: TabLoadingState });
const ParentConnect = dynamic(() => import('@/components/ParentConnect'), { loading: TabLoadingState });
const InstitutionMode = dynamic(() => import('@/components/InstitutionMode'), { loading: TabLoadingState });

// Preserved Dynamic Components
const AssessmentHub = dynamic(() => import('@/components/AssessmentHub'), { loading: TabLoadingState });
const LearningDashboard = dynamic(() => import('@/components/LearningDashboard'), { loading: TabLoadingState });
const CodeSandbox = dynamic(() => import('@/components/CodeSandbox'), { loading: TabLoadingState });
const StudyPlanner = dynamic(() => import('@/components/StudyPlanner'), { loading: TabLoadingState });
const BadgesDisplay = dynamic(() => import('@/components/BadgesDisplay'), { loading: TabLoadingState });
const PodcastPlayer = dynamic(() => import('@/components/PodcastPlayer'), { loading: TabLoadingState });
const ProtegeMode = dynamic(() => import('@/components/ProtegeMode'), { loading: TabLoadingState });
const EyeDetectionOverlay = dynamic(() => import('@/components/EyeDetectionOverlay'), { ssr: false });

type Tab = 
  | 'chat' 
  | 'documents' 
  | 'visual'
  | 'reality'
  | 'revision'
  | 'coach'
  | 'career'
  | 'focus'
  | 'parent'
  | 'institution'
  | 'assessments' 
  | 'protege' 
  | 'code' 
  | 'analytics' 
  | 'badges' 
  | 'planner' 
  | 'podcast';

const tabs: { id: Tab; label: string; icon: React.ReactNode; group: string }[] = [
  // Core Learning
  { id: 'chat', label: 'Chat', icon: <MessageSquare size={15} />, group: 'core' },
  { id: 'documents', label: 'Docs', icon: <FileText size={15} />, group: 'core' },
  { id: 'visual', label: 'Visual Studio', icon: <Sparkles size={15} />, group: 'core' },
  { id: 'reality', label: 'Reality Nav', icon: <Compass size={15} />, group: 'core' },

  // Active Cognition
  { id: 'revision', label: 'SM-2 Revision', icon: <Zap size={15} />, group: 'learn' },
  { id: 'coach', label: 'Cognitive Coach', icon: <Brain size={15} />, group: 'learn' },
  { id: 'assessments', label: 'Quiz', icon: <CheckSquare size={15} />, group: 'learn' },
  { id: 'protege', label: 'Teach Pupil', icon: <Presentation size={15} />, group: 'learn' },

  // Future & Growth
  { id: 'career', label: 'FuturePath', icon: <Briefcase size={15} />, group: 'growth' },
  { id: 'focus', label: 'Focus Study', icon: <Clock size={15} />, group: 'growth' },
  { id: 'code', label: 'Code', icon: <Code size={15} />, group: 'growth' },

  // Support & Family
  { id: 'parent', label: 'Parent Portal', icon: <HeartHandshake size={15} />, group: 'support' },
  { id: 'institution', label: 'Teacher Mode', icon: <Building2 size={15} />, group: 'support' },
  { id: 'analytics', label: 'Stats', icon: <BarChart size={15} />, group: 'support' },
  { id: 'badges', label: 'Badges', icon: <Trophy size={15} />, group: 'support' },
  { id: 'planner', label: 'Planner', icon: <Calendar size={15} />, group: 'support' },
  { id: 'podcast', label: 'Audio', icon: <Headphones size={15} />, group: 'support' },
];

export default function Dashboard() {
  const [activeTab, setActiveTab] = useState<Tab>('chat');
  const [selectedDocumentIds, setSelectedDocumentIds] = useState<string[]>([]);
  const [selectedDocumentNames, setSelectedDocumentNames] = useState<string[]>([]);
  const [selectedConceptTopic, setSelectedConceptTopic] = useState<string>("PN Junction Diode Operation");

  const handleSelectedDocumentsChange = (documentIds: string[], documentNames: string[]) => {
    setSelectedDocumentIds(documentIds);
    setSelectedDocumentNames(documentNames);
  };

  const handleOpenChatForDocuments = (documentIds: string[], documentNames?: string[]) => {
    setSelectedDocumentIds(documentIds);
    if (documentNames) {
      setSelectedDocumentNames(documentNames);
    }
    setActiveTab('chat');
  };

  const handleClearDocumentScope = () => {
    setSelectedDocumentIds([]);
    setSelectedDocumentNames([]);
  };

  const handleNavigateToReality = (topicName: string) => {
    setSelectedConceptTopic(topicName);
    setActiveTab('reality');
  };

  const handleOpenVisualStudio = (topicName: string) => {
    setSelectedConceptTopic(topicName);
    setActiveTab('visual');
  };

  return (
    <div className="h-screen flex flex-col bg-[rgb(var(--bg-base))]">
      {/* Top Navigation */}
      <header className="border-b border-white/10 bg-[#0D0D0D] backdrop-blur-xl px-4 py-2.5 flex items-center justify-between shrink-0 shadow-sm relative z-50">
        <div className="flex items-center gap-3 shrink-0">
          <a href="/" className="flex items-center gap-2 hover:opacity-80 transition-opacity">
            <span className="font-extrabold text-lg tracking-tight text-white hidden sm:block">GuruCortex</span>
          </a>
          <span className="text-[10px] uppercase tracking-wider font-semibold text-[#22C55E] bg-[#22C55E]/10 border border-[#22C55E]/20 px-2 py-0.5 rounded-full hidden md:inline-flex items-center gap-1.5">
            <div className="w-1.5 h-1.5 bg-[#22C55E] rounded-full animate-pulse"></div>2.0 OS
          </span>
        </div>

        {/* Modular Grouped Tabs */}
        <nav className="flex items-center gap-1 overflow-x-auto mx-4 scrollbar-hide py-1">
          {tabs.map((tab, i) => {
            const prevGroup = i > 0 ? tabs[i - 1].group : tab.group;
            return (
              <div key={tab.id} className="flex items-center">
                {tab.group !== prevGroup && i > 0 && (
                  <div className="w-px h-4 bg-white/10 mx-1.5 shrink-0" />
                )}
                <button
                  onClick={() => setActiveTab(tab.id)}
                  className={`px-2.5 py-1.5 rounded-lg text-xs font-semibold transition-all duration-200 flex items-center gap-1.5 shrink-0 whitespace-nowrap ${
                    activeTab === tab.id 
                      ? 'bg-white/10 text-white shadow-[inset_0_1px_0_rgba(255,255,255,0.1)] border border-white/20' 
                      : 'text-slate-400 hover:text-slate-200 hover:bg-white/5'
                  }`}
                  title={tab.label}
                >
                  <span className={`${activeTab === tab.id ? 'text-[#22C55E] drop-shadow-[0_0_8px_rgba(34,197,94,0.5)]' : 'text-slate-500'}`}>
                    {tab.icon}
                  </span>
                  <span className="hidden xl:inline">{tab.label}</span>
                </button>
              </div>
            );
          })}
        </nav>

        <div className="flex items-center gap-3 shrink-0">
          <AccessibilityToggle />
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 overflow-hidden">
        {activeTab === 'chat' && (
          <ChatInterface
            selectedDocumentIds={selectedDocumentIds}
            selectedDocumentNames={selectedDocumentNames}
            onClearDocumentScope={handleClearDocumentScope}
          />
        )}

        {activeTab === 'documents' && (
          <div className="h-full overflow-y-auto p-6 bg-[rgb(var(--bg-base))]">
            <div className="max-w-3xl mx-auto space-y-6">
              <div>
                <h2 className="text-3xl font-display font-semibold tracking-tight text-white mb-2">Document Manager</h2>
                <p className="text-sm leading-relaxed text-[#A1A1AA] font-normal">Upload study materials (PDF, DOCX, PPTX, TXT) to build your knowledge base.</p>
              </div>
              <DocumentUploader
                selectedDocumentIds={selectedDocumentIds}
                onSelectionChange={handleSelectedDocumentsChange}
                onOpenChatForDocuments={handleOpenChatForDocuments}
              />
            </div>
          </div>
        )}

        {/* GuruCortex 2.0: Visual Intelligence Studio */}
        {activeTab === 'visual' && (
          <div className="h-full overflow-y-auto p-6 bg-[rgb(var(--bg-base))]">
            <div className="max-w-5xl mx-auto">
              <VisualIntelligenceStudio
                initialConceptTitle={selectedConceptTopic}
                onNavigateToReality={handleNavigateToReality}
              />
            </div>
          </div>
        )}

        {/* GuruCortex 2.0: Concept-to-Reality Navigator */}
        {activeTab === 'reality' && (
          <div className="h-full overflow-y-auto p-6 bg-[rgb(var(--bg-base))]">
            <div className="max-w-5xl mx-auto">
              <ConceptRealityNavigator
                initialTopic={selectedConceptTopic}
                onOpenVisualStudio={handleOpenVisualStudio}
              />
            </div>
          </div>
        )}

        {/* GuruCortex 2.0: Revision Intelligence (SM-2 & Active Recall) */}
        {activeTab === 'revision' && (
          <div className="h-full overflow-y-auto p-6 bg-[rgb(var(--bg-base))]">
            <div className="max-w-5xl mx-auto">
              <RevisionIntelligence />
            </div>
          </div>
        )}

        {/* GuruCortex 2.0: Cognitive Learning Coach & Growth Profile */}
        {activeTab === 'coach' && (
          <div className="h-full overflow-y-auto p-6 bg-[rgb(var(--bg-base))]">
            <div className="max-w-5xl mx-auto">
              <CognitiveCoach />
            </div>
          </div>
        )}

        {/* GuruCortex 2.0: FuturePath Career & Skills Guidance */}
        {activeTab === 'career' && (
          <div className="h-full overflow-y-auto p-6 bg-[rgb(var(--bg-base))]">
            <div className="max-w-5xl mx-auto">
              <FuturePathNavigator />
            </div>
          </div>
        )}

        {/* GuruCortex 2.0: Focus Intelligence & Wellness */}
        {activeTab === 'focus' && (
          <div className="h-full overflow-y-auto p-6 bg-[rgb(var(--bg-base))]">
            <div className="max-w-5xl mx-auto">
              <FocusIntelligence />
            </div>
          </div>
        )}

        {/* GuruCortex 2.0: Parent Connect Portal */}
        {activeTab === 'parent' && (
          <div className="h-full overflow-y-auto p-6 bg-[rgb(var(--bg-base))]">
            <div className="max-w-5xl mx-auto">
              <ParentConnect />
            </div>
          </div>
        )}

        {/* GuruCortex 2.0: Teacher & Institution Mode */}
        {activeTab === 'institution' && (
          <div className="h-full overflow-y-auto p-6 bg-[rgb(var(--bg-base))]">
            <div className="max-w-5xl mx-auto">
              <InstitutionMode />
            </div>
          </div>
        )}

        {/* Preserved Existing Modules */}
        {activeTab === 'code' && (
          <div className="h-full overflow-y-auto p-6 bg-[rgb(var(--bg-base))]">
            <div className="max-w-4xl mx-auto">
              <CodeSandbox />
            </div>
          </div>
        )}

        {activeTab === 'assessments' && (
          <div className="h-full overflow-y-auto p-6 bg-[rgb(var(--bg-base))]">
            <div className="max-w-4xl mx-auto">
              <AssessmentHub
                selectedDocumentIds={selectedDocumentIds}
                selectedDocumentNames={selectedDocumentNames}
              />
            </div>
          </div>
        )}

        {activeTab === 'protege' && (
          <div className="h-full overflow-y-auto p-6 bg-[rgb(var(--bg-base))]">
            <div className="max-w-3xl mx-auto">
              <ProtegeMode />
            </div>
          </div>
        )}

        {activeTab === 'podcast' && (
          <div className="h-full overflow-y-auto p-6 bg-[rgb(var(--bg-base))]">
            <div className="max-w-3xl mx-auto">
              <PodcastPlayer />
            </div>
          </div>
        )}

        {activeTab === 'analytics' && (
          <div className="h-full overflow-y-auto p-6 bg-[rgb(var(--bg-base))]">
            <div className="max-w-6xl mx-auto">
              <LearningDashboard />
            </div>
          </div>
        )}

        {activeTab === 'badges' && (
          <div className="h-full overflow-y-auto p-6 bg-[rgb(var(--bg-base))]">
            <div className="max-w-4xl mx-auto">
              <BadgesDisplay />
            </div>
          </div>
        )}

        {activeTab === 'planner' && (
          <div className="h-full overflow-y-auto p-6 bg-[rgb(var(--bg-base))]">
            <div className="max-w-4xl mx-auto">
              <StudyPlanner />
            </div>
          </div>
        )}
      </main>

      {/* Eye Detection overlay */}
      <EyeDetectionOverlay />
    </div>
  );
}
