"""
Visual Intelligence Studio Engine
Handles document deep parsing, concept extraction, 
animated visual scene specification generation, and multi-level explanations.
"""
import uuid
import json
import logging
from typing import List, Dict, Any, Optional
from datetime import datetime
import aiosqlite

from app.config import settings
from app.services.llm_client import LLMClient
from app.services.database import get_database

logger = logging.getLogger(__name__)

class VisualEngine:
    """Core engine for Visual Intelligence Studio and Concept Extraction"""

    def __init__(self):
        self.llm_client = LLMClient()
        self.db_path = settings.CONVERSATION_DB_PATH

    async def extract_concepts_from_document(
        self, 
        document_id: str, 
        document_text: str, 
        filename: str = "Document"
    ) -> List[Dict[str, Any]]:
        """
        Deep parse document content, extract structured concepts,
        estimate difficulty, formulas, and terminology.
        """
        prompt = f"""You are an expert Educational Curriculum Designer.
Analyze this academic study document ("{filename}") and extract 3 to 6 core learning concepts.

Return ONLY a valid JSON array of objects with the following exact keys for each concept:
[
  {{
    "title": "Clear concept title (e.g. PN Junction Diode Operation)",
    "category": "physics | biology | mathematics | electronics | computer_science | chemistry | history | general",
    "page_number": 1,
    "section_title": "Section or heading name",
    "difficulty_level": "beginner | intermediate | advanced",
    "summary": "2-3 sentence clear conceptual summary grounded in the text",
    "key_terms": ["term 1", "term 2", "term 3"],
    "formulas": ["formula or equation with LaTeX if applicable", "e.g. V = I * R"],
    "dependencies": ["prerequisite concept 1", "prerequisite concept 2"]
  }}
]

Document Sample Content:
{document_text[:4000]}
"""
        extracted = []
        try:
            raw_response = await self.llm_client.generate(prompt=prompt, temperature=0.2, max_tokens=3000)
            cleaned = raw_response.strip()
            # Extract JSON block if surrounded by markdown fences
            if "```json" in cleaned:
                cleaned = cleaned.split("```json")[1].split("```")[0].strip()
            elif "```" in cleaned:
                cleaned = cleaned.split("```")[1].split("```")[0].strip()
            
            data = json.loads(cleaned)
            if isinstance(data, list):
                extracted = data
        except Exception as e:
            logger.warning(f"LLM concept extraction failed or fell back: {e}")
            # Intelligent fallback extraction based on text heuristics
            extracted = self._heuristic_concept_extraction(document_text, filename)

        # Ensure at least 1-2 concepts if empty
        if not extracted:
            extracted = self._heuristic_concept_extraction(document_text, filename)

        # Save to database
        saved_concepts = []
        db = await get_database().connect()
        for item in extracted:
            c_id = str(uuid.uuid4())
            title = item.get("title", "Core Concept")
            category = item.get("category", "general").lower()
            page_num = item.get("page_number", 1)
            section = item.get("section_title", "General")
            difficulty = item.get("difficulty_level", "intermediate")
            summary = item.get("summary", "Summary of concept.")
            key_terms = json.dumps(item.get("key_terms", []))
            formulas = json.dumps(item.get("formulas", []))
            deps = json.dumps(item.get("dependencies", []))

            await db.execute(
                """
                INSERT INTO concepts 
                (id, document_id, title, category, page_number, section_title, difficulty_level, summary, key_terms, formulas, dependencies)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                """,
                (c_id, document_id, title, category, page_num, section, difficulty, summary, key_terms, formulas, deps)
            )
            saved_concepts.append({
                "id": c_id,
                "document_id": document_id,
                "title": title,
                "category": category,
                "page_number": page_num,
                "section_title": section,
                "difficulty_level": difficulty,
                "summary": summary,
                "key_terms": item.get("key_terms", []),
                "formulas": item.get("formulas", []),
                "dependencies": item.get("dependencies", []),
                "extracted_at": datetime.utcnow().isoformat()
            })
        await db.commit()
        return saved_concepts

    def _heuristic_concept_extraction(self, text: str, filename: str) -> List[Dict[str, Any]]:
        """Rule-based heuristic extractor for offline or fallback operation"""
        lines = [line.strip() for line in text.split("\n") if len(line.strip()) > 3]
        base_title = filename.replace(".pdf", "").replace(".docx", "").replace(".pptx", "").replace("_", " ").title()
        
        # Detect subject category from text keywords
        lower_text = text.lower()
        category = "general"
        if any(w in lower_text for w in ["diode", "semiconductor", "voltage", "circuit", "transistor", "gate"]):
            category = "electronics"
        elif any(w in lower_text for w in ["electron", "force", "velocity", "wave", "quantum", "gravity", "energy"]):
            category = "physics"
        elif any(w in lower_text for w in ["cell", "dna", "protein", "organism", "mitochondria", "enzyme"]):
            category = "biology"
        elif any(w in lower_text for w in ["integral", "derivative", "matrix", "function", "theorem", "vector"]):
            category = "mathematics"
        elif any(w in lower_text for w in ["algorithm", "binary", "tree", "pointer", "complexity", "database"]):
            category = "computer_science"
        elif any(w in lower_text for w in ["molecule", "reaction", "bond", "acid", "equilibrium", "valence"]):
            category = "chemistry"

        # Look for headings or bold sections
        candidates = []
        for line in lines[:30]:
            if len(line) < 60 and not line.endswith(".") and (line.isupper() or line.istitle() or ":" in line):
                clean_name = line.replace(":", "").strip()
                if len(clean_name) > 3 and clean_name not in candidates:
                    candidates.append(clean_name)
                    if len(candidates) >= 3:
                        break

        if not candidates:
            candidates = [f"{base_title} Fundamentals", f"{base_title} Core Principles"]

        concepts = []
        for i, c_title in enumerate(candidates):
            concepts.append({
                "title": c_title,
                "category": category,
                "page_number": i + 1,
                "section_title": f"Chapter {i + 1}",
                "difficulty_level": "intermediate",
                "summary": f"In-depth exploration of {c_title} based on {base_title}. Highlights operational mechanisms and fundamental laws.",
                "key_terms": [c_title.split()[0], "Operation", "Equilibrium", "Transfer"],
                "formulas": ["ΔE = hν" if category == "physics" else "f(x) = ax + b"],
                "dependencies": ["Basic Scientific Principles"]
            })
        return concepts

    async def get_concepts_for_document(self, document_id: str) -> List[Dict[str, Any]]:
        """Retrieve stored concepts for a document"""
        db = await get_database().connect()
        async with db.execute(
            "SELECT id, document_id, title, category, page_number, section_title, difficulty_level, summary, key_terms, formulas, dependencies, extracted_at FROM concepts WHERE document_id = ? ORDER BY page_number ASC",
            (document_id,)
        ) as cursor:
            rows = await cursor.fetchall()
            return [
                {
                    "id": r[0],
                    "document_id": r[1],
                    "title": r[2],
                    "category": r[3],
                    "page_number": r[4],
                    "section_title": r[5],
                    "difficulty_level": r[6],
                    "summary": r[7],
                    "key_terms": json.loads(r[8] or "[]"),
                    "formulas": json.loads(r[9] or "[]"),
                    "dependencies": json.loads(r[10] or "[]"),
                    "extracted_at": r[11]
                }
                for r in rows
            ]

    async def generate_visual_explanation(self, concept_id: str) -> Dict[str, Any]:
        """
        Generate complete animated visual scene specification, multi-level explanations,
        real-world analogy, formulas, and knowledge check for a concept.
        """
        db = await get_database().connect()

        # Check if already generated
        async with db.execute(
            "SELECT id, concept_id, title, learning_objective, subject, scene_spec, multi_level_explanations, real_world_analogy, formulas_definitions, knowledge_check, created_at FROM visual_explanations WHERE concept_id = ?",
            (concept_id,)
        ) as cursor:
            existing = await cursor.fetchone()
        if existing:
            return self._explanation_from_row(existing)

        # Fetch concept details
        async with db.execute(
            "SELECT id, document_id, title, category, summary, key_terms, formulas FROM concepts WHERE id = ?",
            (concept_id,)
        ) as cursor:
            concept = await cursor.fetchone()
        if not concept:
            raise ValueError(f"Concept with ID {concept_id} not found")

        c_id, doc_id, title, category, summary, key_terms_raw, formulas_raw = concept
        key_terms = json.loads(key_terms_raw or "[]")
        formulas = json.loads(formulas_raw or "[]")

        prompt = f"""You are the GuruCortex Visual Intelligence Studio Designer.
Create a complete, structured interactive visual explanation and multi-level educational content for:
Concept: "{title}"
Category: {category}
Summary: {summary}
Key Terms: {', '.join(key_terms)}
Formulas: {', '.join(formulas)}

Respond with ONLY a valid JSON object with the following exact keys:
{{
  "title": "{title}",
  "learning_objective": "Master the dynamic operation and governing principles of {title}",
  "subject": "{category}",
  "scene_spec": {{
    "concept_title": "{title}",
    "subject": "{category}",
    "viewbox": "0 0 800 500",
    "total_steps": 3,
    "steps": [
      {{
        "step_number": 1,
        "title": "Initial State & Component Overview",
        "narration": "Detailed explanation of initial components and configuration.",
        "caption": "Step 1: Setup and fundamental elements",
        "active_particles": true,
        "particle_type": "electrons",
        "interactive_hint": "Hover over components to inspect their state",
        "elements": [
          {{"id": "el1", "type": "box", "label": "Region A", "x": 150, "y": 200, "width": 180, "height": 120, "color": "#3B82F6", "subtext": "Majority carriers"}},
          {{"id": "el2", "type": "box", "label": "Region B", "x": 470, "y": 200, "width": 180, "height": 120, "color": "#EF4444", "subtext": "Opposing barrier"}},
          {{"id": "arrow1", "type": "arrow", "label": "Equilibrium Flow", "x": 350, "y": 250, "color": "#10B981"}}
        ]
      }},
      {{
        "step_number": 2,
        "title": "Dynamic Interaction & Transition",
        "narration": "Under applied stimulus, dynamic migration and interaction occurs.",
        "caption": "Step 2: Active transmission and barrier modulation",
        "active_particles": true,
        "particle_type": "electrons",
        "interactive_hint": "Notice charge accumulation at the boundary",
        "elements": [
          {{"id": "el1", "type": "box", "label": "Active Region A", "x": 150, "y": 200, "width": 180, "height": 120, "color": "#2563EB", "subtext": "Carrier injection", "highlight": true}},
          {{"id": "el2", "type": "box", "label": "Active Region B", "x": 470, "y": 200, "width": 180, "height": 120, "color": "#DC2626", "subtext": "Recombination zone", "highlight": true}},
          {{"id": "arrow1", "type": "arrow", "label": "High Velocity Flux", "x": 350, "y": 250, "color": "#22C55E"}}
        ]
      }},
      {{
        "step_number": 3,
        "title": "Steady State & Output Characteristics",
        "narration": "System stabilizes into predictable operational equilibrium.",
        "caption": "Step 3: Continuous output and characteristic response",
        "active_particles": true,
        "particle_type": "electrons",
        "interactive_hint": "Check the output curve and net current",
        "elements": [
          {{"id": "el1", "type": "box", "label": "Equilibrium Anode", "x": 150, "y": 200, "width": 180, "height": 120, "color": "#1D4ED8", "subtext": "Steady conduction"}},
          {{"id": "el2", "type": "box", "label": "Equilibrium Cathode", "x": 470, "y": 200, "width": 180, "height": 120, "color": "#B91C1C", "subtext": "Stable flux"}},
          {{"id": "arrow1", "type": "arrow", "label": "Forward Conduction", "x": 350, "y": 250, "color": "#22C55E"}}
        ]
      }}
    ],
    "interactive_labels": [
      {{"key": "Barrier Height", "value": "0.7V for Silicon"}},
      {{"key": "Carrier Concentration", "value": "10^16 cm^-3"}},
      {{"key": "Response Time", "value": "< 10 ns"}}
    ]
  }},
  "multi_level_explanations": {{
    "beginner": "Clear, accessible explanation avoiding heavy jargon.",
    "intermediate": "Standard undergraduate explanation with formal mechanisms.",
    "advanced": "Rigorous derivation, quantum/mathematical specifics, and thermodynamics.",
    "eli12": "Fascinating explanation using everyday metaphors suitable for a curious 12-year-old.",
    "exam_oriented": "Concise key definitions, bullet points required for full marks, common exam questions.",
    "practical_application": "How modern microchips, engines, or instruments implement this daily.",
    "common_misconceptions": "The most frequent error students make and why it is incorrect."
  }},
  "real_world_analogy": "An intuitive real-world analogy (e.g. a one-way turnstile or water pump).",
  "formulas_definitions": [
    {{"name": "Governing Equation", "formula": "I = I_0 * (e^(qV/kT) - 1)", "description": "Relates voltage and current."}}
  ],
  "knowledge_check": {{
    "question": "A conceptual multiple-choice question testing understanding of this phenomenon.",
    "options": ["Option A", "Option B", "Option C", "Option D"],
    "correct_answer": "Option B",
    "explanation": "Why Option B is correct and how it relates to the animation."
  }}
}}
"""
        generated_data = None
        try:
            raw = await self.llm_client.generate(prompt=prompt, temperature=0.3, max_tokens=4000)
            cleaned = raw.strip()
            if "```json" in cleaned:
                cleaned = cleaned.split("```json")[1].split("```")[0].strip()
            elif "```" in cleaned:
                cleaned = cleaned.split("```")[1].split("```")[0].strip()
            generated_data = json.loads(cleaned)
        except Exception as e:
            logger.warning(f"LLM visual explanation generation failed: {e}. Generating deterministic template.")
            generated_data = self._generate_fallback_scene(title, category, summary, formulas)

        # Fallback safeguard
        if not generated_data or "scene_spec" not in generated_data:
            generated_data = self._generate_fallback_scene(title, category, summary, formulas)

        v_id = str(uuid.uuid4())
        learning_obj = generated_data.get("learning_objective", f"Understand {title}")
        subject = generated_data.get("subject", category)
        scene_spec = generated_data.get("scene_spec", {})
        multi_level = generated_data.get("multi_level_explanations", {})
        analogy = generated_data.get("real_world_analogy", f"{title} operates like a selective valve.")
        formulas_defs = generated_data.get("formulas_definitions", [])
        knowledge_check = generated_data.get("knowledge_check", {
            "question": f"What is the primary factor governing {title}?",
            "options": ["External Gradient", "Random Fluctuations", "Equilibrium State", "Inertial Drift"],
            "correct_answer": "External Gradient",
            "explanation": "The gradient drives the primary interaction across the boundary."
        })
        now = datetime.utcnow().isoformat()

        payload = {
            "id": v_id,
            "concept_id": concept_id,
            "title": title,
            "learning_objective": learning_obj,
            "subject": subject,
            "scene_spec": scene_spec,
            "multi_level_explanations": multi_level,
            "real_world_analogy": analogy,
            "formulas_definitions": formulas_defs,
            "knowledge_check": knowledge_check,
            "created_at": now
        }

        await db.execute(
            """
            INSERT INTO visual_explanations
            (id, concept_id, title, learning_objective, subject, scene_spec, multi_level_explanations, real_world_analogy, formulas_definitions, knowledge_check, created_at)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            """,
            (
                v_id, concept_id, title, learning_obj, subject,
                json.dumps(scene_spec), json.dumps(multi_level),
                analogy, json.dumps(formulas_defs), json.dumps(knowledge_check), now
            )
        )
        await db.commit()
        return payload

    async def generate_visual_explanation_for_title(self, title: str) -> Dict[str, Any]:
        """Generate or retrieve a visual explanation for a free-form topic title."""
        db = await get_database().connect()
        await db.execute(
            "INSERT OR IGNORE INTO documents (id, filename, file_type) VALUES ('__topics__', 'On-demand topics', 'topic')"
        )
        async with db.execute(
            "SELECT id FROM concepts WHERE document_id = '__topics__' AND title = ?",
            (title,)
        ) as cursor:
            row = await cursor.fetchone()
        if row:
            concept_id = row[0]
        else:
            concept_id = str(uuid.uuid4())
            await db.execute(
                """
                INSERT INTO concepts
                (id, document_id, title, category, page_number, section_title, difficulty_level, summary, key_terms, formulas, dependencies)
                VALUES (?, '__topics__', ?, 'general', 1, 'On-Demand Topic', 'intermediate', ?, '[]', '[]', '[]')
                """,
                (concept_id, title, f"Core principles and operation of {title}.")
            )
        await db.commit()
        return await self.generate_visual_explanation(concept_id)

    def _explanation_from_row(self, row) -> Dict[str, Any]:
        return {
            "id": row[0],
            "concept_id": row[1],
            "title": row[2],
            "learning_objective": row[3],
            "subject": row[4],
            "scene_spec": json.loads(row[5]),
            "multi_level_explanations": json.loads(row[6]),
            "real_world_analogy": row[7],
            "formulas_definitions": json.loads(row[8]),
            "knowledge_check": json.loads(row[9]),
            "created_at": row[10]
        }

    def _generate_fallback_scene(self, title: str, category: str, summary: str, formulas: List[str]) -> Dict[str, Any]:
        """Generate high-fidelity, validated template scene spec when LLM is unavailable"""
        p_type = "electrons" if category in ["electronics", "physics"] else ("molecules" if category == "chemistry" else "data_packets")
        
        return {
            "title": title,
            "learning_objective": f"Understand the core interaction and operational state of {title}",
            "subject": category,
            "scene_spec": {
                "concept_title": title,
                "subject": category,
                "viewbox": "0 0 800 500",
                "total_steps": 3,
                "steps": [
                    {
                        "step_number": 1,
                        "title": "Stage 1: System Baseline & Structure",
                        "narration": f"Initial state of {title}. The components establish a localized gradient in baseline equilibrium.",
                        "caption": "Step 1: Baseline arrangement and component boundaries",
                        "active_particles": True,
                        "particle_type": p_type,
                        "interactive_hint": "Click on elements to inspect localized properties",
                        "elements": [
                            {"id": "node_left", "type": "box", "label": "Source Region", "x": 160, "y": 200, "width": 180, "height": 130, "color": "#3B82F6", "subtext": "High potential"},
                            {"id": "node_right", "type": "box", "label": "Target Region", "x": 460, "y": 200, "width": 180, "height": 130, "color": "#EF4444", "subtext": "Low potential"},
                            {"id": "flow1", "type": "arrow", "label": "Potential Barrier", "x": 350, "y": 265, "color": "#94A3B8"}
                        ]
                    },
                    {
                        "step_number": 2,
                        "title": "Stage 2: Active Transition & Field Interaction",
                        "narration": f"When external excitation occurs, the barrier narrows and transmission activates across {title}.",
                        "caption": "Step 2: Excitation triggers particle migration and state transfer",
                        "active_particles": True,
                        "particle_type": p_type,
                        "interactive_hint": "Observe high kinetic transfer through the central channel",
                        "elements": [
                            {"id": "node_left", "type": "box", "label": "Excited Source", "x": 160, "y": 200, "width": 180, "height": 130, "color": "#2563EB", "subtext": "Carrier injection", "highlight": True},
                            {"id": "node_right", "type": "box", "label": "Excited Target", "x": 460, "y": 200, "width": 180, "height": 130, "color": "#DC2626", "subtext": "Continuous collection", "highlight": True},
                            {"id": "flow1", "type": "arrow", "label": "High-Speed Conduction", "x": 350, "y": 265, "color": "#22C55E"}
                        ]
                    },
                    {
                        "step_number": 3,
                        "title": "Stage 3: Equilibrium & Characteristic Response",
                        "narration": f"The system sustains continuous throughput, reaching an efficient steady state.",
                        "caption": "Step 3: Stable equilibrium with governed output characteristics",
                        "active_particles": True,
                        "particle_type": p_type,
                        "interactive_hint": "Check the output metric panel below",
                        "elements": [
                            {"id": "node_left", "type": "box", "label": "Steady Conductor", "x": 160, "y": 200, "width": 180, "height": 130, "color": "#1D4ED8", "subtext": "Current balance"},
                            {"id": "node_right", "type": "box", "label": "Output Load", "x": 460, "y": 200, "width": 180, "height": 130, "color": "#B91C1C", "subtext": "Sustained work"},
                            {"id": "flow1", "type": "arrow", "label": "Sustained Loop", "x": 350, "y": 265, "color": "#10B981"}
                        ]
                    }
                ],
                "interactive_labels": [
                    {"key": "Efficiency", "value": "94.2%"},
                    {"key": "Propagation Delay", "value": "< 5 ms"},
                    {"key": "Thermodynamic State", "value": "Stable"}
                ]
            },
            "multi_level_explanations": {
                "beginner": f"{title} is a fundamental concept where two interacting parts balance each other to achieve steady transfer.",
                "intermediate": f"In {category}, {title} functions by controlling the gradient and flux across distinct structural boundaries under excitation.",
                "advanced": f"A rigorous analysis of {title} demonstrates boundary condition satisfaction governed by conservation laws and field gradients.",
                "eli12": f"Imagine a water slide with a gate at the top. When the gate opens slightly, water rushes down in a controlled path!",
                "exam_oriented": f"Key Definition: State the 3 stages clearly. Mention equilibrium condition, rate-determining step, and sketch the input-output curve for full marks.",
                "practical_application": f"Widely engineered into modern everyday technologies across telecommunications, automotive electronics, and computation.",
                "common_misconceptions": "A common mistake is assuming transfer is instantaneous. In reality, propagation velocity and barrier height strictly limit transition time."
            },
            "real_world_analogy": f"{title} acts like a smart highway toll gate that dynamically opens lanes depending on traffic density.",
            "formulas_definitions": [
                {"name": "Standard Law", "formula": formulas[0] if formulas else "J = σ * E", "description": "Relates applied field to particle current density."}
            ],
            "knowledge_check": {
                "question": f"During Stage 2 of {title}, what triggers the transition?",
                "options": ["Decrease in energy", "External excitation overcoming the barrier", "Complete system shutdown", "Random dispersion"],
                "correct_answer": "External excitation overcoming the barrier",
                "explanation": "External energy reduces the effective barrier, enabling rapid carrier transmission."
            }
        }
