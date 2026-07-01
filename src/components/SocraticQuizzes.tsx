import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  HelpCircle, 
  Timer, 
  RotateCcw, 
  CheckCircle, 
  X, 
  Sparkles, 
  Send, 
  Brain, 
  Award,
  Flame,
  Volume2,
  ChevronRight,
  TrendingUp,
  PlayCircle
} from "lucide-react";

interface SocraticQuizzesProps {
  selectedSubject: string;
  setSelectedSubject: (val: string) => void;
  selectedTopic: string;
  setSelectedTopic: (val: string) => void;
  currentStudySubject: string;
  isGeneratingQuiz: boolean;
  generateQuizFromAI: (sub: string, top: string) => void;
  quizQuestions: any[];
  quizCompleted: boolean;
  quizIndex: number;
  quizScore: number;
  quizSubmitted: boolean;
  selectedQuizOption: string | null;
  quizTimeLeft: number;
  quizHistory: any[];
  testMessages: any[];
  isTestAiTyping: boolean;
  submitQuizAnswer: (key: string) => void;
  nextQuizQuestion: () => void;
  resetQuiz: () => void;
  subjects: string[];
  formatTime: (secs: number) => string;
  setTestChatInput: (val: string) => void;
  testChatInput: string;
  handleSendTestChat: () => void;
  triggerNotification: (msg: string, type: "success" | "error" | "info") => void;
  renderTextWithMath?: (text: string) => React.ReactNode;
}

export const SocraticQuizzes: React.FC<SocraticQuizzesProps> = ({
  selectedSubject,
  setSelectedSubject,
  selectedTopic,
  setSelectedTopic,
  currentStudySubject,
  isGeneratingQuiz,
  generateQuizFromAI,
  quizQuestions,
  quizCompleted,
  quizIndex,
  quizScore,
  quizSubmitted,
  selectedQuizOption,
  quizTimeLeft,
  quizHistory,
  testMessages,
  isTestAiTyping,
  submitQuizAnswer,
  nextQuizQuestion,
  resetQuiz,
  subjects,
  formatTime,
  setTestChatInput,
  testChatInput,
  handleSendTestChat,
  triggerNotification,
  renderTextWithMath
}) => {
  const [activeDifficulty, setActiveDifficulty] = useState<"Easy" | "Medium" | "Hard" | "Expert">("Medium");
  const [questionCount, setQuestionCount] = useState<number>(5);
  const [questionType, setQuestionType] = useState<"MCQ" | "True/False" | "Mixed">("MCQ");

  const renderMath = (text: string) => {
    if (renderTextWithMath) {
      return renderTextWithMath(text);
    }
    return text;
  };

  const handleLaunchQuiz = () => {
    if (!selectedTopic.trim()) {
      triggerNotification("Please outline a topic for LUNITO to query!", "info");
      return;
    }
    // Call standard quiz gen core
    generateQuizFromAI(selectedSubject, selectedTopic);
  };

  return (
    <motion.div
      key="test"
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0 }}
      className="flex-1 flex flex-col min-h-0 space-y-6 max-w-6xl mx-auto w-full font-sans"
    >
      {/* Quiz Top Header bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-[#E5E5E5] pb-3">
        <div>
          <h2 className="text-xl font-bold text-[#111111] tracking-tight flex items-center gap-2">
            <HelpCircle className="w-5 h-5 text-[#10A37F]" />
            <span>Socratic Assessment Portal</span>
          </h2>
          <p className="text-xs text-[#666666] mt-0.5 font-sans">Gauge conceptual boundaries, lock study milestones, and record real mastery scores.</p>
        </div>
        
        {quizQuestions.length > 0 && !quizCompleted && (
          <button
            onClick={resetQuiz}
            className="px-3 py-1.5 bg-rose-50 text-red-650 hover:bg-rose-100 border border-rose-100 rounded-lg text-xs font-semibold transition-all cursor-pointer"
          >
            Reset / Exit Quiz
          </button>
        )}
      </div>

      {/* AI Quiz Config Parameters Panel */}
      {quizQuestions.length === 0 && (
        <div className="p-5 rounded-xl bg-[#F7F7F8] border border-[#E5E5E5] space-y-4">
          <div className="space-y-0.5">
            <span className="text-[10px] font-bold text-[#10A37F] uppercase tracking-wider font-mono">Cognitive Assessment Builder</span>
            <h3 className="text-sm font-bold text-[#111111]">Generate Socratic Diagnostics</h3>
            <p className="text-xs text-[#666666] leading-relaxed">Input a curriculum module within <strong className="text-[#10A37F] font-semibold">{currentStudySubject}</strong>, and LUNITO will write matching diagnostic questions.</p>
          </div>

          <div className="flex flex-col sm:flex-row gap-3">
            <input 
              type="text" 
              value={selectedTopic}
              onChange={(e) => setSelectedTopic(e.target.value)}
              placeholder="e.g. Krebs Cycle, Derivatives of Trig functions, Python loops"
              className="flex-1 bg-white border border-[#E5E5E5] rounded-lg px-4 py-2.5 outline-none text-xs text-[#111111] focus:border-[#10A37F]"
            />
            
            <button
              onClick={handleLaunchQuiz}
              disabled={isGeneratingQuiz || !selectedTopic.trim()}
              className="px-5 py-2.5 bg-[#10A37F] hover:bg-[#10A37F]/95 text-white font-semibold rounded-lg text-xs transition-all flex items-center justify-center gap-2 disabled:opacity-45 cursor-pointer shrink-0"
            >
              <PlayCircle className="w-4 h-4 shrink-0" />
              <span>{isGeneratingQuiz ? "Assembling Quiz..." : "Compile AI Quiz"}</span>
            </button>
          </div>

          {/* Quick options panel */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-3 border-t border-[#E5E5E5] text-xs">
            <div>
              <span className="text-[9px] font-bold uppercase text-[#666666] font-mono block mb-1">Assessment Level</span>
              <div className="flex gap-1">
                {(["Easy", "Medium", "Hard", "Expert"] as const).map((lvl) => (
                  <button
                    key={lvl}
                    onClick={() => setActiveDifficulty(lvl)}
                    className={`px-2 py-1 text-[10px] rounded border font-semibold transition-all ${
                      activeDifficulty === lvl ? "bg-emerald-50 border-[#10A37F] text-[#10A37F]" : "bg-white border-[#E5E5E5] text-[#666666] hover:bg-gray-50 bg-white"
                    }`}
                  >
                    {lvl}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <span className="text-[9px] font-bold uppercase text-[#666666] font-mono block mb-1">Density Count</span>
              <div className="flex gap-1.5">
                {[5, 10, 15, 20].map((num) => (
                  <button
                    key={num}
                    onClick={() => setQuestionCount(num)}
                    className={`px-2.5 py-1 text-[10px] rounded border font-mono font-bold transition-all ${
                      questionCount === num ? "bg-emerald-50 border-[#10A37F] text-[#10A37F]" : "bg-white border-[#E5E5E5] text-[#666666] hover:bg-gray-50 bg-white"
                    }`}
                  >
                    {num} Qs
                  </button>
                ))}
              </div>
            </div>

            <div>
              <span className="text-[9px] font-bold uppercase text-[#666666] font-mono block mb-1 font-sans">Formatting Style</span>
              <div className="flex gap-1.5">
                {(["MCQ", "True/False", "Mixed"] as const).map((t) => (
                  <button
                    key={t}
                    onClick={() => setQuestionType(t)}
                    className={`px-2.5 py-1 text-[10px] rounded border font-semibold transition-all ${
                      questionType === t ? "bg-emerald-50 border-[#10A37F] text-[#10A37F]" : "bg-white border-[#E5E5E5] text-[#666666] hover:bg-gray-50 bg-white"
                    }`}
                  >
                    {t}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ACTIVE QUIZ FEED OR COPILOT COMPANION CHAT CONTAINER */}
      {quizQuestions.length > 0 && !quizCompleted ? (
        /* ACTIVE INTERACTIVE INTERACTIVE DISPLAY */
        <div className="p-6 rounded-xl bg-white border border-[#E5E5E5] space-y-5 animate-fadeIn relative">
          <div className="pb-4 border-b border-[#E5E5E5] flex flex-col md:flex-row md:items-center justify-between gap-4 shrink-0">
            <div>
              <div className="inline-flex items-center gap-1.5 bg-emerald-50 border border-emerald-100 px-2 py-0.5 rounded-lg mb-1.5">
                <span className="text-[9px] text-[#10A37F] font-bold uppercase tracking-wider font-mono">Assigned Subject:</span>
                <span className="text-[#10A37F] text-[10px] font-bold">{selectedSubject}</span>
              </div>
              <h3 className="text-base font-bold text-[#111111] uppercase font-display tracking-tight">Logical Exam Panel</h3>
              <p className="text-xs text-[#666666]">Study Concept: <strong className="text-[#10A37F] font-semibold">{selectedTopic}</strong></p>
            </div>
            
            <button
              onClick={handleLaunchQuiz}
              className="px-3.5 py-1.5 bg-white border border-[#E5E5E5] hover:border-[#10A37F] text-[#111111] hover:text-[#10A37F] text-xs font-semibold rounded-lg transition-all"
            >
              Regenerate Exam Questions
            </button>
          </div>

          {/* Question markers with active timer counts */}
          <div className="flex justify-between items-center bg-[#F7F7F8] rounded-xl p-3 border border-[#E5E5E5]">
            <span className="text-xs font-bold text-[#111111]">
              Challenge {quizIndex + 1} of {quizQuestions.length}
            </span>
            
            <div className="flex items-center gap-1.5 text-xs font-bold text-[#10A37F] bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-100 font-mono">
              <Timer className="w-3.5 h-3.5 animate-pulse" />
              <span>{formatTime(quizTimeLeft)}</span>
            </div>
          </div>

          {/* Question text panel */}
          <div className="space-y-4">
            <div className="text-sm font-semibold text-[#111111] leading-relaxed">
              {renderMath(quizQuestions[quizIndex].question)}
            </div>

            <div className="grid grid-cols-1 gap-2.5">
              {quizQuestions[quizIndex].options.map((opt: any) => {
                const isSelected = selectedQuizOption === opt.key;
                const isCorrect = opt.key === quizQuestions[quizIndex].correct;
                let borderClass = "border-[#E5E5E5] bg-white text-[#111111] hover:border-gray-350";
                
                if (quizSubmitted) {
                  if (isCorrect) borderClass = "border-emerald-500 bg-emerald-50 text-emerald-805 font-semibold";
                  else if (isSelected) borderClass = "border-red-500 bg-red-50 text-red-800 font-semibold";
                } else {
                  if (isSelected) borderClass = "border-[#10A37F] bg-emerald-50 text-[#10A37F] font-semibold";
                }

                return (
                  <button
                    key={opt.key}
                    onClick={() => submitQuizAnswer(opt.key)}
                    className={`w-full text-left p-3.5 rounded-xl border text-xs transition-all relative block cursor-pointer ${borderClass}`}
                    disabled={quizSubmitted}
                  >
                    <span className="font-mono text-[9px] mr-2 uppercase block tracking-wider text-[#666666] mb-0.5">
                      Choice {opt.key}
                    </span>
                    <span className="block font-sans">{renderMath(opt.text)}</span>
                  </button>
                );
              })}
            </div>

            {/* Revealing Socratic companion analysis logs after answering */}
            {quizSubmitted && (
              <div className="p-4 rounded-xl bg-blue-50 border border-blue-100 text-xs text-blue-800 leading-relaxed font-sans mt-3">
                <p className="font-bold mb-1 flex items-center gap-1"><Brain className="w-3.5 h-3.5 text-blue-550 shrink-0" /> Socratic tutor analysis:</p>
                <div className="font-medium text-justify">{renderMath(quizQuestions[quizIndex].explanation)}</div>
              </div>
            )}

            {/* Answer next pagination button */}
            {quizSubmitted && (
              <div className="pt-4 border-t border-[#E5E5E5] flex justify-end">
                <button
                  onClick={nextQuizQuestion}
                  className="px-4 py-2 bg-[#10A37F] hover:bg-[#10A37F]/95 text-white rounded-lg text-xs font-semibold flex items-center gap-1 cursor-pointer transition-all active:scale-95 duration-100"
                >
                  <span>{quizIndex < quizQuestions.length - 1 ? "Next Challenge →" : "View Final Result"}</span>
                </button>
              </div>
            )}
          </div>
        </div>
      ) : quizCompleted ? (
        /* COMPLETED METRIC RESULT SCREEN DISPLAY */
        <div className="p-6 md:p-8 rounded-xl bg-white border border-[#E5E5E5] text-center space-y-4 animate-fadeIn">
          <div className="w-12 h-12 bg-emerald-50 text-[#10A37F] border border-emerald-100 rounded-full flex items-center justify-center mx-auto shadow-none">
            <CheckCircle className="w-6 h-6 text-[#10A37F]" />
          </div>

          <div>
            <h2 className="text-lg font-bold text-[#111111] font-display">Diagnostics Concluded!</h2>
            <p className="text-xs text-[#666666] mt-1 max-w-sm mx-auto leading-relaxed">
              Wonderful homework performance. Socratic evaluation results have been synchronized to database diagnostics memory.
            </p>
          </div>

          <div className="p-4 bg-[#F7F7F8] border border-[#E5E5E5] rounded-xl max-w-md mx-auto grid grid-cols-2 gap-3 pb-4">
            <div>
              <span className="text-[9px] uppercase tracking-wider text-[#666666] font-bold block mb-0.5 font-mono">My Score</span>
              <span className="text-xl font-bold text-[#111111] font-mono">
                {quizScore} / {quizQuestions.length}
              </span>
            </div>

            <div>
              <span className="text-[9px] uppercase tracking-wider text-[#10A37F] font-bold block mb-0.5 font-mono">Accuracy Goal</span>
              <span className="text-xl font-bold font-mono text-[#10A37F]">
                {quizQuestions.length > 0 ? Math.round((quizScore / quizQuestions.length) * 100) : 0}%
              </span>
            </div>
          </div>

          <div className="flex justify-center gap-3 pt-4">
            <button
              onClick={resetQuiz}
              className="px-4 py-2 hover:bg-gray-50 border border-[#E5E5E5] text-[#111111] rounded-lg text-xs font-semibold cursor-pointer font-sans"
            >
              Restart Session
            </button>
            
            <button
              onClick={() => {
                resetQuiz();
                setTestChatInput(`Can you ask me some challenging alternative exercises mapping to ${selectedTopic}?`);
              }}
              className="px-4 py-2 bg-[#10A37F] text-white hover:bg-[#10A37F]/95 rounded-lg text-xs font-semibold cursor-pointer font-sans"
            >
              Explore Study Concepts
            </button>
          </div>
        </div>
      ) : (
        /* STANDARD DIAGNOSTICS TUTOR CHAT (FALLBACK) */
        <div className="flex flex-col bg-[#F7F7F8] border border-[#E5E5E5] rounded-xl h-[420px] overflow-hidden shadow-none animate-fadeIn font-sans">
          
          <div className="p-4 border-b border-[#E5E5E5] bg-white flex items-center justify-between shrink-0">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded bg-emerald-50 border border-emerald-100 flex items-center justify-center text-[#10A37F]">
                <Brain className="w-4.5 h-4.5" />
              </div>
              <div>
                <h3 className="text-xs font-bold text-[#111111]">Tutor Assessment Trainer</h3>
                <p className="text-[9px] text-[#666666] font-mono font-medium">Socratic Curriculum Diagnostic Guide</p>
              </div>
            </div>
            
            <span className="p-1 px-2.5 rounded bg-emerald-50 border border-emerald-100 text-[9px] font-bold uppercase tracking-wider text-[#10A37F] font-mono">Assessment Coach</span>
          </div>

          {/* Interactive diagnostic threads dialogs */}
          <div className="flex-1 p-4 overflow-y-auto space-y-4 pr-2">
            {testMessages.map((m) => {
              const isTutor = m.sender === "ai";
              return (
                <div key={m.id} className={`flex flex-col ${isTutor ? "items-start" : "items-end"} gap-1`}>
                  <span className="text-[9px] text-[#666666] font-mono mb-0.5">{isTutor ? "Socratic Assessor" : "User Scholar"}</span>
                  <div className={`max-w-[85%] rounded-xl px-4 py-2.5 text-xs leading-relaxed ${
                    isTutor ? "bg-white border border-[#E5E5E5] text-[#111111]" : "bg-[#10A37F] text-white"
                  }`}>
                    {renderMath(m.text)}
                  </div>
                </div>
              );
            })}
            
            {isTestAiTyping && (
              <div className="flex items-center gap-2 text-[#10A37F] animate-pulse">
                <Brain className="w-4 h-4 animate-spin shrink-0" />
                <span className="text-[10px] font-mono font-semibold uppercase leading-none">Drafting analytical diagnostics...</span>
              </div>
            )}
          </div>

          {/* Quick study questions selector */}
          <div className="p-3 bg-white border-t border-[#E5E5E5] flex items-center gap-2.5 shrink-0">
            <input 
              type="text"
              placeholder="Suggest test topics, or write custom prompts here (e.g. Probe my quantum mechanical limits)..."
              value={testChatInput}
              onChange={(e) => setTestChatInput(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleSendTestChat()}
              className="flex-1 bg-[#F7F7F8] border border-[#E5E5E5] rounded-lg px-3.5 py-1.5 outline-none text-xs text-[#111111] placeholder-[#666666]/60 font-sans"
            />
            
            <button 
              onClick={handleSendTestChat}
              disabled={!testChatInput.trim()}
              className="p-1 px-2.5 bg-[#10A37F] text-white rounded-lg hover:bg-[#10A37F]/95 disabled:opacity-40 flex items-center"
            >
              <Send className="w-3.5 h-3.5" />
            </button>
          </div>

        </div>
      )}

      {/* Historical diagnostic assessment completions */}
      {quizHistory.length > 0 && quizQuestions.length === 0 && (
        <div className="pt-4 border-t border-[#E5E5E5] space-y-3 shrink-0">
          <div className="flex items-center gap-1.5">
            <span className="p-1 rounded bg-[#E5E5E5]">
              <TrendingUp className="w-4 h-4 text-[#10A37F]" />
            </span>
            <span className="text-xs font-bold uppercase tracking-wider text-[#111111] font-mono">Assigned Homework Audit logs</span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {quizHistory.map((h) => (
              <div key={h.id} className="p-3 bg-white border border-[#E5E5E5] rounded-xl text-xs space-y-1">
                <span className="text-[9px] font-bold bg-[#F7F7F8] border border-[#E5E5E5] px-1.5 py-0.5 rounded text-[#111111] uppercase font-mono">{h.subject}</span>
                <h4 className="text-xs font-bold text-[#111111] truncate">{h.topic}</h4>
                <div className="flex items-center justify-between text-[9px] text-[#666666] font-mono pt-1">
                  <span>Score: {h.score} out of {h.total}</span>
                  <span>{h.date}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

    </motion.div>
  );
};
