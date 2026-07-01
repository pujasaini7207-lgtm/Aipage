import React, { useState } from "react";
import { motion } from "framer-motion";
import { doc, updateDoc } from "firebase/firestore";
import confetti from "canvas-confetti";
import { 
  Brain, 
  BookOpen, 
  Search, 
  Plus, 
  Loader2, 
  Flame, 
  Timer, 
  CheckCircle, 
  ArrowRight, 
  Sparkles,
  AlertTriangle,
  Award,
  TrendingUp,
  History,
  FileText,
  MessageSquare,
  HelpCircle,
  Clock,
  Target
} from "lucide-react";


// Adapt local props interface
interface ModifiedDashboardProps {
  displayName: string;
  selectedClass: string;
  setSelectedClass: (val: string) => void;
  selectedBoard: string;
  setSelectedBoard: (val: string) => void;
  subjects: string[];
  subjectsProgress: Record<string, any>;
  testHistory: any[];
  userSyllabus: Record<string, string[]> | null;
  setUserSyllabus: (val: Record<string, string[]> | null) => void;
  syllabusSources: any[];
  setSyllabusSources: (val: any[]) => void;
  newSubjectToManage: string;
  setNewSubjectToManage: (val: string) => void;
  handleAddCustomSubject: () => void;
  setCurrentStudySubject: (sub: string) => void;
  setSelectedSubject: (sub: string) => void;
  setSelectedTopic: (top: string) => void;
  setActiveTab: (tab: any) => void;
  triggerNotification: (msg: string, type: "success" | "error" | "info") => void;
  isFetchingSyllabus: boolean;
  setIsFetchingSyllabus: (val: boolean) => void;
  safeFetch: any;
  db: any;
  auth: any;
  getTopicsForSubject: (sub: string) => string[];
  realStreak: number;
  formattedStudyTime: string;
}

export const SocraticDashboard: React.FC<ModifiedDashboardProps> = ({
  displayName,
  selectedClass,
  setSelectedClass,
  selectedBoard,
  setSelectedBoard,
  subjects,
  subjectsProgress,
  testHistory,
  userSyllabus,
  setUserSyllabus,
  syllabusSources,
  setSyllabusSources,
  newSubjectToManage,
  setNewSubjectToManage,
  handleAddCustomSubject,
  setCurrentStudySubject,
  setSelectedSubject,
  setSelectedTopic,
  setActiveTab,
  triggerNotification,
  isFetchingSyllabus,
  setIsFetchingSyllabus,
  safeFetch,
  db,
  auth,
  getTopicsForSubject,
  realStreak,
  formattedStudyTime
}) => {
  const [editingSubject, setEditingSubject] = useState<string | null>(null);
  const [editedTopicsText, setEditedTopicsText] = useState<string>("");

  // Daily goal & non-digital self-study states
  const [dailyGoal, setDailyGoal] = useState<number>(() => {
    const saved = localStorage.getItem("lunito_daily_learning_goal");
    return saved ? parseInt(saved, 10) : 30;
  });
  const [extraStudyMin, setExtraStudyMin] = useState<number>(() => {
    const saved = localStorage.getItem("lunito_extra_study_minutes_today");
    return saved ? parseInt(saved, 10) : 0;
  });
  const [goalReachedCelebrated, setGoalReachedCelebrated] = useState<boolean>(false);

  const parseScorePercentage = (scoreStr: string): number | null => {
    if (!scoreStr || scoreStr === "Active" || scoreStr === "Demo") return null;
    const match = scoreStr.match(/\((\d+)%\)/);
    if (match) return parseInt(match[1], 10);
    const slashMatch = scoreStr.match(/(\d+)\s*\/\s*(\d+)/);
    if (slashMatch) {
      const num = parseInt(slashMatch[1], 10);
      const den = parseInt(slashMatch[2], 10);
      if (den > 0) return Math.round((num / den) * 100);
    }
    return null;
  };

  const realQuizzes = testHistory.filter(h => h.score && h.score !== "Active" && h.score !== "Demo");

  const totalChats = Object.values(subjectsProgress).reduce((acc, p: any) => acc + (p.chatsCount || 0), 0);
  const realQuizCount = realQuizzes.length;
  const totalFlashcards = Object.values(subjectsProgress).reduce((acc, p: any) => acc + (p.flashcardCount || 0), 0);
  const totalNotebookPages = Object.values(subjectsProgress).reduce((acc, p: any) => acc + (p.notebookPageCount || 0), 0);
  const autoMinutes = (totalChats * 3) + (realQuizCount * 10) + (totalNotebookPages * 15) + (totalFlashcards * 5);
  const currentTotalMins = autoMinutes + extraStudyMin;

  const handleUpdateGoal = (newGoal: number) => {
    const validated = Math.max(5, Math.min(180, newGoal));
    setDailyGoal(validated);
    localStorage.setItem("lunito_daily_learning_goal", validated.toString());
    triggerNotification(`Daily learning goal set to ${validated} minutes.`, "success");
    if (autoMinutes + extraStudyMin < validated) {
      setGoalReachedCelebrated(false);
    }
  };

  const handleLogExtraTime = (mins: number) => {
    const nextVal = Math.max(0, extraStudyMin + mins);
    setExtraStudyMin(nextVal);
    localStorage.setItem("lunito_extra_study_minutes_today", nextVal.toString());
    triggerNotification(`Logged +${mins}m of offline study/reading!`, "success");
  };

  const handleResetExtraTime = () => {
    setExtraStudyMin(0);
    localStorage.setItem("lunito_extra_study_minutes_today", "0");
    setGoalReachedCelebrated(false);
    triggerNotification("Logged offline study minutes reset.", "info");
  };

  React.useEffect(() => {
    if (currentTotalMins >= dailyGoal && !goalReachedCelebrated && dailyGoal > 0) {
      confetti({
        particleCount: 100,
        spread: 70,
        origin: { y: 0.6 },
        colors: ["#10A37F", "#8B5CF6", "#06B6D4", "#F59E0B"]
      });
      setGoalReachedCelebrated(true);
      triggerNotification("Daily target accomplished! Keep it up! 🎉", "success");
    }
  }, [currentTotalMins, dailyGoal, goalReachedCelebrated, triggerNotification]);

  // Dynamic Socratic AI Memory Analyzer
  // Gather weak topics, strong topics, etc.
  const buildAIMemorySystem = () => {
    const weakList: { subject: string; topic: string; score: number }[] = [];
    const strongList: { subject: string; topic: string; score: number }[] = [];
    const gapsList: { subject: string; topic: string; details: string }[] = [];

    realQuizzes.forEach((run) => {
      const pct = parseScorePercentage(run.score);
      if (pct !== null) {
        if (pct < 60) {
          weakList.push({ subject: run.subject, topic: run.topic, score: pct });
        } else if (pct >= 85) {
          strongList.push({ subject: run.subject, topic: run.topic, score: pct });
        }
      }
    });

    // Extract subjects without any study history
    subjects.forEach((sub) => {
      const subProg = subjectsProgress[sub];
      const hasHistory = subProg && (subProg.chatsCount > 0 || subProg.quizCount > 0);
      if (!hasHistory) {
        gapsList.push({
          subject: sub,
          topic: getTopicsForSubject(sub)[0] || "Foundational Concepts",
          details: "Pending diagnostic introduction study"
        });
      }
    });

    const revisions: { subject: string; topic: string; daysLeft: string; type: string }[] = [];
    realQuizzes.forEach((quiz) => {
      const pct = parseScorePercentage(quiz.score);
      if (pct !== null) {
        let daysLeft = "In 2 days";
        if (pct < 70) {
          daysLeft = "Review Today ⚡";
        } else if (pct < 85) {
          daysLeft = "In 1 day";
        }
        if (!revisions.some((r) => r.topic === quiz.topic)) {
          revisions.push({
            subject: quiz.subject,
            topic: quiz.topic,
            daysLeft,
            type: "Spaced Repetition"
          });
        }
      }
    });

    return {
      weakList: weakList.slice(0, 3),
      strongList: strongList.slice(0, 3),
      gapsList: gapsList.slice(0, 3),
      revisions: revisions.slice(0, 3)
    };
  };

  const aiMemory = buildAIMemorySystem();

  return (
    <motion.div
      key="dashboard"
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0 }}
      className="max-w-6xl mx-auto space-y-8"
    >
      {/* 1. WELCOME SECTION ( Inspired by premium editorial typography ) */}
      <div className="border-b border-[#E5E5E5] pb-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-[10px] uppercase font-bold tracking-widest text-[#666666] font-mono">WORKSPACE COMMAND CENTER</span>
            <div className="w-1.5 h-1.5 rounded-full bg-[#10A37F]" />
            <span className="text-[10px] font-sans font-bold uppercase text-[#10A37F]">LUNITO ACTIVE</span>
          </div>
          <h1 className="text-3xl font-semibold tracking-tight text-[#111111] font-display">
            Good day, {displayName}
          </h1>
          <p className="text-sm text-[#666666] mt-1.5 max-w-xl">
            Explore personalized paths, Socratic chats, structured checklists, and deep diagnostic assessments in <span className="font-semibold text-[#111111]">{selectedClass}</span> ({selectedBoard}).
          </p>
        </div>

        {/* METRICS ROW */}
        <div className="flex items-center gap-4 shrink-0">
          <div className="px-4 py-3 bg-[#F7F7F8] border border-[#E5E5E5] rounded-xl flex items-center gap-3">
            <div className="p-2 bg-amber-50 rounded-lg text-amber-650">
              <Flame className="w-5 h-5 fill-current" />
            </div>
            <div>
              <span className="block text-[9px] font-bold text-[#666666] uppercase tracking-wider font-mono">Streak</span>
              <span className="text-sm font-semibold text-[#111111] block mt-0.5">{realStreak} Days</span>
            </div>
          </div>

          <div className="px-4 py-3 bg-[#F7F7F8] border border-[#E5E5E5] rounded-xl flex items-center gap-3">
            <div className="p-2 bg-emerald-50 rounded-lg text-[#10A37F]">
              <Timer className="w-5 h-5" />
            </div>
            <div>
              <span className="block text-[9px] font-bold text-[#666666] uppercase tracking-wider font-mono">Active Time</span>
              <span className="text-sm font-semibold text-[#111111] block mt-0.5">{formattedStudyTime}</span>
            </div>
          </div>
        </div>
      </div>

      {/* DAILY LEARNING GOAL TRACKER BLOCK */}
      <div className="p-6 bg-white border border-[#E5E5E5] rounded-xl relative overflow-hidden">
        {/* Subtle decorative background pattern */}
        <div className="absolute top-0 right-0 w-32 h-32 bg-radial from-[#10A37F]/5 to-transparent pointer-events-none rounded-full" />
        
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          {/* Left Block: Circular Progress Radial & Big Readout */}
          <div className="flex items-center gap-5">
            <div className="relative shrink-0 flex items-center justify-center">
              <svg className="w-20 h-20 transform -rotate-90">
                {/* Background Ring */}
                <circle
                  cx="40"
                  cy="40"
                  r="32"
                  className="stroke-stone-100 fill-none"
                  strokeWidth="6"
                />
                {/* Foreground Progress Ring */}
                <circle
                  cx="40"
                  cy="40"
                  r="32"
                  className={`fill-none transition-all duration-700 ease-out ${
                    currentTotalMins >= dailyGoal ? 'stroke-emerald-500' : 'stroke-[#10A37F]'
                  }`}
                  strokeWidth="6"
                  strokeDasharray={201.06} // 2 * PI * 32
                  strokeDashoffset={201.06 - Math.min(1, currentTotalMins / dailyGoal) * 201.06}
                  strokeLinecap="round"
                />
              </svg>
              {/* Central Text */}
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className="text-sm font-extrabold text-[#111111] leading-none">
                  {Math.round(Math.min(1, currentTotalMins / dailyGoal) * 100)}%
                </span>
                <span className="text-[7.5px] font-mono font-bold tracking-wider text-stone-400 mt-0.5 uppercase">
                  Goal
                </span>
              </div>
            </div>

            <div>
              <div className="flex items-center gap-1.5">
                <Target className="w-4 h-4 text-[#10A37F]" />
                <h3 className="text-sm font-bold text-[#111111] uppercase tracking-wider font-sans">
                  Daily Learning Target
                </h3>
              </div>
              <p className="text-xs text-[#666666] mt-1 max-w-md leading-relaxed">
                Set active study goals and track progress across interactive dialogue chats, quizzes, flashcard sessions, and notebook pages.
              </p>
              
              <div className="mt-3 flex items-center gap-2 flex-wrap">
                <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-stone-50 border border-stone-200 text-xs font-semibold text-zinc-900 rounded-lg">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 shrink-0" />
                  <strong>{currentTotalMins}</strong> / {dailyGoal} mins studied today
                </span>
                {currentTotalMins >= dailyGoal && (
                  <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-emerald-50 border border-emerald-100 text-xs font-bold text-emerald-600 rounded-lg animate-pulse">
                    <Sparkles className="w-3.5 h-3.5" />
                    Target Completed!
                  </span>
                )}
              </div>
            </div>
          </div>

          <div className="h-px lg:h-12 w-full lg:w-px bg-stone-200/80" />

          {/* Right Block: Controls */}
          <div className="flex flex-col md:flex-row md:items-center gap-6 xl:gap-8">
            {/* Goal setter */}
            <div className="space-y-2 shrink-0">
              <span className="block text-[10px] font-bold text-[#666666] tracking-widest uppercase font-mono">
                Adjust Daily Goal
              </span>
              <div className="flex items-center gap-1.5">
                <button
                  onClick={() => handleUpdateGoal(dailyGoal - 5)}
                  disabled={dailyGoal <= 5}
                  className="w-8 h-8 flex items-center justify-center border border-stone-200 hover:bg-stone-50 rounded-lg text-stone-700 font-bold transition-all disabled:opacity-40 select-none cursor-pointer text-xs"
                  title="Subtract 5 mins"
                >
                  -5
                </button>
                <div className="px-3 py-1 bg-[#F7F7F8] border border-[#E5E5E5] rounded-lg text-center min-w-[70px]">
                  <span className="text-xs font-bold text-zinc-800 font-sans block leading-none">
                    {dailyGoal} min
                  </span>
                </div>
                <button
                  onClick={() => handleUpdateGoal(dailyGoal + 5)}
                  disabled={dailyGoal >= 180}
                  className="w-8 h-8 flex items-center justify-center border border-stone-200 hover:bg-stone-50 rounded-lg text-stone-700 font-bold transition-all disabled:opacity-40 select-none cursor-pointer text-xs"
                  title="Add 5 mins"
                >
                  +5
                </button>
              </div>
              <div className="flex gap-1">
                {[15, 30, 45, 60].map((preset) => (
                  <button
                    key={preset}
                    onClick={() => handleUpdateGoal(preset)}
                    className={`px-2 py-0.5 border text-[10px] font-bold rounded-md transition-all cursor-pointer ${
                      dailyGoal === preset
                        ? "bg-[#10A37F] border-[#10A37F] text-white"
                        : "bg-white border-stone-200 text-stone-600 hover:bg-stone-50"
                    }`}
                  >
                    {preset}m
                  </button>
                ))}
              </div>
            </div>

            {/* Offline study logger */}
            <div className="space-y-2">
              <span className="block text-[10px] font-bold text-[#666666] tracking-widest uppercase font-mono">
                Log Offline Self-Study
              </span>
              <div className="flex items-center gap-1.5 flex-wrap">
                <button
                  onClick={() => handleLogExtraTime(10)}
                  className="px-2.5 py-1.5 bg-sky-50 border border-sky-100 hover:bg-sky-100 text-sky-700 font-bold text-xs rounded-lg transition-all cursor-pointer shadow-3xs"
                  title="Log 10 mins reading self-study"
                >
                  +10m
                </button>
                <button
                  onClick={() => handleLogExtraTime(20)}
                  className="px-2.5 py-1.5 bg-indigo-50 border border-indigo-100 hover:bg-indigo-100 text-indigo-700 font-bold text-xs rounded-lg transition-all cursor-pointer shadow-3xs"
                  title="Log 20 mins homework practice"
                >
                  +20m
                </button>
                <button
                  onClick={() => handleLogExtraTime(30)}
                  className="px-2.5 py-1.5 bg-teal-50 border border-teal-100 hover:bg-teal-100 text-teal-700 font-bold text-xs rounded-lg transition-all cursor-pointer shadow-3xs"
                  title="Log 30 mins intensive revision"
                >
                  +30m
                </button>
                {extraStudyMin > 0 && (
                  <button
                    onClick={handleResetExtraTime}
                    className="p-1.5 hover:bg-red-50 text-stone-400 hover:text-red-500 rounded-lg transition-all cursor-pointer border border-transparent hover:border-red-100"
                    title="Reset manually logged hours"
                  >
                    <span className="text-[10px] font-bold uppercase font-mono">Reset ({extraStudyMin}m)</span>
                  </button>
                )}
              </div>
              <p className="text-[10px] text-stone-400 font-mono mt-1">
                Spent time reading physical notebooks? Log it here!
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* 2. DYNAMIC QUICK ACTIONS & CONTINUE BLOCK */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <button
          onClick={() => {
            setSelectedSubject("Mathematics");
            setSelectedTopic(getTopicsForSubject("Mathematics")[0] || "Core Fundamentals");
            setActiveTab("chat");
          }}
          className="text-left p-5 bg-[#F7F7F8] hover:bg-[#F3F4F6] border border-[#E5E5E5] rounded-xl transition-all duration-150 cursor-pointer group"
        >
          <div className="p-2.5 bg-white border border-[#E5E5E5] rounded-lg text-[#10A37F] w-fit mb-4">
            <MessageSquare className="w-4 h-4" />
          </div>
          <h3 className="text-sm font-bold text-[#111111] flex items-center gap-1">
            <span>Resume Socratic Chat</span>
            <ArrowRight className="w-3.5 h-3.5 opacity-0 group-hover:opacity-100 transition-all transform group-hover:translate-x-1" />
          </h3>
          <p className="text-xs text-[#666666] mt-1.5 leading-relaxed">
            Collaborate with your AI partner to clarify doubts step-by-step.
          </p>
        </button>

        <button
          onClick={() => {
            setSelectedSubject("Mathematics");
            setActiveTab("notebook");
          }}
          className="text-left p-5 bg-[#F7F7F8] hover:bg-[#F3F4F6] border border-[#E5E5E5] rounded-xl transition-all duration-150 cursor-pointer group"
        >
          <div className="p-2.5 bg-white border border-[#E5E5E5] rounded-lg text-blue-600 w-fit mb-4">
            <FileText className="w-4 h-4" />
          </div>
          <h3 className="text-sm font-bold text-[#111111] flex items-center gap-1">
            <span>Open Socratic Notebook</span>
            <ArrowRight className="w-3.5 h-3.5 opacity-0 group-hover:opacity-100 transition-all transform group-hover:translate-x-1" />
          </h3>
          <p className="text-xs text-[#666666] mt-1.5 leading-relaxed">
            Draft active notes, equations, code, or revise concepts with Notion-style layout.
          </p>
        </button>

        <button
          onClick={() => {
            setSelectedSubject("Mathematics");
            setActiveTab("flashcards");
          }}
          className="text-left p-5 bg-[#F7F7F8] hover:bg-[#F3F4F6] border border-[#E5E5E5] rounded-xl transition-all duration-150 cursor-pointer group"
        >
          <div className="p-2.5 bg-white border border-[#E5E5E5] rounded-lg text-purple-600 w-fit mb-4">
            <Brain className="w-4 h-4" />
          </div>
          <h3 className="text-sm font-bold text-[#111111] flex items-center gap-1">
            <span>Review Flashcards</span>
            <ArrowRight className="w-3.5 h-3.5 opacity-0 group-hover:opacity-100 transition-all transform group-hover:translate-x-1" />
          </h3>
          <p className="text-xs text-[#666666] mt-1.5 leading-relaxed">
            Synthesize formulas and exam-style definitions with spaced repetition.
          </p>
        </button>

        <button
          onClick={() => {
            setSelectedSubject("Mathematics");
            setActiveTab("test");
          }}
          className="text-left p-5 bg-[#F7F7F8] hover:bg-[#F3F4F6] border border-[#E5E5E5] rounded-xl transition-all duration-150 cursor-pointer group"
        >
          <div className="p-2.5 bg-white border border-[#E5E5E5] rounded-lg text-amber-600 w-fit mb-4">
            <HelpCircle className="w-4 h-4" />
          </div>
          <h3 className="text-sm font-bold text-[#111111] flex items-center gap-1">
            <span>Take Diagnostic Quiz</span>
            <ArrowRight className="w-3.5 h-3.5 opacity-0 group-hover:opacity-100 transition-all transform group-hover:translate-x-1" />
          </h3>
          <p className="text-xs text-[#666666] mt-1.5 leading-relaxed">
            Verify comprehensive performance and isolate potential structural gaps.
          </p>
        </button>
      </div>

      {/* 3. CORE AI INSIGHTS & MEMORY SYSTEM INTUITIVE GRID */}
      <div className="p-6 bg-[#FFFFFF] border border-[#E5E5E5] rounded-xl space-y-5">
        <div className="flex items-center gap-2 border-b border-[#E5E5E5] pb-4">
          <Sparkles className="w-4.5 h-4.5 text-[#10A37F]" />
          <div>
            <h3 className="text-sm font-bold text-[#111111] uppercase tracking-wider font-sans">Active AI Cognitive Insights</h3>
            <p className="text-xs text-[#666666] mt-0.5">Real-time diagnosis generated from quiz reviews, notebooks, and learning streaks.</p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          {/* Weak Topics */}
          <div className="space-y-3">
            <div className="flex items-center gap-1.5 text-xs font-bold text-red-650 uppercase tracking-wide font-mono">
              <AlertTriangle className="w-3.5 h-3.5 text-red-500" />
              <span>Weak Topics</span>
            </div>
            <div className="space-y-2">
              {aiMemory.weakList.length > 0 ? (
                aiMemory.weakList.map((item, idx) => (
                  <div key={idx} className="p-3 bg-red-50/50 border border-red-100 rounded-lg">
                    <div className="text-[10px] font-bold text-red-800 uppercase tracking-wider font-mono">{item.subject}</div>
                    <h4 className="text-xs font-semibold text-[#111111] mt-1 pr-1 truncate">{item.topic}</h4>
                    <div className="text-[10px] text-red-750 font-medium mt-1">Socratic score: {item.score}%</div>
                  </div>
                ))
              ) : (
                <div className="p-4 rounded-xl border border-dashed border-[#E5E5E5] bg-zinc-50/40 text-center">
                  <p className="text-[10px] text-zinc-500 leading-normal font-sans">No weak areas identified. Keep practicing to maintain excellence!</p>
                </div>
              )}
            </div>
          </div>

          {/* Strong Topics */}
          <div className="space-y-3">
            <div className="flex items-center gap-1.5 text-xs font-bold text-emerald-700 uppercase tracking-wide font-mono">
              <Award className="w-3.5 h-3.5 text-emerald-500" />
              <span>Strong Topics</span>
            </div>
            <div className="space-y-2">
              {aiMemory.strongList.length > 0 ? (
                aiMemory.strongList.map((item, idx) => (
                  <div key={idx} className="p-3 bg-emerald-50/40 border border-emerald-100 rounded-lg">
                    <div className="text-[10px] font-bold text-emerald-800 uppercase tracking-wider font-mono">{item.subject}</div>
                    <h4 className="text-xs font-semibold text-[#111111] mt-1 pr-1 truncate">{item.topic}</h4>
                    <div className="text-[10px] text-[#10A37F] font-bold mt-1">Mastery is solid: {item.score}%</div>
                  </div>
                ))
              ) : (
                <div className="p-4 rounded-xl border border-dashed border-[#E5E5E5] bg-zinc-50/40 text-center">
                  <p className="text-[10px] text-zinc-500 leading-normal font-sans">Complete quizzes with 85%+ score to record strong topics here.</p>
                </div>
              )}
            </div>
          </div>

          {/* Knowledge Gaps */}
          <div className="space-y-3">
            <div className="flex items-center gap-1.5 text-xs font-bold text-blue-700 uppercase tracking-wide font-mono">
              <TrendingUp className="w-3.5 h-3.5 text-blue-500" />
              <span>Knowledge Gaps</span>
            </div>
            <div className="space-y-2">
              {aiMemory.gapsList.length > 0 ? (
                aiMemory.gapsList.map((item, idx) => (
                  <div key={idx} className="p-3 bg-blue-50/40 border border-blue-100 rounded-lg">
                    <div className="text-[10px] font-bold text-blue-850 uppercase tracking-wider font-mono">{item.subject}</div>
                    <h4 className="text-xs font-semibold text-[#111111] mt-1 pr-1 truncate">{item.topic}</h4>
                    <p className="text-[10px] text-[#666666] mt-1 leading-normal">{item.details}</p>
                  </div>
                ))
              ) : (
                <div className="p-4 rounded-xl border border-dashed border-[#E5E5E5] bg-zinc-50/40 text-center">
                  <p className="text-[10px] text-zinc-500 leading-normal font-sans">No learning gaps detected. All registered courses initiated!</p>
                </div>
              )}
            </div>
          </div>

          {/* Revisions Schedule */}
          <div className="space-y-3">
            <div className="flex items-center gap-1.5 text-xs font-bold text-amber-700 uppercase tracking-wide font-mono">
              <History className="w-3.5 h-3.5 text-amber-500" />
              <span>Diagnostic Revisions</span>
            </div>
            <div className="space-y-2">
              {aiMemory.revisions.length > 0 ? (
                aiMemory.revisions.map((item, idx) => (
                  <div key={idx} className="p-3 bg-amber-50/40 border border-amber-100 rounded-lg">
                    <div className="text-[10px] font-bold text-amber-850 uppercase tracking-wider font-mono">{item.subject}</div>
                    <h4 className="text-xs font-semibold text-[#111111] mt-1 pr-1 truncate">{item.topic}</h4>
                    <div className="inline-block px-1.5 py-0.5 rounded bg-amber-100/60 text-amber-900 text-[9px] font-extrabold mt-1.5 font-mono">
                      {item.daysLeft}
                    </div>
                  </div>
                ))
              ) : (
                <div className="p-4 rounded-xl border border-dashed border-[#E5E5E5] bg-zinc-50/40 text-center">
                  <p className="text-[10px] text-zinc-500 leading-normal font-sans">Study balance optimized. Take active quizzes to compile spaced repetition tasks.</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* 4. CLINICAL SUBJECT PROGRESS LIST CARDS */}
      <div className="space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-[#E5E5E5] pb-3">
          <div>
            <h3 className="text-sm font-bold text-[#111111] uppercase tracking-wider font-sans">Active Subject Portfolios</h3>
            <p className="text-xs text-[#666666] mt-0.5">Track syllabus coverage and custom dialogue hours across registered fields.</p>
          </div>
          
          <div className="flex items-center gap-2 shrink-0">
            <input 
              type="text"
              placeholder="Add field e.g. Philosophy"
              value={newSubjectToManage}
              onChange={(e) => setNewSubjectToManage(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  handleAddCustomSubject();
                }
              }}
              className="bg-white border border-[#E5E5E5] rounded-lg px-3 py-1 outline-none text-xs text-[#111111] focus:border-[#10A37F] transition-all font-medium h-8 w-44 placeholder-[#666666]/60"
            />
            <button
              id="register-new-subject-btn"
              onClick={handleAddCustomSubject}
              className="h-8 px-3 bg-[#10A37F] hover:bg-[#10A37F]/90 text-white font-semibold text-xs rounded-lg transition-all flex items-center gap-1 cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Add</span>
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {subjects.map((sub) => {
            const subProg = subjectsProgress[sub] || { chatsCount: 0, quizCount: 0, quizScoreSum: 0, flashcardCount: 0, notebookPageCount: 0, masteryLevel: 0 };
            
            const subRuns = testHistory.filter(q => q.subject === sub);
            const lastStudiedDate = subRuns.length > 0 ? subRuns[0].date : "Not studied yet";

            const subTopics = getTopicsForSubject(sub);
            const completedSubQuizzes = realQuizzes
              .filter(q => q.subject === sub && parseScorePercentage(q.score) !== null && (parseScorePercentage(q.score) || 0) >= 80)
              .map(q => q.topic);
            const nextRecommended = subTopics.find(t => !completedSubQuizzes.includes(t)) || (subTopics[0] || "Foundational Topics");

            const subMinutes = (subProg.chatsCount * 3) + (subProg.quizCount * 10) + (subProg.notebookPageCount * 15) + (subProg.flashcardCount * 5);
            const timeSpent = subMinutes > 59 
              ? `${(subMinutes / 60).toFixed(1)} hrs` 
              : `${subMinutes} mins`;

            return (
              <div
                key={sub}
                className="p-5 rounded-xl bg-[#FFFFFF] border border-[#E5E5E5] flex flex-col justify-between h-[210px] hover:border-gray-400 hover:shadow-sm transition-all group"
              >
                <div>
                  <div className="flex justify-between items-start">
                    <div className="flex items-center gap-2.5">
                      <div className="w-8 h-8 rounded-lg bg-emerald-50 text-[#10A37F] flex items-center justify-center shrink-0 border border-emerald-100">
                        {sub === "Mathematics" ? <Brain className="w-4 h-4" /> : <BookOpen className="w-4 h-4" />}
                      </div>
                      <div>
                        <h4 className="text-xs font-bold text-[#111111] group-hover:text-[#10A37F] transition-colors">{sub}</h4>
                        <span className="text-[9px] text-[#666666] font-mono block">Last studied: {lastStudiedDate}</span>
                      </div>
                    </div>
                    
                    <span className="text-[9.5px] bg-[#F7F7F8] border border-[#E5E5E5] text-[#111111] px-2 py-0.5 rounded-md font-mono font-bold">
                      {subProg.masteryLevel}% Mapped
                    </span>
                  </div>

                  <div className="mt-4 space-y-1 text-[11px] text-[#666666]">
                    <div className="flex justify-between">
                      <span>Curriculum Target:</span>
                      <span className="text-[#111111] font-medium truncate max-w-[140px]">{nextRecommended}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Activity Track:</span>
                      <span className="text-[#111111] font-medium">{subProg.chatsCount} Chats • {subProg.quizCount} Quizzes</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Hours Invested:</span>
                      <span className="text-[#111111] font-medium">{timeSpent}</span>
                    </div>
                  </div>
                </div>

                <div className="mt-4 pt-3 border-t border-[#E5E5E5]">
                  <div className="h-1 bg-[#F7F7F8] rounded-full overflow-hidden mb-3">
                    <div 
                      className="h-full bg-[#10A37F] rounded-full transition-all duration-300"
                      style={{ width: `${subProg.masteryLevel}%` }}
                    />
                  </div>

                  <div className="flex gap-2">
                    <button 
                      onClick={() => {
                        setCurrentStudySubject(sub);
                        setSelectedSubject(sub);
                        setSelectedTopic(nextRecommended);
                        setActiveTab("chat");
                        triggerNotification(`Ready for Socratic study on ${sub}: ${nextRecommended}`, "success");
                      }}
                      className="flex-1 py-1.5 px-3 bg-[#10A37F] hover:bg-[#10A37F]/90 text-white font-semibold text-[10px] rounded-lg transition-all cursor-pointer flex items-center justify-center"
                    >
                      Dialogue Chat
                    </button>
                    <button 
                      onClick={() => {
                        setCurrentStudySubject(sub);
                        setSelectedSubject(sub);
                        setSelectedTopic(nextRecommended);
                        setActiveTab("test");
                        triggerNotification(`Loading diagnostic assessment for: ${nextRecommended}`, "success");
                      }}
                      className="flex-1 py-1.5 px-3 bg-[#F7F7F8] border border-[#E5E5E5] hover:bg-[#F3F4F6] text-[#111111] font-semibold text-[10px] rounded-lg transition-all cursor-pointer flex items-center justify-center"
                    >
                      Take Quiz
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* 5. SECURE SYLLABUS CONTROLS ( Search grounded sync and sources citations ) */}
      <div className="p-6 rounded-xl bg-[#FFFFFF] border border-[#E5E5E5] flex flex-col gap-5 shadow-none relative overflow-hidden font-sans">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#E5E5E5] pb-4">
          <div>
            <div className="flex items-center gap-1.5 text-[10px] font-bold text-[#666666] uppercase tracking-widest font-mono">
              <Search className="w-3.5 h-3.5 text-[#10A37F]" />
              <span>STANDARD OFFICIAL CURRICULUM INTEGRITY</span>
            </div>
            <h3 className="text-sm font-bold text-[#111111] mt-1">
              Google Research-Synced Syllabus: <span className="text-[#10A37F]">{selectedClass}</span> ({selectedBoard})
            </h3>
          </div>
          
          <div className="flex items-center gap-2 flex-wrap">
            <span className="px-2 py-0.5 rounded bg-emerald-50 border border-emerald-100 text-[10px] font-bold text-[#10A37F]">
              Direct Mapped
            </span>
          </div>
        </div>

        {/* Mapped sections */}
        <div>
          <div className="text-xs font-bold text-[#666666] uppercase tracking-wider mb-2.5">Academic Syllabus Milestones:</div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {subjects.map((sub) => {
              const topics = getTopicsForSubject(sub);
              return (
                <div key={sub} className="p-4 rounded-xl bg-[#F7F7F8] border border-[#E5E5E5] flex flex-col justify-between">
                  <div>
                    <div className="flex justify-between items-center">
                      <div className="text-[10px] font-bold text-[#10A37F] uppercase tracking-widest font-mono">{sub}</div>
                      <button
                        onClick={() => {
                          setEditingSubject(sub);
                          setEditedTopicsText(topics.join("\n"));
                          triggerNotification(`Editing ${sub} syllabus milestones...`, "info");
                        }}
                        className="text-[9px] font-extrabold text-emerald-800 hover:text-emerald-950 font-mono bg-emerald-50 hover:bg-emerald-100 border border-emerald-100 px-1.5 py-0.5 rounded cursor-pointer transition-all"
                      >
                        Customize
                      </button>
                    </div>
                    <div className="mt-3 space-y-1.5">
                      {topics.map((tp, idx) => (
                        <div key={idx} className="flex items-start gap-1.5 text-xs text-[#111111]">
                          <span className="text-[#10A37F] text-[10px] font-bold mt-0.5">✓</span>
                          <span className="truncate font-medium">{tp}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                  <div className="mt-4 pt-3 border-t border-[#E5E5E5] flex items-center justify-between text-[9px] text-[#666666] font-medium font-mono">
                    <span>{topics.length} Mapped Areas</span>
                    <button 
                      onClick={() => {
                        setCurrentStudySubject(sub);
                        setSelectedSubject(sub);
                        setSelectedTopic(topics[0] || "General");
                        setActiveTab("chat");
                        triggerNotification(`Ready to teach ${sub} under official syllabus!`, "success");
                      }}
                      className="text-[#10A37F] hover:underline transition-all font-bold cursor-pointer"
                    >
                      Socratic Chat ➔
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Beautiful Syllabus Overlay Modal */}
        {editingSubject && (
          <div className="fixed inset-0 bg-black/45 backdrop-blur-xs flex items-center justify-center p-4 z-[9999] text-left">
            <div className="bg-white border-2 border-emerald-500 rounded-2xl max-w-md w-full p-6 shadow-xl space-y-4">
              <div>
                <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wide font-display flex items-center gap-2">
                  <BookOpen className="w-5 h-5 text-emerald-600" />
                  <span>Customize Syllabus: {editingSubject}</span>
                </h3>
                <p className="text-xs text-slate-500 mt-1">
                  Edit or type your actual school/college syllabus topics for <b>{editingSubject}</b> below, one topic per line.
                </p>
              </div>

              <textarea
                value={editedTopicsText}
                onChange={(e) => setEditedTopicsText(e.target.value)}
                placeholder="e.g.&#10;Quadratic Equations&#10;Arithmetic Progressions&#10;Probability"
                rows={8}
                className="w-full text-xs font-mono p-3 bg-slate-50 border border-slate-200 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500/10 rounded-xl outline-none resize-none leading-relaxed text-slate-800"
              />

              <div className="text-[10px] text-slate-400 font-mono">
                Topics currently entered: {editedTopicsText.split("\n").filter(t => t.trim() !== "").length}
              </div>

              <div className="flex gap-2 justify-end">
                <button
                  type="button"
                  onClick={() => setEditingSubject(null)}
                  className="h-9 px-4 border border-slate-200 hover:bg-slate-50 text-slate-600 rounded-xl text-xs font-semibold cursor-pointer transition-all"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={async () => {
                    const splitTopics = editedTopicsText
                      .split("\n")
                      .map(t => t.trim())
                      .filter(t => t !== "");

                    if (splitTopics.length === 0) {
                      triggerNotification("Please provide at least one topic name", "error");
                      return;
                    }

                    const updatedSyllabus = {
                      ...(userSyllabus || {}),
                      [editingSubject]: splitTopics
                    };

                    setUserSyllabus(updatedSyllabus);

                    // Save to Firestore
                    const currentUser = auth.currentUser;
                    if (currentUser) {
                      try {
                        const userDocRef = doc(db, "users", currentUser.uid);
                        await updateDoc(userDocRef, {
                          syllabus: updatedSyllabus
                        });
                      } catch (err) {
                        console.error("Failed to commit syllabus edits:", err);
                      }
                    }

                    triggerNotification(`Syllabus for ${editingSubject} updated!`, "success");
                    setEditingSubject(null);
                  }}
                  className="h-9 px-4 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold cursor-pointer transition-all shadow-sm"
                >
                  Save Syllabus
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Display source references from real google search groundings */}
        {syllabusSources && syllabusSources.length > 0 && (
          <div className="p-3 bg-[#F7F7F8] rounded-xl border border-[#E5E5E5] text-[10px] space-y-1.5">
            <div className="font-bold text-[#666666] flex items-center gap-1 font-mono">
              <span>🔗 Google Search-Synced Citation Sources:</span>
            </div>
            <div className="flex flex-wrap gap-2">
              {syllabusSources.map((source, sIdx) => (
                <a 
                  key={sIdx}
                  href={source.uri}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-2.5 py-1 rounded bg-white border border-[#E5E5E5] hover:border-[#10A37F] text-[#111111] hover:text-[#10A37F] transition-all text-[9.5px] font-medium inline-flex items-center gap-1 shadow-none"
                >
                  <span>{source.title.length > 30 ? source.title.substring(0, 30) + "..." : source.title}</span>
                  <span className="text-[#666666]">↗</span>
                </a>
              ))}
            </div>
          </div>
        )}

        {/* Search sync formulation */}
        <div className="p-4 rounded-xl bg-[#F7F7F8] border border-[#E5E5E5] mt-1 flex flex-col md:flex-row items-end gap-4 justify-between">
          <div className="flex-1 w-full grid grid-cols-1 sm:grid-cols-2 gap-4 text-left">
            <div>
              <label className="block text-[9px] font-bold text-[#666666] uppercase tracking-widest mb-1.5 font-mono">Academic Class</label>
              <select 
                value={selectedClass}
                onChange={(e) => setSelectedClass(e.target.value)}
                className="w-full bg-white border border-[#E5E5E5] rounded-lg px-3 py-1.5 text-xs text-[#111111] cursor-pointer outline-none focus:border-[#10A37F]"
              >
                {["Class 6", "Class 7", "Class 8", "Class 9", "Class 10", "Class 11", "Class 12", "Undergraduate", "Other"].map((cItem) => (
                  <option key={cItem} value={cItem}>{cItem}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-[9px] font-bold text-[#666666] uppercase tracking-widest mb-1.5 font-mono">Board or Institution Label</label>
              <input 
                type="text"
                value={selectedBoard}
                onChange={(e) => setSelectedBoard(e.target.value)}
                placeholder="e.g. CBSE, ICSE, GCSE, AP"
                className="w-full bg-white border border-[#E5E5E5] rounded-lg px-3 py-1.5 text-xs text-[#111111] outline-none focus:border-[#10A37F]"
              />
            </div>
          </div>

          <button 
            disabled={isFetchingSyllabus}
            onClick={async () => {
              setIsFetchingSyllabus(true);
              triggerNotification(`Searching Google for latest official ${selectedClass} [${selectedBoard}] syllabus...`, "info");
              try {
                const response = await safeFetch("/api/fetch-syllabus", {
                  method: "POST",
                  headers: { "Content-Type": "application/json" },
                  body: JSON.stringify({
                    userClass: selectedClass,
                    userBoard: selectedBoard,
                    subjects: subjects
                  })
                });
                if (response.ok) {
                  const resData = await response.json();
                  setUserSyllabus(resData.syllabus);
                  setSyllabusSources(resData.sources || []);
                  
                  // Save changes to Firestore
                  const user = auth.currentUser;
                  if (user) {
                    const userDocRef = doc(db, "users", user.uid);
                    await updateDoc(userDocRef, {
                      class: selectedClass,
                      board: selectedBoard,
                      syllabus: resData.syllabus,
                      syllabusSources: resData.sources || []
                    });
                  }
                  
                  triggerNotification("Google search-synced syllabus refreshed successfully!", "success");
                }
              } catch (err) {
                console.error(err);
                triggerNotification("Failed to refresh official syllabus, fallback remaining.", "error");
              } finally {
                setIsFetchingSyllabus(false);
              }
            }}
            className="w-full md:w-auto px-4 py-2 bg-[#10A37F] hover:bg-[#10A37F]/90 disabled:opacity-50 text-white text-xs font-semibold rounded-lg transition-all active:scale-95 duration-150 flex items-center justify-center gap-1.5 cursor-pointer shrink-0 h-9"
          >
            {isFetchingSyllabus ? (
              <>
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                <span>Refresher Syncing...</span>
              </>
            ) : (
              <>
                <Search className="w-3.5 h-3.5" />
                <span>Sync Syllabus via Google</span>
              </>
            )}
          </button>
        </div>
      </div>
    </motion.div>
  );
};
