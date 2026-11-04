"""
GuruCortex FuturePath AI - Career & Skills Guidance Engine
Maps academic subjects to high-impact career pathways, analyzes technical skill gaps,
and generates personalized, actionable project roadmaps.
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

CAREER_ARCHETYPES = {
    "electronics": [
        {
            "title": "VLSI Design & Semiconductor Engineering",
            "description": "Architect, simulate, and verify modern nanoscale integrated circuits and microprocessor architectures.",
            "related_subjects": ["Electronics", "Semiconductor Physics", "Digital Logic", "Computer Architecture"],
            "industries": ["Semiconductor Fabrication", "Fabless Chip Design", "Automotive Electronic Systems"],
            "required_qualifications": ["B.Tech / M.Tech in Electrical/Electronics Engineering or Computer Engineering"],
            "technical_skills": ["Verilog / SystemVerilog", "RTL Design", "CMOS Fabrication", "Static Timing Analysis", "Cadence / Synopsys Tools"],
            "recommended_certifications": ["IEEE Certified VLSI Specialist", "Cadence Digital Design Verification"],
            "higher_education_options": ["M.S. in VLSI Architecture", "Ph.D. in Nanoelectronics and Solid-State Physics"],
            "average_salary_range": "$95,000 - $165,000 / ₹14 - 35 LPA"
        },
        {
            "title": "Embedded Systems & Robotics Engineer",
            "description": "Design firmware, sensor fusion interfaces, and microcontrollers for autonomous robotics and smart devices.",
            "related_subjects": ["Microcontrollers", "C/C++", "Control Systems", "Circuits"],
            "industries": ["Aerospace & Defense", "Automotive & Electric Vehicles", "Medical Devices"],
            "required_qualifications": ["Degree in Electronics, Mechatronics, or Embedded Systems"],
            "technical_skills": ["Embedded C/C++", "FreeRTOS", "ARM Cortex Architecture", "I2C/SPI/CAN Protocols", "PCB Layout (KiCad)"],
            "recommended_certifications": ["Arm Certified Engineer (ACE)", "Certified Embedded Systems Professional"],
            "higher_education_options": ["M.Sc. Robotics & Autonomous Systems", "M.Tech Embedded Software"],
            "average_salary_range": "$85,000 - $145,000 / ₹10 - 28 LPA"
        }
    ],
    "computer_science": [
        {
            "title": "AI Systems & Machine Learning Engineer",
            "description": "Develop high-throughput deep neural networks, optimize model inference architectures, and engineer RAG systems.",
            "related_subjects": ["Linear Algebra", "Data Structures & Algorithms", "Probability & Statistics", "Operating Systems"],
            "industries": ["Artificial Intelligence", "Autonomous Systems", "FinTech", "Cloud Platforms"],
            "required_qualifications": ["B.S. / M.S. in Computer Science, Applied Mathematics, or Software Engineering"],
            "technical_skills": ["Python / C++", "PyTorch / JAX", "CUDA Parallel Computing", "Distributed Training", "Vector Databases"],
            "recommended_certifications": ["NVIDIA Deep Learning Institute Certification", "AWS Certified Machine Learning Specialty"],
            "higher_education_options": ["M.S. in Artificial Intelligence", "Doctorate in Machine Learning Systems"],
            "average_salary_range": "$110,000 - $190,000 / ₹18 - 45 LPA"
        }
    ],
    "physics": [
        {
            "title": "Quantum Computing & Photonics Researcher",
            "description": "Harness quantum state superposition and laser optics to engineer next-generation computing hardware.",
            "related_subjects": ["Quantum Mechanics", "Electromagnetism", "Optics", "Linear Algebra"],
            "industries": ["Quantum Hardware", "Telecommunications", "National Defense Laboratories"],
            "required_qualifications": ["Degree in Physics, Applied Physics, or Quantum Engineering"],
            "technical_skills": ["Qiskit / Cirq", "Cryogenic Control Systems", "Laser Interferometry", "Python Modeling"],
            "recommended_certifications": ["IBM Certified Quantum Developer"],
            "higher_education_options": ["Ph.D. in Quantum Engineering or Optical Physics"],
            "average_salary_range": "$100,000 - $175,000 / ₹16 - 40 LPA"
        }
    ]
}

class CareerEngine:
    """Core engine for FuturePath AI"""

    def __init__(self):
        self.llm_client = LLMClient()

    async def get_pathways_for_subject(self, subject: str = "electronics") -> List[Dict[str, Any]]:
        """Return curated, high-accuracy career pathways mapped to student subject interests"""
        sub_key = subject.lower().strip()
        matched = []
        for k, v in CAREER_ARCHETYPES.items():
            if k in sub_key or sub_key in k:
                matched.extend(v)

        if not matched:
            # Return general tech pathways
            matched = CAREER_ARCHETYPES["electronics"] + CAREER_ARCHETYPES["computer_science"]

        # Add unique IDs
        result = []
        for i, p in enumerate(matched):
            item = dict(p)
            item["id"] = f"pathway_{i+1}_{sub_key}"
            result.append(item)
        return result

    async def analyze_skill_gap(
        self, 
        pathway_title: str, 
        student_id: str = "default_student"
    ) -> Dict[str, Any]:
        """
        Compare student's verified skills & project portfolio against industry pathway standards.
        """
        db = await get_database().connect()
        # Fetch student projects and demonstrated skills
        acquired_skills = ["Critical Thinking", "Scientific Method"]
        async with db.execute("SELECT skills_demonstrated FROM student_projects WHERE student_id = ?", (student_id,)) as cur:
            rows = await cur.fetchall()
            for r in rows:
                for s in json.loads(r[0] or "[]"):
                    acquired_skills.append(s)

        pathway_title_clean = pathway_title.lower()
        if "vlsi" in pathway_title_clean or "semiconductor" in pathway_title_clean:
            required = ["Verilog / SystemVerilog", "RTL Design", "CMOS Fabrication", "Static Timing Analysis", "Circuit Modeling"]
            strengths = [s for s in acquired_skills if s in required or "Circuit" in s or "Python" in s]
            to_develop = [s for s in required if s not in strengths]
            missing_know = ["Static Timing Constraints", "Clock Tree Synthesis (CTS)", "Parasitic Extraction"]
            projects = [
                "4-Bit Arithmetic Logic Unit (ALU) design in Verilog",
                "CMOS Inverter layout and SPICE transient delay calculation",
                "FPGA implementation of a UART serial communication controller"
            ]
            resources = [
                {"name": "Digital Integrated Circuits (Rabaey)", "type": "Textbook", "url": "https://ieeexplore.ieee.org"},
                {"name": "NPTEL VLSI Design Course (IIT Kharagpur)", "type": "Video Lectures", "url": "https://nptel.ac.in"}
            ]
        elif "embedded" in pathway_title_clean or "robotics" in pathway_title_clean:
            required = ["Embedded C/C++", "FreeRTOS", "ARM Cortex", "I2C/SPI Protocols", "PCB Design"]
            strengths = [s for s in acquired_skills if s in required or "Data Analysis" in s]
            to_develop = [s for s in required if s not in strengths]
            missing_know = ["Interrupt Service Routine (ISR) latency", "Memory-mapped I/O registers", "RTOS Task Scheduling"]
            projects = [
                "STM32 Bare-Metal Sensor Dashboard via I2C",
                "PID-Controlled Two-Wheel Balancing Robot using FreeRTOS"
            ]
            resources = [
                {"name": "Making Embedded Systems (Elecia White)", "type": "Book", "url": "https://oreilly.com"},
                {"name": "Fastbit Embedded Academy", "type": "Interactive Course", "url": "https://fastbitlab.com"}
            ]
        else:
            required = ["Python / C++", "PyTorch", "Parallel Computing", "Model Evaluation"]
            strengths = [s for s in acquired_skills if s in required or "Python" in s]
            to_develop = [s for s in required if s not in strengths]
            missing_know = ["Gradient checkpointing", "Distributed data parallelism", "Quantization (INT8/FP4)"]
            projects = [
                "Build a miniature RAG system with ChromaDB and local vector embeddings",
                "Train a ResNet-18 classifier from scratch with custom PyTorch training loop"
            ]
            resources = [
                {"name": "Deep Learning Specialization (Andrew Ng)", "type": "Online Course", "url": "https://coursera.org"},
                {"name": "Hugging Face Open Source AI Handbook", "type": "Documentation", "url": "https://huggingface.co"}
            ]

        return {
            "pathway_title": pathway_title,
            "existing_strengths": strengths if strengths else ["Basic Circuit Theory", "Problem Decomposition"],
            "skills_to_develop": to_develop if to_develop else required[:3],
            "missing_knowledge": missing_know,
            "recommended_projects": projects,
            "learning_resources": resources,
            "next_milestone": f"Complete '{projects[0]}' to prove hands-on mastery."
        }

    async def generate_career_roadmap(
        self, 
        pathway_title: str, 
        student_id: str = "default_student"
    ) -> Dict[str, Any]:
        """
        Generate comprehensive, multi-stage project roadmap for the chosen career pathway.
        """
        db = await get_database().connect()
        r_id = str(uuid.uuid4())
        now_str = datetime.utcnow().isoformat()

        milestones = [
            {
                "step_number": 1,
                "milestone_title": "Academic Foundation & Core Principles",
                "target_skills": ["Theoretical Modeling", "Governing Formulas", "Scientific Rigor"],
                "recommended_project": "Reproduce classic textbook laboratory derivations in Python / simulation software.",
                "suggested_timeline": "Month 1 - 2",
                "verification_check": "Achieve 85%+ on GuruCortex Topic Mastery Assessment."
            },
            {
                "step_number": 2,
                "milestone_title": "Applied Simulation & Tool Mastery",
                "target_skills": ["Industry EDA / CAD Tools", "SPICE / Verilog / PyTorch", "Verification"],
                "recommended_project": "Design and simulate a functional sub-system matching IEEE benchmark specifications.",
                "suggested_timeline": "Month 3 - 4",
                "verification_check": "Zero timing violations in simulation testbenches."
            },
            {
                "step_number": 3,
                "milestone_title": "Hardware / Software Portfolio Capstone",
                "target_skills": ["End-to-End System Integration", "Technical Documentation", "GitHub Portfolio"],
                "recommended_project": "Publish open-source capstone with full documentation, architectural block diagram, and test results.",
                "suggested_timeline": "Month 5 - 6",
                "verification_check": "Peer review and successful demonstration video recorded."
            }
        ]

        await db.execute(
            """
            INSERT INTO career_roadmaps
            (id, student_id, pathway_title, related_subjects, industries, required_qualifications, technical_skills, certifications, skill_gap_analysis, learning_roadmap, created_at)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            """,
            (
                r_id, student_id, pathway_title,
                json.dumps(["Electronics", "Physics", "Computer Architecture"]),
                json.dumps(["Semiconductor", "Robotics", "Defense"]),
                json.dumps(["B.Tech / B.S. in Engineering"]),
                json.dumps(["Verilog", "Embedded C", "Circuit Simulation"]),
                json.dumps(["Certified Hardware Engineer"]),
                json.dumps({}),
                json.dumps(milestones),
                now_str
            )
        )
        await db.commit()

        return {
            "id": r_id,
            "pathway_title": pathway_title,
            "industry": "High-Tech Engineering",
            "overview": f"A comprehensive roadmap bridging current academic study directly to {pathway_title}.",
            "milestones": milestones,
            "alternative_pathways": ["Robotics Automation", "Hardware Verification", "Scientific Computing"],
            "created_at": now_str
        }
