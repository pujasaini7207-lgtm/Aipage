import React, { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  ChevronLeft, 
  ChevronRight, 
  Plus, 
  Trash2, 
  FileDown, 
  Compass, 
  AlertTriangle, 
  Lightbulb, 
  GraduationCap, 
  Sparkles, 
  BookOpen, 
  Check, 
  X, 
  Loader2, 
  Search, 
  PlusCircle, 
  ChevronDown, 
  Edit2, 
  Palette, 
  MoveUp, 
  MoveDown,
  Trash,
  Maximize2,
  Minimize2
} from "lucide-react";
import { 
  collection, 
  getDocs, 
  query, 
  where, 
  updateDoc, 
  doc, 
  addDoc,
  deleteDoc 
} from "firebase/firestore";
import { BlockMath, InlineMath } from "react-katex";

interface SocraticNotebookProps {
  notebookPages: any[];
  setNotebookPages: React.Dispatch<React.SetStateAction<any[]>>;
  notebookPage: number;
  setNotebookPage: (val: number) => void;
  notebookTotalPages: number;
  notebookSearch: string;
  setNotebookSearch: (val: string) => void;
  exportNotebookPageToPdf: (customPage?: { title: string; lines: string[] }) => void;
  triggerNotification: (msg: string, type: "success" | "error" | "info") => void;
  currentStudySubject: string;
  db: any;
  auth: any;
  parseTextWithMath: (txt: string) => React.ReactNode;
  safeFetch: any;
}

interface NotebookItem {
  id: string;
  title: string;
  subject: string;
  difficulty: "Beginner" | "Medium" | "Advanced";
  pages: Array<{
    id: string;
    title: string;
    lines: string[];
    isBookmarked?: boolean;
  }>;
  createdAt: string;
  updatedAt: string;
  progress: number;
  isFavorite?: boolean;
}

// Mobile and responsive sketch canvas block
const SketchPad: React.FC<{
  onSave: (imgDataUrl: string) => void;
  onCancel: () => void;
}> = ({ onSave, onCancel }) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [color, setColor] = useState("#1F2937");
  const [lineWidth, setLineWidth] = useState(3.5);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctx.lineCap = "round";
    ctx.lineJoin = "round";
  }, []);

  const getCoordinates = (e: React.MouseEvent | React.TouchEvent): { x: number; y: number } | null => {
    const canvas = canvasRef.current;
    if (!canvas || typeof canvas.getBoundingClientRect !== "function") return null;
    const rect = canvas.getBoundingClientRect();
    
    // Scale standard coordinates to high density screens if necessary
    const touch = ('touches' in e) && e.touches.length > 0 ? e.touches[0] : null;
    const clientX = touch ? touch.clientX : (e as React.MouseEvent).clientX;
    const clientY = touch ? touch.clientY : (e as React.MouseEvent).clientY;
    
    // Account for CSS styling / responsive canvas size stretching
    const scaleX = canvas.width / (rect.width || 1);
    const scaleY = canvas.height / (rect.height || 1);
    
    return {
      x: (clientX - rect.left) * scaleX,
      y: (clientY - rect.top) * scaleY
    };
  };

  const startDrawing = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    ctx.strokeStyle = color;
    ctx.lineWidth = lineWidth;

    const coords = getCoordinates(e);
    if (!coords) return;

    ctx.beginPath();
    ctx.moveTo(coords.x, coords.y);
    setIsDrawing(true);
  };

  const draw = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    if (!isDrawing) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const coords = getCoordinates(e);
    if (!coords) return;

    ctx.lineTo(coords.x, coords.y);
    ctx.stroke();
    // Prevent iOS mobile viewport bounce when sketching
    if (e.cancelable) {
      e.preventDefault();
    }
  };

  const stopDrawing = () => {
    setIsDrawing(false);
  };

  const handleClear = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
  };

  const handleSave = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const dataUrl = canvas.toDataURL("image/png");
    onSave(dataUrl);
  };

  return (
    <div className="bg-[#FAF7F2] border border-stone-250 p-3 rounded-2xl flex flex-col gap-3 shadow-md select-none w-full max-w-sm mx-auto">
      <div className="flex items-center justify-between">
        <span className="text-[11px] font-black text-stone-700 uppercase tracking-wider flex items-center gap-1">
          <Palette className="w-3.5 h-3.5 text-stone-600" /> Freehand Sketch
        </span>
        <div className="flex gap-1.5 items-center">
          <button 
            type="button" 
            onClick={handleClear} 
            className="text-[9.5px] bg-stone-200/80 hover:bg-stone-300 px-2 py-1 rounded-md font-bold transition-all text-stone-850"
          >
            Clear
          </button>
          <button 
            type="button" 
            onClick={onCancel} 
            className="text-[9.5px] bg-stone-200/80 hover:bg-stone-300 px-2 py-1 rounded-md font-bold transition-all text-stone-850"
          >
            Cancel
          </button>
          <button 
            type="button" 
            onClick={handleSave} 
            className="text-[9.5px] bg-emerald-600 hover:bg-emerald-700 text-white px-2 py-1 rounded-md font-bold transition-all"
          >
            Save
          </button>
        </div>
      </div>

      <div className="flex justify-between items-center gap-2">
        <div className="flex gap-1.5 items-center">
          {["#1F2937", "#EF4444", "#3B82F6", "#10B981", "#D97706", "#8B5CF6"].map((c) => (
            <button
              key={c}
              type="button"
              onClick={() => setColor(c)}
              className={`w-5 h-5 rounded-full transition-transform cursor-pointer flex items-center justify-center`}
              style={{ backgroundColor: c }}
            >
              {color === c && <div className="w-1.5 h-1.5 bg-white rounded-full" />}
            </button>
          ))}
        </div>
        <div className="flex items-center gap-1.5">
          <span className="text-[9px] text-stone-400 font-bold">Pen:</span>
          <input
            type="range"
            min="1.5"
            max="8"
            step="0.5"
            value={lineWidth}
            onChange={(e) => setLineWidth(Number(e.target.value))}
            className="w-14 h-1 bg-stone-250 rounded-lg appearance-none cursor-pointer accent-stone-700"
          />
        </div>
      </div>

      <canvas
        ref={canvasRef}
        width={350}
        height={180}
        onMouseDown={startDrawing}
        onMouseMove={draw}
        onMouseUp={stopDrawing}
        onMouseLeave={stopDrawing}
        onTouchStart={startDrawing}
        onTouchMove={draw}
        onTouchEnd={stopDrawing}
        className="border border-stone-300 border-dashed rounded-xl bg-white cursor-crosshair w-full aspect-video touch-none"
      />
    </div>
  );
};

const paginateLines = (lines: string[], maxWordsPerPage: number = 250): string[][] => {
  const pagesLines: string[][] = [];
  let currentLines: string[] = [];
  let currentWordCount = 0;

  const countWords = (text: string) => {
    const cleanText = text.replace(/^\[(TITLE|HEADING|SUBHEADING|DEFINITION|EXAMPLE|IMPORTANT|NOTE|TAKEAWAY|WARNING|MISTAKE|FORMULA|MATH-LINE|EXAM-TIP|TIP|REVISION)\]:\s*/i, "");
    return cleanText.split(/\s+/).filter(Boolean).length;
  };

  const splitLongLine = (line: string, maxWords: number): string[] => {
    const trimmed = line.trim();
    const tagMatch = trimmed.match(/^\[(TITLE|HEADING|SUBHEADING|DEFINITION|EXAMPLE|IMPORTANT|NOTE|TAKEAWAY|WARNING|MISTAKE|FORMULA|MATH-LINE|EXAM-TIP|TIP|REVISION)\]:\s*(.*)/i);
    let prefix = "";
    let content = line;
    if (tagMatch) {
      prefix = `[${tagMatch[1].toUpperCase()}]: `;
      content = tagMatch[2];
    }
    
    if (trimmed.startsWith("[SKETCH]:") || trimmed.startsWith("[GRAPH-PARABOLA]:")) {
      return [line];
    }

    const words = content.split(/\s+/).filter(Boolean);
    if (words.length <= maxWords) {
      return [line];
    }
    
    const chunks: string[] = [];
    let currentChunk: string[] = [];
    for (const word of words) {
      currentChunk.push(word);
      if (currentChunk.length >= maxWords) {
        chunks.push(currentChunk.join(" "));
        currentChunk = [];
      }
    }
    if (currentChunk.length > 0) {
      chunks.push(currentChunk.join(" "));
    }
    
    return chunks.map((chunk, i) => i === 0 ? `${prefix}${chunk}` : chunk);
  };

  for (const line of lines) {
    const splittedLines = splitLongLine(line, maxWordsPerPage);
    for (const subLine of splittedLines) {
      const wCount = countWords(subLine);
      if (currentWordCount > 0 && currentWordCount + wCount > maxWordsPerPage) {
        pagesLines.push(currentLines);
        currentLines = [subLine];
        currentWordCount = wCount;
      } else {
        currentLines.push(subLine);
        currentWordCount += wCount;
      }
    }
  }

  if (currentLines.length > 0) {
    pagesLines.push(currentLines);
  }

  return pagesLines;
};

export const SocraticNotebook: React.FC<SocraticNotebookProps> = ({
  notebookPages,
  setNotebookPages,
  notebookPage,
  setNotebookPage,
  notebookTotalPages,
  notebookSearch,
  setNotebookSearch,
  exportNotebookPageToPdf,
  triggerNotification,
  currentStudySubject,
  db,
  auth,
  parseTextWithMath,
  safeFetch
}) => {
  // Master states
  const [notebooks, setNotebooks] = useState<NotebookItem[]>([]);
  const [selectedNotebook, setSelectedNotebook] = useState<NotebookItem | null>(null);
  const [activePageIndex, setActivePageIndex] = useState<number>(0);
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [isMobile, setIsMobile] = useState<boolean>(false);
  const [isSubjectDropdownOpen, setIsSubjectDropdownOpen] = useState<boolean>(false);
  const [activeNotebookTool, setActiveNotebookTool] = useState<"pen" | "highlighter" | "eraser" | "select">("pen");
  const [isFullscreen, setIsFullscreen] = useState<boolean>(false);

  useEffect(() => {
    const handleFullscreenChange = () => {
      const isCurrentlyFull = !!(
        document.fullscreenElement ||
        (document as any).webkitFullscreenElement ||
        (document as any).mozFullScreenElement ||
        (document as any).msFullscreenElement
      );
      setIsFullscreen(isCurrentlyFull);
    };

    document.addEventListener("fullscreenchange", handleFullscreenChange);
    document.addEventListener("webkitfullscreenchange", handleFullscreenChange);
    document.addEventListener("mozfullscreenchange", handleFullscreenChange);
    document.addEventListener("MSFullscreenChange", handleFullscreenChange);

    return () => {
      document.removeEventListener("fullscreenchange", handleFullscreenChange);
      document.removeEventListener("webkitfullscreenchange", handleFullscreenChange);
      document.removeEventListener("mozfullscreenchange", handleFullscreenChange);
      document.removeEventListener("MSFullscreenChange", handleFullscreenChange);
    };
  }, []);

  const toggleFullscreen = async () => {
    try {
      if (!isFullscreen) {
        const elem = document.documentElement;
        if (elem.requestFullscreen) {
          await elem.requestFullscreen();
        } else if ((elem as any).webkitRequestFullscreen) {
          await (elem as any).webkitRequestFullscreen();
        } else if ((elem as any).msRequestFullscreen) {
          await (elem as any).msRequestFullscreen();
        }
      } else {
        if (document.exitFullscreen) {
          await document.exitFullscreen();
        } else if ((document as any).webkitExitFullscreen) {
          await (document as any).webkitExitFullscreen();
        } else if ((document as any).msExitFullscreen) {
          await (document as any).msExitFullscreen();
        }
      }
    } catch (err) {
      console.log("[Fullscreen API] Unsupported or blocked in environment. CSS overlay fallback is active.");
    } finally {
      setIsFullscreen(!isFullscreen);
    }
  };

  // Growth / write note input
  const [aiInput, setAiInput] = useState<string>("");
  const [isGrowing, setIsGrowing] = useState<boolean>(false);

  // Creative and editing states
  const [editingBlockIndex, setEditingBlockIndex] = useState<number | null>(null);
  const [editingBlockText, setEditingBlockText] = useState<string>("");
  const [showContentsOutline, setShowContentsOutline] = useState<boolean>(false);
  const [showNewBookModal, setShowNewBookModal] = useState<boolean>(false);
  const [newBookTitle, setNewBookTitle] = useState<string>("");
  const [showSketchPad, setShowSketchPad] = useState<boolean>(false);
  const [highlightedIndices, setHighlightedIndices] = useState<number[]>([]);

  // Subject dictionary list
  const SUBJECTS_LIST = [
    "Mathematics",
    "Physics",
    "Chemistry",
    "Biology",
    "History",
    "Geography",
    "Computer Science",
    "Mixed Subject",
    "Custom Subject"
  ];

  // Immersive high-fidelity initial samples for new users
  const SAMPLE_NOTEBOOKS: NotebookItem[] = [
    {
      id: "algebra-basics",
      title: "Algebra Basics",
      subject: "Mathematics",
      difficulty: "Beginner",
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      progress: 25,
      pages: [
        {
          id: "ab-1",
          title: "Solving Quadratic Equations",
          lines: [
            "[TITLE]: Solving Quadratic Equations",
            "A quadratic equation is in the form of a second-degree polynomial equation:",
            "[FORMULA]: ax^2 + bx + c = 0",
            "where $a \\neq 0$. The coefficients $a$, $b$, and $c$ represent real values.",
            "[SUBHEADING]: Worked Practice Example",
            "[EXAMPLE]: Solve the quadratic equation: x^2 + 5x + 6 = 0",
            "[SUBHEADING]: Step 1: Factor the Quadratic Expression",
            "We seek two numbers that multiply to the constant term $c = 6$ and add to the coefficient $b = 5$. Those numbers are $2$ and $3$.",
            "[MATH-LINE]: x^2 + 5x + 6 = (x + 2)(x + 3) = 0",
            "[SUBHEADING]: Step 2: Set each linear factor to zero",
            "[FORMULA]: x + 2 = 0 \\quad or \\quad x + 3 = 0",
            "[SUBHEADING]: Step 3: Solve for the roots",
            "[REVISION]: Factored roots: x = -2 \\quad or \\quad x = -3",
            "[TAKEAWAY]: Always find two integer factors whose product equals the product of $a \\cdot c$ and sum equals $b$.",
            "[SUBHEADING]: Coordinate Geometry View",
            "[GRAPH-PARABOLA]: true",
            "The roots correspond to the x-intercept points $(-3, 0)$ and $(-2, 0)$.",
            "The function vertex is situated at coordinates $(-2.5, -0.25)$."
          ]
        },
        {
          id: "ab-2",
          title: "Introduction to Functions",
          lines: [
            "[TITLE]: Introduction to Functions",
            "[DEFINITION]: A function is an algebraic relation that uniquely maps every element of an input set (domain) to exactly one element of an output set (codomain).",
            "[FORMULA]: f(x) = mx + c",
            "This equation defines a standard linear function where $m$ represents the line slope and $c$ is the vertical y-intercept."
          ]
        }
      ]
    },
    {
      id: "sample-1",
      title: "JEE Physics: Electrostatics",
      subject: "Physics",
      difficulty: "Advanced",
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      progress: 85,
      pages: [
        {
          id: "p-1",
          title: "Coulomb's Law Foundations",
          lines: [
            "[DEFINITION]: Coulomb's Law quantifies the electrostatic force between two point charges. This mutual force is directly proportional to the magnitude product of charges and inversely proportional to the squared displacement distance.",
            "[FORMULA]: The electrostatics vector force equation is given by:\n$$ \\vec{F} = \\frac{1}{4\\pi\\varepsilon_0} \\frac{q_1 q_2}{r^2} \\hat{r} $$",
            "Real permittivity in vacuum uses constant value $ \\varepsilon_0 \\approx 8.854 \\times 10^{-12} \\text{ C}^2\\text{N}^{-1}\\text{m}^{-2} $. At micro-levels, atomic charge quantizes as integer fractions of electronic charges.",
            "[EXAMPLE]: Determine the electrostatic repulsion force between two electrons placed 1 meter apart in a molecular chamber. Calculate $ F \\approx 2.3 \\times 10^{-28} \\text{ N} $.",
            "[MISTAKE]: Standard error is forgetting that force is a vector array. Direction travels on line corresponding to joint radial hubs.",
            "[REVISION]: Recapped electric force lines, vacuum constant constraints, and physical charge dimensions."
          ]
        },
        {
          id: "p-2",
          title: "Electric Fields & Gradients",
          lines: [
            "[DEFINITION]: Electric field Intensity represents spatial force exerted per positive unit charge test node.",
            "[FORMULA]: $$ \\vec{E} = \\int \\frac{k \\cdot dq}{r^2} \\hat{r} $$",
            "[IMPORTANT]: Field vectors point radially away from positive point matrices and stream inward towards negative sinks."
          ]
        }
      ]
    },
    {
      id: "sample-2",
      title: "Respiration & Plant Biology",
      subject: "Biology",
      difficulty: "Medium",
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      progress: 60,
      pages: [
        {
          id: "pb-1",
          title: "Photosynthesis Process & Inputs",
          lines: [
            "[DEFINITION]: Photosynthesis is the vital biological mechanism where vascular plants absorb gaseous carbon dioxide and atmospheric water, transmuting them into metabolic carbohydrate chains using photons.",
            "Takes place within sub-cellular organelles named chloroplasts which contain highly reactive green chlorophyll molecules.",
            "[FORMULA]: The balanced stoichiometrical equation of glucose creation is:\n$$ 6\\text{CO}_2 + 6\\text{H}_2\\text{O} + \\text{photons} \\rightarrow \\text{C}_6\\text{H}_{12}\\text{O}_6 + 6\\text{O}_2 $$",
            "[EXAMPLE]: The thylakoid membrane hosts standard light reaction cascades triggering ADP synthesis to ATP compounds for nutrient circulation.",
            "[REVISION]: Photolysis splits molecular water, releasing diatomic oxygen gas that leaves the cells, thereby supporting terrestrial life breathing."
          ]
        }
      ]
    }
  ];

  // Mobile viewport detection
  useEffect(() => {
    const checkMobileness = () => {
      setIsMobile(window.innerWidth < 768);
    };
    checkMobileness();
    window.addEventListener("resize", checkMobileness);
    return () => window.removeEventListener("resize", checkMobileness);
  }, []);

  // Fetch notebooks from Firestore and fallback to samples if empty
  useEffect(() => {
    fetchNotebooks();
  }, [auth.currentUser, currentStudySubject]);

  // Self-stabilizing auto-pagination hook to enforce 250-word page limit on all pages
  useEffect(() => {
    if (!selectedNotebook) return;
    
    let needsPagination = false;
    for (const page of selectedNotebook.pages) {
      const totalWords = page.lines.reduce((sum, line) => {
        const cleanText = line.replace(/^\[(TITLE|HEADING|SUBHEADING|DEFINITION|EXAMPLE|IMPORTANT|NOTE|TAKEAWAY|WARNING|MISTAKE|FORMULA|MATH-LINE|EXAM-TIP|TIP|REVISION)\]:\s*/i, "");
        return sum + cleanText.split(/\s+/).filter(Boolean).length;
      }, 0);
      if (totalWords > 250) {
        needsPagination = true;
        break;
      }
    }
    
    if (needsPagination) {
      const newPages: Array<{
        id: string;
        title: string;
        lines: string[];
        isBookmarked?: boolean;
      }> = [];
      
      selectedNotebook.pages.forEach((page, pageIdx) => {
        const paginatedLinesList = paginateLines(page.lines, 250);
        paginatedLinesList.forEach((lines, subIdx) => {
          if (subIdx === 0) {
            newPages.push({
              ...page,
              lines
            });
          } else {
            const baseTitle = page.title.replace(/\s*\(Cont\.\s*\d+\)\s*$/i, "");
            newPages.push({
              id: `${page.id}-break-${subIdx}-${Date.now()}`,
              title: `${baseTitle} (Cont. ${subIdx})`,
              lines,
              isBookmarked: page.isBookmarked
            });
          }
        });
      });
      
      const updatedBook = {
        ...selectedNotebook,
        pages: newPages,
        updatedAt: new Date().toISOString()
      };
      
      setSelectedNotebook(updatedBook);
      syncNotebook(updatedBook);
      triggerNotification("Automated page-break completed (250-word page limit reached)", "info");
    }
  }, [selectedNotebook?.pages]);

  const fetchNotebooks = async () => {
    if (!auth.currentUser) {
      // Local sandbox mode: Load custom offline user notebooks merged with samples
      let localBooks: NotebookItem[] = [];
      try {
        const localBooksStr = localStorage.getItem("lunito_local_notebooks") || "[]";
        localBooks = JSON.parse(localBooksStr);
      } catch (err) {
        console.error("Failed loading local notebooks:", err);
      }

      const mergedBooks = [...localBooks, ...SAMPLE_NOTEBOOKS];
      // Sort by updatedAt descending so latest edited/compiled is first
      mergedBooks.sort((a, b) => {
        const dateA = a.updatedAt ? new Date(a.updatedAt).getTime() : 0;
        const dateB = b.updatedAt ? new Date(b.updatedAt).getTime() : 0;
        return dateB - dateA;
      });

      setNotebooks(mergedBooks);
      setSelectedNotebook(prev => {
        if (prev) {
          return mergedBooks.find(n => n.id === prev.id) || mergedBooks[0];
        }
        // Auto-select latest updated/compiled guide for premium UX
        return mergedBooks[0];
      });
      return;
    }
    try {
      const q = query(
        collection(db, "notebooks"),
        where("userId", "==", auth.currentUser.uid)
      );
      const querySnapshot = await getDocs(q);
      const fetched: NotebookItem[] = [];

      querySnapshot.forEach((docSnap) => {
        const data = docSnap.data();
        let pagesToLoad = data.pages || [];
        if (pagesToLoad.length === 0 && data.lines) {
          // Legacy upgrade
          pagesToLoad = [
            {
              id: "page-1",
              title: data.title || "Introductory Leaf",
              lines: data.lines
            }
          ];
        }
        fetched.push({
          id: docSnap.id,
          title: data.title || "Untitled Lesson",
          subject: data.subject || "Mixed Subject",
          difficulty: data.difficulty || "Medium",
          pages: pagesToLoad,
          createdAt: data.createdAt || new Date().toISOString(),
          updatedAt: data.updatedAt || new Date().toISOString(),
          progress: data.progress || 50,
        });
      });

      // Sort globally by updatedAt descending
      fetched.sort((a, b) => {
        const dateA = a.updatedAt ? new Date(a.updatedAt).getTime() : 0;
        const dateB = b.updatedAt ? new Date(b.updatedAt).getTime() : 0;
        return dateB - dateA;
      });

      if (fetched.length === 0) {
        // Automatically save initial samples in State so user immediately sees awesome notes
        setNotebooks(SAMPLE_NOTEBOOKS);
        setSelectedNotebook(prev => {
          if (prev) {
            return SAMPLE_NOTEBOOKS.find(n => n.id === prev.id) || SAMPLE_NOTEBOOKS[0];
          }
          return SAMPLE_NOTEBOOKS[0];
        });
      } else {
        setNotebooks(fetched);
        setSelectedNotebook(prev => {
          if (prev) {
            return fetched.find(n => n.id === prev.id) || fetched[0];
          }
          return fetched[0]; // Auto-open latest compiled multi-page notebook immediately
        });
      }
    } catch (err) {
      console.error("Error reading Socratic notebooks:", err);
      // Resilient fallback to offline samples
      setNotebooks(SAMPLE_NOTEBOOKS);
      setSelectedNotebook(prev => {
        if (prev) {
          return SAMPLE_NOTEBOOKS.find(n => n.id === prev.id) || SAMPLE_NOTEBOOKS[0];
        }
        return SAMPLE_NOTEBOOKS[0];
      });
    }
  };

  // Sync edits directly back to Firebase Firestore
  const syncNotebook = async (updatedBook: NotebookItem) => {
    if (!auth.currentUser) {
      // Offline local update
      setNotebooks(prev => prev.map(nb => nb.id === updatedBook.id ? updatedBook : nb));
      return;
    }
    try {
      setNotebooks(prev => prev.map(nb => nb.id === updatedBook.id ? updatedBook : nb));
      const docRef = doc(db, "notebooks", updatedBook.id);
      await updateDoc(docRef, {
        title: updatedBook.title,
        subject: updatedBook.subject,
        difficulty: updatedBook.difficulty,
        pages: updatedBook.pages,
        progress: updatedBook.progress,
        updatedAt: new Date().toISOString()
      });
    } catch (err) {
      console.warn("Storage sync offline, saving changes inside browser state:", err);
    }
  };

  // Immediate New Notebook Creation Flow (Notebook Name ONLY)
  const handleCreateNotebook = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!newBookTitle.trim()) {
      triggerNotification("Please key in a valid name for your study notebook", "info");
      return;
    }

    const brandNewBook: NotebookItem = {
      id: `nb-${Date.now()}`,
      title: newBookTitle,
      subject: "Mixed Subject",
      difficulty: "Medium",
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      progress: 10,
      pages: [
        {
          id: `page-${Date.now()}`,
          title: "Leaf 1: Introduction",
          lines: [
            "[DEFINITION]: Welcome to your personalized Socratic self-growing study notebook.",
            "[CONCEPT]: Use the Socratic bottom input bar to automatically generate high-yield chemical reviews, maths solutions, biology graphics or concept sheets inside this leaf."
          ]
        }
      ]
    };

    if (auth.currentUser) {
      try {
        const docRef = await addDoc(collection(db, "notebooks"), {
          userId: auth.currentUser.uid,
          title: brandNewBook.title,
          subject: brandNewBook.subject,
          difficulty: brandNewBook.difficulty,
          pages: brandNewBook.pages,
          progress: brandNewBook.progress,
          createdAt: brandNewBook.createdAt,
          updatedAt: brandNewBook.updatedAt
        });
        brandNewBook.id = docRef.id;
        triggerNotification(`Notebook '${newBookTitle}' designed!`, "success");
      } catch (err) {
        console.error("Failed cloud initialization:", err);
      }
    }

    setNotebooks(prev => [brandNewBook, ...prev]);
    setSelectedNotebook(brandNewBook);
    setActivePageIndex(0);
    setNewBookTitle("");
    setShowNewBookModal(false);
  };

  const handleDeleteNotebook = async (idOfBook: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!confirm("Are you sure you want to permanently shred this study notebook?")) return;
    try {
      setNotebooks(prev => prev.filter(nb => nb.id !== idOfBook));
      if (auth.currentUser) {
        await deleteDoc(doc(db, "notebooks", idOfBook));
      }
      triggerNotification("Notebook shredded from memory catalog", "success");
      if (selectedNotebook?.id === idOfBook) {
        setSelectedNotebook(null);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleAddBlankPage = () => {
    if (!selectedNotebook) return;
    const newIdx = selectedNotebook.pages.length + 1;
    const newPage = {
      id: `p-${Date.now()}`,
      title: `Leaf ${newIdx}: Concept outline`,
      lines: [
        "[CONCEPT]: New empty study leaf. Outline formulas or ask for notes below!"
      ]
    };

    const updated = {
      ...selectedNotebook,
      pages: [...selectedNotebook.pages, newPage]
    };
    setSelectedNotebook(updated);
    setActivePageIndex(updated.pages.length - 1);
    syncNotebook(updated);
    triggerNotification("Intelligent study page sheet created", "info");
  };

  const handleDeleteActivePage = () => {
    if (!selectedNotebook) return;
    if (selectedNotebook.pages.length <= 1) {
      triggerNotification("Your textbook must consist of at least one page sheet.", "info");
      return;
    }
    if (!confirm("Remove this entire leaf page?")) return;

    const filteredPages = selectedNotebook.pages.filter((_, idx) => idx !== activePageIndex);
    const updated = {
      ...selectedNotebook,
      pages: filteredPages
    };
    setSelectedNotebook(updated);
    setActivePageIndex(0);
    syncNotebook(updated);
    triggerNotification("Leaf sheet shredded.", "success");
  };

  // Change Notebook Subject Dropdown Anytime
  const handleSelectSubject = (subj: string) => {
    if (!selectedNotebook) return;
    const updated = {
      ...selectedNotebook,
      subject: subj
    };
    setSelectedNotebook(updated);
    syncNotebook(updated);
    setIsSubjectDropdownOpen(false);
    triggerNotification(`Notebook categorized under ${subj}`, "success");
  };

  // Grow standard Socratic page with AI responses directly
  const handleGrowNotebookNotes = async (overrideInput?: string | React.MouseEvent) => {
    const queryToUse = (typeof overrideInput === "string" ? overrideInput : "").trim() || aiInput;
    if (!selectedNotebook || !queryToUse.trim()) return;
    const activePage = selectedNotebook.pages[activePageIndex];
    if (!activePage) return;

    const userQuery = queryToUse.trim();
    setAiInput("");
    setIsGrowing(true);

    let userIdValue = auth.currentUser?.uid;
    if (!userIdValue) {
      let localGuestId = localStorage.getItem("lunito_notebook_guest_id");
      if (!localGuestId) {
        localGuestId = `guest-scholar-${Math.random().toString(36).substring(2, 11)}`;
        localStorage.setItem("lunito_notebook_guest_id", localGuestId);
      }
      userIdValue = localGuestId;
    }

    try {
      const response = await safeFetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          mode: "notebook",
          subject: selectedNotebook.subject,
          topic: selectedNotebook.title,
          messages: [{
            role: "user",
            content: `Compile premium-grade academic self-study notes or solve the problem step-by-step covering the query: "${userQuery}".
            Make sure the notes are highly rigorous, descriptive, educational, and suitable for the notebook subject "${selectedNotebook.subject}".
            Focus on high-yield exam preparation, detailed clear steps, and concepts.
            Ensure proper LaTeX notation. Return only the beautiful notes or solutions directly. Do not write any conversational greetings or polite introductions/preambles.`
          }],
          userId: userIdValue
        })
      });

      const resData = await response.json();
      if (response.ok && resData.content) {
        // Parse into lines while keeping style prefixes intact for beautiful card rendering
        const cleanLineKeepPrefix = (l: string) => {
          let cleaned = l.trim();
          if (!cleaned) return "";
          const tagMatch = cleaned.match(/^\[(TITLE|HEADING|SUBHEADING|DEFINITION|EXAMPLE|IMPORTANT|NOTE|TAKEAWAY|WARNING|MISTAKE|FORMULA|MATH-LINE|EXAM-TIP|TIP|REVISION)\]:\s*(.*)/i);
          if (tagMatch) {
            const prefix = tagMatch[1].toUpperCase();
            let rest = tagMatch[2].trim();
            rest = rest.replace(/^#+\s*/, "");
            rest = rest.replace(/^-\s*/, "• ");
            rest = rest.replace(/^\*\s*/, "• ");
            rest = rest.replace(/\*\*/g, "");
            return `[${prefix}]: ${rest}`;
          } else {
            cleaned = cleaned.replace(/^#+\s*/, "");
            cleaned = cleaned.replace(/^-\s*/, "• ");
            cleaned = cleaned.replace(/^\*\s*/, "• ");
            cleaned = cleaned.replace(/\*\*/g, "");
            // Strip any raw placeholder tags (e.g. [TEXT], [CONCEPT], [SUMMARY], [TEXT-TABBED]) to prevent raw bracket strings
            cleaned = cleaned.replace(/^\[[A-Z0-9_-]+\]:\s*/i, "").replace(/^\[[A-Z0-9_-]+\]\s*/i, "");
            return cleaned;
          }
        };

        const parsedLines = resData.content.split("\n")
          .map(cleanLineKeepPrefix)
          .filter(Boolean);

        if (resData.sources && resData.sources.length > 0) {
          const sourcesText = resData.sources.slice(0, 3).map((s: any) => `- **${s.title}**: ${s.uri}`).join("\n");
          parsedLines.push(`[REVISION]: Live Web Sources Consulted:\n${sourcesText}`);
        }

        const updatedPage = {
          ...activePage,
          lines: [...(activePage.lines || []), ...parsedLines]
        };

        const updatedPages = selectedNotebook.pages.map((p, idx) => idx === activePageIndex ? updatedPage : p);
        const updatedBook = {
          ...selectedNotebook,
          pages: updatedPages,
          updatedAt: new Date().toISOString()
        };

        setSelectedNotebook(updatedBook);
        syncNotebook(updatedBook);
        triggerNotification("Notes grown! Scroll down to read.", "success");
      } else {
        throw new Error(resData.error || "Empty body or sync fault");
      }
    } catch (err: any) {
      console.error(err);
      const errMsg = err?.message || "Encountered connection spike. Try another query!";
      triggerNotification(errMsg, "error");
    } finally {
      setIsGrowing(false);
    }
  };

  // Modify individual block content
  const handleStartEditingBlock = (idx: number, currentText: string) => {
    setEditingBlockIndex(idx);
    setEditingBlockText(currentText);
  };

  const handleSaveBlockEdit = (idx: number) => {
    if (!selectedNotebook) return;
    const page = selectedNotebook.pages[activePageIndex];
    if (!page) return;

    const newLines = [...page.lines];
    newLines[idx] = editingBlockText;

    const updatedPage = {
      ...page,
      lines: newLines
    };
    const updatedPages = selectedNotebook.pages.map((p, pIdx) => pIdx === activePageIndex ? updatedPage : p);
    const updatedBook = {
      ...selectedNotebook,
      pages: updatedPages
    };

    setSelectedNotebook(updatedBook);
    syncNotebook(updatedBook);
    setEditingBlockIndex(null);
    triggerNotification("Study block text updated", "success");
  };

  const handleDeleteBlock = (idx: number) => {
    if (!selectedNotebook) return;
    const page = selectedNotebook.pages[activePageIndex];
    if (!page) return;

    const newLines = page.lines.filter((_, lineIdx) => lineIdx !== idx);
    const updatedPage = {
      ...page,
      lines: newLines
    };
    const updatedPages = selectedNotebook.pages.map((p, pIdx) => pIdx === activePageIndex ? updatedPage : p);
    const updatedBook = {
      ...selectedNotebook,
      pages: updatedPages
    };

    setSelectedNotebook(updatedBook);
    syncNotebook(updatedBook);
    triggerNotification("Study block shredded", "info");
  };

  const handleMoveBlock = (idx: number, direction: "up" | "down") => {
    if (!selectedNotebook) return;
    const page = selectedNotebook.pages[activePageIndex];
    if (!page) return;

    const newLines = [...page.lines];
    if (direction === "up" && idx > 0) {
      const temp = newLines[idx - 1];
      newLines[idx - 1] = newLines[idx];
      newLines[idx] = temp;
    } else if (direction === "down" && idx < newLines.length - 1) {
      const temp = newLines[idx + 1];
      newLines[idx + 1] = newLines[idx];
      newLines[idx] = temp;
    }

    const updatedPage = {
      ...page,
      lines: newLines
    };
    const updatedPages = selectedNotebook.pages.map((p, pIdx) => pIdx === activePageIndex ? updatedPage : p);
    const updatedBook = {
      ...selectedNotebook,
      pages: updatedPages
    };

    setSelectedNotebook(updatedBook);
    syncNotebook(updatedBook);
  };

  // Add customized block type manually
  const handleAddNewCustomBlock = (tag: string) => {
    if (!selectedNotebook) return;
    const page = selectedNotebook.pages[activePageIndex];
    if (!page) return;

    let preFilled = "";
    if (tag === "DEFINITION") preFilled = "[DEFINITION]: Enter detailed description here.";
    else if (tag === "EXAMPLE") preFilled = "[EXAMPLE]: E.g., Worked scenario or question step-by-step.";
    else if (tag === "FORMULA") preFilled = "[FORMULA]: Enter mathematical formula: $$ E = h\\nu $$";
    else if (tag === "CONCEPT") preFilled = "[CONCEPT]: Essential analytical insight.";
    else if (tag === "MISTAKE") preFilled = "[MISTAKE]: Avoid confusing X with Y on exams.";
    else if (tag === "SUMMARY") preFilled = "[SUMMARY]: Recapped critical points of the lesson.";
    else preFilled = "Enter standard notes here.";

    const updatedPage = {
      ...page,
      lines: [...page.lines, preFilled]
    };
    const updatedPages = selectedNotebook.pages.map((p, pIdx) => pIdx === activePageIndex ? updatedPage : p);
    const updatedBook = {
      ...selectedNotebook,
      pages: updatedPages
    };

    setSelectedNotebook(updatedBook);
    syncNotebook(updatedBook);
    setEditingBlockIndex(updatedPage.lines.length - 1);
    setEditingBlockText(preFilled);
    triggerNotification("Custom study block appended", "success");
  };

  // Save freehand sketch image block
  const handleSaveFreehandSketch = (imgDataUrl: string) => {
    if (!selectedNotebook) return;
    const page = selectedNotebook.pages[activePageIndex];
    if (!page) return;

    const sketchLine = `[SKETCH]: ${imgDataUrl}`;
    const updatedPage = {
      ...page,
      lines: [...page.lines, sketchLine]
    };
    const updatedPages = selectedNotebook.pages.map((p, pIdx) => pIdx === activePageIndex ? updatedPage : p);
    const updatedBook = {
      ...selectedNotebook,
      pages: updatedPages
    };

    setSelectedNotebook(updatedBook);
    syncNotebook(updatedBook);
    setShowSketchPad(false);
    triggerNotification("Handwriting sketch appended to active leaf!", "success");
  };

  // Highlight block index toggle
  const toggleBlockHighlight = (idx: number) => {
    if (highlightedIndices.includes(idx)) {
      setHighlightedIndices(prev => prev.filter(i => i !== idx));
    } else {
      setHighlightedIndices(prev => [...prev, idx]);
    }
  };

  // SVG dynamic educational diagram mapping based on page content
  const renderCustomEducationalDiagram = (title: string, subject: string) => {
    const normTitle = (title || "").toLowerCase();
    const normSub = (subject || "").toLowerCase();

    // 1) Chloroplast Biology Process Diagram
    if (normTitle.includes("photo") || normTitle.includes("chloro") || normTitle.includes("plant") || normTitle.includes("cell") || normSub.includes("biol")) {
      return (
        <div className="my-5 p-4 border border-emerald-200 bg-emerald-50/20 rounded-2xl text-center select-none shadow-3xs max-w-lg mx-auto">
          <span className="text-[10px] font-black uppercase text-emerald-800 tracking-wider block mb-2.5 font-mono">
            Biology Model: Chloroplast Photolysis Chart
          </span>
          <svg viewBox="0 0 380 180" className="w-full h-auto max-h-[160px] mx-auto">
            <ellipse cx="190" cy="90" rx="130" ry="65" fill="#DCFCE7" stroke="#059669" strokeWidth="2" />
            
            {/* Grana Stacks */}
            <g transform="translate(110,65)" fill="#10B981" stroke="#047857" strokeWidth="1">
              <rect width="30" height="8" rx="2" />
              <rect width="30" height="8" rx="2" y="6" />
              <rect width="30" height="8" rx="2" y="12" />
            </g>
            <g transform="translate(240,75)" fill="#10B981" stroke="#047857" strokeWidth="1">
              <rect width="30" height="8" rx="2" />
              <rect width="30" height="8" rx="2" y="6" />
            </g>
            <line x1="140" y1="75" x2="240" y2="85" stroke="#059669" strokeWidth="1.5" strokeDasharray="3" />
            
            {/* Flow labels */}
            <path d="M 50 20 L 110 65" stroke="#F59E0B" strokeWidth="2.5" strokeDasharray="3" />
            <text x="35" y="15" fill="#D97706" className="text-[9px] font-bold">☀️ Light Energy</text>

            <text x="45" y="130" fill="#2563EB" className="text-[9px] font-bold">💧 H₂O (In)</text>
            <text x="45" y="155" fill="#4B5563" className="text-[9px] font-bold">💨 CO₂ (In)</text>

            <text x="290" y="35" fill="#DC2626" className="text-[9px] font-bold">🍎 C₆H₁₂O₆ (Sugar)</text>
            <text x="295" y="145" fill="#059669" className="text-[9px] font-bold">💨 O₂ (Out)</text>
          </svg>
        </div>
      );
    }

    // 2) Parabola Roots Math Mapping
    if (normTitle.includes("quad") || normTitle.includes("parab") || normTitle.includes("equa") || normSub.includes("math")) {
      return (
        <div className="my-5 p-4 border border-violet-200 bg-violet-50/20 rounded-2xl text-center select-none shadow-3xs max-w-lg mx-auto">
          <span className="text-[10px] font-black uppercase text-violet-800 tracking-wider block mb-2.5 font-mono">
            Math Model: Parabolic Curvature & Roots
          </span>
          <svg viewBox="0 0 380 185" className="w-full h-auto max-h-[160px] mx-auto">
            {/* Cartesian coordinate plane */}
            <line x1="40" y1="130" x2="340" y2="130" stroke="#9CA3AF" strokeWidth="1.2" />
            <line x1="190" y1="20" x2="190" y2="160" stroke="#9CA3AF" strokeWidth="1.2" />
            
            {/* Parabola curve */}
            <path d="M 90 40 Q 190 165 290 40" fill="none" stroke="#8B5CF6" strokeWidth="2.5" />
            
            {/* Roots */}
            <circle cx="132" cy="130" r="4" fill="#EF4444" stroke="#991B1B" strokeWidth="1.2" />
            <circle cx="248" cy="130" r="4" fill="#EF4444" stroke="#991B1B" strokeWidth="1.2" />
            
            <text x="105" y="120" fill="#B91C1C" className="text-[8.5px] font-bold font-mono">Root x₁</text>
            <text x="255" y="120" fill="#B91C1C" className="text-[8.5px] font-bold font-mono">Root x₂</text>
            
            <circle cx="190" cy="130" r="2.5" fill="#10B981" />
            <text x="200" y="145" fill="#4B5563" className="text-[8px] font-bold">Vertex (0, 0)</text>
          </svg>
        </div>
      );
    }

    // 3) Convex Lens Optics diagram
    if (normTitle.includes("optic") || normTitle.includes("len") || normTitle.includes("ray") || normTitle.includes("light") || normSub.includes("phys")) {
      return (
        <div className="my-5 p-4 border border-blue-200 bg-blue-50/20 rounded-2xl text-center select-none shadow-3xs max-w-lg mx-auto">
          <span className="text-[10px] font-black uppercase text-blue-800 tracking-wider block mb-2.5 font-mono">
            Physics Model: Convex Refraction Index
          </span>
          <svg viewBox="0 0 380 180" className="w-full h-auto max-h-[160px] mx-auto">
            <line x1="30" y1="90" x2="350" y2="90" stroke="#9CA3AF" strokeDasharray="3" />
            
            {/* Convex Lens lens */}
            <path d="M 190 20 Q 205 90 190 160 Q 175 90 190 20" fill="#EFF6FF" fillOpacity="0.8" stroke="#3B82F6" strokeWidth="2" />
            
            <circle cx="100" cy="90" r="3" fill="#2563EB" />
            <circle cx="280" cy="90" r="3" fill="#2563EB" />
            <text x="95" y="80" fill="#1D4ED8" className="text-[8px] font-mono">F₁</text>
            <text x="275" y="80" fill="#1D4ED8" className="text-[8px] font-mono">F₂ (Focus)</text>

            <path d="M 40 50 L 190 50 L 280 90 L 340 115" fill="none" stroke="#EF4444" strokeWidth="1.5" />
            <path d="M 40 50 L 190 90 L 340 130" fill="none" stroke="#F59E0B" strokeWidth="1.5" />
            <line x1="40" y1="90" x2="40" y2="50" stroke="#10B981" strokeWidth="2.5" />
            
            <text x="25" y="42" fill="#047857" className="text-[8px] font-extrabold uppercase">Object</text>
          </svg>
        </div>
      );
    }

    // Default: Multi-branch Mind Map visual
    return (
      <div className="my-5 p-4 border border-stone-200 bg-stone-50/40 rounded-2xl text-center select-none shadow-3xs max-w-lg mx-auto">
        <span className="text-[10px] font-black uppercase text-stone-500 tracking-wider block mb-2.5 font-mono">
          Intelligent Concept Junction Map
        </span>
        <svg viewBox="0 0 380 180" className="w-full h-auto max-h-[160px] mx-auto">
          {/* Central concept node */}
          <rect x="120" y="70" width="140" height="40" rx="10" fill="#F3F4F6" stroke="#4B5563" strokeWidth="1.5" />
          <text x="190" y="94" textAnchor="middle" fill="#111827" className="text-[9px] font-extrabold uppercase font-sans">
            {title ? (title.length > 18 ? title.slice(0, 18) + "..." : title) : "Active Concept"}
          </text>
          
          {/* Left Leaf branch */}
          <line x1="50" y1="45" x2="120" y2="75" stroke="#6B7280" strokeWidth="1" strokeDasharray="3" />
          <rect x="15" y="25" width="75" height="28" rx="6" fill="#EFF6FF" stroke="#3B82F6" strokeWidth="1" />
          <text x="52.5" y="41" textAnchor="middle" fill="#1E40AF" className="text-[8px] font-bold">Foundations</text>

          {/* Right Leaf branch */}
          <line x1="260" y1="90" x2="330" y2="55" stroke="#6B7280" strokeWidth="1" strokeDasharray="3" />
          <rect x="290" y="30" width="75" height="28" rx="6" fill="#ECFDF5" stroke="#10B981" strokeWidth="1" />
          <text x="327.5" y="46" textAnchor="middle" fill="#065F46" className="text-[8px] font-bold">Applications</text>

          {/* Bottom Leaf branch */}
          <line x1="190" y1="110" x2="190" y2="135" stroke="#6B7280" strokeWidth="1" strokeDasharray="3" />
          <rect x="140" y="130" width="100" height="28" rx="6" fill="#FAF5FF" stroke="#8B5CF6" strokeWidth="1" />
          <text x="190" y="146" textAnchor="middle" fill="#5B21B6" className="text-[8px] font-bold">Revise Lessons</text>
        </svg>
      </div>
    );
  };

  // Render individual content blocks with unified handwritten lines
  const renderInteractiveBlock = (line: string, idx: number) => {
    const clean = line.trim();
    if (!clean) return <div key={idx} className="h-2" />;

    const isEdit = editingBlockIndex === idx;
    const isHighlighted = highlightedIndices.includes(idx);

    // Render edit block state
    if (isEdit) {
      return (
        <div key={idx} className="bg-white border-2 border-[#10B981] p-3 rounded-2xl my-3 shadow-inner flex flex-col gap-2">
          <textarea
            value={editingBlockText}
            onChange={(e) => setEditingBlockText(e.target.value)}
            className="w-full text-xs font-medium resize-y p-2 border border-stone-250 rounded-xl focus:outline-none focus:ring-1 focus:ring-emerald-500 h-28 leading-relaxed font-sans"
          />
          <div className="flex gap-2 justify-end">
            <button
              type="button"
              onClick={() => setEditingBlockIndex(null)}
              className="text-[10px] uppercase font-black tracking-wider text-stone-500 hover:text-stone-700 bg-stone-100 px-3 py-1 rounded-lg transition-all"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={() => handleSaveBlockEdit(idx)}
              className="text-[10px] uppercase font-black tracking-wider text-white bg-emerald-600 hover:bg-emerald-700 px-3 py-1 rounded-lg transition-all"
            >
              Save Section
            </button>
          </div>
        </div>
      );
    }

    // Keep [SKETCH] block since it represents a canvas drawing image
    if (clean.startsWith("[SKETCH]:")) {
      const datURL = clean.replace(/^\[SKETCH\]:\s*/i, "");
      return (
        <div 
          key={idx} 
          className="group relative border border-stone-200/80 bg-white p-3 rounded-2xl shadow-sm my-4 flex justify-center items-center overflow-hidden max-w-sm mx-auto animate-fadeIn"
        >
          {renderFloatingBlockControls(idx, line)}
          <div className="absolute top-2 left-2 flex items-center gap-1 select-none pointer-events-none">
            <span className="text-[9px] font-black text-stone-400 uppercase font-mono tracking-widest bg-stone-100 px-1.5 py-0.5 rounded-md">Sketch</span>
          </div>
          <img src={datURL} alt="Notebook sketch" className="h-auto max-h-[170px] object-contain" />
        </div>
      );
    }

    // Keep GRAPH blocks since they are visual plots
    if (clean.startsWith("[GRAPH-PARABOLA]:")) {
      return (
        <div key={idx} className="group relative my-5 pl-1 max-w-lg">
          {renderFloatingBlockControls(idx, line)}
          <div className="my-2 p-3 border border-zinc-200/80 bg-white rounded-2xl text-center select-none shadow-3xs max-w-md mx-auto relative font-sans">
            <svg viewBox="0 0 320 260" className="w-full h-auto mx-auto max-h-[220px]">
              {/* Draw light gray graph grid lines */}
              <g stroke="#F3F4F6" strokeWidth="1">
                {/* Vertical Grid lines */}
                <line x1="40" y1="20" x2="40" y2="240" />
                <line x1="70" y1="20" x2="70" y2="240" />
                <line x1="100" y1="20" x2="100" y2="240" />
                <line x1="130" y1="20" x2="130" y2="240" />
                <line x1="160" y1="20" x2="160" y2="240" />
                <line x1="190" y1="20" x2="190" y2="240" />
                <line x1="220" y1="20" x2="220" y2="240" />
                <line x1="250" y1="20" x2="250" y2="240" />
                <line x1="280" y1="20" x2="280" y2="240" />
                <line x1="20" y1="50" x2="300" y2="50" />
                <line x1="20" y1="80" x2="300" y2="80" />
                <line x1="20" y1="110" x2="300" y2="110" />
                <line x1="20" y1="140" x2="300" y2="140" />
                <line x1="20" y1="170" x2="300" y2="170" />
                <line x1="20" y1="200" x2="300" y2="200" />
                <line x1="20" y1="230" x2="300" y2="230" />
              </g>

              {/* Draw Main Axes */}
              <line x1="160" y1="15" x2="160" y2="245" stroke="#9CA3AF" strokeWidth="1.5" />
              <line x1="15" y1="170" x2="305" y2="170" stroke="#9CA3AF" strokeWidth="1.5" />

              {/* Axis markers/ticks */}
              <text x="40" y="184" textAnchor="middle" className="text-[9px] font-bold text-gray-400 font-sans">-4</text>
              <text x="70" y="184" textAnchor="middle" className="text-[9px] font-bold text-gray-400 font-sans">-3</text>
              <text x="100" y="184" textAnchor="middle" className="text-[9px] font-bold text-gray-400 font-sans">-2</text>
              <text x="130" y="184" textAnchor="middle" className="text-[9px] font-bold text-gray-400 font-sans">-1</text>
              <text x="190" y="184" textAnchor="middle" className="text-[9px] font-bold text-gray-400 font-sans">1</text>
              <text x="220" y="184" textAnchor="middle" className="text-[9px] font-bold text-gray-400 font-sans">2</text>
              <text x="250" y="184" textAnchor="middle" className="text-[9px] font-bold text-gray-400 font-sans">3</text>
              <text x="280" y="184" textAnchor="middle" className="text-[9px] font-bold text-gray-400 font-sans">4</text>

              <text x="150" y="54" textAnchor="end" className="text-[9px] font-bold text-gray-400 font-sans">4</text>
              <text x="150" y="84" textAnchor="end" className="text-[9px] font-bold text-gray-400 font-sans">3</text>
              <text x="150" y="114" textAnchor="end" className="text-[9px] font-bold text-gray-400 font-sans">2</text>
              <text x="155" y="204" textAnchor="end" className="text-[9px] font-bold text-gray-400 font-sans">-1</text>

              {/* Plot Parabola Curve */}
              <path d="M 68 50 Q 115 264.5 162 50" fill="none" stroke="#A78BFA" strokeWidth="3" />
              <circle cx="70" cy="170" r="5.5" fill="#10B981" stroke="#047857" strokeWidth="1.5" />
              <circle cx="100" cy="170" r="5.5" fill="#10B981" stroke="#047857" strokeWidth="1.5" />
              <circle cx="85" cy="177.5" r="4.5" fill="#9333EA" />
            </svg>
          </div>
        </div>
      );
    }

    // Process and render premium styled notes cards based on the line bracket prefix tags
    const tagMatch = clean.match(/^\[(TITLE|HEADING|SUBHEADING|DEFINITION|EXAMPLE|IMPORTANT|NOTE|TAKEAWAY|WARNING|MISTAKE|FORMULA|MATH-LINE|EXAM-TIP|TIP|REVISION)\]:\s*(.*)/i);
    
    if (tagMatch) {
      const tag = tagMatch[1].toUpperCase();
      const contentOfTag = tagMatch[2].trim();

      // Module Title → Simple sleek bold textbook header with blue accent border
      if (tag === "TITLE") {
        return (
          <div key={idx} className="group relative my-4 pl-1 select-text border-b-2 border-blue-500 pb-2 animate-fadeIn">
            {renderFloatingBlockControls(idx, line)}
            <div className="text-[9px] font-mono font-bold uppercase tracking-wider text-blue-600 mb-0.5">
              Study Unit / Chapter Module
            </div>
            <h1 className="font-sans font-black text-xl text-zinc-900 tracking-tight leading-snug">
              {parseTextWithMath(contentOfTag)}
            </h1>
          </div>
        );
      }

      // Main Headings → Purple Accent Heading
      if (tag === "HEADING") {
        return (
          <div key={idx} className="group relative my-3.5 pl-1 select-text animate-fadeIn">
            {renderFloatingBlockControls(idx, line)}
            <div className="flex items-center gap-2 border-l-3 border-purple-500 pl-2.5 my-1.5">
              <span className="text-base font-bold font-sans text-purple-900 tracking-tight">
                {parseTextWithMath(contentOfTag)}
              </span>
            </div>
          </div>
        );
      }

      // Subheadings → Indigo Accent Heading
      if (tag === "SUBHEADING") {
        return (
          <div key={idx} className="group relative my-2.5 pl-1 select-text animate-fadeIn">
            {renderFloatingBlockControls(idx, line)}
            <div className="flex items-center gap-2 border-l-2 border-indigo-400 pl-2 my-1">
              <span className="text-sm font-bold font-sans text-indigo-900 tracking-tight">
                {parseTextWithMath(contentOfTag)}
              </span>
            </div>
          </div>
        );
      }

      // Definitions → Simple Cyan Left border Card
      if (tag === "DEFINITION") {
        return (
          <div key={idx} className="group relative my-2.5 pl-1 select-text animate-fadeIn">
            {renderFloatingBlockControls(idx, line)}
            <div className="bg-cyan-50/15 border border-zinc-200 border-l-[3.5px] border-l-cyan-500 rounded-md p-3 my-1.5 shadow-3xs">
              <div className="text-[8.5px] font-mono font-bold tracking-wider text-cyan-700 uppercase mb-1">
                DEFINITION
              </div>
              <div className="text-[13.5px] leading-relaxed text-zinc-850 font-sans">
                {parseTextWithMath(contentOfTag)}
              </div>
            </div>
          </div>
        );
      }

      // Examples → Simple Green Left border Card
      if (tag === "EXAMPLE") {
        return (
          <div key={idx} className="group relative my-2.5 pl-1 select-text animate-fadeIn">
            {renderFloatingBlockControls(idx, line)}
            <div className="bg-emerald-50/15 border border-zinc-200 border-l-[3.5px] border-l-emerald-500 rounded-md p-3 my-1.5 shadow-3xs">
              <div className="text-[8.5px] font-mono font-bold tracking-wider text-emerald-700 uppercase mb-1">
                WORKED PRACTICE TASK &amp; SOLUTION
              </div>
              <div className="text-[13.5px] leading-relaxed text-zinc-850 font-sans font-medium">
                {parseTextWithMath(contentOfTag)}
              </div>
            </div>
          </div>
        );
      }

      // Key Points / Notes → Yellow Left border Card
      if (tag === "IMPORTANT" || tag === "NOTE" || tag === "TAKEAWAY") {
        return (
          <div key={idx} className="group relative my-2.5 pl-1 select-text animate-fadeIn">
            {renderFloatingBlockControls(idx, line)}
            <div className="bg-amber-50/20 border border-zinc-200 border-l-[3.5px] border-l-amber-500 rounded-md p-3 my-1.5 shadow-3xs">
              <div className="text-[8.5px] font-mono font-bold tracking-wider text-amber-800 uppercase mb-1">
                KEY POINT &amp; CORE HIGHLIGHT
              </div>
              <div className="text-[13.5px] leading-relaxed text-zinc-850 font-sans">
                {parseTextWithMath(contentOfTag)}
              </div>
            </div>
          </div>
        );
      }

      // Warnings/Common Mistakes → Red Left border Card
      if (tag === "WARNING" || tag === "MISTAKE") {
        return (
          <div key={idx} className="group relative my-2.5 pl-1 select-text animate-fadeIn">
            {renderFloatingBlockControls(idx, line)}
            <div className="bg-red-50/15 border border-zinc-200 border-l-[3.5px] border-l-red-500 rounded-md p-3 my-1.5 shadow-3xs">
              <div className="text-[8.5px] font-mono font-bold tracking-wider text-red-700 uppercase mb-1">
                CRITICAL EXAM PITFALL / COMMON ERROR
              </div>
              <div className="text-[13.5px] leading-relaxed text-zinc-900 font-semibold font-sans">
                {parseTextWithMath(contentOfTag)}
              </div>
            </div>
          </div>
        );
      }

      // Formulas → Crisp Violet Formula Containers (centered or inline-block look)
      if (tag === "FORMULA" || tag === "MATH-LINE") {
        return (
          <div key={idx} className="group relative my-3 pl-1 select-text w-full animate-fadeIn">
            {renderFloatingBlockControls(idx, line)}
            <div className="bg-purple-50/15 border border-zinc-200 border-l-[3.5px] border-l-purple-500 rounded-md p-3.5 my-1.5 shadow-3xs w-full overflow-x-auto">
              <div className="text-[8.5px] font-mono font-bold tracking-wider text-purple-700 uppercase mb-1.5">
                MATHEMATICAL REGISTRY / EQUATION
              </div>
              <div className="text-[15.5px] text-zinc-900 font-bold tracking-wide flex items-center justify-center py-1">
                {parseTextWithMath(contentOfTag.startsWith("$$") || contentOfTag.includes("$") ? contentOfTag : `$$ ${contentOfTag} $$`)}
              </div>
            </div>
          </div>
        );
      }

      // Exam Tips → Neat Orange Left border Card
      if (tag === "EXAM-TIP" || tag === "TIP") {
        return (
          <div key={idx} className="group relative my-2.5 pl-1 select-text animate-fadeIn">
            {renderFloatingBlockControls(idx, line)}
            <div className="bg-orange-50/15 border border-zinc-200 border-l-[3.5px] border-l-orange-500 rounded-md p-3 my-1.5 shadow-3xs">
              <div className="text-[8.5px] font-mono font-bold tracking-wider text-orange-700 uppercase mb-1">
                COACHING EXAM TIP
              </div>
              <div className="text-[13.5px] leading-relaxed text-orange-950 font-bold font-sans">
                {parseTextWithMath(contentOfTag)}
              </div>
            </div>
          </div>
        );
      }

      // Revision Page → Teal Left border Card
      if (tag === "REVISION") {
        return (
          <div key={idx} className="group relative my-2.5 pl-1 select-text animate-fadeIn">
            {renderFloatingBlockControls(idx, line)}
            <div className="bg-teal-50/15 border border-zinc-200 border-l-[3.5px] border-l-teal-500 rounded-md p-3 my-1.5 shadow-3xs">
              <div className="text-[8.5px] font-mono font-bold tracking-wider text-teal-700 uppercase mb-1">
                REVISION NOTE / SUMMARY CHECK
              </div>
              <div className="text-[13.5px] leading-relaxed text-zinc-850 font-sans">
                {parseTextWithMath(contentOfTag)}
              </div>
            </div>
          </div>
        );
      }
    }

    // Default Fallback parsing
    if (clean.startsWith("## ") || clean.startsWith("# ")) {
      const strippedTitle = clean.replace(/^#+\s*/, "");
      return (
        <div key={idx} className="group relative my-4 pl-1">
          {renderFloatingBlockControls(idx, line)}
          <div className="relative inline-block">
            <span className="font-handwriting font-bold text-xl md:text-2xl text-zinc-800 tracking-wide select-text relative z-10 leading-relaxed">
              {strippedTitle}
            </span>
            <span className="absolute left-0 bottom-1.5 w-full h-[9px] bg-emerald-250/25 border-b border-emerald-300/25 rounded-full select-none -z-0" />
          </div>
        </div>
      );
    }

    // Default: Elegant handwritten paragraph
    const fallbackClean = clean.replace(/^\[[A-Z0-9_-]+\]:\s*/i, "").replace(/^\[[A-Z0-9_-]+\]\s*/i, "");
    return (
      <div 
        key={idx} 
        className={`group relative p-1.5 px-3 my-1.5 text-[16px] md:text-[17.5px] text-stone-800 leading-relaxed font-handwriting tracking-normal rounded-xl hover:bg-stone-50/50 transition-colors ${isHighlighted ? "bg-yellow-105/70" : ""}`}
      >
        {renderFloatingBlockControls(idx, line)}
        {parseTextWithMath(fallbackClean)}
      </div>
    );
  };

  // Hover panel controls for moving, editing, deleting and highlighting
  const renderFloatingBlockControls = (idx: number, rawText: string) => {
    return (
      <div className="absolute right-2 top-2 opacity-0 group-hover:opacity-100 transition-opacity bg-white border border-stone-200 p-1 rounded-xl flex items-center gap-1.5 shadow-md z-10 select-none">
        <button
          type="button"
          onClick={() => toggleBlockHighlight(idx)}
          className="text-stone-500 hover:text-yellow-600 p-1 hover:bg-stone-50 rounded-lg transition-all"
          title="Highlight Block"
        >
          <span className="text-[11px]">🎨</span>
        </button>
        <button
          type="button"
          onClick={() => handleStartEditingBlock(idx, rawText)}
          className="text-stone-500 hover:text-emerald-600 p-1 hover:bg-stone-50 rounded-lg transition-all"
          title="Edit Block"
        >
          <Edit2 className="w-3 h-3" />
        </button>
        <button
          type="button"
          onClick={() => handleMoveBlock(idx, "up")}
          disabled={idx === 0}
          className="text-stone-500 hover:text-stone-850 p-1 hover:bg-stone-50 disabled:opacity-30 rounded-lg transition-all"
          title="Move Up"
        >
          <MoveUp className="w-3 h-3" />
        </button>
        <button
          type="button"
          onClick={() => handleMoveBlock(idx, "down")}
          disabled={selectedNotebook?.pages[activePageIndex] ? idx === (selectedNotebook.pages[activePageIndex].lines?.length ?? 0) - 1 : true}
          className="text-stone-500 hover:text-stone-850 p-1 hover:bg-stone-50 disabled:opacity-30 rounded-lg transition-all"
          title="Move Down"
        >
          <MoveDown className="w-3 h-3" />
        </button>
        <button
          type="button"
          onClick={() => handleDeleteBlock(idx)}
          className="text-stone-500 hover:text-red-600 p-1 hover:bg-stone-50 rounded-lg transition-all"
          title="Delete Section"
        >
          <Trash2 className="w-3 h-3" />
        </button>
      </div>
    );
  };

  return (
    <div className="w-full bg-[#FAF9F5] min-h-[calc(100vh-64px)] flex flex-col font-sans relative text-stone-850 select-text">
      
      {/* ──────────────── SCREEN 1: THE MY NOTEBOOKS DASHBOARD ──────────────── */}
      {!selectedNotebook ? (
        <div className="flex-1 max-w-5xl mx-auto w-full px-4 py-8 md:py-12">
          
          {/* Dashboard Header */}
          <div className="flex flex-col md:flex-row md:items-center justify-between mb-8 pb-4 border-b border-stone-200">
            <div>
              <h1 className="text-2xl font-black text-stone-900 tracking-tight uppercase font-mono">My Study Catalog</h1>
              <p className="text-xs text-stone-500 font-bold mt-1 uppercase font-mono">Apple Notes &times; Socratic AI Tutor</p>
            </div>
            <button
              type="button"
              onClick={() => setShowNewBookModal(true)}
              className="mt-4 md:mt-0 bg-stone-900 hover:bg-stone-800 text-white font-extrabold text-xs px-4 py-2.5 rounded-2xl flex items-center justify-center gap-1.5 shadow-sm active:scale-95 transition-all cursor-pointer"
            >
              <Plus className="w-4 h-4 text-[#4ADE80]" />
              <span>New Study Notebook</span>
            </button>
          </div>

          {/* Quick Search across notebooks */}
          <div className="relative mb-6">
            <Search className="w-4 h-4 text-stone-400 absolute left-3.5 top-3.5" />
            <input
              type="text"
              placeholder="Search concepts or notebook names..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-white border border-stone-250 rounded-2xl py-2.5 pl-10 pr-4 text-xs font-semibold focus:outline-none focus:border-stone-400 transition-all shadow-3xs"
            />
          </div>

          {/* Notebook Books Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {notebooks
              .filter(nb => nb.title.toLowerCase().includes(searchQuery.toLowerCase()))
              .map((nb) => {
                const totalBlocks = nb.pages.reduce((acc, p) => acc + p.lines.length, 0);
                return (
                  <div
                    key={nb.id}
                    onClick={() => {
                      setSelectedNotebook(nb);
                      setActivePageIndex(0);
                    }}
                    className="group bg-white border border-stone-200 hover:border-stone-350 rounded-3xl p-5 hover:shadow-md transition-all duration-300 transform hover:-translate-y-0.5 cursor-pointer flex flex-col justify-between h-48 relative overflow-hidden"
                  >
                    {/* Left Margin Accent strip representing cover topics */}
                    <div className="absolute top-0 left-0 bottom-0 w-3 bg-stone-150 group-hover:bg-[#4ADE80] transition-all" />

                    <div className="pl-2">
                      <div className="flex justify-between items-start gap-2">
                        <span className="text-[9.5px] font-black uppercase text-stone-500 font-mono tracking-widest bg-stone-100 px-2 py-0.5 rounded-md">
                          📚 {nb.subject}
                        </span>
                        <button
                          type="button"
                          onClick={(e) => handleDeleteNotebook(nb.id, e)}
                          className="opacity-0 group-hover:opacity-100 p-1 hover:bg-stone-100 text-stone-400 hover:text-red-600 rounded-lg duration-200 transition-all"
                        >
                          <Trash className="w-3.5 h-3.5" />
                        </button>
                      </div>

                      <h3 className="text-sm font-black text-stone-903 tracking-tight mt-3 uppercase leading-tight">
                        {nb.title}
                      </h3>
                      
                      <p className="text-[10px] text-stone-450 font-bold font-mono mt-1">
                        {nb.pages.length} PAGES SHEET &bull; {totalBlocks} BLOCK NODES
                      </p>
                    </div>

                    {/* Progress tracking pad */}
                    <div className="pl-2 pt-2 border-t border-stone-100">
                      <div className="flex justify-between items-center text-[9px] font-bold text-stone-500 font-mono">
                        <span>REVISION INDEX</span>
                        <span>{nb.progress}%</span>
                      </div>
                      <div className="w-full bg-stone-100 h-1 rounded-full mt-1 overflow-hidden">
                        <div className="bg-[#4ADE80] h-full" style={{ width: `${nb.progress}%` }} />
                      </div>
                    </div>
                  </div>
                );
              })}
          </div>

          {/* Quick empty state if no catalog matches search */}
          {notebooks.filter(nb => nb.title.toLowerCase().includes(searchQuery.toLowerCase())).length === 0 && (
            <div className="text-center py-20 border border-dashed border-stone-250 bg-white rounded-3xl">
              <span className="text-3xl">🖋️</span>
              <h3 className="text-xs font-black tracking-tight uppercase text-stone-800 mt-2 font-mono">No notes catalogue found</h3>
              <p className="text-[10px] text-stone-500 mt-1 max-w-xs mx-auto leading-normal">
                Initialize an immediate textbook study session above using the "New Study Notebook" button.
              </p>
            </div>
          )}

          {/* Create Notebook Name Input Modal */}
          <AnimatePresence>
            {showNewBookModal && (
              <div className="fixed inset-0 bg-[#0F172A]/40 backdrop-blur-xs flex items-center justify-center p-4 z-50">
                <motion.div
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  className="bg-white rounded-3xl border border-stone-200 p-6 max-w-sm w-full shadow-xl select-none"
                >
                  <div className="flex justify-between items-center pb-3 border-b border-stone-100 mb-4">
                    <h2 className="text-xs font-black uppercase text-stone-800 tracking-widest font-mono">Prepare Study Subject</h2>
                    <button
                      type="button"
                      onClick={() => setShowNewBookModal(false)}
                      className="p-1 hover:bg-stone-100 rounded-lg"
                    >
                      <X className="w-4 h-4 text-stone-400" />
                    </button>
                  </div>

                  <form onSubmit={handleCreateNotebook} className="space-y-4">
                    <div>
                      <label className="text-[10px] font-black uppercase text-stone-500 font-mono tracking-wider block mb-1">
                        Notebook Name
                      </label>
                      <input
                        type="text"
                        required
                        placeholder="e.g. JEE Preparation, Physics Revision..."
                        value={newBookTitle}
                        onChange={(e) => setNewBookTitle(e.target.value)}
                        className="w-full border border-stone-250 rounded-xl px-3 py-2 text-xs font-bold focus:outline-none focus:ring-1 focus:ring-stone-500 bg-stone-50/50"
                      />
                    </div>
                    <div className="flex gap-2 justify-end pt-2">
                      <button
                        type="button"
                        onClick={() => setShowNewBookModal(false)}
                        className="bg-stone-100 hover:bg-stone-200 text-stone-700 font-extrabold text-xs px-3.5 py-2 rounded-xl transition-all"
                      >
                        Cancel
                      </button>
                      <button
                        type="submit"
                        className="bg-stone-900 hover:bg-stone-800 text-white font-extrabold text-xs px-4 py-2 rounded-xl transition-all cursor-pointer"
                      >
                        Create Laptop Note
                      </button>
                    </div>
                  </form>
                </motion.div>
              </div>
            )}
          </AnimatePresence>
        </div>
      ) : (
        
        // ──────────────── SCREEN 2: MAIN INTUITIVE STUDY PAD ────────────────
        <div className={`flex-grow flex flex-col min-h-0 select-none bg-[#F4F4F5] h-full overflow-hidden select-text ${isFullscreen ? 'fixed inset-0 z-[100] w-screen h-screen' : ''}`}>
          
          {/* Note Active Header Bar replaced with compact inline controls */}

          {/* PAGE NAVIGATION HEADER (SUB BAR) */}
          <div className="flex items-center justify-between bg-white px-4 py-3 select-none shrink-0 border-b border-stone-200/50">
            {/* Left section: Back button to Catalog with dynamic title context */}
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setSelectedNotebook(null)}
                className="p-1 px-2.5 border border-[#E4E4E7] hover:bg-[#F4F4F5] rounded-xl text-zinc-700 flex items-center gap-1 cursor-pointer transition-colors shadow-xs text-xs font-bold font-sans"
                title="Return to Books Catalog"
              >
                <ChevronLeft className="w-3.5 h-3.5" />
                <span>Books</span>
              </button>
              <div className="hidden md:block max-w-[160px] truncate text-[11px] font-black text-stone-500 uppercase tracking-wider font-mono">
                {selectedNotebook.title}
              </div>
            </div>

            {/* Center section: Pagination controls */}
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => {
                  if (activePageIndex > 0) setActivePageIndex(activePageIndex - 1);
                }}
                disabled={activePageIndex === 0}
                className="p-1.5 border border-[#E4E4E7] hover:bg-[#F4F4F5] rounded-xl flex items-center justify-center cursor-pointer transition-colors shadow-sm disabled:opacity-30"
              >
                <ChevronLeft className="w-4 h-4 text-zinc-700" />
              </button>

              <span className="text-xs font-sans font-extrabold text-emerald-600 tracking-wide uppercase">
                Leaf {activePageIndex + 1} of {selectedNotebook.pages.length}
              </span>

              <button
                type="button"
                onClick={() => {
                  if (activePageIndex < selectedNotebook.pages.length - 1) setActivePageIndex(activePageIndex + 1);
                }}
                disabled={activePageIndex === selectedNotebook.pages.length - 1}
                className="p-1.5 border border-[#E4E4E7] hover:bg-[#F4F4F5] rounded-xl flex items-center justify-center cursor-pointer transition-colors shadow-sm disabled:opacity-30"
              >
                <ChevronRight className="w-4 h-4 text-zinc-700" />
              </button>
            </div>

            {/* Right section: Control buttons for deleting active notebook page, setting full screen, and exporting PDF */}
            <div className="flex items-center gap-1.5">
              <button
                type="button"
                onClick={toggleFullscreen}
                className="p-1.5 border border-amber-200 bg-amber-50 hover:bg-amber-100 text-amber-700 rounded-xl transition-all flex items-center justify-center cursor-pointer shadow-3xs"
                title={isFullscreen ? "Exit Fullscreen" : "Go Fullscreen"}
              >
                {isFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
              </button>
              <button
                type="button"
                onClick={handleDeleteActivePage}
                className="p-1.5 border border-stone-200 hover:bg-red-50 text-stone-500 hover:text-red-600 rounded-xl transition-all flex items-center justify-center cursor-pointer"
                title="Shred this study leaf"
              >
                <Trash2 className="w-4 h-4" />
              </button>
              <button
                type="button"
                onClick={() => {
                  const activePage = selectedNotebook?.pages[activePageIndex];
                  if (activePage) {
                    exportNotebookPageToPdf({
                      title: activePage.title || `Leaf ${activePageIndex + 1}`,
                      lines: activePage.lines || []
                    });
                  } else {
                    exportNotebookPageToPdf();
                  }
                }}
                className="p-1.5 bg-stone-50 hover:bg-stone-100 text-stone-700 border border-stone-200 rounded-xl transition-all flex items-center justify-center cursor-pointer"
                title="Download Page PDF"
              >
                <FileDown className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* TACTILE WRITING WORKSPACE CONTEXT */}
          <div className="flex-grow overflow-y-auto p-4 md:p-6 pb-40 select-text relative">
            <div className="max-w-2xl mx-auto relative">
              
              {/* THE WRITING PARCHMENT PAPER SHEET */}
              <div 
                className="bg-[#FCFAF5] rounded-3xl border border-stone-250 shadow-sm p-6 pl-10 md:p-8 md:pl-12 min-h-[500px] flex flex-col justify-between relative overflow-hidden"
                style={{
                  backgroundImage: "linear-gradient(rgba(0, 0, 0, 0.035) 1px, transparent 1px)",
                  backgroundSize: "100% 28px",
                  lineHeight: "28px"
                }}
              >
                {/* Red binder margin line on the left side of paper exactly as UI */}
                <div className="absolute top-0 bottom-0 left-7 border-l-2 border-red-300/40 pointer-events-none select-none" />

                <div className="select-text relative z-10 w-full">
                  {/* Lines Stack of study elements */}
                  <div className="space-y-1.5 whitespace-normal break-words overflow-x-hidden pt-1">
                    {selectedNotebook?.pages[activePageIndex]?.lines && selectedNotebook.pages[activePageIndex].lines.length > 0 ? (
                      selectedNotebook.pages[activePageIndex].lines.map((line, lIdx) => renderInteractiveBlock(line, lIdx))
                    ) : (
                      <div className="py-24 text-center select-none">
                        <span className="text-3xl">🖋️</span>
                        <h4 className="text-xs font-black text-stone-700 tracking-tight mt-1 uppercase font-mono">This unit note sheet is blank</h4>
                        <p className="text-[10px] text-stone-400 max-w-xs mx-auto leading-normal mt-1 font-semibold uppercase">
                          Ask your Socratic bot below to draft key formula sheets or summaries!
                        </p>
                      </div>
                    )}

                    {/* Active handwriting drawing workspace */}
                    {showSketchPad && (
                      <div className="my-5 select-none shrink-0">
                        <SketchPad
                          onSave={handleSaveFreehandSketch}
                          onCancel={() => setShowSketchPad(false)}
                        />
                      </div>
                    )}
                  </div>
                </div>

                {/* Notebook bottom margin indicators */}
                <div className="mt-12 pt-3 border-t border-stone-200/50 flex justify-between items-center text-[8.5px] font-mono font-black text-zinc-400 uppercase select-none">
                  <span>Socratic Study Notebook system</span>
                  <span>Leaf {activePageIndex + 1} of {selectedNotebook.pages.length}</span>
                </div>
              </div>

              {/* FLOATING DRAWING SYSTEM TOOLBAR (RIGHT CAPSULE) */}
              <div className="absolute -right-5 top-1/4 bg-white/95 border border-zinc-200/80 shadow-lg rounded-2xl p-1.5 flex flex-col gap-2.5 z-35 select-none">
                <button
                  type="button"
                  onClick={() => {
                    setActiveNotebookTool("pen");
                    triggerNotification("Pencil Pen utility active", "info");
                  }}
                  className={`p-2.5 rounded-xl transition-all cursor-pointer ${
                    activeNotebookTool === "pen" 
                      ? "bg-emerald-50 text-emerald-600 border border-emerald-100" 
                      : "text-zinc-500 hover:bg-zinc-50"
                  }`}
                  title="Ink Writing Pencil Pen"
                >
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                  </svg>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setActiveNotebookTool("highlighter");
                    triggerNotification("Neon Highlighter active", "info");
                  }}
                  className={`p-2.5 rounded-xl transition-all cursor-pointer ${
                    activeNotebookTool === "highlighter" 
                      ? "bg-emerald-50 text-emerald-600 border border-emerald-100" 
                      : "text-zinc-500 hover:bg-zinc-50"
                  }`}
                  title="Marker Highlighter"
                >
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                  </svg>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setActiveNotebookTool("eraser");
                    triggerNotification("Eraser active. Modify any block with hover buttons.", "info");
                  }}
                  className={`p-2.5 rounded-xl transition-all cursor-pointer ${
                    activeNotebookTool === "eraser" 
                      ? "bg-emerald-50 text-emerald-600 border border-emerald-100" 
                      : "text-zinc-500 hover:bg-zinc-50"
                  }`}
                  title="Handwriting Eraser"
                >
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                  </svg>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setActiveNotebookTool("select");
                    triggerNotification("Lasso region selector active", "info");
                  }}
                  className={`p-2.5 rounded-xl transition-all cursor-pointer ${
                    activeNotebookTool === "select" 
                      ? "bg-emerald-50 text-emerald-600 border border-emerald-100" 
                      : "text-zinc-500 hover:bg-zinc-50"
                  }`}
                  title="Lasso Region Selector"
                >
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2" strokeDasharray="3">
                    <rect x="4" y="4" width="16" height="16" rx="2" />
                  </svg>
                </button>
              </div>

              {/* MANUAL ACTION TRIGGERS */}
              <div className="mt-5 flex flex-wrap justify-center gap-2 select-none">
                <button
                  type="button"
                  onClick={() => handleAddNewCustomBlock("DEFINITION")}
                  className="bg-blue-50/70 hover:bg-blue-100 text-blue-800 text-[10px] font-black py-1 px-2.5 rounded-xl border border-blue-200/50 tracking-tight transition-all"
                >
                  ➕ Definition
                </button>
                <button
                  type="button"
                  onClick={() => handleAddNewCustomBlock("EXAMPLE")}
                  className="bg-emerald-50/70 hover:bg-emerald-100 text-emerald-800 text-[10px] font-black py-1 px-2.5 rounded-xl border border-emerald-250/50 tracking-tight transition-all"
                >
                  ➕ Example
                </button>
                <button
                  type="button"
                  onClick={() => handleAddNewCustomBlock("FORMULA")}
                  className="bg-purple-50/70 hover:bg-purple-100 text-purple-800 text-[10px] font-black py-1 px-2.5 rounded-xl border border-purple-200/50 tracking-tight transition-all"
                >
                  ➕ Formula
                </button>
                <button
                  type="button"
                  onClick={() => handleAddNewCustomBlock("CONCEPT")}
                  className="bg-amber-50/70 hover:bg-amber-100 text-amber-805 text-[10px] font-black py-1 px-2.5 rounded-xl border border-amber-250/50 tracking-tight transition-all"
                >
                  ➕ Concept
                </button>
                <button
                  type="button"
                  onClick={() => handleAddNewCustomBlock("MISTAKE")}
                  className="bg-red-50/70 hover:bg-red-100 text-red-800 text-[10px] font-black py-1 px-2.5 rounded-xl border border-red-250/50 tracking-tight transition-all"
                >
                  ➕ Pitfall
                </button>
                <button
                  type="button"
                  onClick={() => setShowSketchPad(true)}
                  className="bg-stone-100 hover:bg-stone-200 text-stone-750 text-[10px] font-black py-1 px-2.5 rounded-xl border border-stone-300 tracking-tight transition-all"
                >
                  🎨 Drawing Pad
                </button>
                <button 
                  type="button" 
                  onClick={handleAddBlankPage}
                  className="bg-[#ECFDF5] hover:bg-[#D1FAE5] text-emerald-800 text-[10px] font-black py-1 px-2.5 rounded-xl border border-emerald-250 tracking-tight transition-all"
                >
                  ➕ Insert Page
                </button>
              </div>

            </div>
          </div>

          {/* BOTTOM FLOATING BAR: AI STUDY TOOLS & ASK QUESTION CONTROL */}
          <div className="absolute bottom-0 left-0 right-0 bg-white/95 border-t border-zinc-200/80 p-4 md:p-5 z-40 shadow-xl select-none">
            <div className="max-w-2xl mx-auto flex flex-col gap-4">
              
              {/* AI Study Tools Outer Frame */}
              <div className="bg-[#F0FDF4]/70 border border-[#DCFCE7]/80 rounded-2xl p-3 shadow-3xs">
                <div className="text-center text-[11px] font-bold text-emerald-800 uppercase tracking-widest mb-3 font-sans">
                  AI Study Tools
                </div>
                <div className="grid grid-cols-5 gap-1.5">
                  {/* Tool 1: Explain Simpler */}
                  <button
                    type="button"
                    onClick={() => {
                      const text = "Explain this page inside the notebook in a simpler, friendlier way with cute analogies.";
                      setAiInput(text);
                      handleGrowNotebookNotes(text);
                      triggerNotification("Explain Simpler initiated", "info");
                    }}
                    className="flex flex-col items-center justify-center p-2 rounded-xl transition-all cursor-pointer bg-[#DCFCE7]/40 hover:bg-[#DCFCE7]/75 text-[#166534]"
                  >
                    <span className="text-lg">🌿</span>
                    <span className="text-[10px] font-semibold mt-1 truncate max-w-full">Explain</span>
                  </button>

                  {/* Tool 2: Think With Me */}
                  <button
                    type="button"
                    onClick={() => {
                      const text = "Let's think together! Ask me a guided conceptual question about the main formula on this page.";
                      setAiInput(text);
                      handleGrowNotebookNotes(text);
                      triggerNotification("Think With Me initiated", "info");
                    }}
                    className="flex flex-col items-center justify-center p-2 rounded-xl transition-all cursor-pointer bg-[#F3E8FF]/40 hover:bg-[#F3E8FF]/75 text-[#6B21A8]"
                  >
                    <span className="text-lg">🧠</span>
                    <span className="text-[10px] font-semibold mt-1 truncate max-w-full">Think</span>
                  </button>

                  {/* Tool 3: Quiz Me */}
                  <button
                    type="button"
                    onClick={() => {
                      const text = "Quiz me! Provide a 3-question multiple choice test based on this page's content, then reply with step-by-step corrections.";
                      setAiInput(text);
                      handleGrowNotebookNotes(text);
                      triggerNotification("Quiz Me initiated", "info");
                    }}
                    className="flex flex-col items-center justify-center p-2 rounded-xl transition-all cursor-pointer bg-[#FCE7F3]/40 hover:bg-[#FCE7F3]/75 text-[#9D174D]"
                  >
                    <span className="text-lg">🤖</span>
                    <span className="text-[10px] font-semibold mt-1 truncate max-w-full">Quiz Me</span>
                  </button>

                  {/* Tool 4: Flashcards */}
                  <button
                    type="button"
                    onClick={() => {
                      const text = "Extract three concise flashcards representing key definitions & formulas on this study page.";
                      setAiInput(text);
                      handleGrowNotebookNotes(text);
                      triggerNotification("Flashcards initiated", "info");
                    }}
                    className="flex flex-col items-center justify-center p-2 rounded-xl transition-all cursor-pointer bg-[#EFF6FF]/50 hover:bg-[#EFF6FF]/80 text-[#1E40AF]"
                  >
                    <span className="text-lg">🗂️</span>
                    <span className="text-[10px] font-semibold mt-1 truncate max-w-full">Cards</span>
                  </button>

                  {/* Tool 5: Practice */}
                  <button
                    type="button"
                    onClick={() => {
                      const text = "Generate a practical test problem related to this lesson along with hints and solutions.";
                      setAiInput(text);
                      handleGrowNotebookNotes(text);
                      triggerNotification("Practice initiated", "info");
                    }}
                    className="flex flex-col items-center justify-center p-2 rounded-xl transition-all cursor-pointer bg-[#E0F2FE]/50 hover:bg-[#E0F2FE]/80 text-[#0369A1]"
                  >
                    <span className="text-lg">💡</span>
                    <span className="text-[10px] font-semibold mt-1 truncate max-w-full">Practice</span>
                  </button>
                </div>
              </div>

              {/* Status Spinner */}
              {isGrowing && (
                <div className="flex items-center justify-center gap-1.5 py-1 select-none text-emerald-700 text-[11px] font-black font-mono uppercase tracking-widest animate-pulse">
                  <Loader2 className="w-4 h-4 animate-spin text-emerald-600" />
                  <span>AI analysis compiling textbook review...</span>
                </div>
              )}

              {/* Ask Input Row */}
              <div className="relative flex items-center bg-zinc-50 border border-zinc-250 rounded-2xl p-1.5 pr-2 shadow-3xs focus-within:border-emerald-500/80 transition-colors">
                {/* Outliner launcher */}
                <button
                  type="button"
                  onClick={() => setShowContentsOutline(true)}
                  className="h-9 px-3.5 hover:bg-zinc-200/80 active:bg-zinc-200 text-zinc-650 rounded-xl flex items-center justify-center gap-1.5 transition-colors font-mono font-black uppercase text-[10px] select-none"
                  title="Show Outline Index"
                >
                  📋 <span className="hidden sm:inline">Index</span>
                </button>

                <input
                  type="text"
                  placeholder="Ask a question about this page..."
                  value={aiInput}
                  onChange={(e) => setAiInput(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleGrowNotebookNotes()}
                  className="flex-grow focus:outline-none text-[13px] font-medium px-2.5 bg-transparent min-w-0"
                  disabled={isGrowing}
                />

                <button
                  type="button"
                  onClick={handleGrowNotebookNotes}
                  className="w-9 h-9 bg-[#10A37F] hover:bg-[#0D8E6D] text-white rounded-full flex items-center justify-center transition-all shadow-sm cursor-pointer hover:scale-105 active:scale-95 disabled:opacity-50 shrink-0"
                  disabled={isGrowing || !aiInput.trim()}
                >
                  <svg className="w-4 h-4 transform rotate-45" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                  </svg>
                </button>
              </div>

            </div>
          </div>

          {/* OUTLINE TABLE MODAL/SIDE SHEET */}
          <AnimatePresence>
            {showContentsOutline && (
              <div className="fixed inset-0 bg-[#0F172A]/40 backdrop-blur-xs flex items-end sm:items-center justify-center p-4 z-50 select-none">
                <motion.div
                  initial={{ y: 100, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  exit={{ y: 100, opacity: 0 }}
                  className="bg-white rounded-t-3xl sm:rounded-3xl border border-stone-250 p-5 max-w-sm w-full shadow-xl max-h-[75vh] flex flex-col justify-between"
                >
                  <div>
                    <div className="flex justify-between items-center pb-3 border-b border-stone-100 mb-4">
                      <h4 className="text-xs font-black uppercase tracking-widest text-stone-500 font-mono">Notebook Outline</h4>
                      <button
                        type="button"
                        onClick={() => setShowContentsOutline(false)}
                        className="p-1 hover:bg-stone-50 rounded-lg"
                      >
                        <X className="w-4 h-4 text-stone-400" />
                      </button>
                    </div>

                    <div className="space-y-2 overflow-y-auto max-h-[45vh] pr-1">
                      {selectedNotebook.pages.map((p, idx) => {
                        return (
                          <div
                            key={p.id || idx}
                            onClick={() => {
                              setActivePageIndex(idx);
                              setShowContentsOutline(false);
                            }}
                            className={`p-3 rounded-2xl border transition-all cursor-pointer flex justify-between items-center ${
                              activePageIndex === idx
                                ? "bg-stone-100 border-stone-300 text-stone-900"
                                : "hover:bg-stone-50 border-stone-150 text-stone-600"
                            }`}
                          >
                            <div className="flex items-center gap-2 truncate">
                              <span className="font-mono text-xs font-extrabold text-stone-400">{idx + 1}.</span>
                              <span className="text-xs font-extrabold text-stone-900 uppercase truncate">{p.title}</span>
                            </div>
                            <span className="text-[8.5px] font-bold font-mono text-stone-400 uppercase">
                              {p.lines.length} nodes
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  <div className="pt-4 border-t border-stone-100 mt-4 flex gap-2">
                    <button
                      type="button"
                      onClick={() => {
                        handleAddBlankPage();
                        setShowContentsOutline(false);
                      }}
                      className="flex-1 bg-[#10A37F] hover:bg-[#0D8E6D] text-white font-black text-xs py-2 px-3 rounded-xl transition-all text-center flex items-center justify-center gap-1"
                    >
                      <Plus className="w-3.5 h-3.5 text-white" />
                      <span>Insert Blank Leaf</span>
                    </button>
                  </div>
                </motion.div>
              </div>
            )}
          </AnimatePresence>

        </div>
      )}

    </div>
  );
};
