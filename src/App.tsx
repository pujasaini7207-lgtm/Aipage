import React, { useState, useEffect, useRef } from "react";
import { 
  Brain, 
  LayoutDashboard, 
  MessageSquare, 
  BookOpen, 
  TrendingUp, 
  PlayCircle, 
  HelpCircle, 
  Volume2,
  VolumeX,
  Settings as SettingsIcon, 
  Flame, 
  Timer, 
  CheckCircle, 
  Award, 
  Bell, 
  X, 
  Check,
  Send, 
  Lock,
  Paperclip, 
  Mic, 
  Download, 
  ChevronLeft, 
  ChevronRight, 
  Plus, 
  Search, 
  LogOut, 
  Moon, 
  Sun, 
  Camera, 
  Image as ImageIcon,
  Sparkles,
  Info,
  AlertTriangle,
  Lightbulb,
  User,
  Trash2,
  RotateCcw,
  RotateCw,
  PenTool,
  Menu,
  CreditCard,
  QrCode,
  Loader2
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { SocraticDashboard } from "./components/SocraticDashboard";
import { SocraticSidebar } from "./components/SocraticSidebar";
import { SocraticChat } from "./components/SocraticChat";
import { SocraticNotebook } from "./components/SocraticNotebook";
import { SocraticFlashcards } from "./components/SocraticFlashcards";
import { SocraticQuizzes } from "./components/SocraticQuizzes";
import { SocraticSettings } from "./components/SocraticSettings";
import { SocraticAnalytics } from "./components/SocraticAnalytics";
import { SocraticRoadmap } from "./components/SocraticRoadmap";
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip as ChartTooltip, ResponsiveContainer } from "recharts";
import confetti from "canvas-confetti";
import { 
  auth, 
  db, 
  handleFirestoreError, 
  OperationType,
  isMockMode,
  signInWithPopup, 
  GoogleAuthProvider, 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword, 
  signOut, 
  onAuthStateChanged,
  doc, 
  getDoc, 
  setDoc, 
  updateDoc, 
  collection, 
  query, 
  where, 
  getDocs, 
  addDoc, 
  deleteDoc 
} from "./lib/supabase";
import LunitoLandingPage from "./components/LunitoLandingPage";
import { InlineMath, BlockMath } from "react-katex";
import { jsPDF } from "jspdf";

// Interfaces and Types
type ActiveTab = "dashboard" | "chat" | "notebook" | "progress" | "flashcards" | "test" | "settings" | "roadmap";

interface Message {
  id: string;
  sender: "user" | "ai";
  text: string;
  timestamp: string;
  isTyped?: boolean;
  sources?: Array<{ title: string; uri: string }>;
}

interface ChatThread {
  id: string;
  title: string;
  createdAt: string;
  lastMessageAt: string;
  subject?: string;
  topic?: string;
}

interface Flashcard {
  id: string;
  front: string;
  back: string;
  category: string;
}

interface NotificationMsg {
  id: string;
  message: string;
  type: "success" | "error" | "info";
}

const STANDARD_SUBJECTS = [
  "Mathematics",
  "Physics",
  "Chemistry",
  "Biology",
  "Computer Science",
  "Literature Study",
  "History",
  "General Study",
  "Custom Subject"
];

function parseTextWithMath(text: string): { type: "text" | "inline-math" | "block-math"; content: string }[] {
  const segments: { type: "text" | "inline-math" | "block-math"; content: string }[] = [];
  let currentPos = 0;

  while (currentPos < text.length) {
    let nearestIdx = -1;
    let delimType: "block-$$" | "block-\\[" | "inline-(" | "inline-$" | null = null;

    const idx_block_dollar = text.indexOf("$$", currentPos);
    const idx_block_bracket = text.indexOf("\\[", currentPos);
    const idx_inline_paren = text.indexOf("\\(", currentPos);
    const idx_inline_dollar = text.indexOf("$", currentPos);

    const candidates: { index: number; type: "block-$$" | "block-\\[" | "inline-(" | "inline-$" }[] = [];
    if (idx_block_dollar !== -1) candidates.push({ index: idx_block_dollar, type: "block-$$" });
    if (idx_block_bracket !== -1) candidates.push({ index: idx_block_bracket, type: "block-\\[" });
    if (idx_inline_paren !== -1) candidates.push({ index: idx_inline_paren, type: "inline-(" });
    
    if (idx_inline_dollar !== -1) {
      if (idx_block_dollar === idx_inline_dollar) {
        // block-$$ takes preference
      } else {
        candidates.push({ index: idx_inline_dollar, type: "inline-$" });
      }
    }

    if (candidates.length === 0) {
      const remaining = text.substring(currentPos);
      if (remaining) {
        segments.push({ type: "text", content: remaining });
      }
      break;
    }

    candidates.sort((a, b) => a.index - b.index);
    const firstMatched = candidates[0];
    nearestIdx = firstMatched.index;
    delimType = firstMatched.type;

    if (nearestIdx > currentPos) {
      segments.push({ type: "text", content: text.substring(currentPos, nearestIdx) });
    }

    let closeDelim = "";
    let segType: "text" | "inline-math" | "block-math" = "text";
    let startDelimLen = 0;

    if (delimType === "block-$$") {
      closeDelim = "$$";
      segType = "block-math";
      startDelimLen = 2;
    } else if (delimType === "block-\\[") {
      closeDelim = "\\]";
      segType = "block-math";
      startDelimLen = 2;
    } else if (delimType === "inline-(") {
      closeDelim = "\\)";
      segType = "inline-math";
      startDelimLen = 2;
    } else if (delimType === "inline-$") {
      closeDelim = "$";
      segType = "inline-math";
      startDelimLen = 1;
    }

    const startPos = nearestIdx + startDelimLen;
    const endPos = text.indexOf(closeDelim, startPos);

    if (endPos !== -1) {
      const matchContent = text.substring(startPos, endPos);
      segments.push({ type: segType, content: matchContent });
      currentPos = endPos + closeDelim.length;
    } else {
      const matchContent = text.substring(startPos);
      segments.push({ type: segType, content: matchContent });
      break;
    }
  }

  return segments;
}

function SocraticTypewriter({ 
  text, 
  onComplete 
  }: { 
  text: string; 
  onComplete?: () => void; 
}) {
  const [displayedText, setDisplayedText] = useState("");
  const onCompleteRef = useRef(onComplete);

  useEffect(() => {
    onCompleteRef.current = onComplete;
  }, [onComplete]);

  useEffect(() => {
    if (!text) {
      if (onCompleteRef.current) {
        onCompleteRef.current();
      }
      return;
    }

    let currentIndex = 0;
    // Fast dynamic typewriter
    const step = text.length > 500 ? 5 : text.length > 150 ? 3 : 1;
    
    const interval = setInterval(() => {
      currentIndex += step;
      if (currentIndex >= text.length) {
        clearInterval(interval);
        setDisplayedText(text);
        if (onCompleteRef.current) {
          setTimeout(() => {
            if (onCompleteRef.current) {
              onCompleteRef.current();
            }
          }, 0);
        }
      } else {
        setDisplayedText(text.substring(0, currentIndex));
      }
    }, 12);

    return () => clearInterval(interval);
  }, [text]);

  const segments = parseTextWithMath(displayedText);

  return (
    <span className="whitespace-pre-wrap m-0 block leading-relaxed text-zinc-100">
      {segments.map((seg, idx) => {
        if (seg.type === "block-math") {
          return (
            <div key={idx} className="my-3.5 overflow-x-auto max-w-full text-center py-3 px-4 bg-white/5 rounded-xl border border-white/5 shadow-inner">
              <BlockMath 
                math={seg.content} 
                renderError={(error) => (
                  <span className="font-mono text-xs text-amber-500/80">
                    $${seg.content}$$
                  </span>
                )}
              />
            </div>
          );
        } else if (seg.type === "inline-math") {
          return (
            <span key={idx} className="mx-1 inline-block align-middle my-0.5 font-sans">
              <InlineMath 
                math={seg.content} 
                renderError={(error) => (
                  <span className="font-mono text-xs text-amber-500/80">
                    ${seg.content}$
                  </span>
                )}
              />
            </span>
          );
        } else {
          return (
            <span key={idx} className="whitespace-pre-wrap inline">
              {seg.content}
            </span>
          );
        }
      })}
    </span>
  );
}

export function renderTextWithMath(text: string): React.ReactNode {
  const segments = parseTextWithMath(text);
  return (
    <span className="whitespace-pre-wrap m-0 block leading-relaxed">
      {segments.map((seg, idx) => {
        if (seg.type === "block-math") {
          return (
            <div key={idx} className="my-3.5 overflow-x-auto max-w-full text-center py-3 px-4 bg-white/5 rounded-xl border border-white/5 shadow-inner">
              <BlockMath 
                math={seg.content} 
                renderError={(error) => (
                  <span className="font-mono text-xs text-amber-500/80">
                    $${seg.content}$$
                  </span>
                )}
              />
            </div>
          );
        } else if (seg.type === "inline-math") {
          return (
            <span key={idx} className="mx-1 inline-block align-middle my-0.5 font-sans">
              <InlineMath 
                math={seg.content} 
                renderError={(error) => (
                  <span className="font-mono text-xs text-amber-500/80">
                    ${seg.content}$
                  </span>
                )}
              />
            </span>
          );
        } else {
          return (
            <span key={idx} className="whitespace-pre-wrap inline">
              {seg.content}
            </span>
          );
        }
      })}
    </span>
  );
}

const SUBJECTS_DATABASE: Record<string, string[]> = {
  "Mathematics": ["Quadratic Equations", "Trigonometric Derivatives", "Single Variable Calculus", "Linear Algebra"],
  "Physics": ["Electromagnetism", "Thermodynamics", "Quantum Mechanics", "Newtonian Kinematics"],
  "Chemistry": ["Organic Synthesis", "Chemical Equilibrium", "Reaction Kinetics", "Atomic Structure"],
  "Computer Science": ["Data Structures", "Recursion & Dynamic Programming", "Sorting Algorithms", "System Design"],
  "Literature Study": ["Shakespearean Prose", "Literary Rhetoric Analysis", "Creative Narrative Writing"],
  "Philosophy": ["Socratic Dialogue", "Epistemology & Logic", "Existential Philosophy", "Ethical Frameworks"],
  "World History": ["The Industrial Revolution", "Ancient Civilizations", "World War Decades", "The Renaissance Period"]
};

export default function App() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  
  // Dynamic class-aware adaptive and search-grounded syllabus helper
  const getTopicsForSubject = (sub: string): string[] => {
    if (userSyllabus && userSyllabus[sub] && Array.isArray(userSyllabus[sub]) && userSyllabus[sub].length > 0) {
      return userSyllabus[sub];
    }
    
    const gradeVal = selectedClass || "Class 10";
    if (gradeVal.includes("Class 6") || gradeVal.includes("Class 7") || gradeVal.includes("Class 8")) {
      const g68_DB: Record<string, string[]> = {
        "Mathematics": ["Fractions & Decimals", "Simple Equations", "Practical Geometry", "Data Handling", "Integers & Decimals"],
        "Physics": ["Light, Shadows & Reflections", "Heat & Temperature", "Motion & Measurement", "Electricity & Circuits"],
        "Chemistry": ["Physical & Chemical Changes", "Acids, Bases & Salts", "Separation of Substances", "Water & Air Structure"],
        "Computer Science": ["Introduction to Computers", "Basics of Scratch Coding", "Basics of HTML", "Generative AI Safety"],
        "Literature Study": ["Basic Paragraph Writing", "Aesthetic Prose & Stories", "Poetic Rhymes & Structure", "Reading Vocabularies"],
        "Philosophy": ["Introduction to Reasoning", "Rules of Socratic Dialogue", "Axioms & Moral Customs"],
        "World History": ["Ancient Empires", "Medieval Kingdoms", "Early Human Settlements", "The Indus Valley"]
      };
      return g68_DB[sub] || SUBJECTS_DATABASE[sub] || [`${sub} General Foundation`];
    } else if (gradeVal.includes("Class 9") || gradeVal.includes("Class 10")) {
      const g910_DB: Record<string, string[]> = {
        "Mathematics": ["Real Numbers", "Quadratic Equations", "Arithmetic Progressions", "Trigonometric Identities", "Coordinate Geometry"],
        "Physics": ["Light Reflection & Refraction", "Electricity & Current Circuits", "Magnetic Effects of Current", "Gravitation & Laws of Motion"],
        "Chemistry": ["Chemical Reactions & Equations", "Acids, Bases & Salts", "Metals & Non-metals", "Carbon & its Compounds"],
        "Computer Science": ["Cyber Ethics & Safety", "Basics of Python Programming", "Database Concepts & SQL", "HTML & CSS Styling"],
        "Literature Study": ["Poetry Analytical Essays", "Creative Short-Story Writing", "Grammar & Syntax Rules", "Socratic Reading Comprehension"],
        "Philosophy": ["Logical Proof Basics", "Critical Syllogisms", "Virtue Ethics & Justice"],
        "World History": ["The French Revolution", "Industrialization Movements", "Nationalism & Alliances", "Rise of Democracy"]
      };
      return g910_DB[sub] || SUBJECTS_DATABASE[sub] || [`${sub} Core Syllabus`];
    } else if (gradeVal.includes("Class 11") || gradeVal.includes("Class 12")) {
      const g1112_DB: Record<string, string[]> = {
        "Mathematics": ["Sets, Relations & Functions", "Limits & Derivatives", "Complex Numbers", "Matrices & Determinants", "Introductory Probability"],
        "Physics": ["Static Charges & Fields", "Magnetic Induction & AC", "Wave Optics & Ray Optics", "Electromagnetic Radiation", "Semiconductors Basics"],
        "Chemistry": ["Chemical Bonding & Structure", "Thermodynamics & Equilibrium", "Solutions & Electrochemistry", "Basic Organic Chemistry", "Coordination Compounds"],
        "Computer Science": ["Object-Oriented Coding", "SQL Table Operations", "Data Structure Basics", "Computer Network Routing"],
        "Literature Study": ["Literary Prose Critiques", "Critical Essay Conventions", "Creative Writing Rhetoric"],
        "Philosophy": ["Formal Propositional Logic", "Epistemology & Empiricism", "Utilitarian & Kantian Ethics"],
        "World History": ["Early Multi-continental Empires", "The Cold War Decade", "Nationalist Movements", "The Great Depression"]
      };
      return g1112_DB[sub] || SUBJECTS_DATABASE[sub] || [`${sub} Advanced Syllabus`];
    } else {
      return SUBJECTS_DATABASE[sub] || ["General Study Topic"];
    }
  };
  const [showLandingPage, setShowLandingPage] = useState(true);
  const [isAuthLoading, setIsAuthLoading] = useState(true);
  const isIframe = typeof window !== "undefined" && window.self !== window.top;
  const [emailInput, setEmailInput] = useState("");
  const [isOtpMode, setIsOtpMode] = useState(false);
  const [otpArray, setOtpArray] = useState<string[]>(["", "", "", "", "", ""]);
  const [generatedOtp, setGeneratedOtp] = useState("");
  const [authError, setAuthError] = useState<string | null>(null);

  // Core App states
  const [activeTab, setActiveTab] = useState<ActiveTab>("dashboard");
  const [displayName, setDisplayName] = useState("Alex Alexander");
  const [emailDisplay, setEmailDisplay] = useState("alex@lunito.ai");
  const [tutoringStyle, setTutoringStyle] = useState("Socratic Companion");
  const [notificationsToggle, setNotificationsToggle] = useState(true);
  const [darkModeToggle, setDarkModeToggle] = useState(true);
  const [sidebarOpen, setSidebarOpen] = useState(true);

  // AI Tutor Adaptive Learning States (Mood, Tone, Homework, and Roadmap)
  const [userMood, setUserMood] = useState<string>("neutral");
  const [tutorTone, setTutorTone] = useState<string>("Socratic Companion");
  const [roadmapData, setRoadmapData] = useState<any[]>([]);
  const [homeworks, setHomeworks] = useState<any[]>([]);
  const [diagnosedWeakAreas, setDiagnosedWeakAreas] = useState<string[]>(["Quadratic Equations", "Circuits"]);
  const [diagnosedStrongAreas, setDiagnosedStrongAreas] = useState<string[]>(["Socratic Method Basics"]);

  // Swipe-to-close touch events
  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartX.current = e.touches[0].clientX;
    touchCurrentX.current = e.touches[0].clientX;
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    touchCurrentX.current = e.touches[0].clientX;
  };

  const handleTouchEnd = () => {
    if (touchStartX.current !== null && touchCurrentX.current !== null) {
      const diffX = touchStartX.current - touchCurrentX.current;
      // swipe-left threshold is 50px
      if (diffX > 50) {
        setSidebarOpen(false);
      }
    }
    touchStartX.current = null;
    touchCurrentX.current = null;
  };

  // Subscription and Chat Limit states
  const [isGuestBypass, setIsGuestBypass] = useState(false);
  const [guestChatsCounter, setGuestChatsCounter] = useState<number>(() => {
    if (typeof window !== "undefined") {
      return Number(localStorage.getItem("lunito_guest_chats") || "0");
    }
    return 0;
  });
  const [plan, setPlan] = useState<"free" | "pro" | "elite">("free");
  const [chatsToday, setChatsToday] = useState(0);
  const [lastResetTime, setLastResetTime] = useState("");
  const [isLimitModalOpen, setIsLimitModalOpen] = useState(false);
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);
  const [isGuestPaymentModalOpen, setIsGuestPaymentModalOpen] = useState(false);
  // Payment gateway states
  const [isProcessingPayment, setIsProcessingPayment] = useState(false);
  const [isCustomCheckoutOpen, setIsCustomCheckoutOpen] = useState(false);
  const [paymentPlanToUpgrade, setPaymentPlanToUpgrade] = useState<"pro" | "elite" | null>(null);
  const [customCardNumber, setCustomCardNumber] = useState("");
  const [customCardExpiry, setCustomCardExpiry] = useState("");
  const [customCardCVV, setCustomCardCVV] = useState("");
  const [customCardName, setCustomCardName] = useState("");
  const [paymentMethod, setPaymentMethod] = useState<"card" | "qr">("card");
  const [editedName, setEditedName] = useState("");

  // Profile completion states
  const [isCompletingProfile, setIsCompletingProfile] = useState(false);
  const [completeProfileName, setCompleteProfileName] = useState("");
  const [pendingAuthUser, setPendingAuthUser] = useState<any>(null);

  // Subject Management & Progress Tracking States
  const [subjects, setSubjects] = useState<string[]>(["Mathematics", "Philosophy", "Computer Science", "Physics", "Chemistry", "World History", "Literature Study"]);
  const [currentStudySubject, setCurrentStudySubject] = useState<string>("");
  const [subjectsProgress, setSubjectsProgress] = useState<Record<string, {
    chatsCount: number;
    quizCount: number;
    quizScoreSum: number;
    flashcardCount: number;
    notebookPageCount: number;
    masteryLevel: number;
  }>>({
    "Mathematics": { chatsCount: 0, quizCount: 0, quizScoreSum: 0, flashcardCount: 0, notebookPageCount: 0, masteryLevel: 0 },
    "Philosophy": { chatsCount: 0, quizCount: 0, quizScoreSum: 0, flashcardCount: 0, notebookPageCount: 0, masteryLevel: 0 },
    "Computer Science": { chatsCount: 0, quizCount: 0, quizScoreSum: 0, flashcardCount: 0, notebookPageCount: 0, masteryLevel: 0 },
    "Physics": { chatsCount: 0, quizCount: 0, quizScoreSum: 0, flashcardCount: 0, notebookPageCount: 0, masteryLevel: 0 },
    "Chemistry": { chatsCount: 0, quizCount: 0, quizScoreSum: 0, flashcardCount: 0, notebookPageCount: 0, masteryLevel: 0 },
    "World History": { chatsCount: 0, quizCount: 0, quizScoreSum: 0, flashcardCount: 0, notebookPageCount: 0, masteryLevel: 0 },
    "Literature Study": { chatsCount: 0, quizCount: 0, quizScoreSum: 0, flashcardCount: 0, notebookPageCount: 0, masteryLevel: 0 }
  });
  
  // Local states for subject select modal or new signup builder
  const [profileSubjects, setProfileSubjects] = useState<string[]>(["Mathematics", "Philosophy", "Computer Science", "Physics", "Chemistry", "World History", "Literature Study"]);
  const [customProfileSubject, setCustomProfileSubject] = useState("");
  const [isSubjectSelectionModalOpen, setIsSubjectSelectionModalOpen] = useState(false);
  const [newSubjectToManage, setNewSubjectToManage] = useState("");

  // Active Study Focus States
  const [selectedSubject, setSelectedSubject] = useState("Mathematics");
  const [selectedTopic, setSelectedTopic] = useState("Quadratic Equations");
  const [isFocusModalOpen, setIsFocusModalOpen] = useState(false);
  const [customSubjectInput, setCustomSubjectInput] = useState("");
  const [customTopicInput, setCustomTopicInput] = useState("");
  const [showCustomFields, setShowCustomFields] = useState(false);
  const [isGeneratingQuiz, setIsGeneratingQuiz] = useState(false);
  const [isGeneratingFlashcards, setIsGeneratingFlashcards] = useState(false);

  // Syllabus & Curriculum State Variables
  const [selectedClass, setSelectedClass] = useState<string>("Class 10");
  const [selectedBoard, setSelectedBoard] = useState<string>("CBSE");
  const [userSyllabus, setUserSyllabus] = useState<Record<string, string[]> | null>(null);
  const [syllabusSources, setSyllabusSources] = useState<{ title: string; uri: string }[]>([]);
  const [isFetchingSyllabus, setIsFetchingSyllabus] = useState(false);
  const [onboardingStateBoardName, setOnboardingStateBoardName] = useState("");

  // Online study reference resources state variables
  const [connectedResource, setConnectedResource] = useState<{
    name: string;
    url: string;
    snippet?: string;
  } | null>(null);
  const [isResourceModalOpen, setIsResourceModalOpen] = useState(false);
  const [resourceInputName, setResourceInputName] = useState("");
  const [resourceInputUrl, setResourceInputUrl] = useState("");
  const [resourceInputSnippet, setResourceInputSnippet] = useState("");

  // Independent Subject select choices for sections
  const [chatSubject, setChatSubject] = useState("Mathematics");
  const [chatCustomSubject, setChatCustomSubject] = useState("");
  const [notebookSubject, setNotebookSubject] = useState("Mathematics");
  const [notebookCustomSubject, setNotebookCustomSubject] = useState("");
  const [flashcardSubject, setFlashcardSubject] = useState("Mathematics");
  const [flashcardCustomSubject, setFlashcardCustomSubject] = useState("");

  // Notebook Text Selection States
  const [selectedNotebookText, setSelectedNotebookText] = useState("");
  const [bubbleCoords, setBubbleCoords] = useState<{ x: number; y: number } | null>(null);

  // Notifications Queue
  const [notifications, setNotifications] = useState<NotificationMsg[]>([]);

  // Socratic Chat states
  const [chatInput, setChatInput] = useState("");
  const [attachedFile, setAttachedFile] = useState<{ name: string; url?: string; type: string; base64Content?: string } | null>(null);
  const [isAiTyping, setIsAiTyping] = useState(false);
  const [thinkWithMeActive, setThinkWithMeActive] = useState(false);

  // LONG-TERM CHAT HISTORY SEPARATE FOR USERS
  const defaultWelcomeMessage: Message = {
    id: "welcome",
    sender: "ai",
    text: "Hey there! 👋 I'm **LUNITO**, your personal AI tutor. Ready to learn something amazing today? Ask me anything, upload files, or use voice input!",
    timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
    isTyped: true
  };

  const [messages, setMessages] = useState<Message[]>([defaultWelcomeMessage]);
  const [chatThreads, setChatThreads] = useState<ChatThread[]>([]);
  const [activeChatId, setActiveChatId] = useState<string | null>(null);
  const [isLoadingThreads, setIsLoadingThreads] = useState(false);
  const [isLoadingMessages, setIsLoadingMessages] = useState(false);

  // Flashcards state (pre-made cards removed as requested!)
  const [flashcards, setFlashcards] = useState<Flashcard[]>([]);
  const [isCreatingFlashcard, setIsCreatingFlashcard] = useState(false);
  const [newCardQuestion, setNewCardQuestion] = useState("");
  const [newCardAnswer, setNewCardAnswer] = useState("");
  const [flippedCards, setFlippedCards] = useState<Record<string, boolean>>({});
  const [aiGeneratedFlashcards, setAiGeneratedFlashcards] = useState<Flashcard[]>([]);
  const [aiGeneratedFlashcardsSaved, setAiGeneratedFlashcardsSaved] = useState<boolean>(false);

  // Dynamic practice and test run histories
  const [flashcardsHistory, setFlashcardsHistory] = useState<Array<{ id: string; topic: string; subject: string; date: string; count: number }>>([]);
  const [testHistory, setTestHistory] = useState<Array<{ id: string; topic: string; subject: string; date: string; score: string }>>([]);

  // Notebook solver states
  const [notebookPage, setNotebookPage] = useState(1);
  const [notebookPages, setNotebookPages] = useState<Array<{ id?: string; title: string; lines: string[]; category?: string }>>([]);
  const notebookTotalPages = notebookPages.length;
  const [notebookChatInput, setNotebookChatInput] = useState("");
  const [notebookSearch, setNotebookSearch] = useState("");

  // Flashcard Companion Chat states
  const [flashcardChatInput, setFlashcardChatInput] = useState("");
  const [isFlashcardAiTyping, setIsFlashcardAiTyping] = useState(false);
  const [openedFlashcard, setOpenedFlashcard] = useState<Flashcard | null>(null);
  const [isOpenedFlashcardFlipped, setIsOpenedFlashcardFlipped] = useState(false);
  const [openedTest, setOpenedTest] = useState<any | null>(null);

  const [flashcardMessages, setFlashcardMessages] = useState<Message[]>([
    {
      id: "fc-welcome-1",
      sender: "ai",
      text: "Hello! I am LUNITO, your personal Socratic tutor. What academic topic would you like to generate flashcards for today? Tell me the topic, and I will instantly draft a set of revision cards for you!",
      timestamp: "",
      isTyped: true
    }
  ]);

  // Socratic Test Mode Chat states
  const [testChatInput, setTestChatInput] = useState("");
  const [isTestAiTyping, setIsTestAiTyping] = useState(false);
  const [testMessages, setTestMessages] = useState<Message[]>([
    {
      id: "test-welcome-1",
      sender: "ai",
      text: "Hello! I am LUNITO, your Socratic Test Planner. What topic would you like to be evaluated on today? Ask me to generate a test, and I will build an engaging exam challenge for you!",
      timestamp: "",
      isTyped: true
    }
  ]);
  const [isTestChatOpen, setIsTestChatOpen] = useState(true);

  // Quiz / Test Center states
  const [quizIndex, setQuizIndex] = useState(0);
  const [selectedQuizOption, setSelectedQuizOption] = useState<string | null>(null);
  const [quizScore, setQuizScore] = useState(0);
  const [quizSubmitted, setQuizSubmitted] = useState(false);
  const [quizCompleted, setQuizCompleted] = useState(false);
  const [quizTimeLeft, setQuizTimeLeft] = useState(1125); // 18:45 seconds remaining simulation

  // Dashboard state counts
  const [streakCount, setStreakCount] = useState(0);
  const [studyTimeToday, setStudyTimeToday] = useState("0h");
  const [topicsMastered, setTopicsMastered] = useState(0);
  const [accuracyRate, setAccuracyRate] = useState(0);

  // Swipe and Sidebar references
  const touchStartX = useRef<number | null>(null);
  const touchCurrentX = useRef<number | null>(null);

  // Collapse sidebar on component mount if viewport width is below 1024px
  useEffect(() => {
    if (typeof window !== "undefined") {
      if (window.innerWidth < 1024) {
        setSidebarOpen(false);
      }
      
      const handleResize = () => {
        if (window.innerWidth < 1024) {
          setSidebarOpen(false);
        } else {
          setSidebarOpen(true);
        }
      };
      
      window.addEventListener("resize", handleResize);
      return () => window.removeEventListener("resize", handleResize);
    }
  }, []);

  // References
  const chatBottomRef = useRef<HTMLDivElement>(null);
  const otpRefs = [
    useRef<HTMLInputElement>(null),
    useRef<HTMLInputElement>(null),
    useRef<HTMLInputElement>(null),
    useRef<HTMLInputElement>(null),
    useRef<HTMLInputElement>(null),
    useRef<HTMLInputElement>(null)
  ];

  // Live timer effect for quiz assessment
  useEffect(() => {
    const timer = setInterval(() => {
      setQuizTimeLeft(prev => (prev > 0 ? prev - 1 : 0));
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  // Chat limit, plan renewal & tracking helpers
  const checkChatLimitExceeded = (silent: boolean = false, isInteractiveAction: boolean = false) => {
    // Check if 24 hours have passed for renewal
    if (lastResetTime) {
      const lastReset = new Date(lastResetTime).getTime();
      const now = new Date().getTime();
      if (now - lastReset >= 24 * 60 * 60 * 1000) {
        setChatsToday(0);
        setGuestChatsCounter(0);
        const newReset = new Date().toISOString();
        setLastResetTime(newReset);
        if (auth.currentUser) {
          const userDocRef = doc(db, "users", auth.currentUser.uid);
          updateDoc(userDocRef, {
            chatsToday: 0,
            lastResetTime: newReset
          }).catch(err => {
            console.error("Error background resetting countdown:", err);
            handleFirestoreError(err, OperationType.UPDATE, "users/" + auth.currentUser?.uid);
          });
        }
        return false;
      }
    }

    // Limit based on account/plan: guest = 6, free = 15, pro = 45, elite = 90
    let limit = 15;
    const isGuest = emailDisplay === "guest@lunito.edu" || isGuestBypass;
    
    if (isGuest) {
      limit = 6;
    } else {
      if (plan === "pro") limit = 45;
      if (plan === "elite") limit = 90;
    }

    const currentUsageCount = isGuest ? guestChatsCounter : chatsToday;

    if (currentUsageCount >= limit) {
      if (!silent) {
        setIsLimitModalOpen(true);
        triggerNotification("daily limit hit upgrade plan", "error");
        
        // Add simulated bot system message if from interactive chat submit button
        if (isInteractiveAction) {
          const blockMsg: Message = {
            id: `block-${Date.now()}`,
            sender: "ai",
            text: "⚠️ **daily limit hit upgrade plan**\n\nYou have completed your available chats today for your current plan. Click on your profile icon or Manage Socratic Plan to upgrade, and resume continuous learning!",
            timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
            isTyped: true
          };
          setMessages(prev => [...prev, blockMsg]);
        }
      }
      return true;
    }

    return false;
  };

  const registerChatSent = async () => {
    const isGuest = emailDisplay === "guest@lunito.edu" || isGuestBypass;
    if (isGuest) {
      const nextCount = guestChatsCounter + 1;
      setGuestChatsCounter(nextCount);
      localStorage.setItem("lunito_guest_chats", nextCount.toString());
      return;
    }

    const nextCount = chatsToday + 1;
    setChatsToday(nextCount);
    if (auth.currentUser) {
      const userDocRef = doc(db, "users", auth.currentUser.uid);
      try {
        await updateDoc(userDocRef, { chatsToday: nextCount });
      } catch (err) {
        console.error("Firestore update chat count error:", err);
        handleFirestoreError(err, OperationType.UPDATE, "users/" + auth.currentUser.uid);
      }
    }
  };

  const handleSaveProfileName = async () => {
    if (!editedName.trim()) {
      triggerNotification("Profile name cannot be empty!", "error");
      return;
    }
    setDisplayName(editedName.trim());
    if (auth.currentUser) {
      const userDocRef = doc(db, "users", auth.currentUser.uid);
      try {
        await updateDoc(userDocRef, { displayName: editedName.trim() });
        triggerNotification("Profile name saved in Firestore!", "success");
      } catch (error) {
        console.error("Error saving profile name to Firestore:", error);
        triggerNotification("Name updated locally!", "info");
        handleFirestoreError(error, OperationType.UPDATE, "users/" + auth.currentUser.uid);
      }
    } else {
      triggerNotification("Local Guest name updated!", "success");
    }
  };

  const loadRazorpayScript = (): Promise<boolean> => {
    return new Promise((resolve) => {
      if ((window as any).Razorpay) {
        resolve(true);
        return;
      }
      const script = document.createElement("script");
      script.src = "https://checkout.razorpay.com/v1/checkout.js";
      script.async = true;
      script.onload = () => resolve(true);
      script.onerror = () => resolve(false);
      document.body.appendChild(script);
    });
  };

  const handleUpgradePlan = async (selectedPlan: "free" | "pro" | "elite") => {
    if (selectedPlan === "free") {
      try {
        if (auth.currentUser) {
          const userDocRef = doc(db, "users", auth.currentUser.uid);
          await updateDoc(userDocRef, { plan: "free" });
        }
        setPlan("free");
        triggerNotification("Profile plan set to Free Tier successfully.", "info");
        setIsLimitModalOpen(false);
        setIsProfileModalOpen(false);
      } catch (err) {
        console.error("Error setting free plan:", err);
        handleFirestoreError(err, OperationType.UPDATE, "users/" + auth.currentUser?.uid);
      }
      return;
    }

    const isGuest = emailDisplay === "guest@lunito.edu" || isGuestBypass || auth.currentUser?.email === "guest@lunito.edu" || (auth.currentUser && auth.currentUser.isAnonymous);
    if (isGuest) {
      setIsGuestPaymentModalOpen(true);
      return;
    }

    setPaymentPlanToUpgrade(selectedPlan);
    setIsProcessingPayment(true);

    try {
      // 1. Attempt Cashfree Payment Order Creation primarily
      const amountInINR = selectedPlan === "pro" ? 85.00 : 425.00;
      const cashfreeResponse = await safeFetch("/api/payment/cashfree-create-order", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          amount: amountInINR,
          plan: selectedPlan,
          userId: auth.currentUser?.uid || "guest_user",
          email: auth.currentUser?.email || "student@example.com",
          phone: "9999999999",
          origin: window.location.origin
        })
      });

      if (cashfreeResponse.ok) {
        const cashfreeData = await cashfreeResponse.json();
        if (cashfreeData.real) {
          console.log("[Payments] Interfacing Genuine Cashfree Session. Redirecting user securely to Cashfree gate...");
          window.location.href = cashfreeData.payment_link;
          return;
        }
      }
    } catch (cfErr) {
      console.warn("[Payments] Cashfree fallback or configuration check completed:", cfErr);
    }

    try {
      // Pro costs 1 USD ~ 85 INR (8500 paisa), Elite costs 5 USD ~ 425 INR (42500 paisa)
      const amountInPaisa = selectedPlan === "pro" ? 8500 : 42500;

      // 2. Request Razorpay order ID
      const orderResponse = await safeFetch("/api/payment/create-order", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ amount: amountInPaisa, currency: "INR" })
      });

      if (!orderResponse.ok) {
        throw new Error("Order creation request failed");
      }

      const orderData = await orderResponse.json();

      // 3. Load the checkout v1 JS sdk dynamically
      const isScriptLoaded = await loadRazorpayScript();

      // If keys are not provided OR script has failed to load (common inside iframe browser previews)
      if (!isScriptLoaded || !orderData.real) {
        console.log("[Payments] Proceeding to beautifully-styled Socratic Payment checkout simulator.");
        setIsCustomCheckoutOpen(true);
        setIsProcessingPayment(false);
        return;
      }

      // 3. Genuine Razorpay popup config
      const options = {
        key: orderData.key,
        amount: orderData.amount,
        currency: orderData.currency,
        name: "LUNITO AI Socratic Tutor",
        description: `Upgrade Lunito AI account to ${selectedPlan.toUpperCase()}`,
        image: "https://imgur.com/gK9QpQA.png", // Brain / study icon
        order_id: orderData.id,
        handler: async function (response: any) {
          setIsProcessingPayment(true);
          try {
            const verifyRes = await safeFetch("/api/payment/verify", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                razorpay_order_id: response.razorpay_order_id,
                razorpay_payment_id: response.razorpay_payment_id,
                razorpay_signature: response.razorpay_signature,
                plan: selectedPlan,
                userId: auth.currentUser?.uid || "guest_user"
              })
            });

            const verifyData = await verifyRes.json();
            if (verifyRes.ok && verifyData.status === "success") {
              if (auth.currentUser) {
                const userDocRef = doc(db, "users", auth.currentUser.uid);
                try {
                  await updateDoc(userDocRef, { plan: selectedPlan });
                } catch (dbErr) {
                  console.error("Error saving plan to users collection in verification:", dbErr);
                  handleFirestoreError(dbErr, OperationType.UPDATE, "users/" + auth.currentUser.uid);
                }
              }
              setPlan(selectedPlan);
              triggerNotification(`🎉 Upgraded to ${selectedPlan.toUpperCase()} plan successfully!`, "success");
              confetti({
                particleCount: 160,
                spread: 90,
                origin: { y: 0.6 }
              });
              setIsLimitModalOpen(false);
              setIsProfileModalOpen(false);
            } else {
              triggerNotification(verifyData.error || "Verification mismatch, please retry.", "error");
            }
          } catch (vErr) {
            console.error("Payment verification failure:", vErr);
            triggerNotification("Failed to verify transaction.", "error");
          } finally {
            setIsProcessingPayment(false);
          }
        },
        prefill: {
          name: displayName || "LUNITO Student",
          email: pendingAuthUser?.email || auth.currentUser?.email || "student@example.com",
          contact: "9999999999"
        },
        theme: {
          color: "#7C3AED"
        },
        modal: {
          ondismiss: function () {
            triggerNotification("Razorpay gateway closed.", "info");
            setIsProcessingPayment(false);
          }
        }
      };

      const razorpayInstance = new (window as any).Razorpay(options);
      razorpayInstance.open();
      setIsProcessingPayment(false);

    } catch (e: any) {
      console.error("Razorpay interface init error, loading simulator:", e);
      setIsCustomCheckoutOpen(true);
      setIsProcessingPayment(false);
    }
  };

  // Custom fetch wrapper to automatically and securely inject syllabus parameters into Socratic chat queries
  const safeFetch = async (input: RequestInfo | URL, init?: RequestInit): Promise<Response> => {
    const customInit = { ...init };
    if (typeof input === "string" && input === "/api/chat" && customInit && customInit.body) {
      try {
        const bodyObj = JSON.parse(customInit.body as string);
        if (bodyObj.userClass === undefined) bodyObj.userClass = selectedClass;
        if (bodyObj.userBoard === undefined) bodyObj.userBoard = selectedBoard;
        if (bodyObj.userSyllabus === undefined) bodyObj.userSyllabus = userSyllabus;
        customInit.body = JSON.stringify(bodyObj);
      } catch (e) {
        console.error("[Client] Error patching fetch body:", e);
      }
    }
    return window.fetch(input, customInit);
  };

  // Firebase Authentication listener
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        const userDocRef = doc(db, "users", user.uid);
        try {
          const docSnap = await getDoc(userDocRef);
          if (docSnap.exists()) {
            // LOAD ALL USER DATA from existing account
            const userData = docSnap.data();
            if (userData.displayName) setDisplayName(userData.displayName);
            if (userData.class) setSelectedClass(userData.class);
            if (userData.board) setSelectedBoard(userData.board);
            if (userData.syllabus) setUserSyllabus(userData.syllabus);
            if (userData.syllabusSources) setSyllabusSources(userData.syllabusSources);
            if (userData.streak !== undefined) setStreakCount(userData.streak);
            if (userData.totalSessions !== undefined) setTopicsMastered(userData.totalSessions);
            if (userData.chatsToday !== undefined) setChatsToday(userData.chatsToday);
            
            // Load real stats and practice histories
            if (userData.studyTimeToday !== undefined) setStudyTimeToday(userData.studyTimeToday);
            else setStudyTimeToday("0h");

            if (userData.accuracyRate !== undefined) setAccuracyRate(userData.accuracyRate);
            else setAccuracyRate(0);

            if (userData.flashcardsHistory !== undefined) setFlashcardsHistory(userData.flashcardsHistory);
            else setFlashcardsHistory([]);

            if (userData.testHistory !== undefined) setTestHistory(userData.testHistory);
            else setTestHistory([]);

            if (userData.flashcards !== undefined) setFlashcards(userData.flashcards);
            else setFlashcards([]);

            // Load custom Socratic tutor state
            if (userData.userMood !== undefined) setUserMood(userData.userMood);
            if (userData.tutorTone !== undefined) setTutorTone(userData.tutorTone);
            if (userData.roadmapData !== undefined) setRoadmapData(userData.roadmapData);
            if (userData.homeworks !== undefined) setHomeworks(userData.homeworks);
            if (userData.diagnosedWeakAreas !== undefined) setDiagnosedWeakAreas(userData.diagnosedWeakAreas);
            if (userData.diagnosedStrongAreas !== undefined) setDiagnosedStrongAreas(userData.diagnosedStrongAreas);

            // On-demand migrate missing default stats fields or check active plans
            let updatedProfile = false;
            const profileUpdates: any = {};

            // Ensure an active plan or first-check its database active plans. Fallback to free if none active.
            const activePlans = ["free", "pro", "elite"];
            const isPlanActive = userData.plan && activePlans.includes(userData.plan);
            if (!isPlanActive) {
              profileUpdates.plan = "free";
              setPlan("free");
              updatedProfile = true;
            } else {
              setPlan(userData.plan);
            }

            if (userData.streak === undefined) {
              profileUpdates.streak = 0;
              setStreakCount(0);
              updatedProfile = true;
            }
            if (userData.totalSessions === undefined) {
              profileUpdates.totalSessions = 0;
              setTopicsMastered(0);
              updatedProfile = true;
            }
            if (userData.studyTimeToday === undefined) {
              profileUpdates.studyTimeToday = "0h";
              setStudyTimeToday("0h");
              updatedProfile = true;
            }
            if (userData.accuracyRate === undefined) {
              profileUpdates.accuracyRate = 0;
              setAccuracyRate(0);
              updatedProfile = true;
            }
            if (userData.flashcardsHistory === undefined) {
              profileUpdates.flashcardsHistory = [];
              setFlashcardsHistory([]);
              updatedProfile = true;
            }
            if (userData.testHistory === undefined) {
              profileUpdates.testHistory = [];
              setTestHistory([]);
              updatedProfile = true;
            }
            if (userData.flashcards === undefined) {
              profileUpdates.flashcards = [];
              setFlashcards([]);
              updatedProfile = true;
            }

            if (userData.subjects !== undefined && userData.subjects.length > 0) {
              setSubjects(userData.subjects);
              setCurrentStudySubject(userData.subjects[0]);
              setSelectedSubject(userData.subjects[0]);
            } else {
              const defaultSubs = ["Mathematics", "Philosophy", "Computer Science", "Physics", "Chemistry", "World History", "Literature Study"];
              setSubjects(defaultSubs);
              setCurrentStudySubject("Mathematics");
              setSelectedSubject("Mathematics");
              profileUpdates.subjects = defaultSubs;
              updatedProfile = true;
            }

            if (userData.subjectsProgress !== undefined) {
              setSubjectsProgress(userData.subjectsProgress);
            } else {
              const defaultProg = {
                "Mathematics": { chatsCount: 0, quizCount: 0, quizScoreSum: 0, flashcardCount: 0, notebookPageCount: 0, masteryLevel: 0 },
                "Philosophy": { chatsCount: 0, quizCount: 0, quizScoreSum: 0, flashcardCount: 0, notebookPageCount: 0, masteryLevel: 0 },
                "Computer Science": { chatsCount: 0, quizCount: 0, quizScoreSum: 0, flashcardCount: 0, notebookPageCount: 0, masteryLevel: 0 },
                "Physics": { chatsCount: 0, quizCount: 0, quizScoreSum: 0, flashcardCount: 0, notebookPageCount: 0, masteryLevel: 0 },
                "Chemistry": { chatsCount: 0, quizCount: 0, quizScoreSum: 0, flashcardCount: 0, notebookPageCount: 0, masteryLevel: 0 },
                "World History": { chatsCount: 0, quizCount: 0, quizScoreSum: 0, flashcardCount: 0, notebookPageCount: 0, masteryLevel: 0 },
                "Literature Study": { chatsCount: 0, quizCount: 0, quizScoreSum: 0, flashcardCount: 0, notebookPageCount: 0, masteryLevel: 0 }
              };
              setSubjectsProgress(defaultProg);
              profileUpdates.subjectsProgress = defaultProg;
              updatedProfile = true;
            }

            if (updatedProfile) {
              await updateDoc(userDocRef, profileUpdates);
            }

            // LOAD NOTEBOOKS FROM FIRESTORE
            try {
              const q = query(collection(db, "notebooks"), where("userId", "==", user.uid));
              const querySnapshot = await getDocs(q);
              const books: any[] = [];
              querySnapshot.forEach((docRef) => {
                books.push({
                  id: docRef.id,
                  ...docRef.data()
                });
              });
              
              if (books.length > 0) {
                // Keep order by date or default
                setNotebookPages(books.map(b => ({
                  id: b.id,
                  title: b.title || "Untitled Page",
                  lines: b.lines || [],
                  category: b.category || "emerald"
                })));
              } else {
                // Initialize standard notebooks in database for the user so they have real sheets!
                const created = await initializeStarterNotebookPages(user.uid);
                if (created) {
                  setNotebookPages(created);
                } else {
                  setNotebookPages([]);
                }
              }
            } catch (notebookErr) {
              console.error("Error loading notebooks from DB:", notebookErr);
              setNotebookPages([]);
            }

            // LOAD CHAT THREADS FROM SYSTEM DB FOR SEPARATE USERS
            try {
              setIsLoadingThreads(true);
              const chatsQuery = query(collection(db, "chats"), where("userId", "==", user.uid));
              const chatsSnapshot = await getDocs(chatsQuery);
              const threads: ChatThread[] = [];
              chatsSnapshot.forEach((docRef) => {
                const d = docRef.data();
                threads.push({
                  id: docRef.id,
                  title: d.title || "Study Session",
                  createdAt: d.createdAt || new Date().toISOString(),
                  lastMessageAt: d.lastMessageAt || new Date().toISOString(),
                  subject: d.subject,
                  topic: d.topic
                });
              });

              threads.sort((a, b) => new Date(b.lastMessageAt).getTime() - new Date(a.lastMessageAt).getTime());
              setChatThreads(threads);

              if (threads.length > 0) {
                setActiveChatId(threads[0].id);
                try {
                  setIsLoadingMessages(true);
                  const msgSnapshot = await getDocs(query(collection(db, `chats/${threads[0].id}/messages`)));
                  const loadedMsgs: Message[] = [];
                  msgSnapshot.forEach((mRef) => {
                    const m = mRef.data();
                    loadedMsgs.push({
                      id: mRef.id,
                      sender: m.role === "assistant" || m.role === "ai" ? "ai" : "user",
                      text: m.content || "",
                      timestamp: m.timestamp ? new Date(m.timestamp).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }) : new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
                      isTyped: true
                    });
                  });
                  // Sort chronologically using document IDs
                  loadedMsgs.sort((a, b) => a.id.localeCompare(b.id));

                  if (loadedMsgs.length > 0) {
                    setMessages(loadedMsgs);
                  } else {
                    setMessages([defaultWelcomeMessage]);
                  }
                } catch (msgErr) {
                  console.error("Error setting chat messages:", msgErr);
                  setMessages([defaultWelcomeMessage]);
                } finally {
                  setIsLoadingMessages(false);
                }
              } else {
                setActiveChatId(null);
                setMessages([defaultWelcomeMessage]);
              }
            } catch (chatsErr) {
              console.error("Error loading chat sessions:", chatsErr);
              setChatThreads([]);
              setActiveChatId(null);
              setMessages([defaultWelcomeMessage]);
            } finally {
              setIsLoadingThreads(false);
            }

            if (userData.lastResetTime) {
              setLastResetTime(userData.lastResetTime);
              const lastReset = new Date(userData.lastResetTime).getTime();
              const now = new Date().getTime();
              if (now - lastReset >= 24 * 60 * 60 * 1000) {
                // reset daily chat limit
                await updateDoc(userDocRef, {
                  chatsToday: 0,
                  lastResetTime: new Date().toISOString()
                });
                setChatsToday(0);
                setLastResetTime(new Date().toISOString());
              }
            } else {
              const resetIso = new Date().toISOString();
              await updateDoc(userDocRef, { lastResetTime: resetIso });
              setLastResetTime(resetIso);
            }
            
            setEmailDisplay(user.email || "");
            setIsLoggedIn(true);
            setIsCompletingProfile(false);
            setPendingAuthUser(null);
          } else {
            // New register sign-up: complete profile name first!
            setPendingAuthUser(user);
            setIsCompletingProfile(true);
            setIsLoggedIn(false);
          }
        } catch (error: any) {
          const isAppCheckError = error?.message?.includes("app-check") || error?.code?.includes("app-check") || error?.message?.includes("App Check") || error?.message?.includes("permission-denied") || error?.message?.includes("token-is-invalid");
          if (isAppCheckError) {
            console.warn("Firestore initialization App Check or permissions bypass info:", error);
          } else {
            console.error("Firestore initialization error:", error);
          }
          // Fallback settings
          setPendingAuthUser(user);
          setIsCompletingProfile(true);
          setIsLoggedIn(false);
          handleFirestoreError(error, OperationType.GET, "users/" + user.uid);
        }
      } else {
        setIsLoggedIn(false);
        setIsCompletingProfile(false);
        setPendingAuthUser(null);
        // Reset states to default values on logout
        setDisplayName("");
        setEmailDisplay("");
        setStreakCount(0);
        setTopicsMastered(0);
        setStudyTimeToday("0h");
        setAccuracyRate(0);
        setFlashcardsHistory([]);
        setTestHistory([]);
        setFlashcards([]);
        setNotebookPages([]);
        setNotebookPage(1);
      }
      setIsAuthLoading(false);
    });

    return () => unsubscribe();
  }, []);

  // LOAD LOCAL CHAT STATS & FALLBACK BACKUP ON STARTUP FOR GUEST USERS
  useEffect(() => {
    // Wait slightly to make sure Firebase auth initialized and verified if we have a real user
    const checkGuestFallback = setTimeout(() => {
      if (!auth.currentUser) {
        try {
          const savedThreads = localStorage.getItem("lunito_chat_threads_fallback");
          if (savedThreads) {
            const parsedThreads = JSON.parse(savedThreads);
            if (Array.isArray(parsedThreads) && parsedThreads.length > 0) {
              setChatThreads(parsedThreads);
              
              const savedActiveId = localStorage.getItem("lunito_active_chat_id");
              if (savedActiveId && parsedThreads.some((t: any) => t.id === savedActiveId)) {
                setActiveChatId(savedActiveId);
                const savedMsgs = localStorage.getItem(`lunito_msgs_${savedActiveId}`);
                if (savedMsgs) {
                  setMessages(JSON.parse(savedMsgs));
                }
              } else {
                setActiveChatId(parsedThreads[0].id);
                const savedMsgs = localStorage.getItem(`lunito_msgs_${parsedThreads[0].id}`);
                if (savedMsgs) {
                  setMessages(JSON.parse(savedMsgs));
                }
              }
            }
          }
        } catch (err) {
          console.warn("Failed to load local chat fallback database:", err);
        }
      }
    }, 1200);

    return () => clearTimeout(checkGuestFallback);
  }, [isLoggedIn]);

  // SYNC CHANGES TO LOCALSTORAGE BACKUP
  useEffect(() => {
    try {
      if (chatThreads.length > 0) {
        localStorage.setItem("lunito_chat_threads_fallback", JSON.stringify(chatThreads));
      } else {
        localStorage.removeItem("lunito_chat_threads_fallback");
      }
    } catch (e) {
      console.warn("localStorage error writing threads:", e);
    }
  }, [chatThreads]);

  useEffect(() => {
    try {
      if (activeChatId) {
        localStorage.setItem("lunito_active_chat_id", activeChatId);
        if (messages.length > 0) {
          localStorage.setItem(`lunito_msgs_${activeChatId}`, JSON.stringify(messages));
        }
      } else {
        localStorage.removeItem("lunito_active_chat_id");
      }
    } catch (e) {
      console.warn("localStorage error writing messages:", e);
    }
  }, [messages, activeChatId]);

  // Google sign in integration
  const loginWithGoogle = async () => {
    const provider = new GoogleAuthProvider();
    provider.setCustomParameters({
      prompt: 'select_account'
    });
    setAuthError(null);
    try {
      await signInWithPopup(auth, provider);
      triggerNotification("Successfully signed in with Google!", "success");
    } catch (error: any) {
      console.error("Google login critical failure details:", error);
      
      let friendlyMessage = error.message || "Google auth process interrupted.";
      
      // Common error codes in Web preview contexts
      if (error.code === "auth/unauthorized-domain") {
        friendlyMessage = "Domain Unauthorized: Add your preview URLs to Authorized Domains in Firebase console under Auth Settings.";
      } else if (
        error.code === "auth/iframe-start-failed" || 
        error.code === "auth/network-request-failed" ||
        error.message?.includes("iframe")
      ) {
        friendlyMessage = "Iframe Blocked: Open the application in a NEW tab to continue with Google Sign In.";
      } else if (error.code === "auth/popup-blocked") {
        friendlyMessage = "Popup Blocked: Enable popup permissions in your browser bar for Google Authentication.";
      } else if (error.code === "auth/internal-error" || error.message?.toLowerCase().includes("internal") || error.code?.includes("internal")) {
        friendlyMessage = "Firebase Internal Error. Check: 1) Is Google Auth enabled in Firebase Console > Authentication > Sign-in method? 2) Try opening the app in a NEW tab if third-party storage/cookies are blocked.";
      }
      
      setAuthError(`Google Authentication Failed (${error.code || 'internal-error'}): ${friendlyMessage}`);
      triggerNotification(friendlyMessage, "error");
    }
  };

  // Sync user profile progress to database
  const updateFirestoreStats = async (newStreak?: number, newSessions?: number, newAccuracy?: number, newStudyTime?: string) => {
    if (auth.currentUser) {
      const userDocRef = doc(db, "users", auth.currentUser.uid);
      const updates: any = {};
      if (newStreak !== undefined) updates.streak = newStreak;
      if (newSessions !== undefined) updates.totalSessions = newSessions;
      if (newAccuracy !== undefined) updates.accuracyRate = newAccuracy;
      if (newStudyTime !== undefined) updates.studyTimeToday = newStudyTime;
      try {
        await updateDoc(userDocRef, updates);
      } catch (error) {
        console.error("Failed to update user stats in Firestore:", error);
      }
    }
  };

  // Subject Progress & Selection Management Helpers
  const updateSubjectProgress = async (
    subject: string, 
    type: "chat" | "quiz" | "flashcard" | "notebook", 
    quizScore?: number,
    countToAdd: number = 1
  ) => {
    if (!subject) return;
    
    setSubjectsProgress(prev => {
      const current = prev[subject] || {
        chatsCount: 0,
        quizCount: 0,
        quizScoreSum: 0,
        flashcardCount: 0,
        notebookPageCount: 0,
        masteryLevel: 0
      };
      
      const updated = { ...current };
      if (type === "chat") {
        updated.chatsCount += countToAdd;
      } else if (type === "quiz") {
        updated.quizCount += countToAdd;
        if (quizScore !== undefined) {
          updated.quizScoreSum += quizScore * countToAdd;
        }
      } else if (type === "flashcard") {
        updated.flashcardCount += countToAdd;
      } else if (type === "notebook") {
        updated.notebookPageCount += countToAdd;
      }
      
      // Calculate realistic mastery level percentage
      const averageQuizScore = updated.quizCount > 0 ? (updated.quizScoreSum / updated.quizCount) : 0;
      let mastery = 0;
      if (updated.quizCount > 0) {
        const quizContribution = averageQuizScore * 0.7; // 70% of mastery comes from average quiz accuracy
        const activityContribution = Math.min(30, (updated.chatsCount * 4) + (updated.flashcardCount * 5) + (updated.notebookPageCount * 6));
        mastery = Math.round(quizContribution + activityContribution);
      } else {
        // Fallback for activity only
        mastery = Math.round(Math.min(100, (updated.chatsCount * 8) + (updated.flashcardCount * 10) + (updated.notebookPageCount * 12)));
      }
      updated.masteryLevel = Math.max(15, Math.min(100, mastery));

      const nextProg = { ...prev, [subject]: updated };
      
      // Sync to Firestore
      if (auth.currentUser) {
        const userDocRef = doc(db, "users", auth.currentUser.uid);
        updateDoc(userDocRef, { subjectsProgress: nextProg }).catch(err => console.error("Error updating subject progress:", err));
      }
      return nextProg;
    });
  };

  const handleAddCustomSubject = async () => {
    if (!newSubjectToManage.trim()) return;
    const cleanSub = newSubjectToManage.trim();
    if (subjects.includes(cleanSub)) {
      triggerNotification("This subject is already in your curriculum!", "info");
      return;
    }
    
    const nextSubjects = [...subjects, cleanSub];
    const nextProgress = {
      ...subjectsProgress,
      [cleanSub]: {
        chatsCount: 0,
        quizCount: 0,
        quizScoreSum: 0,
        flashcardCount: 0,
        notebookPageCount: 0,
        masteryLevel: 0
      }
    };
    
    setSubjects(nextSubjects);
    setSubjectsProgress(nextProgress);
    setNewSubjectToManage("");
    
    // Select it as current active study subject
    setCurrentStudySubject(cleanSub);
    setSelectedSubject(cleanSub);
    
    // Save to Firestore database if user is logged in
    if (auth.currentUser) {
      const userDocRef = doc(db, "users", auth.currentUser.uid);
      try {
        await updateDoc(userDocRef, {
          subjects: nextSubjects,
          subjectsProgress: nextProgress
        });
        triggerNotification(`Added "${cleanSub}" to your curriculum!`, "success");
      } catch (err) {
        console.error("Failed to add subject in Firestore:", err);
      }
    } else {
      triggerNotification(`Added "${cleanSub}" locally!`, "success");
    }
  };

  const renderSubjectGate = (featureName: string) => {
    return (
      <motion.div 
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        className="p-8 rounded-2xl bg-[#09090e] border border-violet-500/15 max-w-sm mx-auto text-center space-y-6 my-10 shadow-xl shadow-black/80 relative overflow-hidden"
      >
        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-violet-600 to-indigo-500" />
        <div className="w-14 h-14 mx-auto bg-violet-600/10 rounded-2xl flex items-center justify-center text-violet-400 border border-violet-500/20">
          <Brain className="w-7 h-7 animate-pulse" />
        </div>
        <div>
          <h3 className="text-base font-bold text-white font-display">Target Study Subject Required</h3>
          <p className="text-xs text-zinc-405 mt-2 max-w-xs mx-auto leading-relaxed font-sans">
            Please select an academic subject from your curriculum to explore with the Socratic <strong>{featureName}</strong> helper.
          </p>
        </div>

        <div className="space-y-3 text-left font-sans">
          <label className="block text-[10px] font-bold text-zinc-400 uppercase tracking-widest font-mono">Select Active focus</label>
          <div className="grid grid-cols-1 gap-1.5">
            {subjects.map((sub, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => {
                  setCurrentStudySubject(sub);
                  setSelectedSubject(sub);
                  triggerNotification(`Focus subject set to: ${sub}`, "success");
                }}
                className="p-3 bg-zinc-950 hover:bg-violet-600/10 hover:border-violet-550/30 text-xs text-white font-semibold rounded-xl text-left border border-white/5 transition-all flex items-center justify-between group cursor-pointer"
              >
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-violet-500 group-hover:scale-125 transition-transform" />
                  <span>{sub}</span>
                </div>
                <span className="text-[9px] text-zinc-500 font-mono">mastery: {(subjectsProgress[sub]?.masteryLevel || 0)}%</span>
              </button>
            ))}
          </div>
        </div>

        <div className="text-[10px] text-zinc-500 pt-1 font-mono font-sans">
          Can't find your subject? Add new ones from your Home Dashboard.
        </div>
      </motion.div>
    );
  };

  // Sync histories and cards to Firestore
  const saveUserHistoriesToFirestore = async (
    nextFlashcardHistory?: any[],
    nextTestHistory?: any[],
    nextFlashcards?: any[]
  ) => {
    if (auth.currentUser) {
      const userDocRef = doc(db, "users", auth.currentUser.uid);
      const updates: any = {};
      if (nextFlashcardHistory !== undefined) updates.flashcardsHistory = nextFlashcardHistory;
      if (nextTestHistory !== undefined) updates.testHistory = nextTestHistory;
      if (nextFlashcards !== undefined) updates.flashcards = nextFlashcards;
      try {
        await updateDoc(userDocRef, updates);
      } catch (err) {
        console.error("Failed to sync histories to Firestore:", err);
      }
    }
  };

  // Helper to persist/save notebook pages
  const handleSaveOrUpdateNotebookPage = async (pageIdx: number, title: string, lines: string[], category: string) => {
    if (!auth.currentUser) return null;
    try {
      const page = notebookPages[pageIdx];
      if (page && page.id) {
        const docRef = doc(db, "notebooks", page.id);
        await updateDoc(docRef, {
          title,
          lines,
          category,
          updatedAt: new Date().toISOString()
        });
        return page.id;
      } else {
        const docRef = await addDoc(collection(db, "notebooks"), {
          userId: auth.currentUser.uid,
          title,
          lines,
          category,
          createdAt: new Date().toISOString()
        });
        return docRef.id;
      }
    } catch (err) {
      console.error("Error saving notebook page to Firestore:", err);
      return null;
    }
  };

  // Initialize notebooks on-demand in Firebase for new logged-in/guest user
  const initializeStarterNotebookPages = async (userId: string) => {
    const starterPages = [
      {
        userId,
        title: "Blank Study Sheet",
        lines: [],
        category: "zinc",
        createdAt: new Date().toISOString()
      }
    ];

    const createdPages: any[] = [];
    try {
      for (const page of starterPages) {
        const docRef = await addDoc(collection(db, "notebooks"), page);
        createdPages.push({
          id: docRef.id,
          title: page.title,
          lines: page.lines,
          category: page.category
        });
      }
      return createdPages;
    } catch (err) {
      console.error("Error creating starter pages in Firestore:", err);
      return null;
    }
  };

  // Secure guest login flow via real persistent credentials with fallback
  const handleGuestSecureLogin = async () => {
    setIsAuthLoading(true);
    const guestEmail = "guest@lunito.edu";
    const guestPassword = "otp_pwd_guestlunitoedu_safe_auth";
    try {
      await signInWithEmailAndPassword(auth, guestEmail, guestPassword);
      triggerNotification("Secured full access as Educator Guest!", "success");
    } catch (err: any) {
      if (err.code === "auth/user-not-found" || err.code === "auth/invalid-credential" || err.code === "auth/cannot-find-user") {
        try {
          await createUserWithEmailAndPassword(auth, guestEmail, guestPassword);
          if (auth.currentUser) {
            const userDocRef = doc(db, "users", auth.currentUser.uid);
            await setDoc(userDocRef, {
              uid: auth.currentUser.uid,
              email: guestEmail,
              displayName: "Educator Guest",
              plan: "pro",
              streak: 12,
              totalSessions: 18,
              studyTimeToday: "2.5h",
              accuracyRate: 84,
              chatsToday: 0,
              lastResetTime: new Date().toISOString(),
              lastActive: new Date().toISOString(),
              testHistory: [
                { id: "h2", topic: "Socratic Method Basics", subject: "Philosophy", date: "Tuned", score: "Demo" }
              ],
              flashcardsHistory: [
                { id: "h1", topic: "Quadratic Equations", subject: "Mathematics", date: "Initial Block", count: 4 }
              ],
              flashcards: []
            });
          }
          triggerNotification("Educator Guest Sandbox initialized!", "success");
        } catch (createErr: any) {
          console.warn("Failed to register guest (likely due to App Check):", createErr);
          // graceful fallback
          setIsLoggedIn(true);
          setIsGuestBypass(true);
          setDisplayName("Educator Guest");
          setEmailDisplay(guestEmail);
          setStreakCount(12);
          setTopicsMastered(18);
          setStudyTimeToday("2.5h");
          setAccuracyRate(84);
          setActiveTab("dashboard");
          triggerNotification("Authorized locally via sandbox bypass.", "success");
        }
      } else {
        const isAppCheckErr = err.code?.includes("app-check") || err.message?.includes("app-check") || err.message?.includes("App Check") || err.message?.includes("token-is-invalid");
        if (isAppCheckErr) {
          console.warn("Active App Check configuration detected. Accessing sandbox locally:", err);
        } else {
          console.warn("Guest access info, falling back locally:", err);
        }
        // fallback
        setIsLoggedIn(true);
        setIsGuestBypass(true);
        setDisplayName("Educator Guest");
        setEmailDisplay(guestEmail);
        setStreakCount(12);
        setTopicsMastered(18);
        setStudyTimeToday("2.5h");
        setAccuracyRate(84);
        setActiveTab("dashboard");
        if (isAppCheckErr) {
          triggerNotification("Authorized locally via Sandbox App Check Bypass.", "success");
        }
      }
    } finally {
      setIsAuthLoading(false);
    }
  };

  // Format countdown
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs < 10 ? "0" : ""}${secs}`;
  };

  // Helper to append global screen status notifications
  const triggerNotification = (message: string, type: "success" | "error" | "info" = "info") => {
    const id = Date.now().toString();
    setNotifications(prev => [...prev, { id, message, type }]);
    setTimeout(() => {
      setNotifications(prev => prev.filter(n => n.id !== id));
    }, 4000);
  };

  // Web Speech API / TTS states & helper for aloud Socratic guidance
  const [speechState, setSpeechState] = useState<{ msgId: string | null; isPlaying: boolean }>({ msgId: null, isPlaying: false });

  const handleSpeak = (text: string, msgId: string) => {
    if (typeof window === "undefined" || !window.speechSynthesis) {
      triggerNotification("Web Speech API is not supported in this browser.", "error");
      return;
    }

    if (speechState.msgId === msgId && speechState.isPlaying) {
      window.speechSynthesis.cancel();
      setSpeechState({ msgId: null, isPlaying: false });
      return;
    }

    window.speechSynthesis.cancel();

    // Clean up Markdown formatting, list symbols, code snippets, math formulas for clear narration
    const cleanText = text
      .replace(/```[\s\S]*?```/g, "") // remove code blocks
      .replace(/`([^`]+)`/g, "$1")     // remove inline code formatting
      .replace(/[*#_~>]/g, "")         // remove markdown symbols
      .replace(/\$\$.*?\$\$/g, "")     // remove block math equations
      .replace(/\$.*?\$/g, "")         // remove inline math
      .trim();

    if (!cleanText) {
      triggerNotification("Nothing readable found in this message.", "info");
      return;
    }

    const utterance = new SpeechSynthesisUtterance(cleanText);

    // Prioritize high quality English pitch/voices if available in speech list
    const voices = window.speechSynthesis.getVoices();
    const optimalVoice = voices.find(v => v.lang.startsWith("en") && !v.name.includes("Google") && !v.name.includes("Microsoft")) || 
                          voices.find(v => v.lang.startsWith("en"));
    if (optimalVoice) {
      utterance.voice = optimalVoice;
    }

    utterance.onend = () => {
      setSpeechState({ msgId: null, isPlaying: false });
    };
    utterance.onerror = () => {
      setSpeechState({ msgId: null, isPlaying: false });
    };

    setSpeechState({ msgId, isPlaying: true });
    window.speechSynthesis.speak(utterance);
  };

  // Cancel spoken audio playback automatically on tab switches
  useEffect(() => {
    if (typeof window !== "undefined" && window.speechSynthesis) {
      window.speechSynthesis.cancel();
      setSpeechState({ msgId: null, isPlaying: false });
    }
  }, [activeTab]);

  // CASHFREE REDIRECT VERIFICATION HANDLER HOOK
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const cashfreeOrderId = params.get("cashfree_order_id");
    const selectedPlan = params.get("plan") as "free" | "pro" | "elite" | null;

    if (cashfreeOrderId && selectedPlan) {
      const verifyAndUpgrade = async () => {
        setIsProcessingPayment(true);
        triggerNotification("🔄 Verifying Cashfree transaction... Please wait.", "info");

        try {
          const res = await safeFetch("/api/payment/cashfree-verify", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ order_id: cashfreeOrderId })
          });

          if (res.ok) {
            const data = await res.json();
            if (data.status === "success") {
              const applyUpgrade = async (currentUser: any) => {
                if (currentUser) {
                  const userDocRef = doc(db, "users", currentUser.uid);
                  try {
                    await updateDoc(userDocRef, { plan: selectedPlan });
                  } catch (dbErr) {
                    console.error("Database update failed during Cashfree upgrade:", dbErr);
                  }
                }
                setPlan(selectedPlan);
                triggerNotification(`🎉 Dynamic Upgrade to ${selectedPlan.toUpperCase()} was successful!`, "success");
                confetti({
                  particleCount: 160,
                  spread: 90,
                  origin: { y: 0.6 }
                });
                window.history.replaceState({}, document.title, window.location.pathname);
              };

              if (auth.currentUser) {
                await applyUpgrade(auth.currentUser);
              } else {
                const unsub = onAuthStateChanged(auth, async (user) => {
                  if (user) {
                    await applyUpgrade(user);
                    unsub();
                  }
                });
              }
            } else {
              triggerNotification(data.error || "Cashfree payment verification unsuccessful.", "error");
              window.history.replaceState({}, document.title, window.location.pathname);
            }
          } else {
            triggerNotification("Verification server response failed.", "error");
            window.history.replaceState({}, document.title, window.location.pathname);
          }
        } catch (err) {
          console.error("Cashfree verification hook error:", err);
          triggerNotification("Verify error, fallback to safety check.", "error");
        } finally {
          setIsProcessingPayment(false);
        }
      };

      verifyAndUpgrade();
    }
  }, []);

  // OTP form digit step flow helper
  const handleOtpChange = (val: string, index: number) => {
    const newOtp = [...otpArray];
    newOtp[index] = val.slice(-1);
    setOtpArray(newOtp);

    if (val && index < 5) {
      otpRefs[index + 1].current?.focus();
    }
  };

  const handleOtpKeyDown = (e: React.KeyboardEvent<HTMLInputElement>, index: number) => {
    if (e.key === "Backspace" && !otpArray[index] && index > 0) {
      otpRefs[index - 1].current?.focus();
    }
  };

  // Trigger simulated OTP showing strictly only the raw code
  const sendOTP = () => {
    if (!emailInput.trim()) {
      triggerNotification("Please enter an email address", "error");
      return;
    }
    const code = Math.floor(100000 + Math.random() * 900000).toString();
    setGeneratedOtp(code);
    setIsOtpMode(true);
    triggerNotification(code, "success");
    console.log(`[LUNITO Authentication Service] Generated Verification OTP: ${code}`);
  };

  // Confirm verification code and login to Firebase Auth
  const verifyOTP = async () => {
    const entered = otpArray.join("");
    setAuthError(null);
    if (entered === generatedOtp && generatedOtp !== "") {
      const emailLower = emailInput.toLowerCase().trim();
      const derivedPassword = "otp_pwd_" + emailLower.replace(/[^a-z0-9]/g, "") + "_safe_auth";

      try {
        await signInWithEmailAndPassword(auth, emailLower, derivedPassword);
      } catch (authError: any) {
        console.warn("OTP login catch block triggered:", authError);
        const isAppCheckError = authError?.message?.includes("app-check") || authError?.code?.includes("app-check") || authError?.message?.includes("App Check");
        if (isAppCheckError) {
          console.warn("App Check block detected during sign-in. Automatically falling back to local sandbox guest flow...");
          setIsLoggedIn(true);
          setIsGuestBypass(true);
          setDisplayName("Educator Guest");
          setEmailDisplay(emailLower);
          setStreakCount(12);
          setTopicsMastered(18);
          setActiveTab("dashboard");
          triggerNotification("Authorized via sandbox bypass. Disabling App Check in Firebase Console is recommended.", "success");
          return;
        }

        if (
          authError.code === "auth/user-not-found" || 
          authError.code === "auth/invalid-credential" || 
          authError.code === "auth/cannot-find-user"
        ) {
          try {
            await createUserWithEmailAndPassword(auth, emailLower, derivedPassword);
          } catch (createError: any) {
            console.error("OTP user creation failed:", createError);
            const isAppCheckCreateError = createError?.message?.includes("app-check") || createError?.code?.includes("app-check") || createError?.message?.includes("App Check");
            if (isAppCheckCreateError) {
              console.warn("App Check block detected during sign-up. Automatically falling back to local sandbox guest flow...");
              setIsLoggedIn(true);
              setIsGuestBypass(true);
              setDisplayName("Educator Guest");
              setEmailDisplay(emailLower);
              setStreakCount(12);
              setTopicsMastered(18);
              setActiveTab("dashboard");
              triggerNotification("Authorized via sandbox bypass. Disabling App Check in Firebase Console is recommended.", "success");
              return;
            }
            let friendlyMsg = createError.message || "Account registration failed.";
            if (createError.code === "auth/operation-not-allowed") {
              friendlyMsg = "Email Auth Disabled: Go to Firebase Console > Authentication > Sign-in method, edit 'Email/Password' and set to Enabled, then Save.";
            }
            setAuthError(`Email Authentication Failed: ${friendlyMsg}`);
            triggerNotification(friendlyMsg, "error");
            return;
          }
        } else {
          let friendlyMsg = authError.message || "Authentication failed.";
          if (authError.code === "auth/operation-not-allowed") {
            friendlyMsg = "Email Auth Disabled: Go to Firebase Console > Authentication > Sign-in method, edit 'Email/Password' and set to Enabled, then Save.";
          }
          setAuthError(`Email Authentication Failed: ${friendlyMsg}`);
          triggerNotification(friendlyMsg, "error");
          return;
        }
      }

      setIsLoggedIn(true);
      setActiveTab("dashboard");
      triggerNotification("Successfully authenticated!", "success");
    } else {
      triggerNotification("Incorrect verification code.", "error");
    }
  };

  const logout = async () => {
    try {
      await signOut(auth);
      setIsLoggedIn(false);
      setIsOtpMode(false);
      setOtpArray(["", "", "", "", "", ""]);
      setGeneratedOtp("");
      setEmailInput("");
      setIsGuestBypass(false);
      setPlan("free");
      setChatsToday(0);
      setLastResetTime("");
      setIsCompletingProfile(false);
      setCompleteProfileName("");
      setPendingAuthUser(null);
      setChatThreads([]);
      setActiveChatId(null);
      setMessages([defaultWelcomeMessage]);
      triggerNotification("Logged out safely.", "info");
    } catch (e: any) {
      console.error("Logout error:", e);
    }
  };

  const markMessageAsTyped = (messageId: string) => {
    setMessages(prev => prev.map(m => m.id === messageId ? { ...m, isTyped: true } : m));
  };

  const markTestMessageAsTyped = (messageId: string) => {
    setTestMessages(prev => prev.map(m => m.id === messageId ? { ...m, isTyped: true } : m));
  };

  const markFlashcardMessageAsTyped = (messageId: string) => {
    setFlashcardMessages(prev => prev.map(m => m.id === messageId ? { ...m, isTyped: true } : m));
  };

  // Load messages for a thread
  const loadChatMessages = async (threadId: string) => {
    setIsLoadingMessages(true);
    try {
      const msgQuery = collection(db, `chats/${threadId}/messages`);
      const msgSnapshot = await getDocs(query(msgQuery));
      const loadedMsgs: Message[] = [];
      msgSnapshot.forEach((mRef) => {
        const m = mRef.data();
        loadedMsgs.push({
          id: mRef.id,
          sender: m.role === "assistant" || m.role === "ai" ? "ai" : "user",
          text: m.content || "",
          timestamp: m.timestamp ? new Date(m.timestamp).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }) : new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
          isTyped: true,
          sources: m.sources || []
        });
      });
      loadedMsgs.sort((a, b) => a.id.localeCompare(b.id));
      if (loadedMsgs.length > 0) {
        setMessages(loadedMsgs);
      } else {
        setMessages([defaultWelcomeMessage]);
      }
      setActiveChatId(threadId);
    } catch (err) {
      console.error("Error loading chat messages:", err);
      setMessages([defaultWelcomeMessage]);
    } finally {
      setIsLoadingMessages(false);
    }
  };

  // Start a fresh, clean chat thread session
  const startNewChatThread = () => {
    setActiveChatId(null);
    const welcomeMsg: Message = {
      id: "welcome-fresh-" + Date.now(),
      sender: "ai",
      text: `Hi there! 👋 I'm **LUNITO**, your personal Socratic AI tutor. I am ready to teach you about **${chatSubject}**. What concept or question are we exploring today?`,
      timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
      isTyped: true
    };
    setMessages([welcomeMsg]);
    triggerNotification("Started fresh learning session! Ask anything, Lunito will remember.", "success");
  };

  // Delete a study session and all its messages
  const deleteChatSession = async (threadId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!confirm("Are you sure you want to permanently delete this study session and its entire history?")) return;

    try {
      if (auth.currentUser) {
        await deleteDoc(doc(db, "chats", threadId));
      }
    } catch (err) {
      console.warn("Skipping remote collection cleanup, removing locally:", err);
    }

    try {
      setChatThreads(prev => prev.filter(t => t.id !== threadId));
      localStorage.removeItem(`lunito_msgs_${threadId}`);
      
      if (activeChatId === threadId) {
        setActiveChatId(null);
        setMessages([defaultWelcomeMessage]);
      }
      triggerNotification("Study session deleted successfully.", "success");
    } catch (err) {
      console.error("Error deleting session:", err);
      triggerNotification("Failed to delete study session.", "error");
    }
  };

  // Socratic Response engine matching the backend AI models proxy
  const handleSendMessage = async () => {
    if (!chatInput.trim() && !attachedFile) return;
    if (!chatInput.trim() && attachedFile) {
      triggerNotification("Please type a question or instruction to let LUNITO know what to solve in the attached file!", "info");
      return;
    }

    const userText = chatInput;
    const currentAttachment = attachedFile;

    // Intercept "make notes of [subject topic]" to generate beautiful handwritten notes on notebook pages
    const notesMatch = userText.match(/(?:make|create|write|generate|prepare)\s+notes\s+(?:of|on|about|for|\s+)?\s*(.+)/i);
    if (notesMatch) {
      if (checkChatLimitExceeded(false, true)) {
        return;
      }
      const topicPart = notesMatch[1].trim();
      let matchedSubject = currentStudySubject || chatSubject || "Mathematics";
      
      const lowerTopic = topicPart.toLowerCase();
      const standardSubjects = ["Mathematics", "Philosophy", "Computer Science", "Physics", "Chemistry", "World History", "Literature Study"];
      for (const sub of standardSubjects) {
        if (lowerTopic.includes(sub.toLowerCase())) {
          matchedSubject = sub;
          break;
        }
      }

      setChatInput("");
      setAttachedFile(null);
      setIsAiTyping(false);
      setIsNotebookAiTyping(true);
      setActiveTab("notebook");
      setCurrentStudySubject(matchedSubject);
      setNotebookSubject(matchedSubject);
      setSelectedTopic(topicPart);
      setNotebookPage(1); // Reset page pointer to start page or create a new leaf

      const timestamp = new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
      const userTextWithAttachmentInfo = currentAttachment 
        ? `📎 Attached File: **${currentAttachment.name}**\nRegarding Notebook: make notes of ${topicPart}`
        : `Regarding Notebook: make notes of ${topicPart}`;

      const newUserMsg: Message = { id: `u-${Date.now()}`, sender: "user", text: userTextWithAttachmentInfo, timestamp };
      setMessages(prev => [...prev, newUserMsg]);

      // Focus notebook view and scroll discussion log
      setTimeout(() => chatBottomRef.current?.scrollIntoView({ behavior: "smooth" }), 80);

      triggerNotification(`🖋️ Switching to Notebook. LUNITO is writing study notes on "${topicPart}"...`, "success");

      try {
        const response = await safeFetch("/api/chat", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            messages: [{ role: "user", content: `Please compose highly detailed, beautiful academic study notes about the topic: "${topicPart}". Use structured subsections with clear bullet points. Avoid preamble or conversing.` }],
            userId: auth.currentUser?.uid || displayName || "student",
            plan: "pro",
            subject: matchedSubject,
            topic: topicPart,
            mode: "notebook",
            attachment: currentAttachment ? {
              name: currentAttachment.name,
              type: currentAttachment.type,
              data: currentAttachment.base64Content
            } : null
          })
        });

        const data = await response.json();
        if (response.ok && data.content) {
          setMessages(prev => [
            ...prev,
            { id: `ai-nb-notes-${Date.now()}`, sender: "ai", text: `I have compiled Handwritten Study Notes on **${topicPart}** in your Socratic Notebook!`, timestamp }
          ]);
          addSolverSolutionToNotebook(userText, data.content);
          await registerChatSent();
        } else {
          throw new Error(data.error || "Response not formatted or server failed");
        }
      } catch (err: any) {
        console.error("Auto notes generation failed, using local fallback model:", err);
        const fallbackText = `Handwritten Study Notes: ${topicPart}
• Core Concept and Overview of ${topicPart}
• Essential Equations and Theoretical Framework
• Practical Case Studies & Analytical applications
• Step-by-Step Problem Solving & Real-world practice
✓ Hand-written document compile complete. Check study leaves!`;
        addSolverSolutionToNotebook(userText, fallbackText);
      } finally {
        setIsNotebookAiTyping(false);
      }
      return; // Exit early safely
    }

    if (checkChatLimitExceeded(false, true)) {
      return;
    }

    let textToSendToAI = userText;
    let userTextWithAttachmentInfo = userText;

    if (attachedFile) {
      const isImg = attachedFile.type.startsWith("image/") || attachedFile.name.endsWith(".png") || attachedFile.name.endsWith(".jpg") || attachedFile.name.endsWith(".jpeg");
      const icon = isImg ? "📸" : "📄";
      userTextWithAttachmentInfo = `${icon} Attached: **${attachedFile.name}**\n\n${userText}`;
      textToSendToAI = `[User attached file: ${attachedFile.name} (${attachedFile.type || "unknown"})] ${userText}`;
    }

    const timestamp = new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
    const newUserMsg: Message = { id: `u-${Date.now()}`, sender: "user", text: userTextWithAttachmentInfo, timestamp };

    const previousMessages = [...messages];
    setMessages(prev => [...prev, newUserMsg]);
    setChatInput("");
    setAttachedFile(null); // Clear attached file once sent
    setIsAiTyping(true);

    // Scroll chat bottom
    setTimeout(() => chatBottomRef.current?.scrollIntoView({ behavior: "smooth" }), 80);

    let currentThreadId = activeChatId;
    const currentUserId = auth.currentUser?.uid;

    // 1. Auto-spawn new chat thread if activeChatId is null
    if (!currentThreadId) {
      const promptSnippet = userText.trim();
      const shortTitle = promptSnippet.length > 25 ? promptSnippet.substring(0, 25) + "..." : promptSnippet;
      const sub = chatSubject === "Custom Subject" ? (chatCustomSubject.trim() || "Custom Subject") : chatSubject;
      const top = selectedTopic || "General Topic";

      const newChatData = {
        title: `${sub}: "${shortTitle}"`,
        createdAt: new Date().toISOString(),
        lastMessageAt: new Date().toISOString(),
        subject: sub,
        topic: top
      };

      if (currentUserId) {
        try {
          const chatRef = await addDoc(collection(db, "chats"), { ...newChatData, userId: currentUserId });
          currentThreadId = chatRef.id;

          const newThreadListItem: ChatThread = {
            id: chatRef.id,
            ...newChatData
          };
          setChatThreads(prev => [newThreadListItem, ...prev]);
          setActiveChatId(chatRef.id);

          // Save fallback or initial welcome message to database thread message collection
          const welcomeToSave = previousMessages[0] || defaultWelcomeMessage;
          await addDoc(collection(db, `chats/${chatRef.id}/messages`), {
            role: "assistant",
            content: welcomeToSave.text,
            timestamp: new Date().toISOString()
          });
        } catch (dbErr) {
          console.error("Error creating chat thread session:", dbErr);
        }
      } else {
        // Guest mode creation
        const guestThreadId = "guest_thread_" + Date.now();
        currentThreadId = guestThreadId;
        const newThreadListItem: ChatThread = {
          id: guestThreadId,
          ...newChatData
        };
        setChatThreads(prev => [newThreadListItem, ...prev]);
        setActiveChatId(guestThreadId);
      }
    }

    // 2. Persist the new user message to the thread subcollection
    if (currentThreadId && currentUserId) {
      try {
        await addDoc(collection(db, `chats/${currentThreadId}/messages`), {
          role: "user",
          content: textToSendToAI,
          timestamp: new Date().toISOString()
        });
      } catch (dbErr) {
        console.error("Failed to save user message to thread:", dbErr);
      }
    }

    // 3. Assemble full multi-turn chat history context payload for backend
    const historyPayload = previousMessages.map(m => ({
      role: m.sender === "ai" ? "assistant" : "user",
      content: m.text
    }));
    historyPayload.push({
      role: "user",
      content: textToSendToAI
    });

    try {
      console.log(`[Client] Socratic Mode active with memory. Sending multi-turn request with history length ${historyPayload.length} to /api/chat.`);
      const response = await safeFetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: historyPayload,
          userId: currentUserId || displayName,
          plan: plan || "free",
          subject: chatSubject === "Custom Subject" ? (chatCustomSubject.trim() || "Custom Subject") : chatSubject,
          topic: selectedTopic,
          mode: "socratic",
          thinkWithMe: thinkWithMeActive,
          connectedResource: connectedResource,
          userMood: userMood,
          tutorTone: tutorTone,
          weakAreas: diagnosedWeakAreas,
          attachment: currentAttachment ? {
            name: currentAttachment.name,
            type: currentAttachment.type,
            data: currentAttachment.base64Content
          } : null
        })
      });

      let data: any = {};
      try {
        const contentType = response.headers.get("content-type");
        if (contentType && contentType.includes("application/json")) {
          data = await response.json();
        } else {
          const rawText = await response.text();
          console.error("[Client] Non-JSON response received:", rawText);
          throw new Error("Server returned non-JSON page during chat.");
        }
      } catch (parseErr: any) {
        console.error("[Client] App chat JSON Parsing failed:", parseErr);
        throw new Error("Socratic servers are currently under load. Failsafe local lessons are being loaded.");
      }

      if (response.ok && data.content) {
        setMessages(prev => [
          ...prev, 
          { id: `ai-${Date.now()}`, sender: "ai", text: data.content, timestamp, sources: data.sources || [] }
        ]);

        // Save AI reply and update sorting timestamp
        if (currentThreadId && currentUserId) {
          try {
            await addDoc(collection(db, `chats/${currentThreadId}/messages`), {
              role: "assistant",
              content: data.content,
              sources: data.sources || [],
              timestamp: new Date().toISOString()
            });

            await updateDoc(doc(db, "chats", currentThreadId), {
              lastMessageAt: new Date().toISOString()
            });

            setChatThreads(prev => {
              const updated = prev.map(t => t.id === currentThreadId ? { ...t, lastMessageAt: new Date().toISOString() } : t);
              return updated.sort((a, b) => new Date(b.lastMessageAt).getTime() - new Date(a.lastMessageAt).getTime());
            });
          } catch (dbErr) {
            console.error("Failed to save AI reply to thread database:", dbErr);
          }
        }

        // Write the dynamic solution to the notebook!
        addSolverSolutionToNotebook(userText, data.content);
        await registerChatSent();
      } else {
        throw new Error(data.error || "Failed custom response");
      }
    } catch (err: any) {
      // Graceful fallback with full interactive Socratic responses
      const lower = userText.toLowerCase();
      let fallbackText = "That's a thoughtful question. In traditional Socratic exploration, how might we break this down into smaller, simpler components? What is your starting hypothesis?";
      
      if (lower.includes("quadratic") || lower.includes("solve") || lower.includes("factor")) {
        fallbackText = "Splendid algebraic question! Let's explore **x² - 5x + 6 = 0** step-by-step together. \n\n1. First, we identify coefficients where *a = 1, b = -5, c = 6*.\n2. We look for two integers that multiply to give 6 and add together to give -5. What might those two values be?";
      } else if (lower.includes("explain") || lower.includes("simpler")) {
        fallbackText = "Let me break that down simpler! 🎯 Think of it as a balance scale. Whatever we execute on one side, we must perform on the other to maintain absolute parity! Does that mental model make intuitive sense?";
      } else if (lower.includes("derivative") || lower.includes("3x")) {
        fallbackText = "Ah, derivatives! Let's examine the power rule where $\\frac{d}{dx}[x^n] = n \\cdot x^{n-1}$. For the equation $3x^2 + 5x - 2$:\n- The derivative of $3x^2$ is $6x$\n- The derivative of $5x$ is $5$\n- The derivative of constant $-2$ is $0$\n\nHence, we obtain **6x + 5**! Try solving the derivative of $4x^3$ under this same logic!";
      }

      setMessages(prev => [
        ...prev, 
        { id: `ai-${Date.now()}`, sender: "ai", text: fallbackText, timestamp }
      ]);

      if (currentThreadId && currentUserId) {
        try {
          await addDoc(collection(db, `chats/${currentThreadId}/messages`), {
            role: "assistant",
            content: fallbackText,
            timestamp: new Date().toISOString()
          });

          await updateDoc(doc(db, "chats", currentThreadId), {
            lastMessageAt: new Date().toISOString()
          });

          setChatThreads(prev => {
            const updated = prev.map(t => t.id === currentThreadId ? { ...t, lastMessageAt: new Date().toISOString() } : t);
            return updated.sort((a, b) => new Date(b.lastMessageAt).getTime() - new Date(a.lastMessageAt).getTime());
          });
        } catch (dbErr) {
          console.error("Failed to save fallback AI reply to thread database:", dbErr);
        }
      }

      // Write fallback solution to notebook!
      addSolverSolutionToNotebook(userText, fallbackText);
    } finally {
      setIsAiTyping(false);
      setTimeout(() => chatBottomRef.current?.scrollIntoView({ behavior: "smooth" }), 80);
    }
  };

  // Quick Action triggers from the buttons bar
  const triggerQuickAction = (action: string) => {
    if (action === "explain") {
      setChatInput("Can you explain the quadratic formula simpler using real-world terms?");
    } else if (action === "notebook") {
      setActiveTab("notebook");
      triggerNotification("Opened step-by-step solved page", "info");
    } else if (action === "test") {
      setActiveTab("test");
      triggerNotification("Transitioned to Socratic Assessment portal", "info");
    } else if (action === "flashcards") {
      setActiveTab("flashcards");
      triggerNotification("Opened flash revision cards", "info");
    }
  };

  // Real mock image generator camera simulation
  const openCameraGallery = (medium: "gallery" | "camera") => {
    if (medium === "gallery") {
      triggerNotification("Opening system gallery... Select homework image or file to parse.", "info");
      const fakeInput = document.createElement("input");
      fakeInput.type = "file";
      fakeInput.accept = "image/*,application/pdf,text/*";
      fakeInput.onchange = (e) => {
        const file = (e.target as HTMLInputElement).files?.[0];
        if (file) {
          const reader = new FileReader();
          reader.onload = () => {
            const result = reader.result as string;
            setAttachedFile({
              name: file.name,
              type: file.type,
              base64Content: result
            });
            triggerNotification(`Selected "${file.name}"! Add your question/query below and hit send.`, "success");
          };
          reader.onerror = () => {
            triggerNotification("Failed to read selection file.", "error");
          };
          reader.readAsDataURL(file);
        }
      };
      fakeInput.click();
    } else {
      triggerNotification("Capturing simulated camera snapshot...", "info");
      setTimeout(() => {
        // Red pixel base64 PNG
        setAttachedFile({
          name: "camera_snapshot.png",
          type: "image/png",
          base64Content: "data:image/png;base64,iVBOR0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg=="
        });
        triggerNotification("Snapshot captured successfully! Add your question/query below and hit send.", "success");
      }, 700);
    }
  };

  // Flashcards flip state tracker
  const toggleCardFlip = (cardId: string) => {
    setFlippedCards(prev => ({
      ...prev,
      [cardId]: !prev[cardId]
    }));
  };

  // Creating custom flashcard
  const addFlashcard = () => {
    if (!newCardQuestion.trim() || !newCardAnswer.trim()) {
      triggerNotification("Please fill out both the card front and back", "error");
      return;
    }
    const cardCategory = currentStudySubject || selectedSubject || "General Study";
    const newCard: Flashcard = {
      id: Date.now().toString(),
      category: cardCategory,
      front: newCardQuestion,
      back: newCardAnswer
    };
    setFlashcards(prev => {
      const next = [newCard, ...prev];
      saveUserHistoriesToFirestore(undefined, undefined, next);
      return next;
    });

    // Increment progress counter for the matched academic subject
    updateSubjectProgress(cardCategory, "flashcard", undefined, 1);

    setNewCardQuestion("");
    setNewCardAnswer("");
    setIsCreatingFlashcard(false);
    triggerNotification("Custom flashcard added to study deck!", "success");
  };

  // Socratic assessment Quiz list
  const DEFAULT_QUIZ_QUESTIONS = [
    {
      question: "What is the derivative of f(x) = 3x² + 5x - 2?",
      options: [
        { key: "A", text: "6x + 5" },
        { key: "B", text: "3x + 5" },
        { key: "C", text: "6x² + 5x" },
        { key: "D", text: "3x² + 5" }
      ],
      correct: "A",
      explanation: "Using the power rule, the exponent 2 is multiplied by the coefficient 3, reducing the power by 1. Linear 5x derivative is 5, while constant -2 is 0."
    },
    {
      question: "Which formula represents Euler's magnificent link between fundamentals?",
      options: [
        { key: "A", text: "e^(iπ) - 1 = 0" },
        { key: "B", text: "e^(iπ) + 1 = 0" },
        { key: "C", text: "sin²(x) + cos²(x) = 1" },
        { key: "D", text: "f(a) + f'(a)(x-a) = y" }
      ],
      correct: "B",
      explanation: "Euler's Identity elements e, i, pi, 1, and 0 in a single structural equation: e^(iπ) + 1 = 0."
    }
  ];

  const [quizQuestions, setQuizQuestions] = useState<any[]>([]);

  const generateQuizFromAI = async (subject: string = selectedSubject, topic: string = selectedTopic) => {
    setIsGeneratingQuiz(true);
    triggerNotification(`Generating Socratic Quiz for ${topic} in ${subject}...`, "info");
    try {
      const response = await safeFetch("/api/generate-quiz", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          subject: subject,
          topic: topic
        })
      });
      const data = await response.json();
      if (response.ok && data.questions && data.questions.length > 0) {
        setQuizQuestions(data.questions);
        setQuizIndex(0);
        setSelectedQuizOption(null);
        setQuizSubmitted(false);
        setQuizCompleted(false);
        setQuizScore(0);
        
        // Save to Socratic Test History!
        const newTestRun = {
          id: `test-h-${Date.now()}`,
          topic: topic,
          subject: subject,
          date: new Date().toLocaleDateString([], { month: "short", day: "numeric" }),
          score: "Active",
          questions: data.questions
        };
        setTestHistory(prev => {
          const next = [newTestRun, ...prev.filter(h => h.id !== "h2")];
          saveUserHistoriesToFirestore(undefined, next);
          return next;
        });

        triggerNotification(`Socratic Evaluation loaded for ${topic}!`, "success");
        setSelectedSubject(subject);
        setSelectedTopic(topic);
        setActiveTab("test");
        confetti({ particleCount: 60, spread: 50, colors: ["#8B5CF6", "#06B6D4"] });
      } else {
        throw new Error(data.error || "Failed standard quiz generation");
      }
    } catch (err: any) {
      console.error(err);
      triggerNotification("AI Quiz generator is loaded with requests. Try again soon.", "error");
    } finally {
      setIsGeneratingQuiz(false);
    }
  };

  const deleteFlashcard = async (id: string) => {
    setFlashcards(prev => {
      const next = prev.filter(c => c.id !== id);
      saveUserHistoriesToFirestore(undefined, undefined, next);
      triggerNotification("Flashcard deleted from your active stack.", "success");
      return next;
    });
  };

  const clearAllFlashcards = async () => {
    setFlashcards([]);
    saveUserHistoriesToFirestore(undefined, undefined, []);
    triggerNotification("Revision session completed and closed.", "success");
  };

  const saveAiGeneratedFlashcards = async () => {
    if (aiGeneratedFlashcards.length === 0) return;
    if (aiGeneratedFlashcardsSaved) {
      triggerNotification("These cards are already added to your deck!", "info");
      return;
    }
    
    const updatedFlashcards = [...aiGeneratedFlashcards, ...flashcards];
    
    // Save to Flashcards History!
    const newCardsRun = {
      id: `fc-h-${Date.now()}`,
      topic: selectedTopic || "AI Topic",
      subject: selectedSubject || "Mathematics",
      date: new Date().toLocaleDateString([], { month: "short", day: "numeric" }),
      count: aiGeneratedFlashcards.length
    };
    const updatedHistory = [newCardsRun, ...flashcardsHistory.filter(h => h.id !== "h1")];

    // Atomically set local states
    setFlashcards(updatedFlashcards);
    setFlashcardsHistory(updatedHistory);

    // Single atomic database update
    if (auth.currentUser) {
      const userDocRef = doc(db, "users", auth.currentUser.uid);
      try {
        await updateDoc(userDocRef, {
          flashcards: updatedFlashcards,
          flashcardsHistory: updatedHistory
        });
      } catch (err) {
        console.error("Failed to atomic sync flashcards to Firestore:", err);
      }
    }

    // Update progress tracker counts
    const activeSub = currentStudySubject || selectedSubject || "Mathematics";
    await updateSubjectProgress(activeSub, "flashcard", undefined, aiGeneratedFlashcards.length);

    setAiGeneratedFlashcardsSaved(true);
    triggerNotification(`✨ Successfully saved ${aiGeneratedFlashcards.length} revision cards!`, "success");
    confetti({ particleCount: 50, spread: 40, colors: ["#10B981", "#8B5CF6"] });
  };

  const clearAiGeneratedFlashcards = () => {
    setAiGeneratedFlashcards([]);
    setAiGeneratedFlashcardsSaved(false);
    triggerNotification("Cleared generated cards preview area.", "info");
  };

  const generateFlashcardsFromAI = async (subject: string = selectedSubject, topic: string = selectedTopic) => {
    setIsGeneratingFlashcards(true);
    triggerNotification(`Generating Custom Revision Cards for ${topic}...`, "info");
    try {
      const response = await safeFetch("/api/generate-flashcards", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          subject: subject,
          topic: topic
        })
      });
      const data = await response.json();
      if (response.ok && data.flashcards && data.flashcards.length > 0) {
        const newCards = data.flashcards.map((cf: any, index: number) => ({
          id: `ai-fc-${Date.now()}-${index}`,
          category: cf.category || subject,
          front: cf.front,
          back: cf.back
        }));
        
        // Draft in preview area wait for save or got it!
        setAiGeneratedFlashcards(newCards);
        setAiGeneratedFlashcardsSaved(false);

        triggerNotification(`Generated ${newCards.length} tailored Flashcards for ${topic}! Click 'Save' in preview to store them.`, "success");
        setSelectedSubject(subject);
        setSelectedTopic(topic);
        setActiveTab("flashcards");
        confetti({ particleCount: 50, spread: 40, colors: ["#10B981", "#8B5CF6"] });
      } else {
        throw new Error(data.error || "Failed cards blueprint");
      }
    } catch (err: any) {
      console.error(err);
      triggerNotification("Flashcards generator is currently sleeping. Try again later.", "error");
    } finally {
      setIsGeneratingFlashcards(false);
    }
  };

  const handleSelectSubjectAndTopic = async (subject: string, topic: string) => {
    setSelectedSubject(subject);
    setSelectedTopic(topic);
    setIsFocusModalOpen(false);

    triggerNotification(`📚 study focus changed: ${topic} (${subject})`, "success");

    setIsAiTyping(true);
    const timestamp = new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });

    setMessages(prev => [
      ...prev,
      {
        id: `shift-user-${Date.now()}`,
        sender: "user",
        text: `Let's shift my active tutor curriculum to: **${topic}** which sits under **${subject}**. Tailor our learning path here!`,
        timestamp
      }
    ]);

    try {
      const response = await safeFetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: [{ role: "user", content: `I have selected the study subject: "${subject}" and topic: "${topic}". Introduce this focus to me Socratically, and ask a triggering question or give a brief puzzle to test my starting proficiency.` }],
          userId: displayName,
          plan: "pro",
          subject,
          topic
        })
      });
      const data = await response.json();
      if (response.ok && data.content) {
        setMessages(prev => [
          ...prev,
          { id: `shift-ai-${Date.now()}`, sender: "ai", text: data.content, timestamp }
        ]);
        setActiveTab("chat");
      } else {
        throw new Error("Unable to fetch tailored intro.");
      }
    } catch (err) {
      setMessages(prev => [
        ...prev,
        {
          id: `shift-ai-fallback-${Date.now()}`,
          sender: "ai",
          text: `A fantastic choice! Socratic focus shifted to **${topic}** under **${subject}**. Let us begin unpacking this. Why don't you start by explaining what key question or formula from ${topic} you'd like to explore first?`,
          timestamp
        }
      ]);
    } finally {
      setIsAiTyping(false);
      setTimeout(() => chatBottomRef.current?.scrollIntoView({ behavior: "smooth" }), 80);
    }
  };

  const handleNotebookTextSelection = (e: React.MouseEvent<HTMLDivElement>) => {
    // Delay slightly to give browser time to update Selection
    setTimeout(() => {
      const selection = window.getSelection();
      if (!selection) return;
      const text = selection.toString().trim();
      
      if (text.length > 3) {
        setSelectedNotebookText(text);
        
        try {
          const range = selection.getRangeAt(0);
          const rect = range.getBoundingClientRect();
          // Position relative to viewport for fixed positioning above the text selection
          setBubbleCoords({
            x: rect.left + rect.width / 2,
            y: rect.top - 48
          });
        } catch (err) {
          setBubbleCoords({
            x: e.clientX,
            y: e.clientY - 48
          });
        }
      } else {
        const target = e.target as HTMLElement;
        if (!target.closest(".ask-lunito-bubble")) {
          setSelectedNotebookText("");
          setBubbleCoords(null);
        }
      }
    }, 40);
  };

  const handleAskLunitoForSelectedText = async (selectedText: string) => {
    if (!selectedText.trim()) return;

    setActiveTab("chat");
    const userText = `Please explain this concept from my notebook Socratically: "${selectedText.substring(0, 150)}"`;
    const timestamp = new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
    const newUserMsg: Message = { id: `u-highlight-${Date.now()}`, sender: "user", text: userText, timestamp };

    setMessages(prev => [...prev, newUserMsg]);
    setSelectedNotebookText("");
    setBubbleCoords(null);
    setIsAiTyping(true);

    setTimeout(() => chatBottomRef.current?.scrollIntoView({ behavior: "smooth" }), 80);

    try {
      const response = await safeFetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: [{ role: "user", content: userText }],
          userId: displayName,
          plan: "pro",
          subject: selectedSubject,
          topic: selectedTopic
        })
      });

      const data = await response.json();
      if (response.ok && data.content) {
        setMessages(prev => [
          ...prev, 
          { id: `ai-${Date.now()}`, sender: "ai", text: data.content, timestamp }
        ]);
      } else {
        throw new Error(data.error || "Failed Socratic explanation");
      }
    } catch (err: any) {
      const fallbackText = `That is an excellent formula or phrase: "${selectedText}". Let's explore its core intuition. What do you think the variable relationships or terms in this statement are trying to convey?`;
      setMessages(prev => [
        ...prev,
        { id: `ai-highlight-fallback-${Date.now()}`, sender: "ai", text: fallbackText, timestamp }
      ]);
    } finally {
      setIsAiTyping(false);
      setTimeout(() => chatBottomRef.current?.scrollIntoView({ behavior: "smooth" }), 80);
    }
  };

  const submitQuizAnswer = (key: string) => {
    if (quizSubmitted) return;
    setSelectedQuizOption(key);
    setQuizSubmitted(true);
    if (key === quizQuestions[quizIndex].correct) {
      setQuizScore(prev => prev + 1);
      confetti({ particleCount: 50, spread: 60, colors: ["#8B5CF6", "#00F0FF"] });
      triggerNotification("Splendid work! Correct solution.", "success");
    } else {
      triggerNotification("Incorrect option. Review the Socratic explanation below.", "error");
    }
  };

  const nextQuizQuestion = () => {
    setSelectedQuizOption(null);
    setQuizSubmitted(false);
    if (quizIndex < quizQuestions.length - 1) {
      setQuizIndex(prev => prev + 1);
    } else {
      setQuizCompleted(true);
      const calculatedAccuracy = quizQuestions.length > 0 ? Math.round((quizScore / quizQuestions.length) * 100) : 0;
      setAccuracyRate(calculatedAccuracy);
      
      // Update dynamic scoring for active history run!
      setTestHistory(prev => {
        const next = prev.map((item, idx) => {
          if (idx === 0 && item.score === "Active") {
            const finalScore = `Completed: ${quizScore} / ${quizQuestions.length} (${calculatedAccuracy}%)`;
            return { ...item, score: finalScore };
          }
          return item;
        });
        saveUserHistoriesToFirestore(undefined, next);
        return next;
      });

      // Update progress tracker counts & calculate realistic mastery dynamically based on score!
      const currentSub = currentStudySubject || selectedSubject || "Mathematics";
      updateSubjectProgress(currentSub, "quiz", calculatedAccuracy, 1);

      setTopicsMastered(prev => {
        const next = prev + 1;
        updateFirestoreStats(undefined, next, calculatedAccuracy);
        return next;
      });

      confetti({ particleCount: 100, spread: 80, colors: ["#8B5CF6", "#10B981"] });
    }
  };

  const resetQuiz = () => {
    setQuizIndex(0);
    setSelectedQuizOption(null);
    setQuizScore(0);
    setQuizSubmitted(false);
    setQuizCompleted(false);
  };

  // Solve or document any concept directly into the Notebook
  const addSolverSolutionToNotebook = async (questionText: string, aiResponseText: string) => {
    // Elegant topic extraction for title
    let title = selectedTopic || "Study Notes: " + (selectedTopic || "Custom Study");
    const lowerQ = questionText.toLowerCase();
    if (lowerQ.includes("solve") || lowerQ.includes("factor") || lowerQ.includes("quadratic") || lowerQ.includes("equation")) {
      title = "Solved Work: " + (selectedTopic || "Algebra Work");
    } else if (lowerQ.includes("derivative") || lowerQ.includes("integral") || lowerQ.includes("calculus") || lowerQ.includes("limit")) {
      title = "Calculus Study Guide";
    } else if (lowerQ.includes("quantum") || lowerQ.includes("vector") || lowerQ.includes("physics")) {
      title = "Physics: Wave Theory";
    } else if (questionText.trim().length > 3 && questionText.trim().length < 35) {
      title = questionText.trim();
    }

    // 1. Process and partition aiResponseText into separate pages
    const rawPages = aiResponseText.split(/\[PAGE:\s*([^\]]+)\]/gi);
    const parsedPages: Array<{ title: string, lines: string[] }> = [];

    const cleanLineKeepPrefix = (line: string) => {
      let cleaned = line.trim();
      if (!cleaned) return "";
      const tagMatch = cleaned.match(/^\[(TITLE|HEADING|SUBHEADING|DEFINITION|EXAMPLE|IMPORTANT|NOTE|TAKEAWAY|WARNING|MISTAKE|FORMULA|MATH-LINE|EXAM-TIP|TIP|REVISION)\]:\s*(.*)/i);
      if (tagMatch) {
        const prefix = tagMatch[1].toUpperCase();
        let rest = tagMatch[2].trim();
        rest = rest.replace(/^#+\s*/, "");
        rest = rest.replace(/^-\s*/, "• ");
        rest = rest.replace(/^\*\s*/, "• ");
        rest = rest.replace(/\*\*/g, ""); // strip bold asterisks
        return `[${prefix}]: ${rest}`;
      } else {
        cleaned = cleaned.replace(/^#+\s*/, "");
        cleaned = cleaned.replace(/^-\s*/, "• ");
        cleaned = cleaned.replace(/^\*\s*/, "• ");
        cleaned = cleaned.replace(/\*\*/g, ""); // strip bold asterisks
        return cleaned;
      }
    };

    if (rawPages.length <= 1) {
      // Fallback: Automatically partition content blocks into multiple pages
      const rawLines = aiResponseText.split("\n")
        .map(cleanLineKeepPrefix)
        .filter(l => l.length > 0);
      
      let pageLines: string[] = [];
      let currentPageTitle = title;
      
      rawLines.forEach((line) => {
        const isHeader = line.startsWith("[TITLE]:") || line.startsWith("[HEADING]:") || line.startsWith("# ") || line.startsWith("## ");
        if (isHeader && pageLines.length >= 10) {
          parsedPages.push({
            title: currentPageTitle,
            lines: [...pageLines]
          });
          const cleanTitle = line.replace(/^\[TITLE\]:\s*/i, "").replace(/^\[HEADING\]:\s*/i, "").replace(/^#+\s*/, "").trim();
          currentPageTitle = cleanTitle || `Study Leaf ${parsedPages.length + 1}`;
          pageLines = [line];
        } else {
          pageLines.push(line);
        }
      });
      if (pageLines.length > 0) {
        parsedPages.push({
          title: currentPageTitle,
          lines: pageLines
        });
      }
    } else {
      // True multi-page tags are present
      const leadingText = rawPages[0].trim();
      if (leadingText) {
        const lines = leadingText.split("\n")
          .map(cleanLineKeepPrefix)
          .filter(l => l.length > 0);
        if (lines.length > 0) {
          parsedPages.push({
            title: title,
            lines
          });
        }
      }
      
      for (let i = 1; i < rawPages.length; i += 2) {
        const pageTitle = rawPages[i].trim();
        const pageBody = rawPages[i + 1] || "";
        const lines = pageBody.split("\n")
          .map(cleanLineKeepPrefix)
          .filter(l => l.length > 0);
        
        if (lines.length > 0 || pageTitle) {
          parsedPages.push({
            title: pageTitle || `Study Leaf ${parsedPages.length + 1}`,
            lines: lines
          });
        }
      }
    }

    // Ensure we have at least one page
    if (parsedPages.length === 0) {
      parsedPages.push({
        title: title,
        lines: ["• Concept sheet structured and ready."]
      });
    }

    // 2. Format page structures
    const formattedPages = parsedPages.map((p, pIdx) => ({
      id: `p-${Date.now()}-${pIdx}-${Math.random().toString(36).substring(2, 7)}`,
      title: p.title,
      lines: p.lines
    }));

    let notebookId = `nb-${Date.now()}`;
    const subjectOfBook = currentStudySubject || "Mixed Subject";
    const newBookPayload = {
      title: title,
      subject: subjectOfBook,
      difficulty: "Medium" as const,
      progress: 100,
      pages: formattedPages,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    if (auth.currentUser) {
      try {
        const docRef = await addDoc(collection(db, "notebooks"), {
          userId: auth.currentUser.uid,
          ...newBookPayload
        });
        notebookId = docRef.id;
      } catch (err) {
        console.error("Failed cloud save of multi-page notebook:", err);
      }
    } else {
      // Offline local sandbox save
      try {
        const localBooksStr = localStorage.getItem("lunito_local_notebooks") || "[]";
        const localBooks = JSON.parse(localBooksStr);
        const savedBook = { id: notebookId, ...newBookPayload };
        localBooks.push(savedBook);
        localStorage.setItem("lunito_local_notebooks", JSON.stringify(localBooks));
      } catch (err) {
        console.error("Failed local storage save:", err);
      }
    }

    // Maintain backward compatibility for state
    const syncPage = {
      id: notebookId,
      title: title,
      lines: formattedPages[0]?.lines || [],
      category: "violet"
    };
    
    setNotebookPages(prev => [...prev, syncPage]);
    triggerNotification(`🖋️ Compiled multi-page Study Book with ${formattedPages.length} chapters!`, "success");
    setNotebookPage(1);
  };

  const exportNotebookPageToPdf = (customPage?: { title: string; lines: string[] }) => {
    const page = customPage || notebookPages[notebookPage - 1];
    if (!page) {
      triggerNotification("No notebook page found to export!", "error");
      return;
    }

    try {
      const doc = new jsPDF({
        orientation: "portrait",
        unit: "mm",
        format: "a4"
      });

      // Page parameters
      const pageWidth = doc.internal.pageSize.getWidth(); // ~210mm
      const pageHeight = doc.internal.pageSize.getHeight(); // ~297mm

      // 1. Draw ivory/notebook paper color
      doc.setFillColor(253, 251, 247);
      doc.rect(0, 0, pageWidth, pageHeight, "F");

      // 2. Draw light blue-gray horizontal ruled lines
      doc.setDrawColor(225, 218, 202);
      doc.setLineWidth(0.25);
      for (let y = 32; y < pageHeight - 12; y += 8) {
        doc.line(12, y, pageWidth - 12, y);
      }

      // 3. Draw standard vertical pink margin segment line
      doc.setDrawColor(225, 140, 140);
      doc.setLineWidth(0.4);
      doc.line(25, 0, 25, pageHeight);

      // 4. Draw Header line info
      doc.setFont("Helvetica", "italic");
      doc.setFontSize(8);
      doc.setTextColor(120, 120, 120);
      doc.text("LUNITO Personal AI Step Notebook", 30, 14);
      
      const academicLabel = selectedClass && selectedBoard ? `${selectedClass} - ${selectedBoard}` : "";
      if (academicLabel) {
        doc.text(academicLabel, pageWidth - 30, 14, { align: "right" });
      }

      // 5. Draw the Page Title with thick line underneath
      doc.setFont("Helvetica", "bold");
      doc.setFontSize(16);
      doc.setTextColor(74, 46, 16); // nice warm notebook ink brown `#4a2e10`
      doc.text(page.title, 30, 23);

      doc.setDrawColor(74, 46, 16);
      doc.setLineWidth(0.5);
      doc.line(30, 26, pageWidth - 15, 26);

      // 6. Draw page content step by step
      doc.setFont("Times-Roman", "normal");
      doc.setFontSize(12);
      doc.setTextColor(40, 30, 20);

      let currentY = 35;
      const marginX = 30;
      const contentWidth = pageWidth - marginX - 15;

      if (!page.lines || page.lines.length === 0) {
        doc.setFont("Helvetica", "italic");
        doc.setTextColor(140, 120, 100);
        doc.text("[This study notebook sheet is currently empty. Ask LUNITO to write solutions here!]", marginX, currentY + 5);
      } else {
        page.lines.forEach((line) => {
          // Break line into wrapped strings for pdf page fit
          const docLines = doc.splitTextToSize(line, contentWidth);
          
          docLines.forEach((docLine: string) => {
            // Check overflow & add continuing page
            if (currentY > pageHeight - 18) {
              doc.addPage();
              
              // Redraw ivory canvas
              doc.setFillColor(253, 251, 247);
              doc.rect(0, 0, pageWidth, pageHeight, "F");

              // Redraw horizontal rules
              doc.setDrawColor(225, 218, 202);
              doc.setLineWidth(0.25);
              for (let y = 32; y < pageHeight - 12; y += 8) {
                doc.line(12, y, pageWidth - 12, y);
              }

              // Redraw vertical notebook margin line
              doc.setDrawColor(225, 140, 140);
              doc.setLineWidth(0.4);
              doc.line(25, 0, 25, pageHeight);

              // Redraw header
              doc.setFont("Helvetica", "italic");
              doc.setFontSize(8);
              doc.setTextColor(120, 120, 120);
              doc.text(`LUNITO Personal AI Step Notebook - ${page.title} (Continued)`, 30, 14);

              doc.setFont("Times-Roman", "normal");
              doc.setFontSize(12);
              doc.setTextColor(40, 30, 20);
              currentY = 35;
            }

            const cleanLine = docLine.trim();
            const isCheckmark = cleanLine.startsWith("✓") || cleanLine.startsWith("📚");
            if (isCheckmark) {
              doc.setFont("Helvetica", "bold");
              doc.setTextColor(16, 115, 60); // elegant emerald green for checked milestones
              doc.text(docLine, marginX, currentY);
              doc.setFont("Times-Roman", "normal");
              doc.setTextColor(40, 30, 20);
            } else {
              doc.text(docLine, marginX, currentY);
            }
            
            // Advance cursor to next ruled spacing
            currentY += 8;
          });
        });
      }

      const slug = page.title.toLowerCase().replace(/[^a-z0-9]+/g, "-");
      doc.save(`lunito-notebook-${slug || "export"}.pdf`);
      triggerNotification("High contrast study PDF exported successfully! 📝", "success");
    } catch (err) {
      console.error("PDF generation failure:", err);
      triggerNotification("Error exporting step sheet as PDF.", "error");
    }
  };

  const [isNotebookAiTyping, setIsNotebookAiTyping] = useState(false);

  const handleNotebookChatSubmit = async () => {
    if (!notebookChatInput.trim() && !attachedFile) return;
    if (!notebookChatInput.trim() && attachedFile) {
      triggerNotification("Please type a short query or problem details for the attached file as instructions!", "info");
      return;
    }

    if (checkChatLimitExceeded(false, true)) {
      return;
    }

    const text = notebookChatInput;
    let textToSendToAI = text;
    const currentAttachment = attachedFile;

    if (attachedFile) {
      textToSendToAI = `[Attached File: ${attachedFile.name}] ${text}`;
    }

    setNotebookChatInput("");
    setAttachedFile(null); // Clear attached file once sent
    setIsNotebookAiTyping(true);

    const notesMatch = text.match(/(?:make|create|write|generate|prepare)\s+notes\s+(?:of|on|about|for|\s+)?\s*(.+)/i);
    let promptToSend = `Please solve and list analytical, brief step-by-step points for the following: "${textToSendToAI}". Make each point a single line.`;
    
    if (notesMatch) {
      const topicPart = notesMatch[1].trim();
      promptToSend = `Please compose highly detailed, beautiful academic study notes about the topic: "${topicPart}". Use structured subsections with clear bullet points. Avoid preamble or conversing.`;
      
      const lowerTopic = topicPart.toLowerCase();
      const standardSubjects = ["Mathematics", "Philosophy", "Computer Science", "Physics", "Chemistry", "World History", "Literature Study"];
      for (const sub of standardSubjects) {
        if (lowerTopic.includes(sub.toLowerCase())) {
          setNotebookSubject(sub);
          setCurrentStudySubject(sub);
          break;
        }
      }
      triggerNotification(`🖋️ LUNITO is writing handwritten study notes for: "${topicPart}"`, "success");
    } else {
      triggerNotification(`LUNITO is writing solution for: "${text.substring(0, 35)}..."`, "info");
    }

    const timestamp = new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });

    // Store user query in general messaging for conversation log
    const userMsgText = currentAttachment 
      ? `📎 Attached File: **${currentAttachment.name}**\nRegarding Notebook: ${text}`
      : `Regarding Notebook: ${text}`;

    setMessages(prev => [
      ...prev,
      { id: `u-nb-${Date.now()}`, sender: "user", text: userMsgText, timestamp }
    ]);

    try {
      console.log(`[Client] Notebook Mode active. Sending request to /api/chat with mode: "notebook", input: "${textToSendToAI.substring(0, 30)}..."`);
      const response = await safeFetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: [{ role: "user", content: promptToSend }],
          userId: displayName,
          plan: "pro",
          subject: notebookSubject === "Custom Subject" ? (notebookCustomSubject.trim() || "Custom Subject") : notebookSubject,
          topic: "Core Topic Study",
          mode: "notebook",
          connectedResource: connectedResource,
          attachment: currentAttachment ? {
            name: currentAttachment.name,
            type: currentAttachment.type,
            data: currentAttachment.base64Content
          } : null
        })
      });

      const data = await response.json();
      if (response.ok && data.content) {
        // Post response to main chat history too
        setMessages(prev => [
          ...prev, 
          { id: `ai-nb-${Date.now()}`, sender: "ai", text: data.content, timestamp }
        ]);
        
        // Overwrite or write to the notebook page!
        addSolverSolutionToNotebook(text, data.content);
        await registerChatSent();
      } else {
        throw new Error(data.error || "Failed custom response");
      }
    } catch (err: any) {
      // Graceful fallback response
      let fallbackText = `Socratic Solved Step-by-Step:\n1. Problem defined: ${text}\n2. Break the equations into base terms.\n3. Solve for unknown parameters using equivalence rules.\n4. Simplify and verify roots with LUNITO check.\n✓ Solution parsed. Learn more conceptually in the Socratic portal!`;
      
      setMessages(prev => [
        ...prev, 
        { id: `ai-nb-${Date.now()}`, sender: "ai", text: fallbackText, timestamp }
      ]);
      
      addSolverSolutionToNotebook(text, fallbackText);
    } finally {
      setIsNotebookAiTyping(false);
    }
  };

  const handleFlashcardChatSubmit = async () => {
    if (!flashcardChatInput.trim() && !attachedFile) return;
    if (!flashcardChatInput.trim() && attachedFile) {
      triggerNotification("Please type a short query or instruction for the attached file!", "info");
      return;
    }

    if (checkChatLimitExceeded(false, true)) {
      return;
    }

    const text = flashcardChatInput;
    let textToSendToAI = text;
    const currentAttachment = attachedFile;

    if (attachedFile) {
      textToSendToAI = `[Attached File: ${attachedFile.name}] ${text}`;
    }

    setFlashcardChatInput("");
    setAttachedFile(null); // Clear attached file once sent
    setIsFlashcardAiTyping(true);
    triggerNotification(`LUNITO is drafting card recommendations for: "${text.substring(0, 35)}..."`, "info");

    const timestamp = new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });

    // Store user query in local chat log
    const userMsgText = currentAttachment 
      ? `📎 Attached File: **${currentAttachment.name}**\n${text}`
      : text;

    setFlashcardMessages(prev => [
      ...prev,
      { id: `u-fc-${Date.now()}`, sender: "user", text: userMsgText, timestamp }
    ]);

    try {
      console.log(`[Client] Flashcards Mode active. Sending request to /api/chat with mode: "flashcards", input: "${textToSendToAI.substring(0, 30)}..."`);
      const response = await safeFetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: [{ role: "user", content: textToSendToAI }],
          userId: displayName,
          plan: "pro",
          subject: flashcardSubject === "Custom Subject" ? (flashcardCustomSubject.trim() || "Custom Subject") : flashcardSubject,
          topic: selectedTopic,
          mode: "flashcards",
          attachment: currentAttachment ? {
            name: currentAttachment.name,
            type: currentAttachment.type,
            data: currentAttachment.base64Content
          } : null
        })
      });

      const data = await response.json();
      if (response.ok && data.content) {
        const contentStr = data.content as string;
        
        // Highly robust parser: split text by "=== FLASHCARD ==="
        const cardBlocks = contentStr.split(/===\s*FLASHCARD\s*===/gi);
        let newCardsCount = 0;
        const parsedCards: Flashcard[] = [];

        cardBlocks.forEach(block => {
          if (!block.trim()) return;
          
          const frontMatch = block.match(/Front:\s*(.*?)(?=\n\s*Back:|$)/is);
          const backMatch = block.match(/Back:\s*(.*?)(?=\n\s*Category:|$)/is);
          const categoryMatch = block.match(/Category:\s*(.*?)(?=\n\s*====|$)/is);
          
          const front = frontMatch ? frontMatch[1].trim() : "";
          const back = backMatch ? backMatch[1].trim() : "";
          let category = categoryMatch ? categoryMatch[1].trim() : (selectedSubject || "AI Custom");
          
          category = category.replace(/[\s=]*$/g, '').trim().replace(/^\[|\]$/g, '');
          
          if (front && back) {
            const newCard: Flashcard = {
              id: `fc-ai-${Date.now()}-${Math.random()}`,
              front: front.replace(/^\[|\]$/g, ''),
              back: back.replace(/^\[|\]$/g, ''),
              category: category
            };
            parsedCards.push(newCard);
            newCardsCount++;
          }
        });

        if (newCardsCount > 0) {
          // Successfully parsed flashcards: render cards directly in preview area
          setAiGeneratedFlashcards(parsedCards);
          setAiGeneratedFlashcardsSaved(false);
          triggerNotification(`✨ Drafted ${newCardsCount} new flashcards in preview area! Click 'Save' to keep them.`, "success");
          
          const replyText = `I have successfully compiled **${newCardsCount} tailored revision card drafts** for you under **${flashcardSubject === "Custom Subject" ? (flashcardCustomSubject.trim() || "Custom Subject") : flashcardSubject}**! They are now loaded in the **AI Dynamic Drafts** preview zone on the right. Please review them and click **Save flashcards** to store them permanently into your study deck. Let me know if you would like me to explain any other concepts or draft additional cards!`;
          
          setFlashcardMessages(prev => [
            ...prev,
            { id: `ai-fc-${Date.now()}`, sender: "ai", text: replyText, timestamp }
          ]);
        } else {
          // No flashcards were parsed, add regular assistant conversational text to chat history
          setFlashcardMessages(prev => [
            ...prev, 
            { id: `ai-fc-${Date.now()}`, sender: "ai", text: contentStr, timestamp }
          ]);
        }
        await registerChatSent();
      } else {
        throw new Error(data.error || "Failed flashcards chat response");
      }
    } catch (err: any) {
      // Graceful fallback response
      let fallbackText = `Here's a parsed flashcard for you:\n\n=== FLASHCARD ===\nFront: What is the main characteristic of the ${selectedTopic} concept?\nBack: It refers to core properties aligned with ${selectedSubject} tutoring logic.\nCategory: ${selectedSubject}\n=================`;
      
      setFlashcardMessages(prev => [
        ...prev, 
        { id: `ai-fc-${Date.now()}`, sender: "ai", text: `I noticed an issue connecting to the custom server, but let me compile a default card for you anyway!\n\n${fallbackText}`, timestamp }
      ]);
      
      // Auto-append fallback card
      const newCard: Flashcard = {
        id: `fc-ai-${Date.now()}-${Math.random()}`,
        front: `What is the main characteristic of the ${selectedTopic} concept?`,
        back: `It refers to core properties aligned with ${selectedSubject} tutoring logic.`,
        category: selectedSubject
      };
      setFlashcards(prev => [newCard, ...prev]);
      triggerNotification("✨ Added local Socratic revision card as fallback!", "success");
    } finally {
      setIsFlashcardAiTyping(false);
    }
  };

  const handleTestChatSubmit = async () => {
    if (!testChatInput.trim()) return;

    if (checkChatLimitExceeded(false, true)) {
      return;
    }

    const text = testChatInput;
    setTestChatInput("");
    setIsTestAiTyping(true);

    const timestamp = new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });

    // Store user query in local chat log
    setTestMessages(prev => [
      ...prev,
      { id: `u-test-${Date.now()}`, sender: "user", text: text, timestamp }
    ]);

    try {
      const promptContext = `[Socratic evaluation portal chat system context]
The student is speaking inside the Socratic Assessment / Test Mode.
If they want to trigger, create, make, build, or generate a quiz/test/evaluation/assessment, respond on the very first line with EXACTLY:
GENERATE_TRG: <Subject> | <Topic>

(Make sure the <Subject> is one of the standard fields like Mathematics, Physics, Chemistry, Biology, Computer Science, Literature Study, History, General Study, or a custom one. The <Topic> should be the specific area of focus).

On subsequent lines, reply to confirm in a highly professional, encouraging, Socratic mentor voice that you are generating the test and why this is a great test of their skills.

If the user is not requesting to make or start a test, just answer their question normally (Socratic style). Do not start with GENERATE_TRG.`;

      const response = await safeFetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: [
            { role: "user", content: promptContext },
            { role: "user", content: text }
          ],
          userId: displayName,
          plan: "pro",
          subject: selectedSubject,
          topic: selectedTopic,
          mode: "socratic"
        })
      });

      const data = await response.json();
      if (response.ok && data.content) {
        const contentStr = data.content as string;
        
        const triggerMatch = contentStr.match(/GENERATE_TRG:\s*([^|\n]+)\s*\|\s*([^\n]+)/i);
        
        let cleanedReply = contentStr;
        if (triggerMatch) {
          cleanedReply = contentStr.replace(/GENERATE_TRG:\s*[^\n]+\n?/i, "").trim();
        }

        setTestMessages(prev => [
          ...prev, 
          { id: `ai-test-${Date.now()}`, sender: "ai", text: cleanedReply || "Generating test questions now!", timestamp }
        ]);

        if (triggerMatch) {
          const matchedSubject = triggerMatch[1].trim();
          const matchedTopic = triggerMatch[2].trim();
          
          setSelectedSubject(matchedSubject);
          setSelectedTopic(matchedTopic);
          
          // Trigger Socratic test generation!
          generateQuizFromAI(matchedSubject, matchedTopic);
        }
        await registerChatSent();
      } else {
        throw new Error(data.error || "Failed test chat response");
      }
    } catch (err: any) {
      console.error(err);
      const lower = text.toLowerCase();
      let fallbackSubject = selectedSubject;
      let fallbackTopic = selectedTopic;

      if (lower.includes("math") || lower.includes("algebra") || lower.includes("calculus") || lower.includes("quadratic")) {
        fallbackSubject = "Mathematics";
        fallbackTopic = lower.includes("quadratic") ? "Quadratic Equations" : "Algebraic Principles";
      } else if (lower.includes("chem") || lower.includes("bond") || lower.includes("molecule")) {
        fallbackSubject = "Chemistry";
        fallbackTopic = lower.includes("bond") ? "Chemical Bonding" : "Molecular Reactions";
      } else if (lower.includes("phys") || lower.includes("light") || lower.includes("force")) {
        fallbackSubject = "Physics";
        fallbackTopic = lower.includes("light") ? "Light Reflection" : "Newtonian Forces";
      } else if (lower.includes("biol") || lower.includes("cell") || lower.includes("photosynthesis")) {
        fallbackSubject = "Biology";
        fallbackTopic = lower.includes("photosynthesis") ? "Photosynthesis" : "Cell Division";
      }

      setTestMessages(prev => [
        ...prev, 
        { 
          id: `ai-test-fallback-${Date.now()}`, 
          sender: "ai", 
          text: `Certainly! I've loaded a direct Socratic evaluation on **${fallbackTopic}** for you! Good luck on this diagnostic query.`, 
          timestamp 
        }
      ]);

      generateQuizFromAI(fallbackSubject, fallbackTopic);
    } finally {
      setIsTestAiTyping(false);
    }
  };

  return (
    <div className={`relative min-h-screen transition-all duration-300 ${darkModeToggle ? "bg-[#07070a] text-white" : "bg-neutral-50 text-neutral-900"}`}>
      
      {/* Global Toast Notifications banner */}
      <div className="fixed top-4 right-4 left-4 md:left-auto md:w-80 md:right-6 md:top-6 z-[9999] space-y-2 pointer-events-none flex flex-col items-center md:items-end">
        <AnimatePresence>
          {notifications.map(n => (
            <motion.div
              key={n.id}
              initial={{ opacity: 0, y: -20, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95, transition: { duration: 0.15 } }}
              className={`p-3 md:p-3.5 rounded-xl pointer-events-auto border flex items-center gap-2.5 w-full max-w-[92vw] md:w-80 bg-zinc-950/90 backdrop-blur-md shadow-lg shadow-black/80 ${
                n.type === "success" 
                  ? "border-emerald-500/20 text-emerald-300" 
                  : n.type === "error" 
                    ? "border-rose-500/20 text-rose-300" 
                    : "border-cyan-500/20 text-cyan-300"
              }`}
            >
              {n.type === "success" ? (
                <CheckCircle className="w-4 h-4 text-emerald-400 shrink-0" />
              ) : n.type === "error" ? (
                <AlertTriangle className="w-4 h-4 text-rose-450 shrink-0" />
              ) : (
                <Info className="w-4 h-4 text-cyan-400 shrink-0" />
              )}
              <span className="text-xs font-semibold leading-relaxed break-words flex-1 font-sans">{n.message}</span>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

      {/* 0. AUTH LOADING SCREEN OVERLAY */}
      {isAuthLoading ? (
        <div className="min-h-screen bg-[#07070a] flex flex-col items-center justify-center relative overflow-hidden">
          <div className="absolute -top-40 -left-40 w-96 h-96 bg-violet-650/10 rounded-full blur-3xl pointer-events-none" />
          <div className="absolute -bottom-40 -right-40 w-96 h-96 bg-cyan-600/10 rounded-full blur-3xl pointer-events-none" />
          
          <div className="space-y-4 text-center z-10">
            <div className="w-16 h-16 mx-auto rounded-2xl bg-gradient-to-tr from-violet-600 to-cyan-500 flex items-center justify-center animate-pulse shadow-xl shadow-violet-500/10 border border-violet-500/20">
              <Brain className="w-8 h-8 text-white animate-pulse" />
            </div>
            <h2 className="text-xs font-bold text-zinc-400 tracking-wider uppercase font-mono">
              Configuring Socratic Workspace...
            </h2>
          </div>
        </div>
      ) : isCompletingProfile ? (
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-[#07070a] via-[#0E122A] to-[#07070a] px-4 py-6">
          <div className="w-full max-w-sm p-5 md:p-8 rounded-2xl border border-zinc-800 bg-zinc-950/90 backdrop-blur-2xl shadow-xl shadow-black/80 relative overflow-hidden">
            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-violet-600 via-pink-500 to-cyan-500" />
            <div className="absolute -top-12 -left-12 w-40 h-40 bg-violet-600/10 rounded-full blur-3xl pointer-events-none" />
            <div className="absolute -bottom-12 -right-12 w-40 h-40 bg-cyan-600/10 rounded-full blur-3xl pointer-events-none" />
            
            <div className="text-center mb-6">
              <div className="w-12 h-12 mx-auto mb-3 rounded-xl bg-gradient-to-tr from-violet-600 to-cyan-500 flex items-center justify-center shadow-md animate-bounce">
                <Brain className="w-6 h-6 text-white" />
              </div>
              <h1 className="text-2xl font-display font-medium text-white tracking-tight">Complete Profile</h1>
              <p className="text-xs text-zinc-400 mt-1 font-medium font-sans">Enter your scholar details to activate LUNITO Socratic Suite</p>
            </div>

            <div className="space-y-4 font-sans">
              <div>
                <label className="block text-[10px] font-bold text-zinc-400 uppercase tracking-widest mb-1.5 font-mono">Scholar/Educator Name</label>
                <input 
                  type="text"
                  placeholder="Enter your profile name (e.g., Alex Alexander)"
                  value={completeProfileName}
                  onChange={(e) => setCompleteProfileName(e.target.value)}
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 outline-none text-xs text-white focus:border-violet-500 transition-all font-semibold"
                />
              </div>

              <div>
                <label className="block text-[10px] font-bold text-zinc-400 uppercase tracking-widest mb-1.5 font-mono">Select Class / Standard</label>
                <select
                  value={selectedClass}
                  onChange={(e) => setSelectedClass(e.target.value)}
                  className="w-full bg-zinc-900 border border-white/10 rounded-xl px-4 py-2.5 outline-none text-xs text-white focus:border-violet-500 transition-all font-semibold cursor-pointer"
                >
                  {["Class 6", "Class 7", "Class 8", "Class 9", "Class 10", "Class 11", "Class 12", "Undergraduate", "Postgraduate", "Other"].map((cls) => (
                    <option key={cls} value={cls} className="bg-zinc-950 text-white font-sans">{cls}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-[10px] font-bold text-zinc-400 uppercase tracking-widest mb-1.5 font-mono">Select Academic Board</label>
                <div className="grid grid-cols-3 gap-2">
                  {["CBSE", "ICSE", "State Board"].map((boardOption) => {
                    const isBoardSel = selectedBoard === boardOption;
                    return (
                      <button
                        key={boardOption}
                        type="button"
                        onClick={() => setSelectedBoard(boardOption)}
                        className={`py-2 px-1 rounded-xl text-[11px] font-bold text-center border transition-all cursor-pointer ${
                          isBoardSel
                            ? "bg-violet-605/25 border-violet-505 text-violet-300 font-extrabold shadow-lg shadow-violet-500/5"
                            : "bg-white/5 border-white/5 hover:bg-white/10 text-zinc-400 font-semibold"
                        }`}
                      >
                        {boardOption}
                      </button>
                    );
                  })}
                </div>

                {selectedBoard === "State Board" && (
                  <div className="mt-2.5">
                    <label className="block text-[9px] font-bold text-zinc-405 uppercase tracking-widest mb-1 font-mono">Specify State Board Name</label>
                    <input 
                      type="text"
                      placeholder="e.g. Maharashtra State Board"
                      value={onboardingStateBoardName}
                      onChange={(e) => setOnboardingStateBoardName(e.target.value)}
                      className="w-full bg-white/5 border border-white/10 rounded-xl px-3.5 py-2 outline-none text-xs text-white focus:border-violet-500 transition-all font-bold"
                    />
                  </div>
                )}
              </div>

              <div>
                <label className="block text-[10px] font-bold text-zinc-400 uppercase tracking-widest mb-1.5 font-mono">Key Subjects to Study</label>
                <div className="grid grid-cols-2 gap-1.5 mb-2">
                  {["Mathematics", "Philosophy", "Computer Science", "Biology", "Chemistry", "Literature", "History", "Physics"].map((subOption) => {
                    const isSelected = profileSubjects.includes(subOption);
                    return (
                      <button
                        key={subOption}
                        type="button"
                        onClick={() => {
                          if (isSelected) {
                            if (profileSubjects.length <= 1) {
                              triggerNotification("Select at least 1 focus subject!", "error");
                              return;
                            }
                            setProfileSubjects(prev => prev.filter(s => s !== subOption));
                          } else {
                            setProfileSubjects(prev => [...prev, subOption]);
                          }
                        }}
                        className={`py-1.5 px-2 rounded-lg text-[10px] font-semibold text-center border transition-all cursor-pointer truncate ${
                          isSelected 
                            ? "bg-violet-605/20 border-violet-500/50 text-violet-300" 
                            : "bg-white/5 border-white/5 text-zinc-400 hover:bg-white/10"
                        }`}
                      >
                        {subOption}
                      </button>
                    );
                  })}
                </div>
                <div className="flex gap-1.5">
                  <input 
                    type="text"
                    placeholder="Other subject (e.g., Economics)"
                    value={customProfileSubject}
                    onChange={(e) => setCustomProfileSubject(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        e.preventDefault();
                        if (customProfileSubject.trim()) {
                          const clean = customProfileSubject.trim();
                          if (!profileSubjects.includes(clean)) {
                            setProfileSubjects(prev => [...prev, clean]);
                            setCustomProfileSubject("");
                          }
                        }
                      }
                    }}
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-1.5 outline-none text-[10px] text-white focus:border-violet-500 transition-all font-medium"
                  />
                  <button
                    type="button"
                    onClick={() => {
                      if (customProfileSubject.trim()) {
                        const clean = customProfileSubject.trim();
                        if (!profileSubjects.includes(clean)) {
                          setProfileSubjects(prev => [...prev, clean]);
                          setCustomProfileSubject("");
                        }
                      }
                    }}
                    className="px-2.5 bg-violet-600 border border-violet-500 text-white rounded-xl text-[10px] font-bold shrink-0 cursor-pointer"
                  >
                    + Add
                  </button>
                </div>
              </div>

              <div className="p-3 bg-zinc-900/60 rounded-xl border border-zinc-850 text-[11px] text-zinc-400 space-y-1.5 leading-relaxed">
                <div className="text-zinc-205 font-bold flex items-center gap-1 text-[11px]">
                  <span>⚡ Setup Your Personalized Plan!</span>
                </div>
                <p>Welcome! Your login is authenticated to <span className="text-zinc-200 font-mono font-bold">{pendingAuthUser?.email}</span>.</p>
                <p>You are joining under LUNITO's **Free Plan with 15 daily chat interactions** across all features.</p>
              </div>

              <button
                disabled={isFetchingSyllabus}
                onClick={async () => {
                  if (!completeProfileName.trim()) {
                    triggerNotification("Please enter a profile name to complete your setup!", "error");
                    return;
                  }
                  if (profileSubjects.length === 0) {
                    triggerNotification("Please select at least one study subject!", "error");
                    return;
                  }
                  const user = pendingAuthUser || auth.currentUser;
                  if (user) {
                    const userDocRef = doc(db, "users", user.uid);
                    
                    const initialProg: Record<string, any> = {};
                    profileSubjects.forEach(s => {
                      initialProg[s] = {
                        chatsCount: 0,
                        quizCount: 0,
                        quizScoreSum: 0,
                        flashcardCount: 0,
                        notebookPageCount: 0,
                        masteryLevel: 0
                      };
                    });

                    // 1. Fetch search-grounded syllabus online
                    let fetchedSyllabus: Record<string, string[]> | null = null;
                    let fetchedSources: { title: string; uri: string }[] = [];
                    setIsFetchingSyllabus(true);
                    triggerNotification("Activating Google search grounding for your academic syllabus...", "info");
                    
                    const actualBoard = selectedBoard === "State Board" ? (onboardingStateBoardName.trim() || "State Board") : selectedBoard;

                    try {
                      const response = await safeFetch("/api/fetch-syllabus", {
                        method: "POST",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify({
                          userClass: selectedClass,
                          userBoard: actualBoard,
                          subjects: profileSubjects
                        })
                      });
                      
                      if (response.ok) {
                        const resData = await response.json();
                        fetchedSyllabus = resData.syllabus;
                        fetchedSources = resData.sources || [];
                        triggerNotification(`Successfully fetched latest official syllabus from the internet!`, "success");
                      }
                    } catch (fetchErr) {
                      console.error("Failed to compile online syllabus:", fetchErr);
                    } finally {
                      setIsFetchingSyllabus(false);
                    }

                    try {
                      await setDoc(userDocRef, {
                        uid: user.uid,
                        email: user.email || "",
                        displayName: completeProfileName.trim(),
                        plan: "free",
                        streak: 0,
                        totalSessions: 0,
                        studyTimeToday: "0h",
                        accuracyRate: 0,
                        chatsToday: 0,
                        lastResetTime: new Date().toISOString(),
                        lastActive: new Date().toISOString(),
                        subjects: profileSubjects,
                        subjectsProgress: initialProg,
                        class: selectedClass,
                        board: actualBoard,
                        syllabus: fetchedSyllabus,
                        syllabusSources: fetchedSources,
                        testHistory: [],
                        flashcardsHistory: [],
                        flashcards: []
                      });
                      
                      setDisplayName(completeProfileName.trim());
                      setEmailDisplay(user.email || "");
                      setPlan("free");
                      setStreakCount(0);
                      setTopicsMastered(0);
                      setStudyTimeToday("0h");
                      setAccuracyRate(0);
                      setChatsToday(0);
                      
                      setSubjects(profileSubjects);
                      setSubjectsProgress(initialProg);
                      setSelectedClass(selectedClass);
                      setSelectedBoard(actualBoard);

                      const firstSub = profileSubjects[0] || "";
                      setCurrentStudySubject(firstSub);
                      setSelectedSubject(firstSub);

                      if (fetchedSyllabus) {
                        setUserSyllabus(fetchedSyllabus);
                        if (firstSub && fetchedSyllabus[firstSub] && fetchedSyllabus[firstSub].length > 0) {
                          setSelectedTopic(fetchedSyllabus[firstSub][0]);
                        }
                      }
                      if (fetchedSources) {
                        setSyllabusSources(fetchedSources);
                      }
                      
                      setTestHistory([]);
                      setFlashcardsHistory([]);
                      setFlashcards([]);
                      setLastResetTime(new Date().toISOString());
                      
                      setIsLoggedIn(true);
                      setIsCompletingProfile(false);
                      setPendingAuthUser(null);
                      setActiveTab("dashboard");
                      triggerNotification("Done! Welcome to LUNITO.", "success");
                    } catch (err) {
                      console.error("Error writing user doc profile:", err);
                      setDisplayName(completeProfileName.trim());
                      setSubjects(profileSubjects);
                      setSubjectsProgress(initialProg);
                      setCurrentStudySubject(profileSubjects[0] || "");
                      setSelectedSubject(profileSubjects[0] || "");
                      setIsLoggedIn(true);
                      setIsCompletingProfile(false);
                      triggerNotification("Profile created locally!", "success");
                      handleFirestoreError(err, OperationType.CREATE, user.uid ? "users/" + user.uid : null);
                    }
                  }
                }}
                className="w-full py-2.5 bg-gradient-to-r from-violet-600 to-cyan-600 hover:from-violet-700 hover:to-cyan-700 disabled:opacity-50 text-white rounded-xl transition-all font-bold text-xs shadow-lg active:scale-95 duration-100 cursor-pointer flex items-center justify-center gap-2"
              >
                {isFetchingSyllabus ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin text-white" />
                    <span>Searching Google & Generating Syllabus...</span>
                  </>
                ) : (
                  <>
                    <span>Activate Account & Profile 🚀</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      ) : !isLoggedIn ? (
        showLandingPage ? (
          <LunitoLandingPage 
            onGetStarted={() => setShowLandingPage(false)} 
            onLogin={() => setShowLandingPage(false)} 
          />
        ) : (
          <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-[#07070a] via-[#0E0A1A] to-[#07070a] px-4 py-6">
          <div className="w-full max-w-sm p-5 md:p-8 rounded-2xl border border-zinc-805/80 bg-zinc-950/80 backdrop-blur-2xl shadow-xl shadow-black/60 relative overflow-hidden">
            
            <div className="absolute -top-12 -left-12 w-40 h-40 bg-violet-600/5 rounded-full blur-3xl pointer-events-none" />
            <div className="absolute -bottom-12 -right-12 w-40 h-40 bg-cyan-600/5 rounded-full blur-3xl pointer-events-none" />
 
            <div className="text-center mb-6">
              <div className="w-12 h-12 mx-auto mb-3 rounded-xl bg-gradient-to-tr from-violet-600 to-cyan-500 flex items-center justify-center shadow-md">
                <Brain className="w-6 h-6 text-white" />
              </div>
              <h1 className="text-2xl font-display font-medium text-white tracking-tight">LUNITO</h1>
              <p className="text-xs text-zinc-400 mt-1 font-medium">Immersive Socratic AI Personal Tutor</p>
            </div>

            {isMockMode && (
              <div className="mb-4 p-3.5 bg-[#0a1215] border border-cyan-500/20 rounded-2xl text-[11px] text-zinc-300 space-y-2.5 leading-relaxed animate-fadeIn">
                <div className="flex items-center gap-1.5 font-bold text-cyan-400">
                  <Sparkles className="w-3.5 h-3.5 text-cyan-400 animate-pulse shrink-0" />
                  <span>Socratic Supabase Sandbox</span>
                </div>
                <p className="text-[10px] text-zinc-400 font-sans leading-relaxed">
                  The app is running on a secure local browser store fallback. Add <span className="text-cyan-300 font-mono">VITE_SUPABASE_URL</span> and <span className="text-cyan-300 font-mono">VITE_SUPABASE_ANON_KEY</span> to connect your own Supabase project dynamically.
                </p>
                <div className="pt-0.5 select-none">
                  <button
                    onClick={async () => {
                      await handleGuestSecureLogin();
                      setActiveTab("dashboard");
                    }}
                    className="w-full py-1.5 bg-cyan-600/20 hover:bg-cyan-600/30 border border-cyan-500/30 text-cyan-200 font-sans font-bold text-[10px] rounded-lg tracking-wider transition-all uppercase flex items-center justify-center gap-1 cursor-pointer"
                  >
                    <Sparkles className="w-3.5 h-3.5 text-cyan-300 shrink-0" />
                    <span>Instant Guest Bypass</span>
                  </button>
                </div>
              </div>
            )}

            {!isMockMode && authError && (
              <div className="mb-4 p-3.5 bg-rose-950/20 border border-rose-500/20 rounded-2xl text-[11px] text-zinc-300 space-y-2 leading-relaxed animate-fadeIn">
                <div className="flex items-center gap-1.5 font-bold text-rose-400">
                  <AlertTriangle className="w-3.5 h-3.5 shrink-0 text-rose-400" />
                  <span>Socratic Security Connect Warning</span>
                </div>
                <p className="text-[10px] text-zinc-400">
                  {authError}
                </p>
                <div className="text-[9px] text-rose-300 border-t border-rose-500/10 pt-1.5 mt-1 font-sans">
                  💡 <strong>How to fix:</strong> Ensure you have enabled <strong>Email/Password</strong> or <strong>Google Provider</strong> in your Firebase Console (Authentication &gt; Sign-in method). If logging in from a sandboxed iframe, try opening this application in a <strong>new browser tab</strong>.
                </div>
              </div>
            )}

            {!isOtpMode ? (
              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-zinc-400 mb-1.5 font-sans">Email Address</label>
                  <input
                    type="email"
                    placeholder="student@example.com"
                    value={emailInput}
                    onChange={(e) => setEmailInput(e.target.value)}
                    className="w-full bg-white/5 border border-white/5 rounded-xl px-3.5 py-2.5 outline-none text-xs text-white focus:border-violet-500/50 transition-all font-medium"
                  />
                </div>
                <button
                  onClick={sendOTP}
                  className="w-full py-2.5 bg-violet-600 text-white rounded-xl hover:bg-violet-700 transition-all font-bold text-xs shadow mt-2 block duration-150 cursor-pointer"
                >
                  Send OTP Code
                </button>
 
                {/* Secure Divider for Continue with Google */}
                <div className="relative py-2 flex items-center justify-center">
                  <div className="absolute inset-0 flex items-center">
                    <span className="w-full border-t border-zinc-850" />
                  </div>
                  <span className="relative px-3 text-[10px] font-bold text-zinc-550 uppercase tracking-wider bg-[#0d0918]">or continue with</span>
                </div>

                {/* Preview Iframe Helper Banner */}
                {isIframe && (
                  <div className="p-3 bg-violet-950/20 border border-violet-500/15 rounded-xl text-[11px] text-zinc-300 leading-relaxed space-y-1 my-1.5 font-sans">
                    <div className="flex items-center gap-1.5 font-bold text-violet-400">
                      <HelpCircle className="w-3.5 h-3.5 shrink-0" />
                      <span>Google Login & Iframe Restrictions</span>
                    </div>
                    <p className="text-[10px] text-zinc-400">
                      Browsers block Google Authentication inside nested workspace frames. Open the app in a new tab to sign in with Google seamlessly:
                    </p>
                    <div className="pt-1 flex items-center gap-2">
                      <a
                        href={window.location.href}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="px-2 py-1 bg-cyan-950/40 hover:bg-cyan-900/40 text-cyan-400 border border-cyan-500/20 rounded-lg text-[10px] font-bold transition-all inline-flex items-center gap-1 cursor-pointer no-underline"
                      >
                        Launch in New Tab ↗
                      </a>
                      <span className="text-zinc-700 text-[9px]">or use the instant Email OTP flow</span>
                    </div>
                  </div>
                )}
 
                {/* Continue with Google trigger */}
                <button
                  onClick={loginWithGoogle}
                  className="w-full py-2.5 bg-zinc-900 hover:bg-zinc-850 text-white rounded-xl border border-zinc-800 transition-all font-bold text-xs flex items-center justify-center gap-2 cursor-pointer shadow duration-150"
                >
                  <svg className="w-4 h-4 shrink-0" viewBox="0 0 24 24">
                    <path
                      fill="#4285F4"
                      d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                    />
                    <path
                      fill="#34A853"
                      d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                    />
                    <path
                      fill="#FBBC05"
                      d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22c-.66-.61-1.04-1.37-1.18-1.63z"
                    />
                    <path
                      fill="#EA4335"
                      d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                    />
                  </svg>
                  <span>Continue with Google</span>
                </button>

                {/* Instant Sandbox Bypass */}
                <button
                  onClick={async () => {
                    await handleGuestSecureLogin();
                    setActiveTab("dashboard");
                  }}
                  className="w-full py-2.5 bg-zinc-950 hover:bg-zinc-900 text-zinc-300 rounded-xl border border-dashed border-zinc-800 hover:border-zinc-700 transition-all font-bold text-xs flex items-center justify-center gap-2 cursor-pointer shadow duration-150"
                >
                  <Sparkles className="w-4 h-4 text-violet-400 shrink-0" />
                  <span>Sandbox Guest Access (Bypass Auth)</span>
                </button>

                <p className="text-center text-[10px] text-zinc-550 mt-4 leading-relaxed font-sans">
                  LUNITO passwordless Socratic ecosystem is secured by standard secure tokens.
                </p>
              </div>
            ) : (
              <div className="space-y-5">
                {/* STRICTLY ONLY THE OTP DISPLAY (Per user requested specification) */}
                <div className="p-3.5 bg-violet-950/15 border border-violet-500/10 rounded-2xl flex flex-col items-center justify-center font-mono">
                  <span className="text-[10px] text-violet-400 tracking-widest font-bold uppercase mb-1">Your OTP Verification Code</span>
                  <span className="text-2xl font-black tracking-widest text-[#22D3EE]">{generatedOtp}</span>
                </div>
 
                <div className="text-center">
                  <p className="text-[11px] text-zinc-400 font-semibold mb-3 leading-relaxed">
                    Verify the security token above to authenticate your account
                  </p>
                  <div className="flex justify-center gap-1.5 matches-otp">
                    {otpArray.map((digit, index) => (
                      <input
                        key={index}
                        ref={otpRefs[index]}
                        type="text"
                        maxLength={1}
                        value={digit}
                        onChange={(e) => handleOtpChange(e.target.value, index)}
                        onKeyDown={(e) => handleOtpKeyDown(e, index)}
                        className="w-10 h-10 text-center text-lg font-bold bg-white/5 border border-white/10 rounded-xl outline-none focus:border-violet-500 text-white transition-all"
                      />
                    ))}
                  </div>
                </div>
 
                <div className="space-y-2 pt-1">
                  <button
                    onClick={verifyOTP}
                    className="w-full py-2.5 bg-violet-600 text-white rounded-xl hover:bg-violet-700 transition-all font-bold text-xs shadow cursor-pointer"
                  >
                    Verify & Connect
                  </button>

                  {/* Sandbox Bypass inside OTP view */}
                  <button
                    onClick={async () => {
                      await handleGuestSecureLogin();
                      setActiveTab("dashboard");
                    }}
                    className="w-full py-2 bg-zinc-950 hover:bg-zinc-900 border border-dashed border-zinc-850 text-zinc-400 hover:text-white rounded-xl font-bold text-[10px] sm:text-[11px] transition-all text-center block cursor-pointer flex items-center justify-center gap-1.5"
                  >
                    <Sparkles className="w-3.5 h-3.5 text-violet-400" />
                    <span>Quick Sandbox Access (Bypass Auth)</span>
                  </button>

                  <button
                    onClick={() => {
                      setIsOtpMode(false);
                      setOtpArray(["", "", "", "", "", ""]);
                    }}
                    className="w-full py-2 bg-zinc-900 border border-white/5 rounded-xl text-zinc-400 hover:text-white hover:bg-zinc-800 font-bold text-[11px] transition-all text-center block"
                  >
                    Back to Login
                  </button>
                </div>
              </div>
            )}
            
            {/* Direct Back to Landing Page trigger button */}
            <button
              onClick={() => setShowLandingPage(true)}
              className="w-full mt-4 py-2 bg-transparent hover:bg-white/5 text-zinc-450 hover:text-zinc-200 text-[10px] font-bold uppercase tracking-widest font-mono transition-all text-center rounded-xl cursor-pointer"
            >
              ← Back To Landing Page
            </button>
          </div>
        </div>
        )
      ) : (
        /* 2. CORE MASTER CONTAINER */
        <div className="flex min-h-screen bg-white text-[#111111] relative overflow-hidden font-sans">
          
          {/* Subtle overlay backdrop */}
          {sidebarOpen && (
            <div 
              className="lg:hidden fixed inset-0 z-40 bg-black/40 backdrop-blur-sm transition-opacity duration-300"
              onClick={() => setSidebarOpen(false)}
            />
          )}

          {/* Collapsible Modular Navigation Sidebar */}
          <SocraticSidebar
            activeTab={activeTab}
            setActiveTab={setActiveTab}
            sidebarOpen={sidebarOpen}
            setSidebarOpen={setSidebarOpen}
            displayName={displayName}
            emailDisplay={emailDisplay}
            realStreak={streakCount}
            logout={logout}
            setIsProfileModalOpen={setIsProfileModalOpen}
            setEditedName={setEditedName}
          />

          {/* MAIN PAGE CONTAINER WITH CONTENT */}
          <div className="flex-1 flex flex-col min-h-screen min-w-0 transition-all duration-300 ease-in-out">
            
            {/* STICKY MAIN APP GLOBAL NAVIGATION */}
            <header className="sticky top-0 z-30 bg-white/95 backdrop-blur-md border-b border-[#E5E5E5] px-4 md:px-6 py-3.5 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <button 
                  onClick={() => setSidebarOpen(!sidebarOpen)}
                  className="p-1.5 hover:bg-gray-100 rounded-lg text-[#666666] hover:text-[#111111] transition-all cursor-pointer"
                  aria-label="Toggle Sidebar Menu"
                >
                  <Menu className="w-5 h-5 text-[#10A37F]" />
                </button>
                <div>
                  <h2 className="text-sm md:text-base font-bold text-[#111111] capitalize leading-tight">
                    {activeTab === "settings" ? "Mentor Preferences" : activeTab === "test" ? "Socratic Assessment Portal" : activeTab === "dashboard" ? "Home" : activeTab === "chat" ? "AI Workspace" : activeTab === "roadmap" ? "Socratic Chat" : activeTab === "flashcards" ? "Revision Cards" : `${activeTab} Mode`}
                  </h2>
                  <p className="text-[10px] text-[#666666] font-mono font-medium lowercase">
                    Companion active: <span className="text-[#10A37F] font-bold uppercase font-sans text-[9px]">{tutoringStyle}</span>
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2.5">
                {currentStudySubject ? (
                  <div className="hidden sm:flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-50 border border-emerald-100 text-[#10A37F] text-[10px] font-bold">
                    <BookOpen className="w-3.5 h-3.5 text-[#10A37F]" />
                    <span>Studying: {currentStudySubject}</span>
                  </div>
                ) : (
                  <div className="hidden sm:flex items-center gap-1.5 px-3 py-1 rounded-full bg-rose-50 border border-rose-100 text-[#666666] text-[10px] font-bold animate-pulse">
                    <BookOpen className="w-3.5 h-3.5 text-rose-500" />
                    <span>No Active Focus</span>
                  </div>
                )}

                <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-orange-50 border border-orange-100 text-orange-650 text-[10px] font-bold">
                  <Flame className="w-3.5 h-3.5 text-orange-500" />
                  <span>{streakCount} Days</span>
                </div>

                <button 
                  onClick={() => {
                    setEditedName(displayName);
                    setIsProfileModalOpen(true);
                  }}
                  className="w-8 h-8 rounded-full bg-emerald-50 border border-[#E5E5E5] flex items-center justify-center shrink-0 cursor-pointer hover:opacity-90 active:scale-95 duration-100 transition-all shrink-0 hover:rotate-6 text-[#10A37F] font-bold text-xs"
                >
                  <span>{displayName?.charAt(0)?.toUpperCase()}</span>
                </button>
              </div>
            </header>

            {/* PERSISTENT STUDENT CONTEXT BAR: CLASS, BOARD, CURRICULUM PROGRESS */}
            {(() => {
              const activeSub = currentStudySubject || selectedSubject || "Mathematics";
              const currentTopics = getTopicsForSubject(activeSub);
              
              const parsedClass = selectedClass || "Class 10";
              const parsedBoard = selectedBoard || "CBSE";

              // Find completed chapters in current subjects
              const completedChapters = testHistory
                .filter(q => q.subject === activeSub && q.score && q.score !== "Active" && q.score !== "Demo")
                .map(q => {
                  const scoreStr = q.score;
                  let percentage = null;
                  if (scoreStr) {
                    const pctMatch = scoreStr.match(/\((\d+)%\)/);
                    if (pctMatch) percentage = parseInt(pctMatch[1], 10);
                    else {
                      const slashMatch = scoreStr.match(/(\d+)\s*\/\s*(\d+)/);
                      if (slashMatch) {
                        const num = parseInt(slashMatch[1], 10);
                        const den = parseInt(slashMatch[2], 10);
                        if (den > 0) percentage = Math.round((num / den) * 100);
                      }
                    }
                  }
                  return { topic: q.topic, passed: percentage !== null && percentage >= 80 };
                })
                .filter(t => t.passed)
                .map(t => t.topic);

              const completedActiveChapters = completedChapters.filter(v => currentTopics.includes(v));
              const progressPercentage = currentTopics.length > 0
                ? Math.round((completedActiveChapters.length / currentTopics.length) * 100)
                : 0;

              return (
                <div 
                  id="student-context-bar"
                  className="bg-[#F7F7F8] border-b border-[#E5E5E5] px-4 md:px-6 py-2.5 flex flex-wrap items-center justify-between gap-3 text-xs z-20 select-none shrink-0"
                >
                  <div className="flex items-center gap-2 lg:gap-3 flex-wrap">
                    <div className="flex items-center gap-1 bg-white border border-[#E5E5E5] px-2.5 py-1 rounded-lg text-[#111111]">
                      <span className="text-[9px] uppercase font-mono font-bold text-[#666666] tracking-wide">Grade</span>
                      <span className="font-bold">{parsedClass}</span>
                    </div>
                    
                    <div className="flex items-center gap-1 bg-white border border-[#E5E5E5] px-2.5 py-1 rounded-lg text-[#111111]">
                      <span className="text-[9px] uppercase font-mono font-bold text-[#666666] tracking-wide">Board</span>
                      <span className="font-bold">{parsedBoard}</span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 text-xs">
                    <span className="text-[10px] text-[#666666] font-bold uppercase tracking-wider font-mono">Curriculum progress:</span>
                    <div className="w-24 h-2 bg-gray-100 rounded-full overflow-hidden border border-[#E5E5E5]/20">
                      <div 
                        className="h-full bg-[#10A37F]"
                        style={{ width: `${progressPercentage}%` }}
                      />
                    </div>
                    <span className="text-[#111111] font-bold font-mono text-[11px]">
                      {progressPercentage}%
                    </span>
                  </div>
                </div>
              );
            })()}

            {/* DYNAMIC SCREEN CORE DISPLAY */}
            <main className="flex-1 p-4 md:p-6 flex flex-col min-h-0 relative bg-[#FFFFFF]">
              <AnimatePresence mode="wait">
                
                {/* TAB 1: DASHBOARD VIEW */}
                {activeTab === "dashboard" && (() => {
                  const totalChats = Object.values(subjectsProgress).reduce((acc, p: any) => acc + (p.chatsCount || 0), 0);
                  const realQuizzes = testHistory.filter(h => h.score && h.score !== "Active" && h.score !== "Demo");
                  const realQuizCount = realQuizzes.length;
                  const totalFlashcards = Object.values(subjectsProgress).reduce((acc, p: any) => acc + (p.flashcardCount || 0), 0);
                  const totalNotebookPages = Object.values(subjectsProgress).reduce((acc, p: any) => acc + (p.notebookPageCount || 0), 0);
                  const totalMinutes = (totalChats * 3) + (realQuizCount * 10) + (totalNotebookPages * 15) + (totalFlashcards * 5);
                  const formattedStudyTime = totalMinutes > 59 ? `${(totalMinutes / 60).toFixed(1)}h` : `${totalMinutes}m`;
                  const hasRealLearningData = totalChats > 0 || realQuizCount > 0 || totalNotebookPages > 0 || totalFlashcards > 0;
                  const realStreak = hasRealLearningData ? (streakCount || 1) : 0;
                  return (
                    <SocraticDashboard
                      displayName={displayName}
                      selectedClass={selectedClass}
                      setSelectedClass={setSelectedClass}
                      selectedBoard={selectedBoard}
                      setSelectedBoard={setSelectedBoard}
                      subjects={subjects}
                      subjectsProgress={subjectsProgress}
                      testHistory={testHistory}
                      userSyllabus={userSyllabus}
                      setUserSyllabus={setUserSyllabus}
                      syllabusSources={syllabusSources}
                      setSyllabusSources={setSyllabusSources}
                      newSubjectToManage={newSubjectToManage}
                      setNewSubjectToManage={setNewSubjectToManage}
                      handleAddCustomSubject={handleAddCustomSubject}
                      setCurrentStudySubject={setCurrentStudySubject}
                      setSelectedSubject={setSelectedSubject}
                      setSelectedTopic={setSelectedTopic}
                      setActiveTab={setActiveTab}
                      triggerNotification={triggerNotification}
                      isFetchingSyllabus={isFetchingSyllabus}
                      setIsFetchingSyllabus={setIsFetchingSyllabus}
                      safeFetch={safeFetch}
                      db={db}
                      auth={auth}
                      getTopicsForSubject={getTopicsForSubject}
                      realStreak={realStreak}
                      formattedStudyTime={formattedStudyTime}
                    />
                  );
                })()}

                {/* TAB: PERSONAL ROAMAP & SOCRATIC HOMEWORK WORKSPACE */}
                {activeTab === "roadmap" && (
                  !currentStudySubject ? renderSubjectGate("Socratic Roadmap & Homework") : (
                    <SocraticRoadmap
                      userMood={userMood}
                      setUserMood={setUserMood}
                      tutorTone={tutorTone}
                      setTutorTone={setTutorTone}
                      roadmapData={roadmapData}
                      setRoadmapData={setRoadmapData}
                      homeworks={homeworks}
                      setHomeworks={setHomeworks}
                      diagnosedWeakAreas={diagnosedWeakAreas}
                      setDiagnosedWeakAreas={setDiagnosedWeakAreas}
                      diagnosedStrongAreas={diagnosedStrongAreas}
                      setDiagnosedStrongAreas={setDiagnosedStrongAreas}
                      activeSubject={currentStudySubject}
                      subjects={subjects}
                      setCurrentStudySubject={setCurrentStudySubject}
                      selectedClass={selectedClass}
                      selectedBoard={selectedBoard}
                      safeFetch={safeFetch}
                      db={db}
                      auth={auth}
                      triggerNotification={triggerNotification}
                      parseTextWithMath={renderTextWithMath}
                    />
                  )
                )}

                {/* TAB 2: ACTIVE SOCRATIC CHAT VIEW */}
                {activeTab === "chat" && (
                  !currentStudySubject ? renderSubjectGate("Socratic Chat") : (
                    <SocraticChat
                      messages={messages}
                      setMessages={setMessages}
                      chatInput={chatInput}
                      setChatInput={setChatInput}
                      attachedFile={attachedFile}
                      setAttachedFile={setAttachedFile}
                      isAiTyping={isAiTyping}
                      setIsAiTyping={setIsAiTyping}
                      thinkWithMeActive={thinkWithMeActive}
                      setThinkWithMeActive={setThinkWithMeActive}
                      chatThreads={chatThreads}
                      activeChatId={activeChatId}
                      setActiveChatId={setActiveChatId}
                      isLoadingThreads={isLoadingThreads}
                      isLoadingMessages={isLoadingMessages}
                      loadChatMessages={loadChatMessages}
                      deleteChatSession={deleteChatSession}
                      startNewChatThread={startNewChatThread}
                      handleSendMessage={handleSendMessage}
                      triggerQuickAction={triggerQuickAction}
                      setCurrentStudySubject={setCurrentStudySubject}
                      currentStudySubject={currentStudySubject}
                      subjects={subjects}
                      selectedSubject={selectedSubject}
                      selectedTopic={selectedTopic}
                      chatSubject={chatSubject}
                      setChatSubject={setChatSubject}
                      chatCustomSubject={chatCustomSubject}
                      setChatCustomSubject={setChatCustomSubject}
                      connectedResource={connectedResource}
                      setConnectedResource={setConnectedResource}
                      isResourceModalOpen={isResourceModalOpen}
                      setIsResourceModalOpen={setIsResourceModalOpen}
                      resourceInputName={resourceInputName}
                      setResourceInputName={setResourceInputName}
                      resourceInputUrl={resourceInputUrl}
                      setResourceInputUrl={setResourceInputUrl}
                      resourceInputSnippet={resourceInputSnippet}
                      setResourceInputSnippet={setResourceInputSnippet}
                      triggerNotification={triggerNotification}
                      parseTextWithMath={renderTextWithMath}
                    />
                  )
                )}

                {/* TAB 3: IMAGES & HANDWRITTEN NOTEBOOK */}
                {activeTab === "notebook" && (
                  !currentStudySubject ? renderSubjectGate("Socratic Notebook") : (
                    <SocraticNotebook
                      notebookPages={notebookPages}
                      setNotebookPages={setNotebookPages}
                      notebookPage={notebookPage}
                      setNotebookPage={setNotebookPage}
                      notebookTotalPages={notebookTotalPages}
                      notebookSearch={notebookSearch}
                      setNotebookSearch={setNotebookSearch}
                      exportNotebookPageToPdf={exportNotebookPageToPdf}
                      triggerNotification={triggerNotification}
                      currentStudySubject={currentStudySubject}
                      db={db}
                      auth={auth}
                      parseTextWithMath={renderTextWithMath}
                      safeFetch={safeFetch}
                    />
                  )
                )}

                {/* TAB 4: PROGRESS TRACKER */}
                {activeTab === "progress" && (
                  <SocraticAnalytics
                    subjects={subjects}
                    subjectsProgress={subjectsProgress}
                    setStreakCount={setStreakCount}
                    updateFirestoreStats={updateFirestoreStats}
                    triggerNotification={triggerNotification}
                  />
                )}

                {/* TAB 5: REVISION CARDS DECKS */}
                {activeTab === "flashcards" && (
                  !currentStudySubject ? renderSubjectGate("Revision Cards") : (
                    <SocraticFlashcards
                      selectedSubject={selectedSubject}
                      selectedTopic={selectedTopic}
                      setSelectedTopic={setSelectedTopic}
                      currentStudySubject={currentStudySubject}
                      isGeneratingFlashcards={isGeneratingFlashcards}
                      generateFlashcardsFromAI={generateFlashcardsFromAI}
                      flashcardMessages={flashcardMessages}
                      isFlashcardAiTyping={isFlashcardAiTyping}
                      flashcards={flashcards}
                      flippedCards={flippedCards}
                      toggleCardFlip={toggleCardFlip}
                      deleteFlashcard={deleteFlashcard}
                      isCreatingFlashcard={isCreatingFlashcard}
                      setIsCreatingFlashcard={setIsCreatingFlashcard}
                      newCardQuestion={newCardQuestion}
                      setNewCardQuestion={setNewCardQuestion}
                      newCardAnswer={newCardAnswer}
                      setNewCardAnswer={setNewCardAnswer}
                      addFlashcard={addFlashcard}
                      flashcardsHistory={flashcardsHistory}
                      aiGeneratedFlashcardsSaved={aiGeneratedFlashcardsSaved}
                      aiGeneratedFlashcards={aiGeneratedFlashcards}
                      saveAiGeneratedFlashcards={saveAiGeneratedFlashcards}
                      clearAiGeneratedFlashcards={clearAiGeneratedFlashcards}
                      triggerNotification={triggerNotification}
                      renderTextWithMath={renderTextWithMath}
                      clearAllFlashcards={clearAllFlashcards}
                    />
                  )
                )}

                {/* TAB 6: SOCRATIC ASSESSMENT / TEST MODE */}
                {activeTab === "test" && (
                  !currentStudySubject ? renderSubjectGate("Socratic Assessment") : (
                    <SocraticQuizzes
                      selectedSubject={selectedSubject}
                      setSelectedSubject={setSelectedSubject}
                      selectedTopic={selectedTopic}
                      setSelectedTopic={setSelectedTopic}
                      currentStudySubject={currentStudySubject}
                      isGeneratingQuiz={isGeneratingQuiz}
                      generateQuizFromAI={generateQuizFromAI}
                      quizQuestions={quizQuestions}
                      quizCompleted={quizCompleted}
                      quizIndex={quizIndex}
                      quizScore={quizScore}
                      quizSubmitted={quizSubmitted}
                      selectedQuizOption={selectedQuizOption}
                      quizTimeLeft={quizTimeLeft}
                      quizHistory={testHistory}
                      testMessages={testMessages}
                      isTestAiTyping={isTestAiTyping}
                      submitQuizAnswer={submitQuizAnswer}
                      nextQuizQuestion={nextQuizQuestion}
                      resetQuiz={resetQuiz}
                      subjects={subjects}
                      formatTime={formatTime}
                      setTestChatInput={setTestChatInput}
                      testChatInput={testChatInput}
                      handleSendTestChat={handleTestChatSubmit}
                      triggerNotification={triggerNotification}
                      renderTextWithMath={renderTextWithMath}
                    />
                  )
                )}


                {/* TAB 7: PREFERENCES & SYSTEM TUNING */}
                {activeTab === "settings" && (
                  <SocraticSettings
                    displayName={displayName}
                    setDisplayName={setDisplayName}
                    emailDisplay={emailDisplay}
                    isGuestBypass={isGuestBypass}
                    guestChatsCounter={guestChatsCounter}
                    chatsToday={chatsToday}
                    plan={plan}
                    setIsLimitModalOpen={setIsLimitModalOpen}
                    tutoringStyle={tutoringStyle}
                    setTutoringStyle={setTutoringStyle}
                    darkModeToggle={darkModeToggle}
                    setDarkModeToggle={setDarkModeToggle}
                    notificationsToggle={notificationsToggle}
                    setNotificationsToggle={setNotificationsToggle}
                    triggerNotification={triggerNotification}
                    db={db}
                    auth={auth}
                  />
                )}

              </AnimatePresence>
            </main>



      {/* MODAL: CONNECT ONLINE STUDY RESOURCES */}
      <AnimatePresence>
        {isResourceModalOpen && (
          <div className="fixed inset-0 z-[10000] flex items-center justify-center p-4">
            {/* Dark glass backdrop overlay */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsResourceModalOpen(false)}
              className="absolute inset-0 bg-black/80 backdrop-blur-md"
            />

            {/* Modal Dialog container content */}
            <motion.div
              initial={{ scale: 0.95, opacity: 0, y: 30 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.95, opacity: 0, y: 30 }}
              transition={{ type: "spring", damping: 25, stiffness: 350 }}
              className="bg-zinc-950 border border-violet-500/20 rounded-3xl w-full max-w-xl overflow-hidden shadow-2xl relative p-6 max-h-[90vh] flex flex-col justify-between"
            >
              {/* Card headers */}
              <div className="flex items-start justify-between pb-4 border-b border-white/5 mb-4 font-sans">
                <div>
                  <h3 className="text-lg font-black text-white flex items-center gap-2">
                    <BookOpen className="w-5 h-5 text-violet-400" />
                    <span>Connect Online Study Reference</span>
                  </h3>
                  <p className="text-xs text-zinc-400 mt-1">Socratic LUNITO will read and align its simple tutorials to this resource material's principles.</p>
                </div>
                <button
                  onClick={() => setIsResourceModalOpen(false)}
                  className="p-1.5 hover:bg-white/5 text-zinc-400 hover:text-white rounded-lg transition-all cursor-pointer font-sans"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Input Form Fields */}
              <div className="space-y-4 my-2 flex-grow overflow-y-auto no-scrollbar pr-1">
                <div>
                  <label className="block text-[10px] font-bold text-zinc-400 uppercase tracking-widest mb-1.5 font-mono">Resource / Document Title</label>
                  <input
                    type="text"
                    placeholder="e.g. Wikipedia: Photosynthesis overview, Biology Lecture Notes..."
                    value={resourceInputName}
                    onChange={(e) => setResourceInputName(e.target.value)}
                    className="w-full bg-white/5 text-xs text-white font-semibold px-3 py-2.5 rounded-xl border border-white/10 outline-none focus:border-violet-500 transition-all font-sans placeholder-zinc-600"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-zinc-400 uppercase tracking-widest mb-1.5 font-mono">Reference URL or Online Link</label>
                  <input
                    type="url"
                    placeholder="e.g. https://en.wikipedia.org/wiki/Photosynthesis"
                    value={resourceInputUrl}
                    onChange={(e) => setResourceInputUrl(e.target.value)}
                    className="w-full bg-white/5 text-xs text-white font-semibold px-3 py-2.5 rounded-xl border border-white/10 outline-none focus:border-violet-500 transition-all font-sans placeholder-zinc-600"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-zinc-400 uppercase tracking-widest mb-1 hover:text-violet-300 font-mono flex items-center justify-between">
                    <span>Key Excerpts, Highlights or Text Copy (Optional)</span>
                    <span className="text-[9px] text-zinc-500 normal-case font-sans">Ensures perfect AI grounding</span>
                  </label>
                  <textarea
                    rows={4}
                    placeholder="Copy-paste outline points, main book sections, Wikipedia introductory sentences, or course syllabus items here..."
                    value={resourceInputSnippet}
                    onChange={(e) => setResourceInputSnippet(e.target.value)}
                    className="w-full bg-white/5 text-xs text-white font-medium px-3 py-2.5 rounded-xl border border-white/10 outline-none focus:border-violet-500 transition-all font-sans placeholder-zinc-650 resize-none h-[110px]"
                  />
                </div>
              </div>

              {/* Confirm Actions Row */}
              <div className="flex items-center gap-2 pt-4 border-t border-white/5 mt-4">
                <button
                  type="button"
                  onClick={() => setIsResourceModalOpen(false)}
                  className="flex-1 py-2.5 rounded-xl text-xs font-bold text-zinc-400 hover:text-white bg-white/5 hover:bg-white/10 border border-white/5 transition-all text-center cursor-pointer font-sans"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={() => {
                    if (!resourceInputName.trim()) {
                      triggerNotification("Please type a friendly title for this study resource material", "error");
                      return;
                    }
                    if (!resourceInputUrl.trim()) {
                      triggerNotification("Please enter a valid link or reference identifier", "error");
                      return;
                    }

                    setConnectedResource({
                      name: resourceInputName.trim(),
                      url: resourceInputUrl.trim(),
                      snippet: resourceInputSnippet.trim()
                    });

                    setIsResourceModalOpen(false);
                    triggerNotification(`Successfully connected study resource: ${resourceInputName}! LUNITO AI will ground lessons here.`, "success");
                  }}
                  className="flex-grow py-2.5 rounded-xl text-xs font-bold text-white bg-violet-600 hover:bg-violet-700 border border-violet-500/20 shadow transition-all text-center cursor-pointer font-sans"
                >
                  {connectedResource ? "Save Updates" : "🔗 Connect Study Material"}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
      <AnimatePresence>
        {isFocusModalOpen && (
          <div className="fixed inset-0 z-[10000] flex items-center justify-center p-4">
            {/* Dark glass backdrop overlay */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsFocusModalOpen(false)}
              className="absolute inset-0 bg-black/80 backdrop-blur-md"
            />

            {/* Modal Dialog container content */}
            <motion.div
              initial={{ scale: 0.95, opacity: 0, y: 30 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.95, opacity: 0, y: 30 }}
              transition={{ type: "spring", damping: 25, stiffness: 350 }}
              className="bg-zinc-950 border border-violet-500/20 rounded-3xl w-full max-w-2xl overflow-hidden shadow-2xl relative p-6 max-h-[90vh] flex flex-col justify-between"
            >
              {/* Card headers */}
              <div className="flex items-start justify-between pb-4 border-b border-white/5 mb-6">
                <div>
                  <h3 className="text-xl font-black text-white">Choose Your Study Destination</h3>
                  <p className="text-xs text-zinc-400 mt-1">LUNITO AI will adapt all chats, lessons, test modules, and revision cards to this topic focus.</p>
                </div>
                <button
                  onClick={() => setIsFocusModalOpen(false)}
                  className="p-1 px-1.5 hover:bg-white/5 text-zinc-400 hover:text-white rounded-lg transition-all cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Core selection views */}
              <div className="flex-1 overflow-y-auto space-y-6 pr-1 select-none no-scrollbar">
                
                {/* Subjects choice list */}
                <div>
                  <label className="block text-[10px] font-bold text-zinc-400 uppercase tracking-widest mb-3 font-mono">Academic Field</label>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
                    {Object.keys(userSyllabus || SUBJECTS_DATABASE).map((sub) => {
                      const isSelected = selectedSubject === sub && !showCustomFields;
                      const topicsCount = getTopicsForSubject(sub).length;
                      return (
                        <button
                          key={sub}
                          onClick={() => {
                            setSelectedSubject(sub);
                            setShowCustomFields(false);
                            // Pre-fill first topic
                            setSelectedTopic(getTopicsForSubject(sub)[0] || "General Core");
                          }}
                          className={`p-3 rounded-xl border text-left transition-all relative group cursor-pointer ${
                            isSelected
                              ? "border-violet-500 bg-violet-600/15 text-white"
                              : "border-white/5 hover:border-white/20 bg-white/5 text-zinc-300"
                          }`}
                        >
                          <div className={`text-xs font-bold leading-relaxed ${isSelected ? "text-violet-400" : "text-white"}`}>{sub}</div>
                          <span className="text-[10px] text-zinc-500 block mt-0.5 font-medium">
                            {topicsCount} Topics Available
                          </span>
                        </button>
                      );
                    })}

                    {/* Custom Toggle Option */}
                    <button
                      onClick={() => {
                        setShowCustomFields(true);
                      }}
                      className={`p-3 rounded-xl border text-left transition-all cursor-pointer ${
                        showCustomFields
                          ? "border-cyan-500 bg-cyan-500/10 text-white"
                          : "border-white/5 hover:border-white/20 bg-white/5 text-zinc-300"
                      }`}
                    >
                      <div className="text-xs font-bold text-cyan-400 leading-relaxed">✏️ Custom Topic etc...</div>
                      <span className="text-[10px] text-zinc-500 block mt-0.5">Define custom path</span>
                    </button>
                  </div>
                </div>

                {/* Sub-topics display or Custom inputs */}
                {!showCustomFields ? (
                  <div>
                    <label className="block text-[10px] font-bold text-zinc-400 uppercase tracking-widest mb-3 font-mono">
                      Select Topic under {selectedSubject}
                    </label>
                    
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      {getTopicsForSubject(selectedSubject)?.map((tp) => {
                        const isSelected = selectedTopic === tp;
                        return (
                          <button
                            key={tp}
                            onClick={() => setSelectedTopic(tp)}
                            className={`p-3.5 rounded-xl border text-left text-xs font-semibold tracking-wide transition-all cursor-pointer ${
                              isSelected
                                ? "border-cyan-500 bg-cyan-600/15 text-cyan-305 font-bold"
                                : "border-white/5 hover:border-white/10 text-zinc-405 hover:text-white"
                            }`}
                          >
                            <span>{tp}</span>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                ) : (
                  <div className="space-y-4 p-4 border border-cyan-500/10 rounded-2xl bg-cyan-500/5">
                    <h4 className="text-xs font-mono font-bold uppercase tracking-widest text-cyan-400">Enter Custom Syllabus Details</h4>
                    
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-[9px] font-bold text-zinc-400 uppercase tracking-widest mb-1.5 font-mono">Custom Subject Name</label>
                        <input
                          type="text"
                          placeholder="e.g. World History"
                          value={customSubjectInput}
                          onChange={(e) => setCustomSubjectInput(e.target.value)}
                          className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 outline-none text-xs text-white focus:border-cyan-500 transition-all font-semibold"
                        />
                      </div>
                      <div>
                        <label className="block text-[9px] font-bold text-zinc-400 uppercase tracking-widest mb-1.5 font-mono">Custom Topic Name</label>
                        <input
                          type="text"
                          placeholder="e.g. French Revolution"
                          value={customTopicInput}
                          onChange={(e) => setCustomTopicInput(e.target.value)}
                          className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 outline-none text-xs text-white focus:border-cyan-500 transition-all font-semibold"
                        />
                      </div>
                    </div>
                  </div>
                )}

              </div>

              {/* Action Buttons */}
              <div className="pt-4 border-t border-white/5 mt-6 flex justify-end gap-3">
                <button
                  onClick={() => setIsFocusModalOpen(false)}
                  className="px-4 py-2 bg-zinc-900 hover:bg-zinc-800 text-zinc-400 hover:text-white text-xs font-bold rounded-xl transition-all cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  onClick={() => {
                    if (showCustomFields) {
                      if (!customSubjectInput.trim() || !customTopicInput.trim()) {
                        triggerNotification("Please fill out both the custom subject and topic fields", "error");
                        return;
                      }
                      handleSelectSubjectAndTopic(customSubjectInput.trim(), customTopicInput.trim());
                    } else {
                      handleSelectSubjectAndTopic(selectedSubject, selectedTopic);
                    }
                  }}
                  className="px-5 py-2.5 bg-gradient-to-r from-violet-605 to-indigo-605 text-white font-bold text-xs rounded-xl shadow-lg shadow-violet-500/20 active:scale-95 duration-100 transition-all cursor-pointer"
                >
                  Confirm Study Focus
                </button>
              </div>

            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* MODAL: CHAT LIMIT EXCEEDED AND PLANS OFFER */}
      <AnimatePresence>
        {isLimitModalOpen && (
          <div className="fixed inset-0 z-[10005] flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsLimitModalOpen(false)}
              className="absolute inset-0 bg-black/85 backdrop-blur-md"
            />

            <motion.div
              initial={{ scale: 0.95, opacity: 0, y: 30 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.95, opacity: 0, y: 30 }}
              transition={{ type: "spring", damping: 25, stiffness: 350 }}
              className="bg-zinc-950 border border-violet-500/30 rounded-3xl w-full max-w-xl overflow-hidden shadow-2xl relative p-6 max-h-[95vh] flex flex-col justify-between z-[10010]"
            >
              <div className="flex items-start justify-between pb-3 border-b border-white/5 mb-5">
                <div>
                  <h3 className="text-lg font-black text-white flex items-center gap-1.5 leading-none">
                    <span className="text-yellow-450 text-xl font-bold">⚠️</span>
                    <span>Chat Limit Reached</span>
                  </h3>
                  <p className="text-xs text-zinc-400 mt-1 font-sans">You have exceeded the allocated Socratic messages. Please select an upgrade option below to resume Socratic Tutoring.</p>
                </div>
                <button
                  onClick={() => setIsLimitModalOpen(false)}
                  className="p-1 px-[7px] bg-white/5 hover:bg-white/10 text-zinc-400 hover:text-white rounded-lg transition-all cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="space-y-4 overflow-y-auto pr-1 select-none flex-1 no-scrollbar mb-5 font-sans">
                {/* Free, Pro, and Elite packages */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3 font-sans">
                  
                  {/* Card 1: Free Tier */}
                  <div className={`p-4 rounded-xl border relative flex flex-col justify-between transition-all ${
                    plan === "free" 
                      ? "border-zinc-500/30 bg-zinc-900/40" 
                      : "border-white/5 bg-white/5"
                  }`}>
                    <div>
                      <div className="text-[10px] font-mono font-bold tracking-widest text-zinc-400 uppercase mb-1">Tier 01</div>
                      <h4 className="text-xs font-bold text-white uppercase tracking-wider">Free Plan</h4>
                      <p className="text-[10.5px] text-zinc-400 mt-1 leading-normal font-sans">Basic Socratic study companion access.</p>
                    </div>
                    <div className="mt-4 pt-3 border-t border-white/5">
                      <div className="text-base font-black text-white">10 <span className="text-[10px] font-normal text-zinc-500">chats/day</span></div>
                      <div className="text-[10px] text-violet-450 font-bold mt-1 font-sans">Free Lifetime</div>
                      <button 
                        disabled
                        className="w-full mt-3 py-1.5 bg-zinc-800 text-zinc-500 text-[10px] font-bold rounded-lg cursor-not-allowed font-sans"
                      >
                        {plan === "free" ? "Active Now" : "Standard"}
                      </button>
                    </div>
                  </div>

                  {/* Card 2: Pro Tier */}
                  <div className={`p-4 rounded-xl border relative flex flex-col justify-between transition-all overflow-hidden ${
                    plan === "pro" 
                      ? "border-violet-500 bg-violet-950/20" 
                      : "border-violet-500/30 bg-violet-500/5 hover:border-violet-450"
                  }`}>
                    <div className="absolute top-0 right-0 bg-violet-600 text-[8px] font-black tracking-widest text-white px-2 py-0.5 rounded-bl uppercase font-sans">Popular</div>
                    <div>
                      <div className="text-[10px] font-mono font-bold tracking-widest text-violet-450 uppercase mb-1">Tier 02</div>
                      <h4 className="text-xs font-bold text-white uppercase tracking-wider">Pro Plan</h4>
                      <p className="text-[10.5px] text-zinc-405 mt-1 leading-normal font-sans">Optimized count for standard study sessions.</p>
                    </div>
                    <div className="mt-4 pt-3 border-t border-white/5">
                      <div className="text-base font-black text-white">40 <span className="text-[10px] font-normal text-zinc-450">chats/day</span></div>
                      <div className="text-[10px] text-violet-350 font-bold mt-1 font-sans">$1 / Month</div>
                      <button 
                        onClick={() => handleUpgradePlan("pro")}
                        className="w-full mt-3 py-1.5 bg-violet-600 hover:bg-violet-500 text-white text-[10px] font-bold rounded-lg relative active:scale-95 duration-100 transition-all cursor-pointer shadow-md shadow-violet-500/10 font-sans"
                      >
                        {plan === "pro" ? "Selected" : "Select Pro"}
                      </button>
                    </div>
                  </div>

                  {/* Card 3: Elite Tier */}
                  <div className={`p-4 rounded-xl border relative flex flex-col justify-between transition-all ${
                    plan === "elite" 
                      ? "border-cyan-500 bg-cyan-950/20" 
                      : "border-cyan-500/30 bg-cyan-500/5 hover:border-cyan-450"
                  }`}>
                    <div>
                      <div className="text-[10px] font-mono font-bold tracking-widest text-cyan-405 uppercase mb-1">Tier 03</div>
                      <h4 className="text-xs font-bold text-white uppercase tracking-wider">Elite Plan</h4>
                      <p className="text-[10.5px] text-zinc-400 mt-1 leading-normal font-sans font-sans">Dynamic Socratic exploration maximum speed.</p>
                    </div>
                    <div className="mt-4 pt-3 border-t border-white/5">
                      <div className="text-base font-black text-white">80 <span className="text-[10px] font-normal text-zinc-405 font-sans">chats/day</span></div>
                      <div className="text-[10px] text-cyan-350 font-bold mt-1 font-sans font-sans">$5 / Month</div>
                      <button 
                        onClick={() => handleUpgradePlan("elite")}
                        className="w-full mt-3 py-1.5 bg-cyan-600 hover:bg-cyan-500 text-white text-[10px] font-bold rounded-lg relative active:scale-95 duration-100 transition-all cursor-pointer shadow-md shadow-cyan-500/10 font-sans"
                      >
                        {plan === "elite" ? "Selected" : "Select Elite"}
                      </button>
                    </div>
                  </div>

                </div>

                <div className="p-3 bg-zinc-900/50 rounded-xl border border-zinc-850 flex items-center gap-2">
                  <span className="text-sm">💡</span>
                  <div className="text-[10.5px] text-zinc-400 leading-relaxed font-sans">
                    Chat counters are updated on solid-state Firestore endpoints automatically. Standard plans unlock full custom widgets, Socratic notebook solvers, and revision decks lifetime.
                  </div>
                </div>
              </div>

              <div className="pt-3 border-t border-white/5 flex justify-end">
                <button
                  onClick={() => setIsLimitModalOpen(false)}
                  className="px-4 py-2 bg-zinc-900 border border-white/5 hover:border-white/10 text-zinc-300 hover:text-white text-xs font-bold rounded-xl transition-all cursor-pointer font-sans"
                >
                  Close & Continue
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* MODAL: PROFILE & MEMBERSHIP EXPLORER */}
      <AnimatePresence>
        {isProfileModalOpen && (
          <div className="fixed inset-0 z-[10005] flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsProfileModalOpen(false)}
              className="absolute inset-0 bg-black/85 backdrop-blur-md"
            />

            <motion.div
              initial={{ scale: 0.95, opacity: 0, y: 30 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.95, opacity: 0, y: 30 }}
              transition={{ type: "spring", damping: 25, stiffness: 350 }}
              className="bg-zinc-950 border border-violet-500/35 rounded-3xl w-full max-w-xl overflow-hidden shadow-2xl relative p-6 max-h-[95vh] flex flex-col justify-between z-[10010]"
            >
              <div className="flex items-start justify-between pb-3 border-b border-white/5 mb-4">
                <div>
                  <h3 className="text-base font-bold text-white flex items-center gap-2 tracking-tight">
                    <User className="w-5 h-5 text-violet-400" />
                    <span>Socratic Scholar Profile</span>
                  </h3>
                  <p className="text-[11px] text-zinc-400 mt-0.5">Manage your identity preferences and Socratic subscription plan.</p>
                </div>
                <button
                  onClick={() => setIsProfileModalOpen(false)}
                  className="p-1 px-[7px] bg-white/5 hover:bg-white/10 text-zinc-400 hover:text-white rounded-lg transition-all cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="space-y-4 overflow-y-auto pr-1 flex-1 no-scrollbar mb-4">
                {/* ID & EDIT GROUP */}
                <div className="p-4 rounded-xl bg-white/5 border border-white/5 space-y-3.5">
                  <div>
                    <label className="block text-[10px] font-bold text-zinc-400 uppercase tracking-widest mb-1.5 font-mono font-sans">Scholar Study Email</label>
                    <div className="text-xs text-violet-300 font-semibold bg-white/5 px-3 py-2 rounded-lg border border-white/5 select-all font-sans">
                      {emailDisplay}
                    </div>
                  </div>

                  <div>
                    <label className="block text-[10px] font-bold text-zinc-400 uppercase tracking-widest mb-1.5 font-mono font-sans">Edit Scholar Name</label>
                    <div className="flex gap-2">
                      <input 
                        type="text" 
                        value={editedName}
                        onChange={(e) => setEditedName(e.target.value)}
                        className="flex-1 bg-zinc-900 border border-white/10 rounded-lg px-3 py-2 text-xs text-white outline-none focus:border-violet-500 transition-all font-semibold font-sans animate-pulse-subtle"
                        placeholder="Enter scholar name..."
                      />
                      <button 
                        onClick={handleSaveProfileName}
                        className="px-4 py-2 bg-violet-650 hover:bg-violet-550 text-white text-[11px] font-bold tracking-wide rounded-lg cursor-pointer transition-colors font-sans"
                      >
                        Save Name
                      </button>
                    </div>
                  </div>
                </div>

                {/* MEMBERSHIP PLANS HEAD */}
                <div className="space-y-2.5">
                  <div className="flex justify-between items-center">
                    <h4 className="text-[11px] font-bold text-zinc-350 uppercase tracking-wider font-mono font-sans">Available Study Plans</h4>
                    <span className="text-[10px] text-violet-400 font-mono font-bold uppercase font-sans">
                      Current: {plan.toUpperCase()}
                    </span>
                  </div>

                  <div className="grid grid-cols-1 gap-2.5">
                    {/* Free Plan */}
                    <div className={`p-3.5 rounded-xl border flex items-center justify-between transition-all ${
                      plan === "free" ? "border-zinc-500/30 bg-zinc-900/30" : "border-white/5 bg-white/5"
                    }`}>
                      <div className="space-y-0.5">
                        <div className="flex items-center gap-1.5">
                          <span className="text-xs font-bold text-white">Free Plan</span>
                          {plan === "free" && <span className="text-[8px] bg-green-500/10 text-green-400 border border-green-500/15 px-1.5 py-0.2 rounded-full font-bold uppercase tracking-wider leading-none font-sans">Active</span>}
                        </div>
                        <p className="text-[10px] text-zinc-400 font-sans">Basic Socratic study access</p>
                        <p className="text-[10.5px] text-violet-400 font-medium font-sans">10 chats daily • Free Lifetime</p>
                      </div>
                      <button 
                        disabled
                        className="px-3 py-1.5 bg-zinc-800 text-zinc-500 text-[10px] font-bold rounded-lg cursor-not-allowed uppercase font-sans"
                      >
                        {plan === "free" ? "Active" : "Standard"}
                      </button>
                    </div>

                    {/* Pro Plan */}
                    <div className={`p-3.5 rounded-xl border flex items-center justify-between transition-all ${
                      plan === "pro" ? "border-violet-500 bg-violet-950/20" : "border-violet-500/15 bg-violet-500/5 hover:border-violet-450"
                    }`}>
                      <div className="space-y-0.5">
                        <div className="flex items-center gap-1.5">
                          <span className="text-xs font-bold text-white">Pro Plan</span>
                          {plan === "pro" && <span className="text-[8px] bg-green-500/10 text-green-400 border border-green-500/15 px-1.5 py-0.2 rounded-full font-bold uppercase tracking-wider leading-none font-sans">Active</span>}
                          <span className="text-[8px] bg-violet-500/20 text-violet-350 px-1.5 py-0.2 rounded-full font-bold uppercase tracking-widest font-sans">Popular</span>
                        </div>
                        <p className="text-[10px] text-zinc-400 font-sans">Optimized count for standard study sessions</p>
                        <p className="text-[10.5px] text-violet-400 font-medium font-sans font-sans">40 chats daily • $1 / Month</p>
                      </div>
                      <button 
                        onClick={() => handleUpgradePlan("pro")}
                        className="px-3.5 py-1.5 bg-violet-600 hover:bg-violet-550 text-white text-[10px] font-bold rounded-lg active:scale-95 duration-100 transition-all cursor-pointer uppercase shadow-md shadow-violet-500/10 font-sans"
                      >
                        {plan === "pro" ? "Active" : "Buy Pro"}
                      </button>
                    </div>

                    {/* Elite Plan */}
                    <div className={`p-3.5 rounded-xl border flex items-center justify-between transition-all ${
                      plan === "elite" ? "border-cyan-500 bg-cyan-950/20" : "border-cyan-500/20 bg-cyan-500/5 hover:border-cyan-450"
                    }`}>
                      <div className="space-y-0.5">
                        <div className="flex items-center gap-1.5">
                          <span className="text-xs font-bold text-white">Elite Plan</span>
                          {plan === "elite" && <span className="text-[8px] bg-green-500/10 text-green-400 border border-green-500/15 px-1.5 py-0.2 rounded-full font-bold uppercase tracking-wider leading-none font-sans">Active</span>}
                        </div>
                        <p className="text-[10px] text-zinc-400 font-sans">Dynamic Socratic exploration maximum speed</p>
                        <p className="text-[10.5px] text-cyan-400 font-medium font-sans font-sans">80 chats daily • $5 / Month</p>
                      </div>
                      <button 
                        onClick={() => handleUpgradePlan("elite")}
                        className="px-3.5 py-1.5 bg-cyan-600 hover:bg-cyan-550 text-white text-[10px] font-bold rounded-lg active:scale-95 duration-100 transition-all cursor-pointer uppercase shadow-md shadow-cyan-500/10 font-sans"
                      >
                        {plan === "elite" ? "Active" : "Buy Elite"}
                      </button>
                    </div>

                  </div>
                </div>

              </div>

              <div className="pt-3 border-t border-white/5 flex justify-end">
                <button
                  onClick={() => setIsProfileModalOpen(false)}
                  className="px-4 py-2 bg-zinc-900 border border-white/5 hover:border-white/10 text-zinc-300 hover:text-white text-xs font-bold rounded-xl transition-all cursor-pointer font-sans"
                >
                  Close Profile
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* MODAL: GUEST USER PAYMENT GOOGLE AUTH PROMPT */}
      <AnimatePresence>
        {isGuestPaymentModalOpen && (
          <div className="fixed inset-0 z-[10005] flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsGuestPaymentModalOpen(false)}
              className="absolute inset-0 bg-black/85 backdrop-blur-md"
            />

            <motion.div
              initial={{ scale: 0.95, opacity: 0, y: 30 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.95, opacity: 0, y: 30 }}
              transition={{ type: "spring", damping: 25, stiffness: 350 }}
              className="bg-zinc-950 border border-violet-500/35 rounded-3xl w-full max-w-md overflow-hidden shadow-2xl relative p-6 z-[10010] text-center"
            >
              <div className="flex flex-col items-center justify-center space-y-4">
                <div className="w-16 h-16 rounded-full bg-violet-600/10 flex items-center justify-center border border-violet-500/20 text-violet-400">
                  <span className="text-3xl">🔑</span>
                </div>
                
                <div>
                  <h3 className="text-base font-bold text-white tracking-tight uppercase font-sans">
                    Google Sign-In Required
                  </h3>
                  <p className="text-xs text-zinc-400 mt-2 leading-relaxed font-sans px-2">
                    You are currently using a Guest account. To safely process and link your premium subscription to your permanent profile, please sign in with Google first.
                  </p>
                </div>

                <div className="w-full pt-4 space-y-2">
                  <button
                    onClick={async () => {
                      setIsGuestPaymentModalOpen(false);
                      setIsProfileModalOpen(false);
                      setIsLimitModalOpen(false);
                      await loginWithGoogle();
                    }}
                    className="w-full py-2.5 bg-violet-600 hover:bg-violet-500 text-white text-xs font-bold rounded-xl transition-all cursor-pointer flex items-center justify-center gap-2 shadow-lg shadow-violet-500/25 active:scale-95 duration-100 font-sans"
                  >
                    <svg className="w-4 h-4" viewBox="0 0 24 24" width="24" height="24" xmlns="http://www.w3.org/2000/svg">
                      <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
                      <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
                      <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l3.66-2.85z" fill="#FBBC05" />
                      <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.85c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
                    </svg>
                    Continue with Google
                  </button>

                  <button
                    onClick={() => setIsGuestPaymentModalOpen(false)}
                    className="w-full py-2.5 bg-zinc-900 hover:bg-zinc-850 text-zinc-400 border border-white/5 hover:border-white/10 text-xs font-bold rounded-xl transition-all cursor-pointer font-sans"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* MODAL: SAVED FLASHCARD DETAILED INTERACTIVE VIEW */}
      <AnimatePresence>
        {openedFlashcard && (
          <div className="fixed inset-0 z-[10020] flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setOpenedFlashcard(null)}
              className="absolute inset-0 bg-black/80 backdrop-blur-md"
            />
            
            <motion.div
              initial={{ scale: 0.9, y: 20, opacity: 0 }}
              animate={{ scale: 1, y: 0, opacity: 1 }}
              exit={{ scale: 0.9, y: 20, opacity: 0 }}
              className="relative w-full max-w-lg bg-zinc-950 border border-zinc-900 rounded-2xl p-6 shadow-2xl space-y-6 z-10"
            >
              {/* Header */}
              <div className="flex justify-between items-center border-b border-zinc-900 pb-3 font-sans">
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-violet-500 animate-pulse" />
                  <div>
                    <h3 className="text-sm font-bold text-white uppercase tracking-wider font-mono">LUNITO Socratic Deck</h3>
                    <p className="text-[10px] text-zinc-500">Focus Subject: {openedFlashcard.category || "General"}</p>
                  </div>
                </div>
                <button
                  onClick={() => setOpenedFlashcard(null)}
                  className="p-1 rounded-lg bg-zinc-900 hover:bg-zinc-850 text-zinc-400 hover:text-white transition-all cursor-pointer animate-pulse"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Flippable 3D Card Zone */}
              <div 
                onClick={() => setIsOpenedFlashcardFlipped(!isOpenedFlashcardFlipped)}
                className="h-[250px] cursor-pointer group rounded-2xl relative select-none w-full"
                style={{ perspective: "1000px" }}
              >
                <div 
                  className="w-full h-full duration-500 relative rounded-2xl border"
                  style={{ 
                    transformStyle: "preserve-3d", 
                    transform: isOpenedFlashcardFlipped ? "rotateY(180deg)" : "rotateY(0deg)",
                    transition: "transform 0.6s cubic-bezier(0.4, 0, 0.2, 1)",
                    borderColor: isOpenedFlashcardFlipped ? "rgba(34, 211, 238, 0.4)" : "rgba(139, 92, 246, 0.4)"
                  }}
                >
                  {/* FRONT */}
                  <div 
                    className="absolute inset-0 p-6 flex flex-col justify-between bg-[#0a0a0f] rounded-2xl"
                    style={{ 
                      backfaceVisibility: "hidden",
                      WebkitBackfaceVisibility: "hidden"
                    }}
                  >
                    <div className="flex justify-between items-center text-[9px] font-bold text-zinc-500 uppercase tracking-widest font-mono">
                      <span>{openedFlashcard.category}</span>
                      <span className="text-violet-400">Question Front</span>
                    </div>
                    <div className="text-center font-bold text-base md:text-lg text-white leading-relaxed px-2 font-display">
                      {openedFlashcard.front}
                    </div>
                    <div className="text-center text-[10px] text-zinc-550 group-hover:text-zinc-450 font-bold uppercase tracking-wider font-mono">
                      Tap anywhere to flip ↺
                    </div>
                  </div>

                  {/* BACK */}
                  <div 
                    className="absolute inset-0 p-6 flex flex-col justify-between bg-[#0e0e1a] rounded-2xl"
                    style={{ 
                      backfaceVisibility: "hidden",
                      WebkitBackfaceVisibility: "hidden",
                      transform: "rotateY(180deg)"
                    }}
                  >
                    <div className="flex justify-between items-center text-[9px] font-bold text-zinc-500 uppercase tracking-widest font-mono">
                      <span>{openedFlashcard.category}</span>
                      <span className="text-cyan-400">Mentor's Explanation</span>
                    </div>
                    <div className="text-center font-medium text-xs md:text-sm text-cyan-205 leading-relaxed overflow-y-auto max-h-[140px] px-2 font-sans scrollbar-thin text-justify whitespace-pre-line">
                      {openedFlashcard.back}
                    </div>
                    <div className="text-center text-[10px] text-zinc-550 font-bold uppercase tracking-wider font-mono">
                      Tap anywhere to front ↺
                    </div>
                  </div>
                </div>
              </div>

              {/* Actions */}
              <div className="flex gap-3 justify-center pt-2">
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    setIsOpenedFlashcardFlipped(!isOpenedFlashcardFlipped);
                  }}
                  className="px-6 py-2.5 bg-zinc-900 border border-zinc-805 text-zinc-300 rounded-xl text-xs font-bold hover:bg-zinc-850 hover:text-white transition-all flex items-center gap-1.5 cursor-pointer font-sans shadow"
                >
                  <RotateCw className="w-3.5 h-3.5 animate-spin-slow" />
                  <span>Manual Flip ↺</span>
                </button>
                <button
                  type="button"
                  onClick={() => setOpenedFlashcard(null)}
                  className="px-6 py-2.5 bg-gradient-to-r from-violet-600 to-indigo-605 text-white rounded-xl text-xs font-bold shadow hover:opacity-95 transition-all cursor-pointer font-sans"
                >
                  Close stack
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* MODAL: SAVED SOCRATIC TEST DETAILED VIEW */}
      <AnimatePresence>
        {openedTest && (
          <div className="fixed inset-0 z-[10010] flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setOpenedTest(null)}
              className="absolute inset-0 bg-black/85 backdrop-blur-md"
            />
            
            <motion.div
              initial={{ scale: 0.9, y: 20, opacity: 0 }}
              animate={{ scale: 1, y: 0, opacity: 1 }}
              exit={{ scale: 0.9, y: 20, opacity: 0 }}
              className="relative w-full max-w-2xl bg-zinc-950 border border-zinc-900 rounded-2xl p-6 shadow-2xl z-10 font-sans flex flex-col max-h-[85vh]"
            >
              {/* Header */}
              <div className="flex justify-between items-center border-b border-zinc-900 pb-3 font-sans shrink-0">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-lg bg-cyan-600/10 border border-cyan-500/15 flex items-center justify-center">
                    <Award className="w-4 h-4 text-cyan-400" />
                  </div>
                  <div>
                    <span className="text-[8px] bg-cyan-500/10 text-cyan-400 border border-cyan-500/10 px-2 py-0.5 rounded uppercase font-mono font-bold tracking-widest">
                      {openedTest.subject}
                    </span>
                    <h3 className="text-sm font-bold text-white mt-1 leading-none font-display">
                      {openedTest.topic} Diagnostic
                    </h3>
                  </div>
                </div>
                <button
                  onClick={() => setOpenedTest(null)}
                  className="p-1 rounded-lg bg-zinc-900 hover:bg-zinc-850 text-zinc-400 hover:text-white transition-all cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Results & Score Summary block */}
              <div className="p-4 bg-zinc-900 border border-zinc-805/40 rounded-xl my-4 text-left grid grid-cols-1 sm:grid-cols-3 gap-3 shrink-0 font-sans">
                <div>
                  <span className="text-[9px] uppercase tracking-wider text-zinc-500 font-bold block mb-0.5 font-mono">Date Taken</span>
                  <span className="text-xs font-bold text-white font-mono">📅 {openedTest.date}</span>
                </div>
                <div>
                  <span className="text-[9px] uppercase tracking-wider text-cyan-400 font-bold block mb-0.5 font-mono font-semibold">Assessment Score</span>
                  <span className="text-xs font-semibold text-cyan-305 font-mono">{openedTest.score}</span>
                </div>
                <div>
                  <span className="text-[9px] uppercase tracking-wider text-violet-400 font-bold block mb-0.5 font-mono">Evaluation Type</span>
                  <span className="text-xs font-bold text-white">Socratic Diagnostic</span>
                </div>
              </div>

              {/* Questions review area */}
              <div className="flex-1 overflow-y-auto space-y-4 pr-1.5 no-scrollbar py-1">
                <h4 className="text-xs font-bold text-zinc-400 uppercase tracking-wider font-mono shrink-0">Review Exam Questions</h4>
                
                {(!openedTest.questions || openedTest.questions.length === 0) ? (
                  <div className="p-6 rounded-xl bg-zinc-900/50 border border-zinc-900 text-center space-y-2 font-sans py-12">
                    <span className="text-xl">📊</span>
                    <h5 className="text-xs font-bold text-zinc-450">Diagnostic question trace loading...</h5>
                    <p className="text-[10px] text-zinc-550 max-w-sm mx-auto leading-relaxed">
                      LUNITO archives complete step-by-step diagnostic pathways for all active AI tests generated during lessons!
                    </p>
                  </div>
                ) : (
                  openedTest.questions.map((q: any, qi: number) => (
                    <div key={qi} className="p-3.5 rounded-xl bg-zinc-950 border border-zinc-900 space-y-3 font-sans">
                      <div className="flex items-start gap-2.5 text-xs">
                        <span className="w-5 h-5 rounded-full bg-cyan-500/10 text-cyan-400 border border-cyan-500/15 flex items-center justify-center font-bold font-mono shrink-0">
                          {qi + 1}
                        </span>
                        <p className="font-semibold text-zinc-100 text-[13px] leading-relaxed select-none text-justify">
                          {q.question}
                        </p>
                      </div>

                      {/* Options review */}
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs font-sans pl-7 font-medium">
                        {q.options?.map((opt: any) => {
                          const isCorrect = opt.key === q.correct;
                          return (
                            <div 
                              key={opt.key}
                              className={`p-2.5 rounded-lg border text-[11px] leading-snug flex items-start gap-1 ${
                                isCorrect 
                                  ? "bg-emerald-500/5 border-emerald-500/20 text-emerald-300"
                                  : "bg-[#08080c] border-[#13121d] text-zinc-405"
                              }`}
                            >
                              <span className="font-mono text-[9px] uppercase tracking-wider text-zinc-500 mr-1 mt-0.5">
                                opt {opt.key}:
                              </span>
                              <span>{opt.text}</span>
                            </div>
                          );
                        })}
                      </div>

                      {/* Mentor explanation */}
                      <div className="p-3 bg-violet-650/5 border border-violet-500/10 rounded-lg text-[11px] leading-relaxed text-zinc-355 pl-7 select-none text-justify flex items-start gap-1 font-sans">
                        <span>🎓</span>
                        <div>
                          <strong className="text-violet-400 block mb-0.5 font-sans">Socratic explanation:</strong>
                          <span>{q.explanation}</span>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>

              {/* Close footer */}
              <div className="pt-4 border-t border-zinc-900 flex justify-end shrink-0">
                <button
                  type="button"
                  onClick={() => setOpenedTest(null)}
                  className="px-5 py-2 bg-gradient-to-r from-cyan-600 to-indigo-650 text-white rounded-xl text-xs font-bold shadow hover:opacity-95 transition-all cursor-pointer font-sans"
                >
                  Close diagnostics
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* MODAL: CUSTOM SECURE CHECKOUT SIMULATOR */}
      <AnimatePresence>
        {isCustomCheckoutOpen && (
          <div className="fixed inset-0 z-[10015] flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => {
                setIsCustomCheckoutOpen(false);
                setCustomCardNumber("");
                setCustomCardExpiry("");
                setCustomCardCVV("");
                setCustomCardName("");
              }}
              className="absolute inset-0 bg-black/99 backdrop-blur-md"
            />

            <motion.div
              initial={{ scale: 0.95, opacity: 0, y: 30 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.95, opacity: 0, y: 30 }}
              transition={{ type: "spring", damping: 25, stiffness: 350 }}
              className="bg-zinc-950 border border-violet-500/40 rounded-3xl w-full max-w-sm overflow-hidden shadow-2xl relative p-6 z-[10020] flex flex-col justify-between"
            >
              <div>
                <div className="flex items-start justify-between pb-3 border-b border-white/5 mb-4">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-lg bg-violet-600/20 border border-violet-500/30 flex items-center justify-center">
                      <Lock className="w-4 h-4 text-violet-400" />
                    </div>
                    <div>
                      <h3 className="text-xs font-black text-white leading-tight font-display">Secure Payment Portal</h3>
                      <p className="text-[9px] text-zinc-400 font-mono">Simulated Sandbox Environment</p>
                    </div>
                  </div>
                  <button
                    onClick={() => {
                      setIsCustomCheckoutOpen(false);
                      setCustomCardNumber("");
                      setCustomCardExpiry("");
                      setCustomCardCVV("");
                      setCustomCardName("");
                    }}
                    className="p-1 px-[7px] bg-white/5 hover:bg-white/10 text-zinc-400 hover:text-white rounded-lg transition-all cursor-pointer"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>

                {/* PAYMENT METHOD TABS */}
                <div className="flex gap-2 mb-4 bg-[#0d0d12] p-1 rounded-xl border border-white/5 font-sans">
                  <button
                    type="button"
                    onClick={() => setPaymentMethod("card")}
                    className={`flex-1 flex items-center justify-center gap-1.5 py-1.5 rounded-lg text-[10px] font-bold transition-all cursor-pointer ${
                      paymentMethod === "card"
                        ? "bg-violet-600/20 border border-violet-500/30 text-violet-300 shadow-sm"
                        : "text-zinc-400 hover:text-white hover:bg-white/5 border border-transparent"
                    }`}
                  >
                    <CreditCard className="w-3.5 h-3.5" />
                    <span>Card Pay</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setPaymentMethod("qr")}
                    className={`flex-1 flex items-center justify-center gap-1.5 py-1.5 rounded-lg text-[10px] font-bold transition-all cursor-pointer ${
                      paymentMethod === "qr"
                        ? "bg-cyan-600/25 border border-cyan-500/40 text-cyan-300 shadow-sm"
                        : "text-zinc-400 hover:text-white hover:bg-white/5 border border-transparent"
                    }`}
                  >
                    <QrCode className="w-3.5 h-3.5" />
                    <span>UPI QR Scan</span>
                  </button>
                </div>

                {paymentMethod === "card" ? (
                  <>
                    {/* VISUAL CREDIT CARD EMBED */}
                    <div className="mb-4 relative h-40 w-full rounded-2xl bg-gradient-to-br from-violet-600 via-indigo-600 to-indigo-850 p-4 text-white shadow-lg overflow-hidden flex flex-col justify-between select-none">
                      <div className="absolute -top-10 -right-10 w-32 h-32 bg-cyan-400/20 rounded-full blur-2xl pointer-events-none" />
                      <div className="absolute -bottom-10 -left-10 w-24 h-24 bg-violet-400/20 rounded-full blur-xl pointer-events-none" />

                      <div className="flex justify-between items-start z-10">
                        <span className="text-[8px] font-mono tracking-widest text-violet-200 uppercase">Socratic Premium Scholar</span>
                        <Brain className="w-5 h-5 text-cyan-300 animate-pulse" />
                      </div>

                      <div className="z-10">
                        <div className="text-sm md:text-base font-mono tracking-widest text-zinc-100 placeholder-zinc-400 text-center">
                          {customCardNumber || "•••• •••• •••• ••••"}
                        </div>
                      </div>

                      <div className="flex justify-between items-end z-10 font-mono">
                        <div>
                          <div className="text-[6px] text-violet-200 uppercase tracking-wider">Card Holder</div>
                          <div className="text-[9px] truncate max-w-[130px] font-bold text-white uppercase">
                            {customCardName || "Scholar Surname"}
                          </div>
                        </div>
                        <div className="flex gap-4">
                          <div>
                            <div className="text-[6px] text-violet-200 uppercase tracking-wider">Expiry</div>
                            <div className="text-[9px] font-bold text-white">
                              {customCardExpiry || "MM/YY"}
                            </div>
                          </div>
                          <div>
                            <div className="text-[6px] text-violet-200 uppercase tracking-wider">CVV</div>
                            <div className="text-[9px] font-bold text-white">
                              {customCardCVV || "•••"}
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* FORM FIELDS */}
                    <div className="space-y-3 font-sans">
                      <div>
                        <label className="block text-[9px] font-bold text-zinc-400 uppercase tracking-widest mb-1 font-mono">Cardholder Name</label>
                        <input
                          type="text"
                          maxLength={25}
                          value={customCardName}
                          onChange={(e) => setCustomCardName(e.target.value)}
                          placeholder="e.g. Socratic Scholar"
                          className="w-full bg-[#0a0a0f] border border-white/5 focus:border-violet-500/40 focus:outline-none rounded-xl px-3 py-2 text-xs text-white placeholder-zinc-600 transition-all uppercase"
                        />
                      </div>

                      <div>
                        <label className="block text-[9px] font-bold text-zinc-400 uppercase tracking-widest mb-1 font-mono">Card Number</label>
                        <input
                          type="text"
                          maxLength={19}
                          value={customCardNumber}
                          onChange={(e) => {
                            let val = e.target.value.replace(/\s?/g, '').replace(/[^0-9]/g, '');
                            let cardParts = [];
                            for(let i=0; i<val.length; i+=4) {
                              cardParts.push(val.substring(i, i+4));
                            }
                            setCustomCardNumber(cardParts.join(' '));
                          }}
                          placeholder="4111 2222 3333 4444"
                          className="w-full bg-[#0a0a0f] border border-white/5 focus:border-violet-500/40 focus:outline-none rounded-xl px-3 py-2 text-xs text-white placeholder-zinc-600 transition-all font-mono"
                        />
                      </div>

                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <label className="block text-[9px] font-bold text-zinc-400 uppercase tracking-widest mb-1 font-mono">Expiry Date</label>
                          <input
                            type="text"
                            maxLength={5}
                            placeholder="MM/YY"
                            value={customCardExpiry}
                            onChange={(e) => {
                              let val = e.target.value.replace(/[^0-9]/g, '');
                              if (val.length >= 2) {
                                val = val.substring(0, 2) + "/" + val.substring(2, 4);
                              }
                              setCustomCardExpiry(val);
                            }}
                            className="w-full bg-[#0a0a0f] border border-white/5 focus:border-violet-500/40 focus:outline-none rounded-xl px-3 py-2 text-xs text-white placeholder-zinc-600 transition-all font-mono text-center"
                          />
                        </div>
                        <div>
                          <label className="block text-[9px] font-bold text-zinc-400 uppercase tracking-widest mb-1 font-mono">CVV Code</label>
                          <input
                            type="password"
                            maxLength={3}
                            placeholder="•••"
                            value={customCardCVV}
                            onChange={(e) => setCustomCardCVV(e.target.value.replace(/[^0-9]/g, ''))}
                            className="w-full bg-[#0a0a0f] border border-white/5 focus:border-violet-500/40 focus:outline-none rounded-xl px-3 py-2 text-xs text-white placeholder-zinc-600 transition-all font-mono text-center"
                          />
                        </div>
                      </div>
                    </div>
                  </>
                ) : (
                  <div className="flex flex-col items-center">
                    {/* UPI QR SCAN GRID DISPLAY */}
                    <div className="relative p-3.5 bg-white rounded-2xl border border-white/10 shadow-lg mb-4 flex items-center justify-center w-48 h-48 select-none">
                      {/* Interactive scan frame borders */}
                      <div className="absolute top-2.5 left-2.5 w-4 h-4 border-t-2 border-l-2 border-cyan-500 rounded-tl-sm pointer-events-none" />
                      <div className="absolute top-2.5 right-2.5 w-4 h-4 border-t-2 border-r-2 border-cyan-500 rounded-tr-sm pointer-events-none" />
                      <div className="absolute bottom-2.5 left-2.5 w-4 h-4 border-b-2 border-l-2 border-cyan-500 rounded-bl-sm pointer-events-none" />
                      <div className="absolute bottom-2.5 right-2.5 w-4 h-4 border-b-2 border-r-2 border-cyan-500 rounded-br-sm pointer-events-none" />

                      <img 
                        src={`https://api.qrserver.com/v1/create-qr-code/?size=180x180&data=${encodeURIComponent(
                          `upi://pay?pa=lunito.ai@ybl&pn=LUNITO%20AI%20Socratic%20Tutor&am=${paymentPlanToUpgrade === "pro" ? "85.00" : "425.00"}&cu=INR&tn=Lunito%20VIP%20Upgrade`
                        )}`}
                        alt="UPI Payment QR Code"
                        className="w-40 h-40 object-contain select-none"
                        referrerPolicy="no-referrer"
                      />
                    </div>

                    <div className="text-center space-y-1.5 mb-3 font-sans px-1">
                      <p className="text-[10.5px] font-bold text-white tracking-wide uppercase flex items-center justify-center gap-1">
                        <span className="w-1.5 h-1.5 bg-cyan-400 rounded-full animate-pulse" />
                        <span>Scan with any UPI App</span>
                      </p>
                      <p className="text-[9px] text-zinc-400 leading-relaxed max-w-[245px]">
                        Scan from Google Pay, PhonePe, Paytm, or BHIM. After making your direct payment, click <strong className="text-cyan-400 font-semibold font-sans">Confirm Payment</strong> to activate instantly.
                      </p>
                      
                      {/* VPA Copy Tray */}
                      <div className="flex items-center justify-between gap-1.5 px-2.5 py-1.5 bg-[#0a0a0f] border border-white/5 rounded-xl text-[9px] font-mono text-zinc-300 w-full mt-2 select-none">
                        <span className="text-zinc-500 font-sans uppercase text-[8px] tracking-wide">UPI Address</span>
                        <span className="font-semibold text-cyan-300">lunito.ai@ybl</span>
                        <button
                          type="button"
                          onClick={() => {
                            navigator.clipboard.writeText("lunito.ai@ybl");
                            triggerNotification("UPI ID copied to clipboard!", "success");
                          }}
                          className="px-2 py-0.5 bg-zinc-900 border border-white/10 hover:border-cyan-500/30 font-sans font-bold text-[8.5px] rounded-lg text-cyan-400 hover:text-white transition-all cursor-pointer"
                        >
                          Copy
                        </button>
                      </div>
                    </div>
                  </div>
                )}

                <div className="mt-4 p-3 rounded-lg bg-emerald-500/5 border border-emerald-500/10 text-[9.5px] text-zinc-400 leading-relaxed font-sans">
                  💰 Order Amount: <strong className="text-emerald-400 font-mono">{paymentPlanToUpgrade === "pro" ? "$1.00 USD (INR 85.00)" : "$5.00 USD (INR 425.00)"}</strong>
                  <br />
                  💡 {paymentMethod === "card" 
                    ? "Sandbox: Simulated test card verifies payments instantly on Socratic secure backend hooks!" 
                    : "QR Mode: Sandbox simulation QR simplifies local payment cycles without complex gateways!"
                  }
                </div>
              </div>

              <div className="pt-4 border-t border-white/5 mt-4 flex gap-3">
                <button
                  type="button"
                  onClick={() => {
                    setIsCustomCheckoutOpen(false);
                    setCustomCardNumber("");
                    setCustomCardExpiry("");
                    setCustomCardCVV("");
                    setCustomCardName("");
                  }}
                  className="flex-1 py-2 bg-zinc-900 border border-white/5 text-zinc-400 text-xs font-bold rounded-xl hover:bg-zinc-850 hover:text-white transition-all cursor-pointer font-sans"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={async () => {
                    if (paymentMethod === "card") {
                      if (!customCardNumber.trim() || !customCardExpiry.trim() || !customCardCVV.trim()) {
                        triggerNotification("Please fill in card details.", "error");
                        return;
                      }
                    }
                    setIsProcessingPayment(true);
                    try {
                      // Trigger back-end verification on order_mock / qr_mock
                      const isQr = paymentMethod === "qr";
                      const response = await safeFetch("/api/payment/verify", {
                        method: "POST",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify({
                          razorpay_order_id: isQr ? "qr_mock_" + Date.now() : "order_mock_" + Date.now(),
                          razorpay_payment_id: isQr ? "qr_pay_mock_" + Date.now() : "pay_mock_" + Date.now(),
                          razorpay_signature: isQr ? "qr_sig_mock" : "sig_mock",
                          plan: paymentPlanToUpgrade,
                          userId: auth.currentUser?.uid || "guest_user"
                        })
                      });

                      const data = await response.json();
                      if (response.ok && data.status === "success" && paymentPlanToUpgrade) {
                        if (auth.currentUser) {
                          const userDocRef = doc(db, "users", auth.currentUser.uid);
                          try {
                            await updateDoc(userDocRef, { plan: paymentPlanToUpgrade });
                          } catch (payDbErr) {
                            console.error("Error updating user plan on sandbox checkout:", payDbErr);
                            handleFirestoreError(payDbErr, OperationType.UPDATE, "users/" + auth.currentUser.uid);
                          }
                        }
                        setPlan(paymentPlanToUpgrade);
                        triggerNotification(`🎉 Upgraded to ${paymentPlanToUpgrade.toUpperCase()} plan successfully!`, "success");
                        confetti({
                          particleCount: 160,
                          spread: 90,
                          origin: { y: 0.6 }
                        });
                        setIsCustomCheckoutOpen(false);
                        setIsLimitModalOpen(false);
                        setIsProfileModalOpen(false);
                        // Clean values
                        setCustomCardNumber("");
                        setCustomCardExpiry("");
                        setCustomCardCVV("");
                        setCustomCardName("");
                      } else {
                        triggerNotification(data.error || "Simulation failed.", "error");
                      }
                    } catch (err) {
                      console.error("Simulation verify error:", err);
                      triggerNotification("Gateway checkout timeout.", "error");
                    } finally {
                      setIsProcessingPayment(false);
                    }
                  }}
                  disabled={isProcessingPayment}
                  className="flex-1 py-2 bg-violet-600 hover:bg-violet-700 text-white text-xs font-bold rounded-xl transition-all cursor-pointer shadow-md shadow-violet-500/20 font-sans flex items-center justify-center gap-1"
                >
                  {isProcessingPayment ? (
                    <>
                      <span className="w-3 h-3 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      <span>Processing...</span>
                    </>
                  ) : (
                    <span>Confirm Payment</span>
                  )}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
        </div>
      </div>
      )}
    </div>
  );
}
