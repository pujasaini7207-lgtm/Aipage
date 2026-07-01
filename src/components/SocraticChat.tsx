import React, { useRef } from "react";
import { motion } from "framer-motion";
import { 
  Plus, 
  Search, 
  Trash2, 
  BookOpen, 
  Brain, 
  MessageSquare, 
  HelpCircle, 
  PlayCircle, 
  Award, 
  Sparkles, 
  Send, 
  Paperclip, 
  X,
  ChevronRight,
  Loader2,
  Youtube,
  Video
} from "lucide-react";
import { Message, ChatThread, ActiveTab } from "../types";

interface SocraticChatProps {
  messages: Message[];
  setMessages: React.Dispatch<React.SetStateAction<Message[]>>;
  chatInput: string;
  setChatInput: (val: string) => void;
  attachedFile: any;
  setAttachedFile: (val: any) => void;
  isAiTyping: boolean;
  setIsAiTyping: (val: boolean) => void;
  thinkWithMeActive: boolean;
  setThinkWithMeActive: (val: boolean) => void;
  chatThreads: ChatThread[];
  activeChatId: string | null;
  setActiveChatId: (id: string | null) => void;
  isLoadingThreads: boolean;
  isLoadingMessages: boolean;
  loadChatMessages: (id: string) => void;
  deleteChatSession: (id: string, e: any) => void;
  startNewChatThread: () => void;
  handleSendMessage: () => void;
  triggerQuickAction: (action: string) => void;
  setCurrentStudySubject: (sub: string) => void;
  currentStudySubject: string;
  subjects?: string[];
  selectedSubject: string;
  selectedTopic: string;
  chatSubject: string;
  setChatSubject: (sub: string) => void;
  chatCustomSubject: string;
  setChatCustomSubject: (val: string) => void;
  connectedResource: any;
  setConnectedResource: (val: any) => void;
  isResourceModalOpen: boolean;
  setIsResourceModalOpen: (val: boolean) => void;
  resourceInputName: string;
  setResourceInputName: (val: string) => void;
  resourceInputUrl: string;
  setResourceInputUrl: (val: string) => void;
  resourceInputSnippet: string;
  setResourceInputSnippet: (val: string) => void;
  triggerNotification: (msg: string, type: "success" | "error" | "info") => void;
  parseTextWithMath: (txt: string) => React.ReactNode;
}

const getYouTubeIdFromText = (text: string): string | null => {
  if (typeof text !== "string") return null;
  
  // Pattern 1: standard watch?v= or shorts or embed or v/ or mobile formats
  const reg1 = /(?:youtube\.com\/(?:[^\/\n\s]+\/\S+\/|(?:v|e(?:mbed)?)\/|shorts\/|\S*?[?&]v=)|youtu\.be\/)([a-zA-Z0-9_-]{11})/i;
  let match = text.match(reg1);
  if (match && match[1]) return match[1];

  // Pattern 2: fallbacks for raw short URL or mobile
  const reg2 = /youtu\.be\/([a-zA-Z0-9_-]{11})/i;
  match = text.match(reg2);
  if (match && match[1]) return match[1];

  // Pattern 3: watch URL with other structures
  const reg3 = /[?&]v=([a-zA-Z0-9_-]{11})/i;
  match = text.match(reg3);
  if (match && match[1]) return match[1];

  return null;
};

export const SocraticChat: React.FC<SocraticChatProps> = ({
  messages,
  setMessages,
  chatInput,
  setChatInput,
  attachedFile,
  setAttachedFile,
  isAiTyping,
  thinkWithMeActive,
  setThinkWithMeActive,
  chatThreads,
  activeChatId,
  isLoadingThreads,
  isLoadingMessages,
  loadChatMessages,
  deleteChatSession,
  startNewChatThread,
  handleSendMessage,
  triggerQuickAction,
  currentStudySubject,
  setCurrentStudySubject,
  subjects,
  selectedSubject,
  selectedTopic,
  chatSubject,
  setChatSubject,
  chatCustomSubject,
  setChatCustomSubject,
  connectedResource,
  setConnectedResource,
  setIsResourceModalOpen,
  setResourceInputName,
  setResourceInputUrl,
  setResourceInputSnippet,
  triggerNotification,
  parseTextWithMath
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const chatBottomRef = useRef<HTMLDivElement>(null);

  const handleFileUploadTrigger = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = () => {
        setAttachedFile({
          name: file.name,
          type: file.type,
          base64Content: (reader.result as string).split(",")[1]
        });
        triggerNotification(`Attached ${file.name} successfully!`, "success");
      };
      reader.readAsDataURL(file);
    }
  };

  return (
    <motion.div
      key="chat"
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0 }}
      className="flex-1 flex flex-col min-h-0 space-y-4 max-w-6xl mx-auto w-full font-sans"
    >
      {/* Target Subject Details & Materials Sync Header Banner */}
      <div className="p-4 rounded-xl bg-[#F7F7F8] border border-[#E5E5E5] flex flex-col md:flex-row md:items-center justify-between gap-4 shrink-0">
        <div className="flex items-center gap-3">
          <div className={`w-10 h-10 rounded-lg flex items-center justify-center shrink-0 ${
            connectedResource 
              ? "bg-emerald-50 text-[#10A37F] border border-emerald-100" 
              : "bg-gray-100 text-[#666666] border border-[#E5E5E5]"
          }`}>
            <BookOpen className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-3 flex-wrap">
              <div className="flex items-center gap-1 bg-white border border-[#E5E5E5] hover:border-[#10A37F]/50 rounded-lg px-2 py-0.5 shadow-sm transition-all">
                <span className="text-[10px] uppercase font-bold tracking-wider text-[#666666] font-mono">Subject Focus:</span>
                <select
                  value={currentStudySubject}
                  onChange={(e) => {
                    setCurrentStudySubject(e.target.value);
                    triggerNotification(`Switched focus to ${e.target.value}`, "info");
                  }}
                  className="text-xs font-bold text-[#10A37F] bg-transparent border-none outline-none focus:ring-0 cursor-pointer pr-1"
                >
                  {(subjects && subjects.length > 0 ? subjects : ["Mathematics", "Philosophy", "Computer Science", "Physics", "Chemistry", "World History", "Literature Study"]).map((sub) => (
                    <option key={sub} value={sub} className="text-[#111111] bg-white text-xs">
                      {sub}
                    </option>
                  ))}
                </select>
              </div>
              {connectedResource ? (
                <span className="px-2 py-0.5 rounded bg-emerald-50 border border-emerald-100 text-[9px] font-sans font-bold uppercase text-[#10A37F]">Reference Connected</span>
              ) : (
                <span className="px-2 py-0.5 rounded bg-gray-150 text-[#666666] border border-[#E5E5E5] text-[9px] font-sans font-bold uppercase">No Materials Attached</span>
              )}
            </div>
            <div className="text-sm font-semibold text-[#111111] mt-0.5">
              {connectedResource ? (
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-[#10A37F] font-bold truncate max-w-[200px]">{connectedResource.name}</span>
                  <span className="text-xs text-[#666666] max-w-[200px] truncate font-mono">({connectedResource.url})</span>
                </div>
              ) : (
                <span className="text-[#111111]">Collaborative Socratic Dialogue Active</span>
              )}
            </div>
          </div>
        </div>
        
        <div className="flex flex-wrap items-center gap-2 shrink-0">
          <button
            onClick={() => {
              setResourceInputName(connectedResource?.name || "");
              setResourceInputUrl(connectedResource?.url || "");
              setResourceInputSnippet(connectedResource?.snippet || "");
              setIsResourceModalOpen(true);
            }}
            className="px-3.5 py-1.5 bg-[#10A37F] hover:bg-[#10A37F]/90 text-white font-semibold text-xs rounded-lg transition-all active:scale-95 duration-100 cursor-pointer flex items-center gap-1.5 shadow-none"
          >
            <span>{connectedResource ? "Edit Materials" : "Connect Study Materials"}</span>
          </button>
          {connectedResource && (
            <button
              onClick={() => {
                setConnectedResource(null);
                triggerNotification("Disconnected study reference documents.", "info");
              }}
              className="px-3 py-1.5 bg-white border border-[#E5E5E5] text-[#666666] hover:text-red-650 hover:bg-red-50 text-xs rounded-lg font-semibold transition-all cursor-pointer"
            >
              Disconnect
            </button>
          )}
        </div>
      </div>

      {/* Main split grid: Session list sidebar and central message feed container */}
      <div className="flex-1 flex flex-col lg:flex-row gap-5 min-h-[500px]">
        {/* Left column: Sessions History rail */}
        <div className="w-full lg:w-64 shrink-0 bg-[#F7F7F8] border border-[#E5E5E5] rounded-xl p-4 flex flex-col gap-3 min-h-[150px] lg:min-h-full">
          <div className="flex items-center justify-between border-b border-[#E5E5E5] pb-2">
            <div className="flex items-center gap-1.5">
              <span className="p-1 rounded bg-emerald-50 text-[#10A37F] border border-emerald-100">
                <MessageSquare className="w-3.5 h-3.5 text-[#10A37F]" />
              </span>
              <span className="text-xs font-bold uppercase tracking-wider text-[#111111] font-mono">Work Sessions</span>
            </div>
            <button
              onClick={startNewChatThread}
              className="p-1 rounded-lg bg-white hover:bg-[#F3F4F6] border border-[#E5E5E5] text-[#111111] transition-all cursor-pointer flex items-center justify-center w-6 h-6"
              title="Start New Socratic Session"
            >
              <Plus className="w-3.5 h-3.5 text-[#10A37F]" />
            </button>
          </div>

          <div className="flex-1 overflow-y-auto pr-1 space-y-1.5 max-h-[150px] lg:max-h-full">
            {isLoadingThreads ? (
              <div className="flex flex-col items-center justify-center py-6 text-[#666666] gap-1.5 font-mono text-[10px]">
                <Loader2 className="w-4 h-4 animate-spin text-[#10A37F]" />
                <span>Syncing cloud history...</span>
              </div>
            ) : chatThreads.length === 0 ? (
              <div className="text-center py-6 px-1 border border-[#E5E5E5] border-dashed rounded-lg flex flex-col items-center justify-center bg-white/50">
                <Sparkles className="w-4 h-4 text-[#666666] mb-1" />
                <p className="text-[10px] font-bold text-[#111111]">No saved sessions</p>
                <p className="text-[8.5px] text-[#666666] mt-0.5 leading-relaxed font-sans max-w-[170px] mx-auto">
                  Your multi-turn discussions will automatically group and persist here.
                </p>
              </div>
            ) : (
              chatThreads.map((thread) => {
                const isActive = activeChatId === thread.id;
                const dt = new Date(thread.lastMessageAt);
                const formattedDate = dt.toLocaleDateString(undefined, { month: "short", day: "numeric" });

                return (
                  <div
                    key={thread.id}
                    onClick={() => loadChatMessages(thread.id)}
                    className={`group relative p-2 rounded-lg border transition-all cursor-pointer flex items-start gap-2 ${
                      isActive
                        ? "bg-white border-[#10A37F] text-[#10A37F]"
                        : "bg-white/40 border-[#E5E5E5] hover:bg-white text-[#666666] hover:text-[#111111]"
                    }`}
                  >
                    <div className={`p-1 rounded mt-0.5 max-h-fit ${isActive ? "bg-emerald-50 text-[#10A37F]" : "bg-gray-100 text-[#666666]/70"}`}>
                      <Brain className="w-3.5 h-3.5" />
                    </div>
                    <div className="flex-1 min-w-0 pr-5">
                      <p className={`text-xs font-semibold truncate leading-tight ${isActive ? "text-[#10A37F]" : "text-[#111111]"}`}>
                        {thread.title}
                      </p>
                      <p className="text-[9px] text-[#666666] mt-0.5 font-mono">
                        {formattedDate} Update
                      </p>
                    </div>

                    <button
                      onClick={(e) => deleteChatSession(thread.id, e)}
                      className="absolute right-1.5 top-1.5 p-1 rounded hover:bg-rose-50 text-red-500 hover:text-red-650 transition-all opacity-70 group-hover:opacity-100 cursor-pointer"
                      title="Remove Session"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Right column: Main Dialogue panel container */}
        <div className="flex-1 flex flex-col min-h-0 space-y-4">
          {/* Quick dialogue pill shortcuts */}
          <div className="flex gap-2 pb-2 overflow-x-auto select-none no-scrollbar">
            <button 
              onClick={() => triggerQuickAction("explain")}
              className="px-3.5 py-1.5 bg-white border border-[#E5E5E5] hover:border-[#10A37F] hover:bg-emerald-50/20 text-[#111111] hover:text-[#10A37F] rounded-lg whitespace-nowrap flex items-center gap-1.5 text-xs font-semibold transition-all shadow-none cursor-pointer"
            >
              <Brain className="w-3.5 h-3.5 text-[#10A37F]" />
              <span>Explain Simpler</span>
            </button>
            <button 
              onClick={() => triggerQuickAction("notebook")}
              className="px-3.5 py-1.5 bg-white border border-[#E5E5E5] hover:border-blue-500 hover:bg-blue-50/25 text-[#111111] hover:text-blue-600 rounded-lg whitespace-nowrap flex items-center gap-1.5 text-xs font-semibold transition-all shadow-none cursor-pointer"
            >
              <BookOpen className="w-3.5 h-3.5 text-blue-500" />
              <span>Save to Notebook</span>
            </button>
            <button 
              onClick={() => triggerQuickAction("test")}
              className="px-3.5 py-1.5 bg-white border border-[#E5E5E5] hover:border-amber-500 hover:bg-amber-50/25 text-[#111111] hover:text-amber-600 rounded-lg whitespace-nowrap flex items-center gap-1.5 text-xs font-semibold transition-all shadow-none cursor-pointer"
            >
              <HelpCircle className="w-3.5 h-3.5 text-amber-500" />
              <span>Diagnostic Test</span>
            </button>
            <button 
              onClick={() => triggerQuickAction("flashcards")}
              className="px-3.5 py-1.5 bg-white border border-[#E5E5E5] hover:border-purple-500 hover:bg-purple-50/25 text-[#111111] hover:text-purple-600 rounded-lg whitespace-nowrap flex items-center gap-1.5 text-xs font-semibold transition-all shadow-none cursor-pointer"
            >
              <PlayCircle className="w-3.5 h-3.5 text-purple-500" />
              <span>Review Cards</span>
            </button>
            
            {/* Think with Me toggle */}
            <button 
              onClick={() => {
                setThinkWithMeActive(!thinkWithMeActive);
                triggerNotification(
                  !thinkWithMeActive ? "Think Mode active! Solving step-by-step." : "Reasoning mode turned off.", 
                  "info"
                );
              }}
              className={`px-3.5 py-1.5 border rounded-lg whitespace-nowrap flex items-center gap-1.5 text-xs font-semibold transition-all cursor-pointer shadow-none ${
                thinkWithMeActive 
                  ? "border-[#10A37F] bg-emerald-50 text-[#10A37F]" 
                  : "bg-white border-[#E5E5E5] text-[#666666] hover:bg-[#F3F4F6]"
              }`}
            >
              <Award className="w-3.5 h-3.5 text-[#10A37F]" />
              <span>Step-by-Step Tracer</span>
            </button>
          </div>

          {/* Socratic Dialogues Canvas Area */}
          <div className="flex-1 min-h-[420px] p-5 rounded-xl bg-white border border-[#E5E5E5] flex flex-col justify-between overflow-hidden relative shadow-none">
            
            {/* Session Toolbar */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-3.5 mb-4 border-b border-[#E5E5E5] shrink-0 gap-2">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-[#10A37F] animate-pulse" />
                <span className="text-xs font-bold text-[#111111] truncate max-w-[200px] sm:max-w-[300px]">
                  {activeChatId 
                    ? chatThreads.find(t => t.id === activeChatId)?.title || "Active Discussion" 
                    : "Fresh Dialogue Workspace"}
                </span>
              </div>
              <div className="flex items-center gap-1.5">
                <button
                  onClick={startNewChatThread}
                  className="px-2.5 py-1.5 bg-white hover:bg-emerald-50/20 border border-[#E5E5E5] hover:border-[#10A37F] text-[#111111] hover:text-[#10A37F] font-semibold text-xs rounded-lg transition-all flex items-center gap-1.5 shadow-sm shrink-0 cursor-pointer"
                  title="Create a new, empty chat thread"
                >
                  <Plus className="w-3.5 h-3.5 text-[#10A37F]" />
                  <span>New Chat</span>
                </button>
                <button
                  onClick={(e) => {
                    if (activeChatId) {
                      deleteChatSession(activeChatId, e);
                    } else {
                      if (confirm("Clear current conversation and start fresh?")) {
                        setMessages([]);
                        triggerNotification("Cleared fresh workspace conversation.", "info");
                      }
                    }
                  }}
                  className="px-2.5 py-1.5 bg-white hover:bg-red-50 border border-[#E5E5E5] hover:border-red-200 text-[#666666] hover:text-red-500 font-semibold text-xs rounded-lg transition-all flex items-center gap-1.5 shadow-sm shrink-0 cursor-pointer"
                  title="Delete current study session"
                >
                  <Trash2 className="w-3.5 h-3.5 text-red-500" />
                  <span>Delete Chat</span>
                </button>
              </div>
            </div>
            
            {/* Dynamic Step-by-Step Tracer Timeline */}
            {thinkWithMeActive && (
              <div className="mb-4 p-4 rounded-xl bg-[#F7F7F8] border border-[#E5E5E5] text-xs shrink-0 relative overflow-hidden">
                <div className="flex items-center justify-between pb-2 border-b border-[#E5E5E5]">
                  <div className="flex items-center gap-1.5 font-bold uppercase tracking-widest text-[#10A37F] font-mono">
                    <Sparkles className="w-4 h-4 animate-pulse" />
                    <span>Socratic Step Tracer: In-Progress Diagnostics</span>
                  </div>
                  <span className="px-2 py-0.5 rounded bg-emerald-50 text-[#10A37F] text-[9px] uppercase font-bold tracking-wider">
                    Diagnostic Active
                  </span>
                </div>
                
                <div className="grid grid-cols-5 gap-2 mt-3 text-center text-[10px]">
                  {[
                    { label: "1. Question", desc: "Tutor query", active: messages.length >= 1 },
                    { label: "2. Visual Hint", desc: "Leading tips", active: messages.some(m => m.sender === "ai" && (m.text.toLowerCase().includes("hint") || m.text.toLowerCase().includes("think") || m.text.toLowerCase().includes("what do you think"))) },
                    { label: "3. Student Line", desc: "Formulas & code", active: messages.some(m => m.sender === "user" && messages.length > 2) },
                    { label: "4. Correcting", desc: "Isolating leak", active: messages.length >= 4 },
                    { label: "5. Realization", desc: "Mastered!", active: messages.some(m => m.sender === "ai" && (m.text.toLowerCase().includes("correct") || m.text.toLowerCase().includes("excellent") || m.text.toLowerCase().includes("exactly"))) },
                  ].map((step, idx) => (
                    <div 
                      key={idx} 
                      className={`flex flex-col items-center p-2 rounded-lg border transition-all ${
                        step.active 
                          ? "bg-white border-[#10A37F] text-[#10A37F] font-semibold" 
                          : "bg-gray-50 border-gray-100 text-gray-400"
                      }`}
                    >
                      <span className="font-bold text-[9px] block leading-tight">{step.label}</span>
                      <span className="text-[8px] mt-0.5 hidden sm:inline-block font-sans text-[#666666]">{step.desc}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Scrolling Chat history container block */}
            <div className="flex-1 overflow-y-auto pr-2 space-y-6 max-h-[480px]">
              {isLoadingMessages ? (
                <div className="h-full flex flex-col items-center justify-center py-12 text-[#666666] gap-2">
                  <Loader2 className="w-6 h-6 animate-spin text-[#10A37F]" />
                  <span className="text-xs font-semibold font-mono text-[#111111]">Syncing session dialogs...</span>
                </div>
              ) : messages.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center py-20 text-center space-y-4 max-w-md mx-auto">
                  <div className="p-4 bg-emerald-50 rounded-full text-[#10A37F]">
                    <Brain className="w-10 h-10" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-[#111111] font-display">Target Syllabus Module: {selectedTopic}</h3>
                    <p className="text-xs text-[#666666] mt-1.5 leading-relaxed">
                      LUNITO Socratic AI is primed under official curriculum guidelines. Submit a question, formula, or code block to launch a constructive intellectual tutoring dialog!
                    </p>
                  </div>
                </div>
              ) : (
                messages.map((m) => {
                  const isAI = m.sender === "ai";
                  const ytId = getYouTubeIdFromText(m.text);
                  return (
                    <motion.div 
                      key={m.id} 
                      className={`flex flex-col ${isAI ? "" : "items-end"} gap-1.5`}
                      initial={{ opacity: 0, y: 12, scale: 0.98 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      transition={{ duration: 0.25, ease: "easeOut" }}
                    >
                      <div className="flex items-center gap-2 max-w-full">
                        {isAI && (
                          <div className="w-7 h-7 rounded bg-emerald-50 border border-emerald-100 text-[#10A37F] flex items-center justify-center shrink-0">
                            <Brain className="w-4 h-4" />
                          </div>
                        )}
                        <span className="text-[10px] font-bold text-[#666666] font-mono">
                          {isAI ? "LUNITO Socratic Auto" : "Student Scholar"} • {m.timestamp}
                        </span>
                      </div>

                      <div 
                        className={`max-w-[85%] rounded-xl px-4 py-3 leading-relaxed text-sm ${
                          isAI 
                            ? "bg-[#F7F7F8] border border-[#E5E5E5] text-[#111111]" 
                            : "bg-[#10A37F] text-white"
                        }`}
                      >
                        {parseTextWithMath(m.text)}
                        {ytId && (
                          <div className="mt-4 overflow-hidden rounded-xl border border-zinc-200/80 bg-zinc-950 shadow-md max-w-lg w-full text-zinc-100">
                            <div className="aspect-video">
                              <iframe
                                className="w-full h-full"
                                src={`https://www.youtube.com/embed/${ytId}`}
                                title="YouTube video player"
                                frameBorder="0"
                                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                                allowFullScreen
                                referrerPolicy="no-referrer"
                              />
                            </div>
                            <div className="p-3 bg-zinc-900 border-t border-zinc-800 flex items-center justify-between text-[11px] text-zinc-300 font-medium font-sans">
                              <div className="flex items-center gap-2">
                                <Youtube className="w-5 h-5 text-red-500 fill-red-500" />
                                <span className="font-semibold text-white">Interactive Video Workspace</span>
                              </div>
                              <a
                                href={`https://www.youtube.com/watch?v=${ytId}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="px-2 py-1 rounded bg-zinc-800 hover:bg-zinc-700 text-zinc-100 hover:text-white font-bold transition-all border border-zinc-700"
                              >
                                Watch on YouTube
                              </a>
                            </div>
                          </div>
                        )}
                        {isAI && m.sources && m.sources.length > 0 && (
                          <div className="mt-2.5 pt-2 border-t border-[#E5E5E5]/60 flex flex-col gap-1">
                            <span className="text-[9px] font-bold text-[#666666] uppercase tracking-wider flex items-center gap-1.5 font-mono">
                              <Search className="w-3 h-3 text-[#10A37F]" /> Sources Found
                            </span>
                            <div className="flex flex-wrap gap-1.5 mt-1">
                              {m.sources.slice(0, 4).map((s, sIdx) => {
                                // Shorten title if too long
                                const displayTitle = s.title.length > 28 ? s.title.substring(0, 25) + "..." : s.title;
                                return (
                                  <a 
                                    key={sIdx}
                                    href={s.uri} 
                                    target="_blank" 
                                    rel="noopener noreferrer"
                                    className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-emerald-50 border border-emerald-100 hover:border-[#10A37F] text-[10px] font-semibold text-[#10A37F] transition-all"
                                  >
                                    {displayTitle}
                                  </a>
                                );
                              })}
                            </div>
                          </div>
                        )}
                      </div>
                    </motion.div>
                  );
                })
              )}
              {isAiTyping && (
                <motion.div 
                  className="flex flex-col gap-1.5"
                  initial={{ opacity: 0, y: 8, scale: 0.98 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  transition={{ duration: 0.2 }}
                >
                  <div className="flex items-center gap-2">
                    <div className="w-7 h-7 rounded bg-emerald-50 border border-emerald-100 text-[#10A37F] flex items-center justify-center shrink-0 animate-pulse">
                      <Brain className="w-4 h-4 animate-spin" />
                    </div>
                    <span className="text-[10px] font-bold text-[#10A37F] font-mono">Tutor is analyzing your logic...</span>
                  </div>
                  <div className="max-w-[120px] rounded-xl px-4 py-3 bg-[#F7F7F8] border border-[#E5E5E5] flex items-center justify-center">
                    <div className="flex gap-1">
                      <div className="w-1.5 h-1.5 bg-[#10A37F] rounded-full animate-bounce" style={{ animationDelay: "0ms" }} />
                      <div className="w-1.5 h-1.5 bg-[#10A37F] rounded-full animate-bounce" style={{ animationDelay: "150ms" }} />
                      <div className="w-1.5 h-1.5 bg-[#10A37F] rounded-full animate-bounce" style={{ animationDelay: "300ms" }} />
                    </div>
                  </div>
                </motion.div>
              )}
              <div ref={chatBottomRef} />
            </div>

            {/* Bottom Form Query Input Segment */}
            <div className="mt-5 border-t border-[#E5E5E5] pt-4 bg-white relative">
              {attachedFile && (
                <div className="mb-2.5 p-2 bg-emerald-50 border border-emerald-100 text-[10px] text-emerald-800 rounded-lg flex items-center justify-between">
                  <div className="flex items-center gap-2 truncate pr-4">
                    <Paperclip className="w-3.5 h-3.5 text-[#10A37F] shrink-0" />
                    <span className="font-semibold truncate">File Locked: {attachedFile.name} (Ready to Send)</span>
                  </div>
                  <button 
                    onClick={() => setAttachedFile(null)}
                    className="p-1 hover:bg-emerald-100 rounded text-[#666666] hover:text-red-500 cursor-pointer"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </div>
              )}

              <div className="relative flex items-center gap-2 border border-[#E5E5E5] rounded-xl px-3.5 py-1.5 bg-white focus-within:border-[#10A37F] transition-all">
                <input 
                  type="file"
                  ref={fileInputRef}
                  className="hidden"
                  onChange={handleFileChange}
                />
                
                <button 
                  onClick={handleFileUploadTrigger}
                  className="p-1.5 hover:bg-[#F3F4F6] rounded-lg text-[#666666] hover:text-[#111111] transition-all cursor-pointer"
                  title="Attach screenshot, notes image, or homework PDF"
                >
                  <Paperclip className="w-4.5 h-4.5" />
                </button>

                <input 
                  type="text"
                  placeholder="Pose a math question, copy code, or ask for high-contrast formulas..."
                  value={chatInput}
                  onChange={(e) => setChatInput(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleSendMessage()}
                  className="flex-1 bg-transparent border-0 outline-none pr-12 text-sm text-[#111111] placeholder-[#666666]/60 font-sans h-9"
                />

                <button 
                  disabled={!chatInput.trim() && !attachedFile}
                  onClick={handleSendMessage}
                  className="absolute right-2 px-3 py-1.5 bg-[#10A37F] disabled:opacity-30 hover:bg-[#10A37F]/95 text-white rounded-lg transition-all cursor-pointer flex items-center justify-center"
                >
                  <Send className="w-3.5 h-3.5" />
                </button>
              </div>

              <div className="text-[10px] text-[#666666] text-center mt-2 font-medium font-sans">
                LUNITO standard v3 checks your homework, code, or equations socratically to build active cognitive competence.
              </div>
            </div>

          </div>
        </div>
      </div>
    </motion.div>
  );
};
