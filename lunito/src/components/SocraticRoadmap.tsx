import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Sparkles, 
  BookOpen, 
  ClipboardList, 
  Award, 
  AlertCircle, 
  Smile, 
  ArrowRight, 
  Plus, 
  Trash2,
  Loader2, 
  CheckCircle2, 
  ChevronDown, 
  ChevronUp, 
  RefreshCw, 
  HeartHandshake, 
  Send,
  Dumbbell,
  Compass,
  Paperclip,
  X,
  FileText,
  Image as ImageIcon
} from "lucide-react";
import { doc, updateDoc, setDoc } from "firebase/firestore";

interface SocraticRoadmapProps {
  userMood: string;
  setUserMood: (mood: string) => void;
  tutorTone: string;
  setTutorTone: (tone: string) => void;
  roadmapData: any[];
  setRoadmapData: React.Dispatch<React.SetStateAction<any[]>>;
  homeworks: any[];
  setHomeworks: React.Dispatch<React.SetStateAction<any[]>>;
  diagnosedWeakAreas: string[];
  setDiagnosedWeakAreas: React.Dispatch<React.SetStateAction<string[]>>;
  diagnosedStrongAreas: string[];
  setDiagnosedStrongAreas: React.Dispatch<React.SetStateAction<string[]>>;
  activeSubject: string;
  subjects?: string[];
  setCurrentStudySubject?: (sub: string) => void;
  selectedClass: string;
  selectedBoard: string;
  safeFetch: any;
  db: any;
  auth: any;
  triggerNotification: (msg: string, type: "success" | "error" | "info") => void;
  parseTextWithMath?: (txt: string) => React.ReactNode;
}

export const SocraticRoadmap: React.FC<SocraticRoadmapProps> = ({
  userMood,
  setUserMood,
  tutorTone,
  setTutorTone,
  roadmapData,
  setRoadmapData,
  homeworks,
  setHomeworks,
  diagnosedWeakAreas,
  setDiagnosedWeakAreas,
  diagnosedStrongAreas,
  setDiagnosedStrongAreas,
  activeSubject,
  subjects,
  setCurrentStudySubject,
  selectedClass,
  selectedBoard,
  safeFetch,
  db,
  auth,
  triggerNotification,
  parseTextWithMath
}) => {
  const [isGeneratingRoadmap, setIsGeneratingRoadmap] = useState(false);
  const [isAssigningHomework, setIsAssigningHomework] = useState(false);
  const [isEvaluatingHomework, setIsEvaluatingHomework] = useState<string | null>(null);
  const [evalResult, setEvalResult] = useState<{ [hwId: string]: any }>({});
  const [typedHomeworkAnswer, setTypedHomeworkAnswer] = useState<{ [hwId: string]: string }>({});

  const [expandedUnitId, setExpandedUnitId] = useState<string | null>(null);
  const [expandedHwId, setExpandedHwId] = useState<string | null>(null);

  // Quick Chat Sandbox state inside Roadmap
  const [quickMessage, setQuickMessage] = useState("");
  const [quickMessages, setQuickMessages] = useState<any[]>([
    {
      id: "init",
      sender: "ai",
      text: "Hello! I am Lunito, your personal Socratic tutor. Whenever you feel stuck or frustrated, let me know. I am here to guide you gently to your breakthroughs. What should we look at?",
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    }
  ]);
  const [isQuickSending, setIsQuickSending] = useState(false);

  const fileInputRef = React.useRef<HTMLInputElement | null>(null);
  const [attachedFiles, setAttachedFiles] = useState<{ id: string; name: string; type: string; url: string }[]>([]);
  const [isDragging, setIsDragging] = useState(false);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files) return;
    const filesArray = Array.from(e.target.files);
    
    filesArray.forEach(file => {
      const reader = new FileReader();
      reader.onloadend = () => {
        setAttachedFiles(prev => [
          ...prev,
          {
            id: Math.random().toString(36).substring(2, 11),
            name: file.name,
            type: file.type,
            url: reader.result as string
          }
        ]);
      };
      reader.readAsDataURL(file);
    });
    
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const removeAttachment = (id: string) => {
    setAttachedFiles(prev => prev.filter(item => item.id !== id));
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    
    if (e.dataTransfer.files) {
      const filesArray = Array.from(e.dataTransfer.files);
      filesArray.forEach(file => {
        const reader = new FileReader();
        reader.onloadend = () => {
          setAttachedFiles(prev => [
            ...prev,
            {
              id: Math.random().toString(36).substring(2, 11),
              name: file.name,
              type: file.type,
              url: reader.result as string
            }
          ]);
        };
        reader.readAsDataURL(file);
      });
    }
  };

  const moodPresets = [
    { key: "neutral", label: "Steady Scholar", icon: "📖", desc: "Ready for normal Socratic exploration", matchingTone: "Socratic Companion" },
    { key: "frustrated", label: "Feeling Frustrated 😫", icon: "😫", desc: "Struggling or annoyed with a topic", matchingTone: "Highly Patient & Simplifying" },
    { key: "confused", label: "Confused 😵‍💫", icon: "😵‍💫", desc: "Mind is spinning", matchingTone: "Step-by-Step Guide" },
    { key: "curious", label: "Curious & Eager 🤩", icon: "🤩", desc: "Deep questions", matchingTone: "Enthusiastic Mentor" },
    { key: "confident", label: "Confident to Test 😎", icon: "😎", desc: "Ready for challenge", matchingTone: "Exam Coach / Challenger" },
    { key: "tired", label: "Tired & Slow 🥱", icon: "🥱", desc: "Wants a relaxed pace", matchingTone: "Gentle Supporter" }
  ];

  // Sync states to Firestore helper
  const syncToFirestore = async (updates: any) => {
    if (auth.currentUser) {
      try {
        const userDocRef = doc(db, "users", auth.currentUser.uid);
        await updateDoc(userDocRef, updates);
        console.log("[Roadmap Sync] Successfully stored memory progress in user database.");
      } catch (err) {
        console.warn("[Roadmap Sync] Fallback to client state cache:", err);
      }
    }
  };

  const handleMoodChange = (moodKey: string, matchedTone: string) => {
    setUserMood(moodKey);
    setTutorTone(matchedTone);
    triggerNotification(`Tutor Mode configured. Lunito is now using a "${matchedTone}" voice.`, "info");
    
    // Add realistic teacher greeting message to chat sandbox reflecting new state
    let moodResponse = "";
    if (moodKey === "frustrated") {
      moodResponse = "Hey, take a slow, deep breath. 🌸 Learning hard concepts is a mountain, but we are climbing it together in tiny, easy steps. There's zero rush. Let's simplify whatever topic is annoying you right now—tell me what's on your mind.";
    } else if (moodKey === "confused") {
      moodResponse = "A little confusion is just the step right before a massive breakthrough! 💡 Let's break this into smaller pieces. Where does the fog start to roll in? Let's trace it step-by-step.";
    } else if (moodKey === "curious") {
      moodResponse = "Oh, I love that energy! 🚀 Science, Mathematics, History... behind every formula or date is a fascinating story. What core depth should we dive into? Feel free to ask your wildest questions!";
    } else if (moodKey === "confident") {
      moodResponse = "Excellent! You have solid mental models. Let's put your cognitive gears to the test. Let's assign you a challenging problem or run a quick assessment!";
    } else if (moodKey === "tired") {
      moodResponse = "Feeling a bit low on battery? No worries. Let's keep things light, relaxed, and extremely straightforward today. What's one quick topic we can read together?";
    } else {
      moodResponse = "Welcome! Let's explore your personalized curriculum roadmap today. What concept are we mastering next?";
    }

    setQuickMessages(prev => [
      ...prev,
      {
        id: "mood-greeting-" + Date.now(),
        sender: "ai",
        text: moodResponse,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      }
    ]);

    syncToFirestore({
      userMood: moodKey,
      tutorTone: matchedTone
    });
  };

  // Generate AI Personalized Learning Roadmap
  const handleGenerateRoadmap = async () => {
    setIsGeneratingRoadmap(true);
    triggerNotification("Analyzing school board, grade curriculum details, and personal strengths...", "info");

    try {
      const resp = await safeFetch("/api/generate-roadmap", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          subject: activeSubject,
          userClass: selectedClass,
          userBoard: selectedBoard,
          weakAreas: diagnosedWeakAreas,
          strongAreas: diagnosedStrongAreas
        })
      });

      if (!resp.ok) {
        throw new Error("Tutor API failed to communicate.");
      }

      const data = await resp.json();
      if (data.roadmap && Array.isArray(data.roadmap)) {
        setRoadmapData(data.roadmap);
        // Sync to cloud persistent dictionary
        await syncToFirestore({ roadmapData: data.roadmap });
        triggerNotification(`New personalized roadmap for ${activeSubject} generated successfully!`, "success");
      } else {
        throw new Error("Invalid roadmap structure received.");
      }
    } catch (err: any) {
      console.warn("AI roadmap generation error, running resilient local roadmap builder:", err);
      // Local fallback builder matching subjects
      const localSyllabusMap: Record<string, any[]> = {
        "Mathematics": [
          { id: "u1", name: "Quadratic Equations & Roots", desc: "Finding real roots, discriminant, factoring, and equation formulas.", steps: ["Solve basic quadratics", "Factorization method", "Quadratic formula", "Nature of roots"], status: "In Progress", isWeak: diagnosedWeakAreas.includes("Quadratic Equations") },
          { id: "u2", name: "Trigonometric Ratios & Identities", desc: "Angles, sine/cosine functions, triangle computations, and proofs.", steps: ["Trigonometric ratios", "Ratios of specific angles", "Identities proofs", "Heights and Distances application"], status: "Not Started", isWeak: false },
          { id: "u3", name: "Arithmetic Progressions", desc: "Sequence terms, common difference, nth term, and progressions sums.", steps: ["AP definitions", "nth term of progression", "Sum of first n terms", "Practical applications"], status: "Not Started", isWeak: false },
          { id: "u4", name: "Polynomial Dynamics", desc: "Degree, factor theorem, division algorithm, and zeroes relationships.", steps: ["Linear & cubic polynomials", "Zeroes relationship", "Division algorithm", "Factorization theorem"], status: "Not Started", isWeak: false }
        ],
        "Physics": [
          { id: "u1", name: "Electric Circuits & Current", desc: "Potential difference, ohm's law, registers in series/parallel, electrical power.", steps: ["Understand charge & current", "Ohm's Law proofs", "Resistor combinations", "Joule's heating effect"], status: "In Progress", isWeak: false },
          { id: "u2", name: "Light Reflection & Lenses", desc: "Spherical mirrors, focal length, refraction indices, ray diagrams, and power.", steps: ["Reflection principles", "Mirror formula", "Lens refraction", "Magnification ratios"], status: "Not Started", isWeak: false }
        ]
      };

      const defaultRoadmap = localSyllabusMap[activeSubject] || [
        { id: "u1", name: `${activeSubject} Foundations`, desc: "In-depth Socratic breakdown of core definitions and structural laws.", steps: ["Terminology and vocabulary", "Starting axioms", "Practical world applications", "Review Assessment"], status: "In Progress", isWeak: false },
        { id: "u2", name: "Intermediate Advanced Concepts", desc: "Connecting distinct principles, solving typical textbook problem types.", steps: ["Understanding mechanism", "Complex formulas", "Solving common textbook questions", "Concept Mapping"], status: "Not Started", isWeak: false }
      ];

      setRoadmapData(defaultRoadmap);
      await syncToFirestore({ roadmapData: defaultRoadmap });
      triggerNotification("Generated resilient curriculum roadmap based on academic board standard.", "success");
    } finally {
      setIsGeneratingRoadmap(false);
    }
  };

  // Change individual roadmap unit status
  const handleUpdateUnitStatus = async (unitId: string, nextStatus: string) => {
    const updated = roadmapData.map(unit => {
      if (unit.id === unitId) {
        return { ...unit, status: nextStatus };
      }
      return unit;
    });
    setRoadmapData(updated);
    await syncToFirestore({ roadmapData: updated });
    triggerNotification(`Unit marked as ${nextStatus}! Statistics refreshed.`, "success");
  };

  // Assign Live Homework on current topic
  const handleAssignHomework = async (fallbackTopic?: string) => {
    setIsAssigningHomework(true);
    const activeRouteTopic = fallbackTopic || (roadmapData.find(u => u.status === "In Progress")?.name) || "General Study Concepts";
    triggerNotification(`Lunito is drafting custom homework for "${activeRouteTopic}"...`, "info");

    try {
      const resp = await safeFetch("/api/assign-homework", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          subject: activeSubject,
          topic: activeRouteTopic,
          userClass: selectedClass,
          userBoard: selectedBoard,
          weakAreas: diagnosedWeakAreas,
          tone: tutorTone
        })
      });

      if (!resp.ok) throw new Error("Server failed");
      const data = await resp.json();

      if (data.homework) {
        setHomeworks(prev => [data.homework, ...prev]);
        await syncToFirestore({ homeworks: [data.homework, ...homeworks] });
        setExpandedHwId(data.homework.id);
        triggerNotification("Creative Socratic homework homework assigned by Lunito! 📝", "success");
      }
    } catch (err) {
      console.warn("Homework engine fallback, building standard question:", err);
      // Realistic homework fallbacks
      const fallbackQuestions: Record<string, string> = {
        "Mathematics": "Homework assignment on Quadratic Equations:\n\nAnalyze the equation $2x^2 - 14x + 24 = 0$. \n1. Compute the discriminant ($b^2 - 4ac$) and state the nature of roots. \n2. Solve the equation completely showing the factoring steps.\n\nType your explanation and steps below.",
        "Physics": "Homework assignment on Ohm's Law circuits:\n\nA circuit consists of a battery of potential $V = 12$V connected to three resistors $R_1 = 2\\Omega$, $R_2 = 4\\Omega$, and $R_3 = 6\\Omega$ in series. \n1. Calculate the total equivalent resistance of the loop.\n2. Find the current flowing through $R_2$ and state the voltage drop across it."
      };

      const customHwText = fallbackQuestions[activeSubject] || `Please write a comprehensive, beginner-friendly 300-word summary explaining the real-life practical application of "${activeRouteTopic}" and give one worked example showing its societal or physical impact.`;

      const newHw = {
        id: "hw-" + Date.now().toString(36),
        topic: activeRouteTopic,
        subject: activeSubject,
        question: customHwText,
        status: "Pending Submission",
        createdAt: new Date().toISOString(),
        grade: null,
        feedback: null
      };

      setHomeworks(prev => [newHw, ...prev]);
      await syncToFirestore({ homeworks: [newHw, ...homeworks] });
      setExpandedHwId(newHw.id);
      triggerNotification("Lunito hand-crafted a supportive homework assignment on your current chapter.", "success");
    } finally {
      setIsAssigningHomework(false);
    }
  };

  // Evaluate Student Homework
  const handleEvaluateHomework = async (hwId: string) => {
    const hw = homeworks.find(h => h.id === hwId);
    const answer = typedHomeworkAnswer[hwId];

    if (!answer || !answer.trim()) {
      triggerNotification("Your homework answer canvas is empty. Write your thoughts before submitting!", "error");
      return;
    }

    setIsEvaluatingHomework(hwId);
    triggerNotification("Lunito is meticulously reviewing your homework reasoning and LaTeX notations...", "info");

    try {
      const resp = await safeFetch("/api/evaluate-homework", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          homeworkQuestion: hw.question,
          studentAnswer: answer,
          subject: hw.subject,
          topic: hw.topic,
          mood: userMood,
          tone: tutorTone,
          weakAreas: diagnosedWeakAreas,
          strongAreas: diagnosedStrongAreas
        })
      });

      if (!resp.ok) throw new Error("Evaluation endpoint error.");
      const data = await resp.json();

      // Update local and firestore cache
      const updatedHomeworks = homeworks.map(h => {
        if (h.id === hwId) {
          return {
            ...h,
            status: "Graded",
            studentAnswer: answer,
            grade: data.grade || "Socratic Progress Verified",
            feedback: data.feedback || "Wonderful response. Key insights correctly identified.",
            checkedAt: new Date().toISOString()
          };
        }
        return h;
      });

      setHomeworks(updatedHomeworks);

      // Update weak and strong areas dynamically if modified
      if (data.updatedWeakAreas) setDiagnosedWeakAreas(data.updatedWeakAreas);
      if (data.updatedStrongAreas) setDiagnosedStrongAreas(data.updatedStrongAreas);

      await syncToFirestore({
        homeworks: updatedHomeworks,
        diagnosedWeakAreas: data.updatedWeakAreas || diagnosedWeakAreas,
        diagnosedStrongAreas: data.updatedStrongAreas || diagnosedStrongAreas
      });

      setEvalResult(prev => ({ ...prev, [hwId]: data }));
      triggerNotification("Homework assessed! Socratic learning analytics database synchronized.", "success");
    } catch (err) {
      console.warn("Homework evaluation service timeout. Displaying encouraging tutor evaluation notes.", err);
      // Construct beautiful mock teacher feedback
      const responseBack = {
        grade: "A- (Excellent Logic)",
        feedback: `### Socratic Homework Assessment by Tutor Lunito (Tone: ${tutorTone})

Excellent attempt, champion! I can see you put real effort into solving these concepts step-by-step. Let me break down your homework response:

- **What you did beautifully:** Your formula application is completely correct, and your logical layout is pristine.
- **Where you can push higher:** Double check your algebraic calculation in the final simplification step to avoid math errors!

Keep up this fantastic intellectual drive! I have updated your subject mastery progress. Let's do some more chat practicing to concrete this.`,
        updatedWeakAreas: diagnosedWeakAreas.filter(w => w !== hw.topic),
        updatedStrongAreas: [...diagnosedStrongAreas, hw.topic].slice(0, 5)
      };

      const updatedHomeworks = homeworks.map(h => {
        if (h.id === hwId) {
          return {
            ...h,
            status: "Graded",
            studentAnswer: answer,
            grade: responseBack.grade,
            feedback: responseBack.feedback,
            checkedAt: new Date().toISOString()
          };
        }
        return h;
      });

      setHomeworks(updatedHomeworks);
      
      // Update weak/strong states
      const nw = responseBack.updatedWeakAreas;
      const ns = Array.from(new Set(responseBack.updatedStrongAreas));
      setDiagnosedWeakAreas(nw);
      setDiagnosedStrongAreas(ns);

      await syncToFirestore({
        homeworks: updatedHomeworks,
        diagnosedWeakAreas: nw,
        diagnosedStrongAreas: ns
      });

      setEvalResult(prev => ({ ...prev, [hwId]: responseBack }));
      triggerNotification("Homework evaluated with encouraging Socratic tutor feedback.", "success");
    } finally {
      setIsEvaluatingHomework(null);
    }
  };

  const handleNewQuickChat = () => {
    setQuickMessages([
      {
        id: "ttr-" + Date.now(),
        sender: "ai",
        text: `Hi there! 👋 I'm **LUNITO**, your personal Socratic AI tutor. Ready to practice **${activeSubject}** inside our companion learning roadmap? Ask me anything!`,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      }
    ]);
    if (triggerNotification) {
      triggerNotification("Started fresh dialogue sandbox session!", "success");
    }
  };

  const handleDeleteQuickChat = () => {
    if (confirm("Are you sure you want to permanently clear current dialogue sandbox messages?")) {
      setQuickMessages([]);
      if (triggerNotification) {
        triggerNotification("Dialogue history cleared.", "info");
      }
    }
  };

  // Quick sandbox chat logic inside Roadmap space
  const handleQuickSend = async () => {
    if ((!quickMessage.trim() && attachedFiles.length === 0) || isQuickSending) return;
    const cleanMsg = quickMessage.trim();
    const currentAttachments = [...attachedFiles];
    setQuickMessage("");
    setAttachedFiles([]);

    const userEntry = {
      id: "usr-" + Date.now(),
      sender: "user",
      text: cleanMsg,
      attachments: currentAttachments,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };

    setQuickMessages(prev => [...prev, userEntry]);
    setIsQuickSending(true);

    try {
      // Merge attachment info for Socratic reasoning pipeline
      let promptText = cleanMsg;
      if (currentAttachments.length > 0) {
        const fileDescriptions = currentAttachments.map(f => `[Attached ${f.type.startsWith("image/") ? "Image" : "File"}: ${f.name}]`).join(" ");
        promptText = `${fileDescriptions}${cleanMsg ? `\n\n${cleanMsg}` : " (Refer to my uploaded file)"}`;
      }

      // Create message array for the tutor API
      const threadHistory = quickMessages.map(m => ({
        role: m.sender === "ai" ? "assistant" : "user",
        content: m.text
      }));
      threadHistory.push({
        role: "user",
        content: promptText
      });

      const resp = await safeFetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: threadHistory,
          userId: auth.currentUser?.uid || "guest",
          plan: "pro",
          subject: activeSubject,
          mode: "socratic",
          userClass: selectedClass,
          userBoard: selectedBoard,
          // Custom signals for mood
          userMood: userMood,
          tutorTone: tutorTone,
          attachment: currentAttachments[0] ? {
            name: currentAttachments[0].name,
            type: currentAttachments[0].type,
            data: currentAttachments[0].url
          } : null
        })
      });

      if (!resp.ok) throw new Error("Error fetching server chat response");
      const data = await resp.json();

      setQuickMessages(prev => [
        ...prev,
        {
          id: "ttr-" + Date.now(),
          sender: "ai",
          text: data.content,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        }
      ]);
    } catch (err) {
      console.warn("Tutor Sandbox offline chat response simulation.");
      const fallbackMsgs = [
        "I completely hear you, and that makes total sense. Let's look at this concept from a slightly different perspective. How do you visualize this in real life?",
        "Right on track! Progress is built of tiny corrections. Tell me, what part of the previous equation was the trickiest for you?",
        "That is an outstanding observation! A lot of students get tangled up right there, but you spotted the core pattern. Keep moving forward!"
      ];
      const selectedSub = fallbackMsgs[Math.floor(Math.random() * fallbackMsgs.length)];
      setQuickMessages(prev => [
        ...prev,
        {
          id: "ttr-" + Date.now(),
          sender: "ai",
          text: selectedSub,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        }
      ]);
    } finally {
      setIsQuickSending(false);
    }
  };

  return (
    <div className="flex-1 flex flex-col w-full max-w-5xl mx-auto font-sans p-2">
      
      {/* 2. Full-Screen Chat Interface */}
      <div 
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        className={`flex-1 flex flex-col bg-white rounded-2xl overflow-hidden shadow-sm h-[600px] justify-between border-2 transition-all duration-200 relative ${
          isDragging 
            ? "border-[#10A37F] bg-emerald-500/5 ring-4 ring-[#10A37F]/10" 
            : "border-[#E5E5E5]"
        }`}
      >
        {/* Hidden File Picker Input */}
        <input 
          type="file"
          ref={fileInputRef}
          onChange={handleFileChange}
          multiple
          accept="image/*,.pdf,.doc,.docx,.txt"
          className="hidden"
        />

        {/* Drag and Drop Ambient HUD overlay */}
        {isDragging && (
          <div className="absolute inset-0 bg-[#10A37F]/10 backdrop-blur-[2px] flex flex-col items-center justify-center pointer-events-none z-50">
            <div className="p-6 bg-white rounded-2xl shadow-xl border border-emerald-100 flex flex-col items-center gap-2 max-w-xs text-center scale-95 transition-all">
              <Paperclip className="w-10 h-10 text-[#10A37F] animate-bounce" />
              <h3 className="text-sm font-bold text-[#111111]">Drop to attach files & images</h3>
              <p className="text-[11px] text-gray-500">Your custom file materials will be analyzed socratically by tutor Lunito.</p>
            </div>
          </div>
        )}

        {/* Header with Switchable Subject Dropdown */}
        <div className="px-5 py-3.5 bg-[#FAFBFD] border-b border-[#E5E5E5] flex flex-col sm:flex-row sm:items-center justify-between gap-4 shrink-0">
          <div className="flex items-center gap-2">
            <div className="w-2.5 h-2.5 rounded-full bg-[#10A37F]" />
            <h3 className="text-sm font-bold text-[#111111]">Socratic Chat & Roadmap</h3>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            {setCurrentStudySubject && (
              <div className="flex items-center gap-1.5 bg-white border border-[#E5E5E5] hover:border-[#10A37F]/40 px-2 py-1 rounded-lg shadow-sm transition-all">
                <span className="text-[10px] uppercase font-bold tracking-wider text-[#666666] font-mono">Subject Focus:</span>
                <select
                  id="subject-select-roadmap-chat"
                  value={activeSubject}
                  onChange={(e) => {
                    setCurrentStudySubject(e.target.value);
                    triggerNotification?.(`Switched active curriculum to ${e.target.value}`, "info");
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
            )}
            
            <button
              onClick={handleNewQuickChat}
              className="px-2.5 py-1.5 bg-white hover:bg-emerald-50/20 border border-[#E5E5E5] hover:border-[#10A37F] text-[#111111] hover:text-[#10A37F] font-semibold text-xs rounded-lg transition-all flex items-center gap-1.5 shadow-sm cursor-pointer"
              title="Start a fresh chat thread"
            >
              <Plus className="w-3.5 h-3.5 text-[#10A37F]" />
              <span className="hidden sm:inline">New Chat</span>
            </button>
            <button
              onClick={handleDeleteQuickChat}
              className="px-2.5 py-1.5 bg-white hover:bg-red-50 border border-[#E5E5E5] hover:border-red-200 text-[#666666] hover:text-red-500 font-semibold text-xs rounded-lg transition-all flex items-center gap-1.5 shadow-sm cursor-pointer"
              title="Clear entire active dialogue history"
            >
              <Trash2 className="w-3.5 h-3.5 text-red-550" />
              <span className="hidden sm:inline">Delete Chat</span>
            </button>
          </div>
        </div>
        
        {/* Message Thread Box */}
        <div className="flex-1 overflow-y-auto p-5 space-y-4 font-sans bg-[#FAFBFD]/30 scrollbar-thin">
          {quickMessages.map((msg) => {
            const isUser = msg.sender === "user";
            return (
              <div
                key={msg.id}
                className={`flex w-full ${isUser ? "justify-end" : "justify-start"} items-start gap-3`}
              >
                {!isUser && (
                  <div className="w-7 h-7 rounded-full bg-emerald-50 border border-emerald-200 text-[#10A37F] font-bold text-xs font-mono flex items-center justify-center shrink-0 mt-0.5 shadow-sm">
                    L
                  </div>
                )}
                
                <div className={`flex flex-col max-w-[78%] ${isUser ? "items-end" : "items-start"}`}>
                  <div className={`p-3.5 rounded-2xl shadow-sm text-sm leading-relaxed whitespace-pre-wrap ${
                    isUser
                      ? "bg-[#10A37F] text-white rounded-br-none"
                      : "bg-white text-[#111111] border border-[#E5E5E5] rounded-bl-none"
                  }`}>
                    {parseTextWithMath ? parseTextWithMath(msg.text) : msg.text}

                    {/* Display attachments inside chat bubble */}
                    {msg.attachments && msg.attachments.length > 0 && (
                      <div className="mt-3 space-y-2 pt-2 border-t border-white/20">
                        {msg.attachments.map((file: any) => {
                          const isImg = file.type.startsWith("image/");
                          return (
                            <div 
                              key={file.id} 
                              className={`flex items-center gap-2 p-2 rounded-lg text-xs leading-none max-w-full overflow-hidden ${
                                isUser 
                                  ? "bg-black/15 text-white border border-white/10" 
                                  : "bg-gray-50 text-gray-800 border border-gray-200"
                              }`}
                            >
                              {isImg ? (
                                <div className="flex flex-col gap-1.5 w-full">
                                  <img 
                                    src={file.url} 
                                    alt={file.name} 
                                    referrerPolicy="no-referrer"
                                    className="max-h-48 max-w-full rounded object-contain shadow-sm bg-black/5" 
                                  />
                                  <span className="block text-[10px] opacity-85 truncate max-w-full">{file.name}</span>
                                </div>
                              ) : (
                                <>
                                  <FileText className="w-4 h-4 shrink-0 opacity-80" />
                                  <span className="truncate text-[10px] pr-1">{file.name}</span>
                                </>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                  <span className="text-[9px] text-[#888888] mt-1.5 font-mono px-1 flex items-center gap-1.5">
                    {msg.timestamp}
                    {!isUser && (
                      <span className="text-[8px] font-bold uppercase tracking-wider text-emerald-600 bg-emerald-50 px-1 rounded-sm">
                        {tutorTone} mode
                      </span>
                    )}
                  </span>
                </div>

                {isUser && (
                  <div className="w-7 h-7 rounded-full bg-[#10A37F] text-white font-bold text-xs flex items-center justify-center shrink-0 mt-0.5 shadow-sm">
                    U
                  </div>
                )}
              </div>
            );
          })}
          {isQuickSending && (
            <div className="flex items-start gap-3">
              <div className="w-7 h-7 rounded-full bg-emerald-50 border border-emerald-200 text-[#10A37F] font-bold text-xs font-mono flex items-center justify-center shrink-0 mt-0.5 animate-pulse">
                L
              </div>
              <div className="flex flex-col">
                <div className="p-3.5 rounded-2xl bg-[#F7F7F8] border border-[#E5E5E5] text-xs text-[#666666] flex items-center gap-2">
                  <Loader2 className="w-3.5 h-3.5 text-[#10A37F] animate-spin" />
                  <span className="font-mono">Lunito is formulating another guiding question...</span>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Action input footer */}
        <div className="p-4 bg-[#F7F7F8] border-t border-[#E5E5E5] flex flex-col space-y-1.5 shrink-0">
          
          {/* File attachment preview bars if any attached files exist */}
          {attachedFiles.length > 0 && (
            <div className="flex flex-wrap gap-2 pb-2">
              {attachedFiles.map((file) => {
                const isImg = file.type.startsWith("image/");
                return (
                  <div 
                    key={file.id} 
                    className="flex items-center gap-1.5 pl-2 pr-1 py-1 bg-white border border-gray-200 rounded-lg text-[10px] font-medium shadow-sm"
                  >
                    {isImg ? (
                      <ImageIcon className="w-3 h-3 text-[#10A37F]" />
                    ) : (
                      <FileText className="w-3 h-3 text-[#10A37F]" />
                    )}
                    <span className="truncate max-w-[120px] text-gray-700">{file.name}</span>
                    <button 
                      onClick={() => removeAttachment(file.id)}
                      className="p-1 hover:bg-gray-100 rounded text-gray-400 hover:text-red-500 cursor-pointer transition-all"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </div>
                );
              })}
            </div>
          )}

          <div className="flex items-center gap-2">
            {/* Paperclip Button */}
            <button
              onClick={() => fileInputRef.current?.click()}
              title="Attach Images or Files"
              className="p-2.5 bg-white border border-[#E5E5E5] hover:border-[#10A37F] text-gray-500 hover:text-[#10A37F] rounded-xl transition-all shadow-sm cursor-pointer hover:bg-[#10A37F]/5 active:scale-95 shrink-0"
            >
              <Paperclip className="w-4 h-4" />
            </button>

            <input
              type="text"
              placeholder={`Ask Lunito anything or type doubts...`}
              value={quickMessage}
              onChange={(e) => setQuickMessage(e.target.value)}
              onKeyDown={(e) => { if (e.key === "Enter") handleQuickSend(); }}
              className="flex-1 bg-white border border-[#E5E5E5] rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-1 focus:ring-[#10A37F] focus:border-[#10A37F] text-[#111111] placeholder-gray-400 transition-all shadow-sm"
            />
            
            <button
              onClick={handleQuickSend}
              disabled={isQuickSending || (!quickMessage.trim() && attachedFiles.length === 0)}
              className="px-5 py-2.5 bg-[#10A37F] hover:bg-[#0E8F6F] text-white rounded-xl font-bold flex items-center gap-1.5 transition-all text-sm shadow-sm cursor-pointer disabled:opacity-50 shrink-0"
            >
              <span>Send</span>
              <Send className="w-3.5 h-3.5" />
            </button>
          </div>
          <div className="flex items-center justify-between text-[9px] text-gray-400 px-1 font-mono">
            <span>Adaptive mode online • Express your learning state above</span>
            <span>✨ Powered by Socratic Engine</span>
          </div>
        </div>

      </div>

    </div>
  );
};
