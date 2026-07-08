import React from "react";
import { motion } from "framer-motion";
import { TrendingUp, Award, Clock, Star, Flame, Target } from "lucide-react";

interface SocraticAnalyticsProps {
  subjects: string[];
  subjectsProgress: Record<string, any>;
  setStreakCount: React.Dispatch<React.SetStateAction<number>>;
  updateFirestoreStats: (count: number, data?: any) => void;
  triggerNotification: (msg: string, type: "success" | "error" | "info") => void;
}

export const SocraticAnalytics: React.FC<SocraticAnalyticsProps> = ({
  subjects,
  subjectsProgress,
  setStreakCount,
  updateFirestoreStats,
  triggerNotification
}) => {
  // Math calculations
  const averageMastery = subjects.length > 0 
    ? Math.round(subjects.reduce((sum, sub) => sum + (subjectsProgress[sub]?.masteryLevel || 0), 0) / subjects.length)
    : 0;

  const totalLogsCount = subjects.reduce((sum, sub) => sum + (subjectsProgress[sub]?.chatsCount || 0) + (subjectsProgress[sub]?.quizCount || 0) + (subjectsProgress[sub]?.flashcardCount || 0), 0);

  const handleStudyActionSimulation = () => {
    setStreakCount(c => {
      const nextVal = c + 1;
      updateFirestoreStats(nextVal, undefined);
      return nextVal;
    });
    triggerNotification("Daystreak milestones reinforced successfully!", "success");
  };

  return (
    <motion.div
      key="progress"
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0 }}
      className="flex-1 flex flex-col min-h-0 space-y-6 w-full max-w-6xl mx-auto font-sans"
    >
      {/* Analytics header panel */}
      <div className="flex items-center gap-3 border-b border-[#E5E5E5] pb-3">
        <div className="p-1 px-1.5 rounded bg-emerald-50 text-[#10A37F]">
          <TrendingUp className="w-5 h-5 text-[#10A37F]" />
        </div>
        <div>
          <h2 className="text-xl font-bold text-[#111111] tracking-tight">Progress & Cognitive Mastery Analytics</h2>
          <p className="text-xs text-[#666666] mt-0.5">Real-time mapping of curriculum retention, active study streak paces, and subject breakthroughs.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 flex-1">
        
        {/* Left Column: Circlar Mastery Gauge */}
        <div className="lg:col-span-6 p-6 rounded-xl bg-white border border-[#E5E5E5] flex flex-col justify-between space-y-6 shadow-none">
          <div>
            <h3 className="text-xs font-bold uppercase tracking-wider text-[#111111] font-mono">
              Direct Curriculum Completion
            </h3>
            <p className="text-xs text-[#666666] mt-0.5">Weighted average representation of syllabus retention and task outcomes.</p>
          </div>

          <div className="relative w-44 h-44 mx-auto flex items-center justify-center">
            <svg className="absolute w-full h-full transform -rotate-90">
              <circle cx="88" cy="88" r="74" stroke="#F3F4F6" strokeWidth="9" fill="transparent" />
              <circle 
                cx="88" 
                cy="88" 
                r="74" 
                stroke="#10A37F" 
                strokeWidth="10" 
                fill="transparent" 
                strokeDasharray={464.9} 
                strokeDashoffset={464.9 - (464.9 * averageMastery) / 100} 
                strokeLinecap="round" 
                className="transition-all duration-1000"
              />
            </svg>
            <div className="text-center z-10">
              <span className="text-4xl font-extrabold text-[#111111] block leading-none font-sans">
                {averageMastery}%
              </span>
              <span className="text-[9px] font-bold text-[#10A37F] uppercase tracking-wider mt-1.5 block font-sans">
                Average Mastery
              </span>
            </div>
          </div>

          <div className="p-3.5 bg-[#F7F7F8] border border-[#E5E5E5] rounded-lg text-xs text-[#666666] font-medium font-sans">
            🎉 Excellent momentum! You have recorded a total of <span className="text-[#10A37F] font-bold">{totalLogsCount} active Socratic interactions</span> across your curriculum database. Keeps up the steady study habits!
          </div>
        </div>

        {/* Right Column: Breakdown bars */}
        <div className="lg:col-span-6 p-6 rounded-xl bg-white border border-[#E5E5E5] flex flex-col justify-between space-y-6 shadow-none">
          <div className="space-y-4">
            <div>
              <h3 className="text-xs font-bold uppercase tracking-wider text-[#111111] font-mono">
                Individual Subject Mastery breakdown
              </h3>
              <p className="text-xs text-[#666666] mt-0.5">Continuous evaluation from mock tests, page revisions, and dialogue length metrics.</p>
            </div>

            <div className="space-y-4 pt-1">
              {subjects.map((sub, idx) => {
                const subProg = subjectsProgress[sub] || { chatsCount: 0, quizCount: 0, masteryLevel: 0 };
                return (
                  <div key={idx} className="space-y-1.5">
                    <div className="flex justify-between items-center text-xs font-bold font-sans">
                      <span className="text-[#111111]">{sub}</span>
                      <span className="text-[#10A37F]">{subProg.masteryLevel || 0}% Mastery</span>
                    </div>
                    {/* Mastery slider progress bar */}
                    <div className="h-2.5 bg-gray-100 rounded-full overflow-hidden border border-[#E5E5E5]/20">
                      <div 
                        className="h-full bg-[#10A37F] rounded-full transition-all duration-1000"
                        style={{ width: `${subProg.masteryLevel || 0}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Quick study trigger progress update mock simulator helper */}
          <div className="pt-4 border-t border-[#E5E5E5] shrink-0">
            <button 
              onClick={handleStudyActionSimulation}
              className="w-full py-2 bg-[#F7F7F8] hover:bg-[#F3F4F6] border border-[#E5E5E5] hover:border-[#10A37F] rounded-lg text-xs font-bold text-[#111111] cursor-pointer transition-all duration-150"
            >
              Simulate Core Study Increment (+1 streak)
            </button>
          </div>
        </div>

      </div>

      {/* Grid of bento bento badges cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {[
          { label: "Study milestones", desc: "Total lessons unlocked successfully across standard curricula outlines.", val: `${subjects.length * 3}/12`, icon: Target },
          { label: "Socratic insights", desc: "Your analytical accuracy is calculated above average parameters.", val: "Top 4%", icon: Award },
          { label: "Revision index", desc: "Your total notes, flashcards and study paths logged.", val: `${subjects.length * 5} pages`, icon: Clock },
        ].map((bad, bIdx) => {
          const Icon = bad.icon;
          return (
            <div key={bIdx} className="p-4 bg-white border border-[#E5E5E5] rounded-xl flex items-start gap-3.5 shadow-none">
              <div className="p-2 bg-emerald-50 rounded-xl text-[#10A37F]">
                <Icon className="w-5 h-5 text-[#10A37F]" />
              </div>
              <div className="space-y-0.5">
                <span className="text-[10px] font-bold text-[#666666] uppercase font-mono">{bad.label}</span>
                <p className="text-sm font-extrabold text-[#111111]">{bad.val}</p>
                <p className="text-[10px] text-[#666666] leading-relaxed pt-0.5">{bad.desc}</p>
              </div>
            </div>
          );
        })}
      </div>

    </motion.div>
  );
};
