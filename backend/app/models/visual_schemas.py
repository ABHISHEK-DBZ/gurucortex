from typing import List, Dict, Any, Optional
from pydantic import BaseModel, Field

class ConceptBase(BaseModel):
    document_id: str
    title: str
    category: str = "general"
    page_number: Optional[int] = 1
    section_title: Optional[str] = None
    difficulty_level: str = "intermediate"
    summary: str
    key_terms: List[str] = Field(default_factory=list)
    formulas: List[str] = Field(default_factory=list)
    dependencies: List[str] = Field(default_factory=list)

class ConceptResponse(ConceptBase):
    id: str
    extracted_at: str

class SceneElement(BaseModel):
    id: str
    type: str  # "node", "particle", "arrow", "wave", "box", "text", "circuit_element"
    label: str
    x: float
    y: float
    width: Optional[float] = None
    height: Optional[float] = None
    color: Optional[str] = "#3B82F6"
    subtext: Optional[str] = None
    highlight: Optional[bool] = False

class AnimationStep(BaseModel):
    step_number: int
    title: str
    narration: str
    caption: str
    elements: List[SceneElement] = Field(default_factory=list)
    active_particles: Optional[bool] = False
    particle_type: Optional[str] = "electrons"  # "electrons", "data_packets", "molecules", "photons"
    interactive_hint: Optional[str] = None

class SceneSpec(BaseModel):
    concept_title: str
    subject: str  # "physics", "biology", "math", "electronics", "cs", "chemistry", "history", "general"
    viewbox: str = "0 0 800 500"
    total_steps: int
    steps: List[AnimationStep]
    interactive_labels: List[Dict[str, str]] = Field(default_factory=list)

class MultiLevelExplanations(BaseModel):
    beginner: str
    intermediate: str
    advanced: str
    eli12: str
    exam_oriented: str
    practical_application: str
    common_misconceptions: str

class KnowledgeCheck(BaseModel):
    question: str
    options: List[str]
    correct_answer: str
    explanation: str

class VisualExplanationCreate(BaseModel):
    concept_id: str
    subject: Optional[str] = "general"

class VisualExplanationResponse(BaseModel):
    id: str
    concept_id: str
    title: str
    learning_objective: str
    subject: str
    scene_spec: SceneSpec
    multi_level_explanations: MultiLevelExplanations
    real_world_analogy: str
    formulas_definitions: List[Dict[str, str]] = Field(default_factory=list)
    knowledge_check: KnowledgeCheck
    created_at: str

# Reality Connection Models
class MiniProject(BaseModel):
    title: str
    objective: str
    estimated_time: str
    materials: List[str] = Field(default_factory=list)
    steps: List[str] = Field(default_factory=list)
    expected_outcome: str

class CaseStudy(BaseModel):
    title: str
    organization: str
    description: str
    impact: str

class RealityConnectionResponse(BaseModel):
    id: str
    concept_id: Optional[str] = None
    topic_name: str
    concept_summary: str
    why_developed: str
    real_world_uses: List[str] = Field(default_factory=list)
    industries: List[str] = Field(default_factory=list)
    products: List[str] = Field(default_factory=list)
    research_applications: str
    problems_solved: str
    limitations: str
    future_developments: str
    mini_project: MiniProject
    case_studies: List[CaseStudy] = Field(default_factory=list)
    citations: List[Dict[str, str]] = Field(default_factory=list)
    created_at: str
