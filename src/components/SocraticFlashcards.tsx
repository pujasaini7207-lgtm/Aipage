import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Plus, 
  Layers, 
  PlayCircle, 
  Check, 
  Trash2, 
  X, 
  Sparkles, 
  ChevronRight, 
  Settings, 
  HelpCircle, 
  Flame, 
  Award,
  Bookmark
} from "lucide-react";

interface SocraticFlashcardsProps {
  selectedSubject: string;
  selectedTopic: string;
  setSelectedTopic: (val: string) => void;
  currentStudySubject: string;
  isGeneratingFlashcards: boolean;
  generateFlashcardsFromAI: (sub: string, top: string) => void;
  flashcardMessages: any[];
  isFlashcardAiTyping: boolean;
  flashcards: any[];
  flippedCards: Record<string, boolean>;
  toggleCardFlip: (id: string) => void;
  deleteFlashcard: (id: string) => void;
  isCreatingFlashcard: boolean;
  setIsCreatingFlashcard: (val: boolean) => void;
  newCardQuestion: string;
  setNewCardQuestion: (val: string) => void;
  newCardAnswer: string;
  setNewCardAnswer: (val: string) => void;
  addFlashcard: () => void;
  flashcardsHistory: any[];
  aiGeneratedFlashcardsSaved: boolean;
  aiGeneratedFlashcards: any[];
  saveAiGeneratedFlashcards: () => void;
  clearAiGeneratedFlashcards: () => void;
  triggerNotification: (msg: string, type: "success" | "error" | "info") => void;
  renderTextWithMath?: (text: string) => React.ReactNode;
  clearAllFlashcards?: () => void;
}

export const SocraticFlashcards: React.FC<SocraticFlashcardsProps> = ({
  selectedSubject,
  selectedTopic,
  setSelectedTopic,
  currentStudySubject,
  isGeneratingFlashcards,
  generateFlashcardsFromAI,
  flashcardMessages,
  isFlashcardAiTyping,
  flashcards,
  flippedCards,
  toggleCardFlip,
  deleteFlashcard,
  isCreatingFlashcard,
  setIsCreatingFlashcard,
  newCardQuestion,
  setNewCardQuestion,
  newCardAnswer,
  setNewCardAnswer,
  addFlashcard,
  flashcardsHistory,
  aiGeneratedFlashcardsSaved,
  aiGeneratedFlashcards,
  saveAiGeneratedFlashcards,
  clearAiGeneratedFlashcards,
  triggerNotification,
  renderTextWithMath,
  clearAllFlashcards
}) => {
  const [activeDifficulty, setActiveDifficulty] = useState<"Easy" | "Medium" | "Hard" | "Expert">("Medium");
  const [targetCardCount, setTargetCardCount] = useState<number>(10);
  const [bookmarkedCards, setBookmarkedCards] = useState<Record<string, boolean>>({});
  const [currentIndex, setCurrentIndex] = useState<number>(0);

  const toggleBookmark = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setBookmarkedCards(prev => {
      const active = !prev[id];
      triggerNotification(active ? "Card added to focus bookmarks!" : "Card removed from focus bookmarks.", "success");
      return { ...prev, [id]: active };
    });
  };

  const handleGenerateCards = () => {
    if (!selectedTopic.trim()) {
      triggerNotification("Please tell LUNITO what topic you would like to examine!", "info");
      return;
    }
    // Call original generator trigger
    generateFlashcardsFromAI(selectedSubject, selectedTopic);
  };

  return (
    <motion.div
      key="flashcards"
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0 }}
      className="flex-1 flex flex-col min-h-0 space-y-6 max-w-6xl mx-auto w-full font-sans"
    >
      {/* Title Segment */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-[#111111] tracking-tight flex items-center gap-2">
            <Layers className="w-5 h-5 text-[#10A37F]" />
            <span>Spaced Repetition & Revision Cards</span>
          </h2>
          <p className="text-xs text-[#666666] mt-0.5">Generate, audit, and flash-memorize complex concepts securely with Socratic intervals.</p>
        </div>

        <button
          onClick={() => setIsCreatingFlashcard(!isCreatingFlashcard)}
          className="px-3.5 py-2 bg-white border border-[#E5E5E5] hover:bg-[#F3F4F6] text-[#111111] rounded-lg text-xs font-semibold flex items-center gap-2 transition-all cursor-pointer"
        >
          <Plus className="w-4 h-4 text-[#10A37F]" />
          <span>Add Card Manually</span>
        </button>
      </div>

      {/* AI Tailoring Settings Block */}
      <div className="p-5 rounded-xl bg-[#F7F7F8] border border-[#E5E5E5] gap-4 grid grid-cols-1 md:grid-cols-3">
        <div className="md:col-span-2 space-y-3.5">
          <div className="space-y-0.5">
            <span className="text-[10px] font-bold text-[#10A37F] uppercase tracking-wider font-mono">Socratic Card Tailoring</span>
            <h3 className="text-sm font-bold text-[#111111]">Target Topic Filter: <span className="text-[#10A37F]">{currentStudySubject}</span></h3>
          </div>

          <div className="flex flex-col sm:flex-row gap-2.5">
            <input 
              type="text" 
              value={selectedTopic}
              onChange={(e) => setSelectedTopic(e.target.value)}
              placeholder="e.g. Krebs cycle, Quantum interference, Covalent compounds"
              className="flex-1 bg-white border border-[#E5E5E5] rounded-lg px-3.5 py-2 outline-none text-xs text-[#111111] focus:border-[#10A37F] transition-all font-semibold"
            />
            
            <button
              onClick={handleGenerateCards}
              disabled={isGeneratingFlashcards || !selectedTopic.trim()}
              className="px-4 py-2 bg-[#10A37F] hover:bg-[#10A37F]/95 disabled:opacity-40 text-white rounded-lg text-xs font-semibold transition-all flex items-center justify-center gap-2 cursor-pointer"
            >
              <PlayCircle className="w-4 h-4 shrink-0" />
              <span>{isGeneratingFlashcards ? "Assembling Cards..." : "Generate AI Decks"}</span>
            </button>
          </div>
        </div>

        {/* Difficulty Controls & Card Count selection */}
        <div className="border-t md:border-t-0 md:border-l border-[#E5E5E5] pt-4 md:pt-0 md:pl-5 space-y-4">
          <div>
            <span className="text-[9px] font-bold uppercase text-[#666666] font-mono block mb-1.5">Revision Difficulty</span>
            <div className="grid grid-cols-4 gap-1">
              {(["Easy", "Medium", "Hard", "Expert"] as const).map((diff) => (
                <button
                  key={diff}
                  onClick={() => {
                    setActiveDifficulty(diff);
                    triggerNotification(`Tailored revisions to ${diff} levels.`, "info");
                  }}
                  className={`py-1 text-[10px] font-bold rounded border transition-all ${
                    activeDifficulty === diff 
                      ? "bg-emerald-50 border-[#10A37F] text-[#10A37F]" 
                      : "bg-white border-[#E5E5E5] text-[#666666] hover:bg-gray-50"
                  }`}
                >
                  {diff}
                </button>
              ))}
            </div>
          </div>

          <div>
            <span className="text-[9px] font-bold uppercase text-[#666666] font-mono block mb-1.5 font-sans">Active Card Limits</span>
            <div className="flex items-center gap-2">
              {[5, 10, 15, 20].map((num) => (
                <button
                  key={num}
                  onClick={() => setTargetCardCount(num)}
                  className={`px-3 py-1 text-[10px] font-bold font-mono border rounded transition-all ${
                    targetCardCount === num 
                      ? "bg-emerald-50 border-[#10A37F] text-[#10A37F]" 
                      : "bg-white border-[#E5E5E5] text-[#666655] hover:bg-gray-50"
                  }`}
                >
                  {num} cards
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Real-time Draft Canvas full-width canvas */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 min-h-[440px]">
        
        {/* Flashcards Deck presentation area - expanded to full-width */}
        <div className="lg:col-span-12 flex flex-col space-y-4">
          {/* Draft preview banner inside */}
          {aiGeneratedFlashcards.length > 0 && (
            <div className="p-4 rounded-xl border border-dotted border-[#10A37F] bg-emerald-50 flex items-center justify-between flex-wrap gap-3 shrink-0">
              <div>
                <span className="px-2 py-0.5 rounded bg-emerald-100 border border-[#10A37F]/20 text-[8.5px] font-bold font-mono uppercase text-[#10A37F]">Tailored Review Session</span>
                <p className="text-xs text-emerald-900 font-bold mt-1">Found {aiGeneratedFlashcards.length} Tailored Diagnostic Draft cards!</p>
              </div>

              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={saveAiGeneratedFlashcards}
                  className="px-3 py-1.5 bg-[#10A37F] text-white hover:bg-[#10A37F]/90 rounded-lg text-xs font-semibold flex items-center gap-1 cursor-pointer transition-all active:scale-95 duration-100"
                >
                  <Check className="w-3.5 h-3.5" />
                  <span>{aiGeneratedFlashcardsSaved ? "Saved Successfully ✓" : "Store in Locker"}</span>
                </button>
                <button
                  type="button"
                  onClick={clearAiGeneratedFlashcards}
                  className="px-3 py-1.5 bg-white border border-[#E5E5E5] hover:bg-gray-100 text-[#666666] rounded-lg text-xs font-semibold flex items-center gap-1 cursor-pointer transition-all"
                >
                  <X className="w-3.5 h-3.5" />
                  <span>Dismiss</span>
                </button>
              </div>
            </div>
          )}

          {/* Custom flashcard Manual append panel */}
          {isCreatingFlashcard && (
            <div className="p-5 rounded-xl border border-[#E5E5E5] bg-white space-y-4 animate-fadeIn shrink-0">
              <h3 className="text-xs font-bold uppercase tracking-wider text-[#10A37F] font-mono">Create Personal Card</h3>
              <div className="space-y-3.5 text-xs">
                <div>
                  <label className="block text-[10px] font-bold uppercase text-[#666666] mb-1 font-mono">Card Front (Question/Formula/Concept)</label>
                  <input
                    type="text"
                    value={newCardQuestion}
                    onChange={(e) => setNewCardQuestion(e.target.value)}
                    placeholder="e.g. What is the fundamental theorem of calculus?"
                    className="w-full bg-[#F7F7F8] border border-[#E5E5E5] rounded-lg p-2.5 outline-none focus:border-[#10A37F] text-xs text-[#111111]"
                  />
                  <p className="text-[10px] text-[#666666] mt-1 italic">Keep sentences short (under 15 words) for beautiful rendering.</p>
                </div>

                <div>
                  <label className="block text-[10px] font-bold uppercase text-[#666666] mb-1 font-mono">Card Back (Socratic Proof/Answer)</label>
                  <textarea
                    value={newCardAnswer}
                    onChange={(e) => setNewCardAnswer(e.target.value)}
                    placeholder="e.g. It relates differentiation and integration, proving they are inverse operations..."
                    rows={2.5}
                    className="w-full bg-[#F7F7F8] border border-[#E5E5E5] rounded-lg p-2.5 outline-none focus:border-[#10A37F] text-xs text-[#111111]"
                  />
                  <p className="text-[10px] text-[#666666] mt-1 italic">Keep answers concise (under 25 words) to avoid text truncation.</p>
                </div>

                <div className="flex gap-2.5 pt-1">
                  <button onClick={addFlashcard} className="px-3.5 py-1.5 bg-[#10A37F] text-white text-xs font-semibold rounded-lg hover:bg-[#10A37F]/90 cursor-pointer">
                    Insert Card
                  </button>
                  <button onClick={() => setIsCreatingFlashcard(false)} className="px-3.5 py-1.5 bg-[#F7F7F8] border border-[#E5E5E5] text-[#666666] text-xs font-semibold rounded-lg hover:bg-gray-100 cursor-pointer">
                    Dismiss
                  </button>
                </div>
              </div>
            </div>
          )}          {/* Flashcard Rotator grid */}
          <div className="flex-1 overflow-y-auto max-h-[460px] pr-2">
            {flashcards.length === 0 ? (
              <div className="p-8 rounded-xl border border-dashed border-[#E5E5E5] text-center min-h-[380px] flex flex-col justify-center items-center bg-[#F7F7F8]/40">
                <div className="text-3xl animate-pulse">🗃️</div>
                <h4 className="text-sm font-bold text-[#111111] mt-2">Active revision locker is empty</h4>
                <p className="text-xs text-[#666655] max-w-sm mt-1 mb-4 leading-relaxed font-medium">
                  Input a custom topic above and let LUNITO auto-write your flashcards or manually key in study nodes instantly.
                </p>
              </div>
            ) : currentIndex >= flashcards.length ? (
              <div className="p-8 rounded-xl border border-dashed border-[#10A37F] text-center min-h-[350px] flex flex-col justify-center items-center bg-emerald-50/70 max-w-lg mx-auto w-full animate-fadeIn my-4">
                <div className="text-4xl">🏆</div>
                <h4 className="text-sm font-bold text-emerald-950 mt-3 font-display">All Flashcards Finished!</h4>
                <p className="text-xs text-emerald-800 max-w-sm mt-2 leading-relaxed font-semibold">
                  Excellent work! You have successfully practiced and reviewed all {flashcards.length} flashcards in this deck.
                </p>
                <button
                  type="button"
                  onClick={() => {
                    if (clearAllFlashcards) {
                      clearAllFlashcards();
                    }
                    setCurrentIndex(0);
                  }}
                  className="mt-6 px-6 py-2.5 bg-[#10A37F] hover:bg-[#10A37F]/90 text-white text-xs font-bold rounded-lg shadow-sm transition-all flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  Close Flashcards
                </button>
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center max-w-lg mx-auto w-full py-2 space-y-6">
                
                {/* Progress Indicator */}
                <div className="w-full flex flex-col space-y-2">
                  <div className="flex justify-between items-center text-[10px] font-bold text-[#666666] font-mono tracking-wider">
                    <span>REVISION PROGRESS</span>
                    <span className="text-[#10A37F]">CARD {Math.min(currentIndex, flashcards.length - 1) + 1} OF {flashcards.length}</span>
                  </div>
                  <div className="w-full bg-[#E5E5E5] h-1.5 rounded-full overflow-hidden">
                    <div 
                      className="bg-[#10A37F] h-full transition-all duration-300"
                      style={{ width: `${((Math.min(currentIndex, flashcards.length - 1) + 1) / flashcards.length) * 100}%` }}
                    />
                  </div>
                </div>

                {/* Single Flashcard Card */}
                {(() => {
                  const safeIndex = Math.min(currentIndex, flashcards.length - 1);
                  const card = flashcards[safeIndex];
                  if (!card) return null;
                  const isFlipped = !!flippedCards[card.id];
                  const isBookmarked = !!bookmarkedCards[card.id];

                  return (
                    <div className="w-full animate-fadeIn">
                      <div 
                        onClick={() => toggleCardFlip(card.id)}
                        className="h-[190px] cursor-pointer group rounded-xl relative select-none hover:scale-[1.01] transition-all duration-250 w-full"
                        style={{ perspective: "1000px" }}
                      >
                        <div 
                          className="w-full h-full duration-500 relative rounded-xl border transition-all"
                          style={{ 
                            transformStyle: "preserve-3d", 
                            transform: isFlipped ? "rotateY(180deg)" : "rotateY(0deg)",
                            transition: "transform 0.5s ease-out",
                            borderColor: isFlipped ? "#10A37F" : "#E5E5E5"
                          }}
                        >
                          {/* FRONT */}
                          <div 
                            className="absolute inset-0 p-4 flex flex-col justify-between bg-white rounded-xl shadow-none"
                            style={{ 
                              backfaceVisibility: "hidden",
                              WebkitBackfaceVisibility: "hidden"
                            }}
                          >
                            <div className="flex justify-between items-center text-[8px] font-bold text-[#666666] uppercase tracking-wider font-mono">
                              <span>{card.category}</span>
                              <div className="flex items-center gap-1.5">
                                {/* Small bookmark block */}
                                <button
                                  onClick={(e) => toggleBookmark(card.id, e)}
                                  className={`p-1 rounded ${isBookmarked ? "text-amber-500" : "text-[#666666] hover:text-amber-500"}`}
                                  title="Bookmark important cards"
                                >
                                  <Bookmark className={`w-3.5 h-3.5 ${isBookmarked ? "fill-current" : ""}`} />
                                </button>
                                
                                <button
                                  type="button"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    deleteFlashcard(card.id);
                                    if (currentIndex > 0 && currentIndex >= flashcards.length - 1) {
                                      setCurrentIndex(flashcards.length - 2);
                                    }
                                  }}
                                  className="p-1 rounded text-[#666666] hover:text-red-500 hover:bg-red-50 transition-all cursor-pointer inline-flex items-center justify-center shrink-0"
                                  title="Remove Flashcard"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              </div>
                            </div>
                            
                            <div className="text-center font-bold px-1 text-xs text-[#111111] leading-relaxed max-h-[110px] overflow-y-auto no-scrollbar flex items-center justify-center w-full">
                              <span>{renderTextWithMath ? renderTextWithMath(card.front) : card.front}</span>
                            </div>
                            
                            <div className="text-center text-[9px] text-[#666666] font-bold uppercase tracking-wider font-mono">
                              Tap to reveal answer ↺
                            </div>
                          </div>

                          {/* BACK */}
                          <div 
                            className="absolute inset-0 p-4 flex flex-col justify-between bg-[#F7F7F8] rounded-xl shadow-none"
                            style={{ 
                              backfaceVisibility: "hidden",
                              WebkitBackfaceVisibility: "hidden",
                              transform: "rotateY(180deg)"
                            }}
                          >
                            <div className="flex justify-between items-center text-[8px] font-bold text-[#10A37F] uppercase tracking-wider font-mono font-bold">
                              <span>{card.category}</span>
                              <span className="text-[#10A37F]">Logical Proof</span>
                            </div>
                            
                            <div className="text-center font-semibold px-1 text-[11px] text-[#111111] leading-relaxed max-h-[110px] overflow-y-auto no-scrollbar flex items-center justify-center w-full">
                              <span>{renderTextWithMath ? renderTextWithMath(card.back) : card.back}</span>
                            </div>
                            
                            <div className="text-center text-[9px] text-[#666666] font-bold uppercase tracking-wider font-mono">
                              Tap to view prompt ↺
                            </div>
                          </div>

                        </div>
                      </div>
                    </div>
                  );
                })()}

                {/* Navigation Row */}
                <div className="w-full flex items-center justify-between gap-4 font-mono">
                  <button
                    type="button"
                    onClick={() => setCurrentIndex(prev => Math.max(0, prev - 1))}
                    disabled={currentIndex === 0}
                    className="px-4 py-2 border border-[#E5E5E5] bg-white text-[#111111] hover:bg-gray-50 disabled:opacity-40 rounded-lg text-xs font-bold transition-all flex items-center gap-1 cursor-pointer select-none"
                  >
                    ← PREVIOUS
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setCurrentIndex(prev => prev + 1);
                    }}
                    className="px-5 py-2 bg-[#10A37F] hover:bg-[#10A37F]/95 text-white font-bold rounded-lg text-xs transition-all flex items-center gap-1 cursor-pointer shadow-sm select-none"
                  >
                    {currentIndex === flashcards.length - 1 ? "FINISH DECK →" : "NEXT →"}
                  </button>
                </div>

              </div>
            )}
          </div>
        </div>
      </div>

      {/* Spaced revision log references */}
      {flashcardsHistory.length > 0 && (
        <div className="pt-6 border-t border-[#E5E5E5] space-y-3 shrink-0">
          <div className="flex items-center gap-1.5">
            <span className="p-1 rounded bg-[#E5E5E5]">
              <Sparkles className="w-4 h-4 text-[#10A37F]" />
            </span>
            <span className="text-xs font-bold uppercase tracking-wider text-[#111111] font-mono">Spaced Repetition Mastery Logs</span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {flashcardsHistory.map((item) => (
              <div key={item.id} className="p-3 bg-white border border-[#E5E5E5] rounded-xl text-xs space-y-1">
                <span className="text-[9px] font-bold bg-[#F7F7F8] border border-[#E5E5E5] px-1.5 py-0.5 rounded text-[#111111] uppercase font-mono">{item.subject}</span>
                <h4 className="text-xs font-bold text-[#111111] truncate font-display">{item.topic}</h4>
                <div className="flex items-center justify-between text-[9px] text-[#666666] font-mono pt-1">
                  <span>{item.count} slides</span>
                  <span>{item.date}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

    </motion.div>
  );
};
