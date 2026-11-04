'use client';

import React, { useState, useEffect } from 'react';
import { 
  Building2, Users, FileText, Plus, Sparkles
} from 'lucide-react';
import api from '@/lib/api-client';

export default function InstitutionMode() {
  const [dashboard, setDashboard] = useState<any>(null);

  // New classroom modal
  const [isAddingClass, setIsAddingClass] = useState(false);
  const [className, setClassName] = useState('');
  const [classSubject, setClassSubject] = useState('');
  const [teacherName, setTeacherName] = useState('');

  // New assignment modal
  const [isAddingAssignment, setIsAddingAssignment] = useState(false);
  const [assignTitle, setAssignTitle] = useState('');
  const [assignTopic, setAssignTopic] = useState('');
  const [assignDueDate, setAssignDueDate] = useState('');
  const [assignInstructions, setAssignInstructions] = useState('');

  useEffect(() => {
    loadInstitutionDashboard();
  }, []);

  const loadInstitutionDashboard = async () => {
    try {
      const res = await api.getInstitutionDashboard();
      setDashboard(res);
    } catch (err) {
      console.error("Failed to load institution dashboard:", err);
    }
  };

  const handleCreateClassroom = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!className.trim()) return;

    try {
      const added = await api.createClassroom(className, classSubject || "General Engineering", teacherName || "Faculty Instructor");
      setDashboard((prev: any) => ({
        ...prev,
        classrooms: [added, ...(prev?.classrooms || [])],
        total_classrooms: (prev?.total_classrooms || 0) + 1
      }));
      setIsAddingClass(false);
      setClassName('');
      setClassSubject('');
      setTeacherName('');
    } catch (err) {
      console.error("Failed to create classroom:", err);
    }
  };

  const handleCreateAssignment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!assignTitle.trim()) return;
    const cid = dashboard?.classrooms?.[0]?.id;
    if (!cid) return;

    try {
      const added = await api.createAssignment({
        classroom_id: cid,
        title: assignTitle,
        topic: assignTopic,
        due_date: assignDueDate || new Date().toISOString().split('T')[0],
        instructions: assignInstructions
      });
      setDashboard((prev: any) => ({
        ...prev,
        active_assignments: [added, ...(prev?.active_assignments || [])]
      }));
      setIsAddingAssignment(false);
      setAssignTitle('');
      setAssignTopic('');
      setAssignDueDate('');
      setAssignInstructions('');
    } catch (err) {
      console.error("Failed to create assignment:", err);
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="bg-[#141414] border border-white/10 rounded-2xl p-6 shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-xs uppercase font-bold text-amber-400 tracking-wider px-2 py-0.5 rounded-full bg-amber-400/10 border border-amber-400/20 flex items-center gap-1.5">
              <Building2 size={12} /> TEACHER & INSTITUTION MODE
            </span>
            <span className="text-xs text-slate-400">Classroom Cohort & Curriculum Distribution</span>
          </div>
          <h2 className="text-2xl font-bold text-white tracking-tight">
            Institutional Learning Oversight
          </h2>
          <p className="text-xs text-slate-400 mt-1 max-w-xl">
            Distribute study materials, track aggregate conceptual mastery, and assign diagnostic assessments across student cohorts.
          </p>
        </div>

        {/* Aggregate Numbers */}
        <div className="flex items-center gap-4 bg-[#0D0D0D] border border-white/10 rounded-2xl p-4 shadow-inner text-center shrink-0">
          <div>
            <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider block">Classrooms</span>
            <span className="text-2xl font-extrabold text-amber-400">
              {dashboard?.total_classrooms ?? 0}
            </span>
          </div>
          <div className="w-px h-8 bg-white/10" />
          <div>
            <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider block">Enrolled Students</span>
            <span className="text-2xl font-extrabold text-emerald-400">
              {dashboard?.total_enrolled_students ?? 0}
            </span>
          </div>
        </div>
      </div>

      {/* Classrooms Grid & Creation */}
      <div className="bg-[#141414] border border-white/10 rounded-2xl p-6 shadow-xl space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Users className="text-amber-400" size={18} />
            <h3 className="font-bold text-base text-white">Active Classroom Cohorts</h3>
          </div>
          <button
            onClick={() => setIsAddingClass(!isAddingClass)}
            className="px-3.5 py-1.5 bg-amber-600 hover:bg-amber-500 text-black font-bold rounded-xl text-xs transition-colors flex items-center gap-1.5 shadow"
          >
            <Plus size={14} /> New Classroom
          </button>
        </div>

        {/* Add Class Modal Form */}
        {isAddingClass && (
          <form onSubmit={handleCreateClassroom} className="bg-[#0D0D0D] border border-amber-500/30 rounded-xl p-4 space-y-3 animate-fade-in text-xs">
            <span className="font-bold text-amber-300 block">Create Academic Cohort</span>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <input
                type="text"
                value={className}
                onChange={e => setClassName(e.target.value)}
                placeholder="Class Name (e.g. EC-302 VLSI Lab)"
                className="bg-[#18181B] border border-white/10 rounded-lg p-2.5 text-white"
                required
              />
              <input
                type="text"
                value={classSubject}
                onChange={e => setClassSubject(e.target.value)}
                placeholder="Subject (e.g. Semiconductor Engineering)"
                className="bg-[#18181B] border border-white/10 rounded-lg p-2.5 text-white"
              />
              <input
                type="text"
                value={teacherName}
                onChange={e => setTeacherName(e.target.value)}
                placeholder="Faculty Instructor"
                className="bg-[#18181B] border border-white/10 rounded-lg p-2.5 text-white"
              />
            </div>
            <div className="flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setIsAddingClass(false)}
                className="px-3 py-1.5 rounded-lg bg-white/5 text-slate-300"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-1.5 rounded-lg bg-amber-500 text-black font-bold"
              >
                Initialize Class
              </button>
            </div>
          </form>
        )}

        {/* Classroom Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {dashboard?.classrooms?.map((cls: any) => (
            <div key={cls.id} className="bg-[#0D0D0D] border border-white/10 rounded-xl p-5 space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <span className="text-sm font-bold text-white block">{cls.name}</span>
                  <span className="text-xs text-slate-400">{cls.subject} • {cls.teacher_name}</span>
                </div>
                <div className="text-right">
                  <span className="text-xs font-mono font-bold text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded border border-amber-500/20 select-all block">
                    {cls.class_code}
                  </span>
                  <span className="text-[10px] text-slate-500 mt-0.5 block">{cls.student_count} Students</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Assignments & Curriculum Distribution */}
      <div className="bg-[#141414] border border-white/10 rounded-2xl p-6 shadow-xl space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <FileText className="text-emerald-400" size={18} />
            <h3 className="font-bold text-base text-white">Distributed Learning Assignments</h3>
          </div>
          <button
            onClick={() => setIsAddingAssignment(!isAddingAssignment)}
            className="px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-xl text-xs transition-colors flex items-center gap-1.5 shadow"
          >
            <Plus size={14} /> Assign Task
          </button>
        </div>

        {/* Add Assignment Form */}
        {isAddingAssignment && (
          <form onSubmit={handleCreateAssignment} className="bg-[#0D0D0D] border border-emerald-500/30 rounded-xl p-4 space-y-3 animate-fade-in text-xs">
            <span className="font-bold text-emerald-300 block">Distribute Assignment to Cohort</span>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <input
                type="text"
                value={assignTitle}
                onChange={e => setAssignTitle(e.target.value)}
                placeholder="Assignment Title"
                className="bg-[#18181B] border border-white/10 rounded-lg p-2.5 text-white"
                required
              />
              <input
                type="text"
                value={assignTopic}
                onChange={e => setAssignTopic(e.target.value)}
                placeholder="Topic / Concept"
                className="bg-[#18181B] border border-white/10 rounded-lg p-2.5 text-white"
              />
              <input
                type="date"
                value={assignDueDate}
                onChange={e => setAssignDueDate(e.target.value)}
                className="bg-[#18181B] border border-white/10 rounded-lg p-2.5 text-white"
              />
            </div>
            <textarea
              value={assignInstructions}
              onChange={e => setAssignInstructions(e.target.value)}
              placeholder="Instructions for students (e.g. Explore Visual Intelligence animation and answer knowledge checks)..."
              rows={2}
              className="w-full bg-[#18181B] border border-white/10 rounded-lg p-2.5 text-white"
            />
            <div className="flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setIsAddingAssignment(false)}
                className="px-3 py-1.5 rounded-lg bg-white/5 text-slate-300"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-1.5 rounded-lg bg-emerald-600 text-white font-bold"
              >
                Publish Assignment
              </button>
            </div>
          </form>
        )}

        {/* Assignment Cards */}
        <div className="space-y-3">
          {dashboard?.active_assignments?.map((a: any) => (
            <div key={a.id} className="bg-[#0D0D0D] border border-white/10 rounded-xl p-4 flex flex-col md:flex-row md:items-center justify-between gap-3">
              <div>
                <span className="text-sm font-bold text-white block">{a.title}</span>
                <span className="text-xs text-slate-400 mt-0.5 block">{a.instructions}</span>
              </div>
              <div className="text-right shrink-0">
                <span className="text-xs text-indigo-400 font-semibold block">Due: {a.due_date}</span>
                <span className="text-[10px] text-slate-500">{a.topic}</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Cohort Conceptual Mastery Overview */}
      {dashboard?.class_mastery_overview && (
        <div className="bg-[#141414] border border-white/10 rounded-2xl p-6 shadow-xl space-y-4">
          <h3 className="font-bold text-base text-white flex items-center gap-2">
            <Sparkles className="text-amber-400" size={16} /> Aggregate Cohort Conceptual Mastery
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {dashboard.class_mastery_overview.map((item: any, i: number) => (
              <div key={i} className="bg-[#0D0D0D] border border-white/5 rounded-xl p-4 space-y-2">
                <span className="text-xs font-bold text-white block">{item.topic}</span>
                <div className="flex items-center justify-between text-xs pt-1">
                  <span className="text-slate-400">Class Average:</span>
                  <span className="font-bold text-emerald-400">{item.class_average}%</span>
                </div>
                <div className="flex items-center justify-between text-[11px] text-rose-400">
                  <span>Remedial Attention Needed:</span>
                  <span className="font-semibold">{item.needs_remedial} students</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
