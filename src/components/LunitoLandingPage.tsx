import React, { useState, useEffect } from "react";
import { 
  motion, 
  AnimatePresence 
} from "framer-motion";
import { 
  Brain, 
  Sparkles, 
  ChevronRight, 
  TrendingUp, 
  BookOpen, 
  Clock, 
  Activity, 
  Target, 
  Zap, 
  Check, 
  ArrowRight, 
  MessageSquare, 
  Award,
  Star,
  Users,
  ShieldCheck,
  ZapOff,
  UserCheck,
  Bot,
  X,
  Mail,
  MapPin,
  Phone,
  FileText,
  Globe
} from "lucide-react";
import ThreeDUniverse from "./ThreeDUniverse";

interface LandingPageProps {
  onGetStarted: () => void;
  onLogin: () => void;
}

export default function LunitoLandingPage({ onGetStarted, onLogin }: LandingPageProps) {
  const [activeShowcaseTab, setActiveShowcaseTab] = useState<"tutor" | "notebook" | "gaps" | "paths">("tutor");
  const [isScrolled, setIsScrolled] = useState(false);
  const [activePolicy, setActivePolicy] = useState<"terms" | "privacy" | "refund" | "shipping" | "contact" | null>(null);

  // Monitor scroll for glass navbar effect
  useEffect(() => {
    const handleScroll = () => {
      if (window.scrollY > 20) {
        setIsScrolled(true);
      } else {
        setIsScrolled(false);
      }
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  // Smooth scroll helper for menu items
  const scrollToSection = (id: string) => {
    const element = document.getElementById(id);
    if (element) {
      element.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  };

  // Pre-calculated stats representing unicorn-tier growth metrics
  const stats = [
    { value: "1,245,890+", label: "Academic Questions Solved", icon: Check },
    { value: "248,300+", label: "Structured Learning Sessions", icon: Clock },
    { value: "84,950 Hrs+", label: "Self-Study Time Maximised", icon: TrendingUp },
    { value: "98.4%", label: "Target Concept Mastery Rate", icon: Target }
  ];

  // Testimonials with real conversion strength
  const testimonials = [
    {
      name: "Siddharth Mehta",
      role: "M.S. Computer Science, IIT Bombay",
      image: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=150&h=150&q=80",
      content: "Lunito's Notebook Mode is absolute magic. I uploaded raw research notes on Distributed Systems, and the AI instantly diagnosed my cognitive gaps. Helped me clear finals with a perfect grade.",
      rating: 5,
      achievement: "Top 1% of batch"
    },
    {
      name: "Dr. Elena Rostova",
      role: "Assoc. Professor & Cognitive Scientist",
      image: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=150&h=150&q=80",
      content: "Unlike generative bots that simply dump answers, Lunito operates as a true Socratic interlocutor. It forces students to formulate arguments, encouraging active synaptic engagement.",
      rating: 5,
      achievement: "L&D Advisory Board"
    },
    {
      name: "Pranav Roy",
      role: "Medical Undergrad, AIIMS",
      image: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=150&h=150&q=80",
      content: "The Weak Topic Engine saved me months of rote memorization. It mapped out exactly where my organic chemistry concepts failed, then built a self-healing personalized route.",
      rating: 5,
      achievement: "Saved 120+ study hours"
    }
  ];

  return (
    <div className="bg-[#040406] text-zinc-100 min-h-screen relative overflow-x-hidden font-sans selection:bg-violet-600/30 selection:text-violet-200">
      
      {/* GLOW DECORATIONS (Apple-inspired ambient blur) */}
      <div className="absolute top-0 left-1/4 w-[500px] h-[500px] bg-violet-600/5 rounded-full blur-[140px] pointer-events-none" />
      <div className="absolute top-[1200px] right-10 w-[600px] h-[650px] bg-cyan-500/5 rounded-full blur-[160px] pointer-events-none" />
      <div className="absolute top-[2600px] left-1/2 -translate-x-1/2 w-[700px] h-[700px] bg-violet-500/5 rounded-full blur-[180px] pointer-events-none" />
      <div className="absolute bottom-10 left-10 w-[500px] h-[500px] bg-cyan-600/5 rounded-full blur-[140px] pointer-events-none" />

      {/* FIXED SUBTLE TOP MESH GRID */}
      <div className="absolute inset-x-0 top-0 h-[800px] bg-[linear-gradient(to_right,#80808008_1px,transparent_1px),linear-gradient(to_bottom,#80808008_1px,transparent_1px)] bg-[size:40px_40px] [mask-image:radial-gradient(ellipse_50%_50%_at_50%_0%,#000_70%,transparent_100%)] pointer-events-none" />

      {/* 1. STICKY GLASSMOCK BAR */}
      <header 
        className={`fixed top-0 inset-x-0 z-[1000] transition-all duration-500 border-b ${
          isScrolled 
            ? "bg-black/60 backdrop-blur-xl border-white/5 py-3 shadow-lg shadow-black/40" 
            : "bg-transparent border-transparent py-5"
        }`}
      >
        <div className="max-w-7xl mx-auto px-6 flex items-center justify-between">
          <div className="flex items-center gap-2.5 cursor-pointer" onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}>
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-violet-600 to-cyan-500 flex items-center justify-center shadow-lg shadow-violet-500/10 border border-violet-500/20">
              <Brain className="w-5 h-5 text-white" />
            </div>
            <span className="text-sm font-black text-white tracking-widest font-mono select-none">LUNITO AI</span>
          </div>

          {/* Centered Desktop Menu */}
          <nav className="hidden md:flex items-center gap-8 text-[11.5px] font-bold text-zinc-400">
            <button onClick={() => scrollToSection("features")} className="hover:text-white transition-colors cursor-pointer tracking-wide uppercase font-mono">Features</button>
            <button onClick={() => scrollToSection("how-it-works")} className="hover:text-white transition-colors cursor-pointer tracking-wide uppercase font-mono">How It Works</button>
            <button onClick={() => scrollToSection("showcase")} className="hover:text-white transition-colors cursor-pointer tracking-wide uppercase font-mono">Platform</button>
            <button onClick={() => scrollToSection("pricing")} className="hover:text-white transition-colors cursor-pointer tracking-wide uppercase font-mono">Pricing</button>
          </nav>

          {/* Right actions */}
          <div className="flex items-center gap-4">
            <button 
              onClick={onLogin} 
              className="text-[11.5px] font-bold text-zinc-300 hover:text-white transition-colors font-mono uppercase bg-transparent border-none cursor-pointer p-2 px-3"
            >
              Login
            </button>
            <button 
              onClick={onGetStarted} 
              className="relative group overflow-hidden bg-violet-600 hover:bg-violet-700 text-white text-[11px] font-mono uppercase tracking-wider font-extrabold px-5 py-2.5 rounded-xl transition-all shadow-md shadow-violet-550/10 cursor-pointer flex items-center gap-1"
            >
              <span className="z-10">Get Started Free</span>
              <ChevronRight className="w-4 h-4 z-10 transition-transform group-hover:translate-x-1" />
              <div className="absolute inset-0 bg-gradient-to-r from-violet-500 to-cyan-500 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none" />
            </button>
          </div>
        </div>
      </header>

      {/* 2. HERO / ABOVE THE FOLD INTERACTIVE SHOWCASE */}
      <section className="relative pt-32 pb-20 md:pt-40 md:pb-28 max-w-7xl mx-auto px-6 flex flex-col lg:flex-row items-center gap-12 z-10">
        
        {/* Left main sales core */}
        <div className="lg:w-1/2 flex flex-col text-left space-y-6">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 h-7 rounded-full bg-violet-950/20 border border-violet-500/20 text-[9.5px] text-violet-300 uppercase font-bold tracking-widest leading-none">
            <Sparkles className="w-3.5 h-3.5 text-yellow-400 shrink-0" />
            <span>The Generation of Immersive AI Tutors</span>
          </div>

          <h1 className="text-4xl sm:text-5xl md:text-6xl font-black text-white tracking-tight leading-[1.08] font-display">
            Master Any <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-violet-400 via-indigo-300 to-cyan-300 animate-pulse">Subject Faster</span> <br />
            With Socratic AI.
          </h1>

          <p className="text-sm md:text-base text-zinc-400 font-medium leading-relaxed max-w-lg">
            Lunito learns how you learn, identifies weak topics, generates personalized study paths, and helps you achieve mastery faster than traditional learning.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 pt-2">
            <button 
              onClick={onGetStarted} 
              className="py-3 px-6 bg-gradient-to-r from-violet-600 to-cyan-500 text-white font-extrabold text-xs uppercase tracking-wider rounded-xl font-mono shadow-xl hover:shadow-violet-600/10 transition-all cursor-pointer flex items-center justify-center gap-2 group hover:scale-[1.02] active:scale-95 duration-150"
            >
              <span>Get Started Free</span>
              <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
            </button>
            <button 
              onClick={onLogin} 
              className="py-3 px-6 bg-zinc-950 hover:bg-zinc-900 border border-zinc-800 text-zinc-200 font-bold text-xs uppercase tracking-wider rounded-xl font-mono transition-all cursor-pointer flex items-center justify-center"
            >
              Access Portal
            </button>
          </div>

          {/* Social Proof badges & ratings */}
          <div className="pt-8 flex flex-col sm:flex-row sm:items-center gap-6 border-t border-white/5">
            <div className="flex items-center -space-x-2">
              <img src="https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=100&h=100&q=80" alt="Student" className="w-8 h-8 rounded-full border-2 border-zinc-950 object-cover" referrerPolicy="no-referrer" />
              <img src="https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?auto=format&fit=crop&w=100&h=100&q=80" alt="Student" className="w-8 h-8 rounded-full border-2 border-zinc-950 object-cover" referrerPolicy="no-referrer" />
              <img src="https://images.unsplash.com/photo-1517841905240-472988babdf9?auto=format&fit=crop&w=100&h=100&q=80" alt="Student" className="w-8 h-8 rounded-full border-2 border-zinc-950 object-cover" referrerPolicy="no-referrer" />
              <div className="w-8 h-8 rounded-full border-2 border-zinc-900 bg-zinc-950 flex items-center justify-center text-[10px] font-bold text-zinc-400 font-mono">+12K</div>
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                {[...Array(5)].map((_, i) => (
                  <Star key={i} className="w-3.5 h-3.5 fill-yellow-500 text-yellow-500" />
                ))}
                <span className="text-xs font-bold text-zinc-200 ml-1">4.9/5 Scholar Rating</span>
              </div>
              <p className="text-[11px] text-zinc-550 mt-0.5">Trusted across students from IIT, Stanford & Cambridge</p>
            </div>
          </div>
        </div>

        {/* Right 3D centerpiece above fold */}
        <div className="lg:w-1/2 w-full flex items-center justify-center relative min-h-[380px] md:min-h-[460px]">
          {/* Neon back glow circle */}
          <div className="absolute inset-0 m-auto w-72 h-72 rounded-full bg-violet-600/5 filter blur-3xl pointer-events-none" />
          
          <div className="w-full h-full relative z-10 flex items-center justify-center">
            <ThreeDUniverse />
          </div>

          {/* Floating Metric Badge 1 */}
          <div className="absolute top-10 left-4 md:left-[10%] bg-zinc-950/80 backdrop-blur-md p-3.5 rounded-2xl border border-white/5 shadow-2xl flex items-center gap-3 animate-bounce shadow-black select-none z-20 pointer-events-none max-w-[150px]">
            <div className="w-7 h-7 rounded-lg bg-emerald-500/20 flex items-center justify-center">
              <TrendingUp className="w-4 h-4 text-emerald-400" />
            </div>
            <div>
              <div className="text-[13px] font-mono font-black text-white leading-none">10x</div>
              <div className="text-[9px] text-zinc-450 font-bold tracking-tight">Retention Speed</div>
            </div>
          </div>

          {/* Floating Diagnostic Badge 2 */}
          <div className="absolute bottom-10 right-4 md:right-[10%] bg-zinc-950/80 backdrop-blur-md p-3.5 rounded-2xl border border-white/5 shadow-2xl flex items-center gap-3 shadow-black select-none z-20 pointer-events-none max-w-[150px]">
            <div className="w-7 h-7 rounded-lg bg-violet-500/20 flex items-center justify-center animate-pulse">
              <Bot className="w-4 h-4 text-violet-400" />
            </div>
            <div>
              <div className="text-[13px] font-mono font-black text-white leading-none">Socratic AI</div>
              <div className="text-[9px] text-zinc-450 font-bold tracking-tight">Diagnostic Model</div>
            </div>
          </div>
        </div>
      </section>

      {/* 3. HARD STATS / SOCIAL PROOF */}
      <section className="border-y border-white/5 bg-zinc-950/20 py-12">
        <div className="max-w-7xl mx-auto px-6">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-8">
            {stats.map((stat, idx) => {
              const IconComp = stat.icon;
              return (
                <div key={idx} className="flex flex-col items-center lg:items-start text-center lg:text-left space-y-1.5 p-4 rounded-xl hover:bg-white/5 transition-all duration-300">
                  <div className="flex items-center gap-2.5">
                    <div className="w-6 h-6 rounded-md bg-violet-600/10 flex items-center justify-center shrink-0">
                      <IconComp className="w-3.5 h-3.5 text-violet-400" />
                    </div>
                    <span className="text-2xl sm:text-3xl font-mono font-black text-white tracking-tight">{stat.value}</span>
                  </div>
                  <span className="text-[10px] text-zinc-500 font-bold uppercase tracking-wider font-sans">{stat.label}</span>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* 4. PRODUCT SHOWCASE INTERACTIVE DEMO */}
      <section id="showcase" className="py-24 max-w-7xl mx-auto px-6 z-10 relative">
        <div className="text-center space-y-3 mb-14 max-w-2xl mx-auto">
          <div className="text-[9px] font-bold text-violet-400 tracking-widest font-mono uppercase">Interactive Demonstration</div>
          <h2 className="text-3xl md:text-4.5xl font-black text-white tracking-tight font-display">Inside the Socratic Suite.</h2>
          <p className="text-zinc-400 text-xs md:text-sm leading-relaxed">
            Experience the dynamic diagnostic interfaces engineered for high-performance retention. Choose a module below to inspect the interactive simulator.
          </p>
        </div>

        {/* Tab Selection */}
        <div className="flex flex-wrap justify-center gap-2 mb-10 max-w-3xl mx-auto p-1.5 rounded-2xl bg-zinc-950/80 border border-white/5 relative z-10">
          {[
            { id: "tutor", label: "Socratic AI Tutor", icon: MessageSquare },
            { id: "notebook", label: "Notebook Workspace", icon: BookOpen },
            { id: "gaps", label: "Weak Topic Engine", icon: Activity },
            { id: "paths", label: "Personalized Paths", icon: Target }
          ].map((tab) => {
            const Icon = tab.icon;
            const active = activeShowcaseTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveShowcaseTab(tab.id as any)}
                className={`py-2 px-4 rounded-xl text-xs font-bold transition-all flex items-center gap-2 cursor-pointer ${
                  active 
                    ? "bg-violet-600 text-white shadow-md shadow-violet-500/10" 
                    : "text-zinc-400 hover:text-white"
                }`}
              >
                <Icon className={`w-3.5 h-3.5 ${active ? "text-white" : "text-zinc-550"}`} />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>

        {/* Tab Showcase Card Desktop Preview (Stripe style) */}
        <div className="relative group w-full max-w-5xl mx-auto bg-zinc-950 border border-white/5 rounded-3xl overflow-hidden shadow-2xl z-10 flex flex-col md:flex-row">
          
          {/* Details column */}
          <div className="p-8 md:w-2/5 flex flex-col justify-between border-b md:border-b-0 md:border-r border-white/5">
            <div className="space-y-4">
              <AnimatePresence mode="wait">
                <motion.div
                  key={activeShowcaseTab}
                  initial={{ opacity: 0, y: 15 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -15 }}
                  transition={{ duration: 0.25 }}
                  className="space-y-4"
                >
                  <div className="w-10 h-10 rounded-xl bg-violet-600/15 flex items-center justify-center">
                    {activeShowcaseTab === "tutor" && <MessageSquare className="w-5 h-5 text-violet-400" />}
                    {activeShowcaseTab === "notebook" && <BookOpen className="w-5 h-5 text-violet-400" />}
                    {activeShowcaseTab === "gaps" && <Activity className="w-5 h-5 text-violet-400" />}
                    {activeShowcaseTab === "paths" && <Target className="w-5 h-5 text-violet-400" />}
                  </div>

                  <h3 className="text-xl md:text-2xl font-black text-white tracking-tight">
                    {activeShowcaseTab === "tutor" && "Double Socratic Dialogue"}
                    {activeShowcaseTab === "notebook" && "Notebook Co-reasoner"}
                    {activeShowcaseTab === "gaps" && "AI Knowledge Diagnostic"}
                    {activeShowcaseTab === "paths" && "Self-Healing Roadmap"}
                  </h3>

                  <p className="text-zinc-450 text-xs leading-relaxed font-medium">
                    {activeShowcaseTab === "tutor" && "Instead of feeding cold answers, the AI companion prompts you with logical scaffolding. It acts like a patient expert leading you directly to self-discovered logic."}
                    {activeShowcaseTab === "notebook" && "Upload draft lecture files or raw outlines. Highlight complex definitions to trigger the in-line reasoning engine that maps formulas out into gorgeous visual blocks."}
                    {activeShowcaseTab === "gaps" && "As you solve problems, the algorithm tracks speed, mistakes, and hesitation. It maps out your cognitive gaps automatically so you never waste time studying what you already know."}
                    {activeShowcaseTab === "paths" && "A dynamic syllabus that adapts in real time. If a physics concept fails, the engine injects foundational material on core derivatives before advancing. True personalized learning."}
                  </p>

                  <div className="space-y-2 pt-2 text-[10.5px] font-medium text-zinc-400 font-mono">
                    {activeShowcaseTab === "tutor" && (
                      <>
                        <div className="flex items-center gap-2"><Check className="w-3.5 h-3.5 text-violet-400" /> Fully Customised Persona</div>
                        <div className="flex items-center gap-2"><Check className="w-3.5 h-3.5 text-violet-400" /> Embedded Flashcard Generation</div>
                      </>
                    )}
                    {activeShowcaseTab === "notebook" && (
                      <>
                        <div className="flex items-center gap-2"><Check className="w-3.5 h-3.5 text-violet-400" /> Highlight-to-Explain Scaffolding</div>
                        <div className="flex items-center gap-2"><Check className="w-3.5 h-3.5 text-violet-400" /> Standard PDF and Text Upload</div>
                      </>
                    )}
                    {activeShowcaseTab === "gaps" && (
                      <>
                        <div className="flex items-center gap-2"><Check className="w-3.5 h-3.5 text-violet-400" /> Automatic Weak Ratio Analyzer</div>
                        <div className="flex items-center gap-2"><Check className="w-3.5 h-3.5 text-violet-400" /> Cognitive Friction Logging</div>
                      </>
                    )}
                    {activeShowcaseTab === "paths" && (
                      <>
                        <div className="flex items-center gap-2"><Check className="w-3.5 h-3.5 text-violet-400" /> Automated Math Graph Layouts</div>
                        <div className="flex items-center gap-2"><Check className="w-3.5 h-3.5 text-violet-400" /> Dynamic Recalibration System</div>
                      </>
                    )}
                  </div>
                </motion.div>
              </AnimatePresence>
            </div>

            <button
              onClick={onGetStarted}
              className="mt-8 py-2.5 px-4 bg-zinc-900 hover:bg-zinc-850 hover:text-white text-zinc-300 font-bold text-xs uppercase tracking-wider rounded-xl font-mono transition-all flex items-center justify-center gap-1.5 group cursor-pointer"
            >
              <span>Explore This Module</span>
              <ArrowRight className="w-3.5 h-3.5 transition-transform group-hover:translate-x-1" />
            </button>
          </div>

          {/* Interactive UI screenshot simulation column */}
          <div className="md:w-3/5 min-h-[300px] md:min-h-[420px] bg-[#0c0c12] relative overflow-hidden flex items-center justify-center p-6 border-t md:border-t-0 border-white/5">
            <div className="absolute inset-x-0 bottom-0 h-40 bg-gradient-to-t from-[#040406] to-transparent pointer-events-none z-10" />

            <AnimatePresence mode="wait">
              {activeShowcaseTab === "tutor" && (
                <motion.div
                  key="ui-tutor"
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  className="w-full max-w-sm rounded-2xl bg-[#08080c] border border-white/5 shadow-2xl p-4 space-y-4 relative z-0 font-sans"
                >
                  <div className="flex items-center justify-between border-b border-white/5 pb-2">
                    <div className="flex items-center gap-2">
                      <div className="w-6 h-6 rounded-full bg-violet-600 flex items-center justify-center text-[10px] text-white">S</div>
                      <span className="text-[10px] uppercase font-bold tracking-widest text-zinc-300 font-mono">Socratic Companion</span>
                    </div>
                    <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                  </div>

                  <div className="space-y-3">
                    <div className="bg-zinc-900/60 rounded-xl p-3 text-[10px] leading-relaxed max-w-[85%] text-zinc-400">
                      Why does the function limit fail here when x approaches 2? Look at the denominator.
                    </div>
                    <div className="bg-violet-600/10 border border-violet-500/10 rounded-xl p-3 text-[10px] leading-relaxed max-w-[85%] self-end ml-auto text-zinc-200">
                      Ah, x=2 makes the denominator (x - 2) equal to zero, which is undefined!
                    </div>
                    <div className="bg-[#100f1c] border border-violet-500/25 rounded-xl p-3 text-[10px] leading-relaxed max-w-[90%] text-violet-300 border-dashed animate-pulse flex gap-2">
                      <Sparkles className="w-3.5 h-3.5 text-yellow-400 shrink-0" />
                      <span>Excellent! You've identified the dividing-by-zero boundary. How could we rewrite the numerator limits?</span>
                    </div>
                  </div>
                </motion.div>
              )}

              {activeShowcaseTab === "notebook" && (
                <motion.div
                  key="ui-notebook"
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  className="w-full max-w-sm rounded-2xl bg-[#08080c] border border-white/5 shadow-2xl p-4 font-mono relative z-0 text-left text-[10px] text-zinc-400 space-y-3"
                >
                  <div className="border-b border-white/5 pb-2 flex gap-1.5 items-center">
                    <BookOpen className="w-4 h-4 text-violet-400" />
                    <span className="font-sans font-bold text-zinc-200">Lectureノート_Derivative.pdf</span>
                  </div>
                  <div className="p-2.5 rounded-lg bg-black/40 border border-zinc-900 leading-relaxed font-sans text-zinc-400">
                    "The gradient of continuous function represents its rate of change. By computing <span className="text-violet-400 bg-violet-500/15 p-0.5 rounded font-mono font-bold font-semibold px-1 select-none">limit as h becomes 0</span> we identify instantaneous velocity."
                  </div>
                  <div className="p-3 bg-[#0a0a14] border border-violet-500/15 rounded-xl relative">
                    <span className="text-[8px] uppercase tracking-wider text-violet-400 font-bold block mb-1">Interactive Co-Reasoner</span>
                    <span className="text-[9.5px] text-zinc-350 leading-relaxed font-sans block">
                      This calculation represents Newton's Difference Quotient. It computes velocity by dividing rise/run on an infinitely small tangent line!
                    </span>
                  </div>
                </motion.div>
              )}

              {activeShowcaseTab === "gaps" && (
                <motion.div
                  key="ui-gaps"
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  className="w-full max-w-sm rounded-2xl bg-[#08080c] border border-white/5 shadow-2xl p-4 space-y-4 text-left font-sans"
                >
                  <div className="text-[10px] uppercase font-bold tracking-widest text-zinc-400 font-mono">Cognitive Friction Diagnostics</div>
                  <div className="space-y-2.5">
                    {[
                      { topic: "Integration By Parts", score: "42% Mastery Rate", severity: "HIGH COGNITIVE GAP" },
                      { topic: "Wave Dynamics", score: "68% Mastery Rate", severity: "MODERATE FRICTION" },
                      { topic: "Recursion Flowcharts", score: "89% Mastery Rate", severity: "EXCELLENT" }
                    ].map((g, idx) => (
                      <div key={idx} className="p-3 rounded-xl bg-black/40 border border-zinc-900 flex justify-between items-center gap-4">
                        <div>
                          <div className="text-[11px] font-bold text-white leading-none">{g.topic}</div>
                          <div className="text-[9px] text-zinc-500 font-mono mt-1">{g.score}</div>
                        </div>
                        <span className={`text-[8px] font-bold font-mono px-2 py-0.5 rounded uppercase ${
                          idx === 0 ? "bg-rose-550/15 text-rose-400 border border-rose-500/20" : idx === 1 ? "bg-amber-500/10 text-amber-300 border border-amber-500/10" : "bg-emerald-500/10 text-emerald-400 border border-emerald-500/10"
                        }`}>{g.severity}</span>
                      </div>
                    ))}
                  </div>
                </motion.div>
              )}

              {activeShowcaseTab === "paths" && (
                <motion.div
                  key="ui-paths"
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  className="w-full max-w-sm rounded-2xl bg-[#08080c] border border-white/5 shadow-2xl p-4 font-mono relative z-0 space-y-3.5"
                >
                  <span className="text-[9px] font-bold uppercase tracking-widest text-zinc-400">Recalculating Learning Pathway</span>
                  <div className="space-y-2 font-sans relative pl-5 border-l border-zinc-800">
                    <div className="absolute top-1 left-[-4px] w-2 h-2 rounded-full bg-emerald-400" />
                    <div>
                      <div className="text-[10.5px] font-bold text-emerald-400">Step 1: Trigonometric Identities (Mastered)</div>
                      <div className="text-[9px] text-zinc-500">12 questions solved flawlessly.</div>
                    </div>

                    <div className="absolute top-12 left-[-4px] w-2 h-2 rounded-full bg-violet-500 animate-ping" />
                    <div>
                      <div className="text-[10.5px] font-bold text-violet-400">Step 2: Chain Rule Foundations (Active Focus)</div>
                      <div className="text-[9px] text-zinc-450 leading-relaxed font-sans">Self-healing: Socratic limits injected automatically based on trigonometry diagnostics.</div>
                    </div>

                    <div className="absolute top-24 left-[-4px] w-2 h-2 rounded-full bg-zinc-800" />
                    <div>
                      <div className="text-[10.5px] font-bold text-zinc-500">Step 3: Advanced Vector Differentiation</div>
                      <div className="text-[9px] text-zinc-650">Locked until Step 2 is completed.</div>
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </section>

      {/* 5. FEATURES BENTO GRID (Nano Banana Visuals integrated) */}
      <section id="features" className="py-24 border-t border-white/5 relative z-10">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center space-y-3 mb-16 max-w-2xl mx-auto">
            <div className="text-[9px] font-bold text-cyan-400 tracking-widest font-mono uppercase">Full Platform Infrastructure</div>
            <h2 className="text-3xl md:text-4.5xl font-black text-white tracking-tight font-display">Engineered For Intellectual Craft.</h2>
            <p className="text-zinc-450 text-xs md:text-sm leading-relaxed font-sans">
              Unlike default chat apps, Lunito embeds customized learning modes directly inside standard study workspaces, built for cognitive retention.
            </p>
          </div>

          {/* Bento Grid layout */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            
            {/* FEATURE 1: Notebook Mode (with generated image) */}
            <div className="bg-zinc-950/60 border border-white/5 rounded-3xl p-6 hover:border-violet-500/25 transition-all duration-300 md:col-span-2 flex flex-col md:flex-row gap-6 justify-between overflow-hidden relative group">
              <div className="flex flex-col justify-between md:max-w-[50%] z-10">
                <div className="space-y-3">
                  <div className="w-9 h-9 rounded-xl bg-violet-600/10 flex items-center justify-center">
                    <BookOpen className="w-5 h-5 text-violet-400" />
                  </div>
                  <h3 className="text-xl font-bold text-white tracking-tight">Notebook Mode</h3>
                  <p className="text-zinc-400 text-xs leading-relaxed font-sans">
                    Transform raw PDF lectures, book clippings, or handwritten outlines into clean mathematical syntax. Highlight arguments to request live logical validation.
                  </p>
                </div>
                <div className="pt-6">
                  <span className="text-[10px] font-bold text-violet-400 font-mono tracking-widest uppercase flex items-center gap-1">
                    Explore Notes Transformation <ArrowRight className="w-3.5 h-3.5" />
                  </span>
                </div>
              </div>
              <div className="md:w-1/2 flex items-center justify-center relative rounded-2xl overflow-hidden bg-[#0c0c12] border border-white/5">
                <img 
                  src="/src/assets/images/notebook_mode_visual_1780400219516.png" 
                  alt="Notebook Mode Illustration" 
                  className="w-full h-full object-cover rounded-2xl max-h-48 md:max-h-none group-hover:scale-105 transition-all duration-700" 
                  referrerPolicy="no-referrer"
                />
              </div>
            </div>

            {/* FEATURE 2: Think With Me */}
            <div className="bg-zinc-950/60 border border-white/5 rounded-3xl p-6 hover:border-violet-500/25 transition-all duration-300 flex flex-col justify-between overflow-hidden relative group">
              <div className="space-y-3 z-10">
                <div className="w-9 h-9 rounded-xl bg-cyan-600/10 flex items-center justify-center">
                  <Brain className="w-5 h-5 text-cyan-400" />
                </div>
                <h3 className="text-xl font-bold text-white tracking-tight">Think With Me</h3>
                <p className="text-zinc-400 text-xs leading-relaxed font-sans">
                  Stuck on hard puzzles? Turn on guided dialogue. The AI halts direct solutions, prompting logical hints that help you formulate formulas on your own.
                </p>
              </div>
              <div className="mt-6 rounded-2xl overflow-hidden bg-[#0c0c12] border border-white/5 h-36">
                <img 
                  src="/src/assets/images/think_with_me_visual_1780400254765.png" 
                  alt="Think With Me Illustration" 
                  className="w-full h-full object-cover group-hover:scale-105 transition-all duration-700" 
                  referrerPolicy="no-referrer"
                />
              </div>
            </div>

            {/* FEATURE 3: Weak Topic Engine */}
            <div className="bg-zinc-950/60 border border-white/5 rounded-3xl p-6 hover:border-violet-500/25 transition-all duration-300 flex flex-col justify-between overflow-hidden relative group">
              <div className="space-y-3 z-10">
                <div className="w-9 h-9 rounded-xl bg-orange-600/10 flex items-center justify-center">
                  <Activity className="w-5 h-5 text-orange-400" />
                </div>
                <h3 className="text-xl font-bold text-white tracking-tight">Weak Topic Engine</h3>
                <p className="text-zinc-400 text-xs leading-relaxed font-sans">
                  The system tracks response times and correct ratio patterns automatically on tests. It flags weak mathematical coordinates so you know what concept needs training.
                </p>
              </div>
              <div className="mt-6 p-4 rounded-xl bg-black/40 border border-zinc-900 border-dashed text-left font-mono text-[9px] text-zinc-550 space-y-1 select-none">
                <span className="text-orange-400 font-bold block">LOGGING FRICTION PATTERNS:</span>
                <span>• Integration Limits (High Hesitation: 4.8s)</span>
                <span>• Matrix Inversion (Friction Detected)</span>
              </div>
            </div>

            {/* FEATURE 4: AI Insights & Progress Analytics */}
            <div className="bg-zinc-950/60 border border-white/5 rounded-3xl p-6 hover:border-violet-500/25 transition-all duration-300 md:col-span-2 flex flex-col md:flex-row gap-6 justify-between overflow-hidden relative group">
              <div className="flex flex-col justify-between md:max-w-[50%] z-10">
                <div className="space-y-3">
                  <div className="w-9 h-9 rounded-xl bg-[#c084fc]/10 flex items-center justify-center">
                    <TrendingUp className="w-5 h-5 text-[#c084fc]" />
                  </div>
                  <h3 className="text-xl font-bold text-white tracking-tight">Progress Analytics & Insights</h3>
                  <p className="text-zinc-400 text-xs leading-relaxed font-sans">
                    Uncover daily learning metrics over subjects, study sessions, and masteries. Track exactly where your academic performance stands, mapped visually.
                  </p>
                </div>
                <div className="pt-6">
                  <span className="text-[10px] font-bold text-[#c084fc] font-mono tracking-widest uppercase flex items-center gap-1">
                    Assess diagnostic trends <ArrowRight className="w-3.5 h-3.5" />
                  </span>
                </div>
              </div>
              <div className="md:w-1/2 flex items-center justify-center relative rounded-2xl overflow-hidden bg-[#0c0c12] border border-white/5">
                <img 
                  src="/src/assets/images/analytics_visual_1780400237518.png" 
                  alt="Analytics Illustration" 
                  className="w-full h-full object-cover rounded-2xl max-h-48 md:max-h-none group-hover:scale-105 transition-all duration-700" 
                  referrerPolicy="no-referrer"
                />
              </div>
            </div>

            {/* FEATURE 5: Personalized Learning Paths */}
            <div className="bg-zinc-950/60 border border-white/5 rounded-3xl p-6 hover:border-violet-500/25 transition-all duration-300 md:col-span-3 flex flex-col md:flex-row gap-6 items-center justify-between overflow-hidden group">
              <div className="space-y-3 md:max-w-[60%]">
                <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded-full bg-cyan-950/20 border border-cyan-500/20 text-[9px] text-cyan-400 font-mono font-bold uppercase tracking-widest mb-1.5">
                  <Sparkles className="w-3 h-3 text-cyan-400 shrink-0" />
                  <span>Real-Time Adapting</span>
                </div>
                <h3 className="text-xl md:text-2xl font-bold text-white tracking-tight">Personalized Learning Pathways</h3>
                <p className="text-zinc-400 text-xs leading-relaxed font-sans">
                  The roadmap is a self-cleaning organic graph. If you hit friction, it introduces sub-revelations and basic concepts instantly, then scales intensity as your metrics grow.
                </p>
              </div>
              <div className="w-full md:w-[35%] flex flex-col gap-2.5 p-4 rounded-xl bg-black/40 border border-zinc-900 font-mono text-[9.5px] text-zinc-500">
                <div className="flex justify-between border-b border-white/5 pb-1"><span className="text-cyan-400">MATH RECTIFICATION:</span><span>Active</span></div>
                <div>• Injected Foundational Taylor Series Limit</div>
                <div>• Auto-resuming Vector Derivatives next.</div>
              </div>
            </div>

          </div>
        </div>
      </section>

      {/* 6. HOW IT WORKS TIMELINE CHRONOLOGY */}
      <section id="how-it-works" className="py-24 border-t border-white/5 relative bg-zinc-950/5">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center space-y-3 mb-16 max-w-2xl mx-auto">
            <div className="text-[9px] font-bold text-violet-400 tracking-widest font-mono uppercase">Logical Integration</div>
            <h2 className="text-3xl md:text-4.5xl font-black text-white tracking-tight font-display">How Lunito Calibrates.</h2>
            <p className="text-zinc-450 text-xs md:text-sm leading-relaxed font-sans">
              Watch how our cognitive platform builds self-healing mastery lines through deep analysis.
            </p>
          </div>

          {/* Connected timeline steps */}
          <div className="relative border-l border-zinc-800 md:border-l-0 md:border-t md:border-zinc-800 max-w-5xl mx-auto flex flex-col md:flex-row gap-10 md:gap-4 md:justify-between pt-6 pl-6 md:pl-0">
            
            {[
              { step: "01", title: "Ingest Draft Materials", desc: "Upload study notes, outline PDF files, or select one of LUNITO's standard subjects." },
              { step: "02", title: "Deep Content Scan", desc: "The Socratic parser maps variables, theorems, and definitions into indexable cognitive matrices." },
              { step: "03", title: "Target Gap Detection", desc: "As you communicate or take assessments, latent friction and speed dips are flagged to expose misconceptions." },
              { step: "04", title: "Construct Roadmap", desc: "The engine builds a self-healing personalized curriculum, locking advanced sections until foundations heal." },
              { step: "05", title: "Track Growth Lines", desc: "Log active masteries across subjects, review customized flashcard iterations, and claim mastery." }
            ].map((s, idx) => (
              <div key={idx} className="relative md:w-[18%] flex flex-col space-y-4">
                {/* Bullet point layout */}
                <div className="absolute top-0 left-[-32px] md:left-0 md:top-[-32px] w-5 h-5 rounded-full bg-zinc-950 border-2 border-violet-500/80 flex items-center justify-center text-[9px] text-white font-mono font-bold">
                  {idx + 1}
                </div>
                <div>
                  <span className="text-xs font-mono font-black text-violet-400 block mb-0.5">{s.step}</span>
                  <h4 className="text-[12.5px] font-bold text-white tracking-tight leading-snug">{s.title}</h4>
                  <p className="text-[10.5px] text-zinc-500 mt-2 leading-relaxed font-medium">{s.desc}</p>
                </div>
              </div>
            ))}

          </div>
        </div>
      </section>

      {/* 7. WHY LUNITO / ADVANTAGES COMPARISON */}
      <section className="py-24 border-t border-white/5">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center space-y-3 mb-16 max-w-2xl mx-auto">
            <div className="text-[9px] font-bold text-cyan-400 tracking-widest font-mono uppercase">Competitive Efficiency</div>
            <h2 className="text-3xl md:text-4.5xl font-black text-white tracking-tight font-display">Traditional vs Lunito AI.</h2>
            <p className="text-zinc-450 text-xs md:text-sm leading-relaxed font-sans">
              Compare the pedagogical differences between stagnant study grids and active, self-healing diagnostic ecosystems.
            </p>
          </div>

          <div className="w-full max-w-4xl mx-auto bg-zinc-950/60 border border-white/5 rounded-3xl overflow-hidden shadow-xl z-10 font-sans">
            <table className="w-full text-left border-collapse border-spacing-0">
              <thead>
                <tr className="border-b border-white/5 bg-zinc-900/40 text-[10.5px] font-bold tracking-widest text-zinc-400 uppercase font-mono">
                  <th className="p-5 md:p-6">Performance Variables</th>
                  <th className="p-5 md:p-6 text-zinc-550 flex items-center gap-1.5"><ZapOff className="w-3.5 h-3.5 text-zinc-550" /> Stagnant Study</th>
                  <th className="p-5 md:p-6 text-cyan-400"><Bot className="w-3.5 h-3.5 text-cyan-400 animate-pulse inline mr-1" /> Lunito Socratic AI</th>
                </tr>
              </thead>
              <tbody className="text-xs font-semibold text-zinc-300 divide-y divide-white/5">
                {[
                  { param: "Response to Cognitive Friction", traditional: "Frustration, stalled momentum, manual internet searching.", lunito: "Adaptive sub-limits injected automatically to secure foundations." },
                  { param: "Pedagogical Scaffolding", traditional: "Stagnant text definitions, rote lecture reviews, binary keys.", lunito: "Socratic prompting guides logic sequentially to active revelation." },
                  { param: "Weak Spot Diagnostics", traditional: "Discovered late during exams, resulting in emergency cramming.", lunito: "Instantaneous, predictive flagging based on dialogue metrics." },
                  { param: "Adaptability Index", traditional: "Fixed syllabus forcing all students to go at identical paces.", lunito: "Real-time self-healing grid matching your dynamic daily rate." },
                  { param: "Notebook Interface", traditional: "Stagnate document folder structures with cold file outlines.", lunito: "A live ecosystem with highlight-to-explain math modules." },
                ].map((row, idx) => (
                  <tr key={idx} className="hover:bg-white/[0.01] transition-colors">
                    <td className="p-5 md:p-6 text-white font-bold leading-relaxed">{row.param}</td>
                    <td className="p-5 md:p-6 text-zinc-500 leading-relaxed font-mono text-[11px]">{row.traditional}</td>
                    <td className="p-5 md:p-6 text-cyan-300 bg-cyan-950/5 leading-relaxed font-sans text-xs">{row.lunito}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </section>

      {/* 8. ELITE TESTIMONIALS */}
      <section className="py-24 border-y border-white/5 bg-zinc-950/30">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center space-y-3 mb-16 max-w-2xl mx-auto">
            <div className="text-[9px] font-bold text-violet-400 tracking-widest font-mono uppercase">User Validation</div>
            <h2 className="text-3xl md:text-4.5xl font-black text-white tracking-tight font-display">Academics are Talking.</h2>
            <p className="text-zinc-450 text-xs md:text-sm leading-relaxed font-sans">
              Read how students, researchers, and professional mentors elevate retention metrics using Lunito.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-5xl mx-auto">
            {testimonials.map((t, idx) => (
              <div key={idx} className="p-6 rounded-3xl bg-zinc-950/60 border border-white/5 flex flex-col justify-between hover:border-violet-500/20 transition-all duration-300">
                <p className="text-zinc-300 text-xs leading-relaxed italic font-medium">
                  "{t.content}"
                </p>
                <div className="pt-6 border-t border-white/5 mt-6 flex items-center gap-3">
                  <img src={t.image} alt={t.name} className="w-10 h-10 rounded-full border border-white/10 object-cover" />
                  <div className="overflow-hidden">
                    <h4 className="text-xs font-bold text-white tracking-tight truncate">{t.name}</h4>
                    <p className="text-[10px] text-zinc-500 truncate mt-0.5">{t.role}</p>
                    <span className="text-[8px] font-mono text-violet-400 uppercase font-black tracking-widest block mt-1">{t.achievement}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 9. PRICING SECURE COMPARISON */}
      <section id="pricing" className="py-24 max-w-7xl mx-auto px-6">
        <div className="text-center space-y-3 mb-16 max-w-2xl mx-auto">
          <div className="text-[9px] font-bold text-cyan-400 tracking-widest font-mono uppercase">Simple Tiering</div>
          <h2 className="text-3xl md:text-4.5xl font-black text-white tracking-tight font-display">Socratic Workspace Pricing.</h2>
          <p className="text-zinc-450 text-xs md:text-sm leading-relaxed font-sans">
            Start free, then unlock elite limits and personalized diagnostic tools when you are ready to master fields.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-5xl mx-auto items-stretch">
          
          {/* TIER 1: Free */}
          <div className="bg-zinc-950/60 border border-white/5 rounded-3xl p-6 flex flex-col justify-between relative group hover:border-zinc-800 transition-all duration-300">
            <div className="space-y-6">
              <div>
                <span className="text-[9px] font-black uppercase text-zinc-500 tracking-widest font-mono">Starter Pack</span>
                <h3 className="text-lg font-bold text-white mt-1">Scholar Standard</h3>
                <p className="text-[10.5px] text-zinc-500 mt-1.5 font-sans leading-relaxed">Perfect for test-driving Socratic structures and basic outlines.</p>
              </div>
              <div className="flex items-baseline gap-1 font-mono">
                <span className="text-3xl font-black text-white">INR 0</span>
                <span className="text-[10px] text-zinc-500 uppercase tracking-widest font-black">/ Permanent</span>
              </div>
              <div className="space-y-2.5 pt-4 text-xs font-medium text-zinc-400 border-t border-white/5 font-sans">
                <div className="flex items-center gap-2.5"><Check className="w-4 h-4 text-violet-400 shrink-0" /> 15 Daily Socratic Chat limits</div>
                <div className="flex items-center gap-2.5"><Check className="w-4 h-4 text-violet-400 shrink-0" /> Notebook with core PDF uploads</div>
                <div className="flex items-center gap-2.5"><Check className="w-4 h-4 text-violet-400 shrink-0" /> Basic diagnostic analytics</div>
                <div className="flex items-center gap-2.5"><Check className="w-4 h-4 text-violet-400 shrink-0" /> Socratic Companion settings</div>
              </div>
            </div>
            <button
              onClick={onGetStarted}
              className="mt-8 w-full py-2.5 bg-zinc-900 hover:bg-zinc-850 hover:text-white text-zinc-300 text-[11px] font-bold font-mono uppercase tracking-wider rounded-xl transition-all cursor-pointer text-center block border border-white/5"
            >
              Get Started Free
            </button>
          </div>

          {/* TIER 2: Pro (MOST POPULAR) */}
          <div className="bg-zinc-950/85 border-2 border-violet-500/30 rounded-3xl p-6 flex flex-col justify-between relative group hover:border-violet-500/50 transition-all duration-300 transform md:-translate-y-3 shadow-2xl shadow-violet-950/15">
            <div className="absolute top-0 right-6 -translate-y-1/2 bg-violet-600 px-3 py-1 rounded-full text-[8.5px] font-black font-mono tracking-widest uppercase text-white shadow-lg shadow-violet-500/20">
              Most Popular
            </div>
            <div className="space-y-6">
              <div>
                <span className="text-[9px] font-black uppercase text-violet-400 tracking-widest font-mono">Continuous Mastery</span>
                <h3 className="text-lg font-bold text-white mt-1">Socratic Pro</h3>
                <p className="text-[10.5px] text-zinc-400 mt-1.5 font-sans leading-relaxed">Engineered for active college undergrads and lifelong scholars.</p>
              </div>
              <div className="flex items-baseline gap-1 font-mono">
                <span className="text-3xl font-black text-white">$1</span>
                <span className="text-[10px] text-zinc-405 uppercase tracking-widest font-black">/ Month</span>
              </div>
              <div className="space-y-2.5 pt-4 text-xs font-medium text-zinc-300 border-t border-white/5 font-sans">
                <div className="flex items-center gap-2.5"><Check className="w-4 h-4 text-violet-400 shrink-0" /> <b>Unlimited</b> daily tutoring chats</div>
                <div className="flex items-center gap-2.5"><Check className="w-4 h-4 text-violet-400 shrink-0" /> Weak Topic self-healing parser</div>
                <div className="flex items-center gap-2.5"><Check className="w-4 h-4 text-violet-400 shrink-0" /> Complete Notebook highlights</div>
                <div className="flex items-center gap-2.5"><Check className="w-4 h-4 text-violet-400 shrink-0" /> High-frequency diagnostic maps</div>
                <div className="flex items-center gap-2.5"><Check className="w-4 h-4 text-violet-400 shrink-0" /> Full premium sandbox tools</div>
              </div>
            </div>
            <button
              onClick={onGetStarted}
              className="mt-8 w-full py-2.5 bg-violet-600 hover:bg-violet-700 text-white text-[11px] font-extrabold font-mono uppercase tracking-wider rounded-xl transition-all cursor-pointer text-center block shadow-md shadow-violet-500/20"
            >
              Upgrade To Pro
            </button>
          </div>

          {/* TIER 3: Elite */}
          <div className="bg-zinc-950/60 border border-white/5 rounded-3xl p-6 flex flex-col justify-between relative group hover:border-zinc-800 transition-all duration-300">
            <div className="space-y-6">
              <div>
                <span className="text-[9px] font-black uppercase text-zinc-500 tracking-widest font-mono">Sovereign Knowledge</span>
                <h3 className="text-lg font-bold text-white mt-1">Socratic Elite</h3>
                <p className="text-[10.5px] text-zinc-500 mt-1.5 font-sans leading-relaxed">Perfect for research teams, doctors, and competitive preparation.</p>
              </div>
              <div className="flex items-baseline gap-1 font-mono">
                <span className="text-3xl font-black text-white">$5</span>
                <span className="text-[10px] text-zinc-405 uppercase tracking-widest font-black">/ Month</span>
              </div>
              <div className="space-y-2.5 pt-4 text-xs font-medium text-zinc-400 border-t border-white/5 font-sans">
                <div className="flex items-center gap-2.5"><Check className="w-4 h-4 text-violet-400 shrink-0" /> <b>Everything in Pro tier</b></div>
                <div className="flex items-center gap-2.5"><Check className="w-4 h-4 text-violet-400 shrink-0" /> Dedicated database backups</div>
                <div className="flex items-center gap-2.5"><Check className="w-4 h-4 text-violet-400 shrink-0" /> Advanced brain diagnostic maps</div>
                <div className="flex items-center gap-2.5"><Check className="w-4 h-4 text-violet-400 shrink-0" /> VIP priority reasoning clusters</div>
              </div>
            </div>
            <button
              onClick={onGetStarted}
              className="mt-8 w-full py-2.5 bg-zinc-900 hover:bg-zinc-850 hover:text-white text-zinc-300 text-[11px] font-bold font-mono uppercase tracking-wider rounded-xl transition-all cursor-pointer text-center block border border-white/5"
            >
              Get Elite Study Access
            </button>
          </div>

        </div>
      </section>

      {/* 10. FINAL CONVERSION CTA AREA */}
      <section className="py-28 relative overflow-hidden text-center max-w-7xl mx-auto px-6">
        
        {/* Subtle mesh background center circle */}
        <div className="absolute inset-x-0 top-0 m-auto w-96 h-96 rounded-full bg-violet-600/10 filter blur-[100px] pointer-events-none" />
        
        <div className="relative z-10 max-w-2xl mx-auto space-y-6">
          <div className="w-12 h-12 mx-auto rounded-2xl bg-gradient-to-tr from-violet-600 to-cyan-500 flex items-center justify-center shadow-2xl animate-pulse">
            <Brain className="w-6 h-6 text-white" />
          </div>
          <h2 className="text-4xl md:text-5xl font-black text-white tracking-tight leading-none font-display">
            Start Learning Smarter Today
          </h2>
          <p className="text-zinc-400 text-sm md:text-base leading-relaxed max-w-lg mx-auto">
            Join the next generation of AI-powered learners and build secure Socratic memory loops.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center pt-4">
            <button 
              onClick={onGetStarted} 
              className="py-3.5 px-8 bg-gradient-to-r from-violet-600 to-cyan-500 text-white font-extrabold text-xs uppercase tracking-wider rounded-xl font-mono shadow-xl transition-all hover:scale-[1.02] active:scale-95 duration-150 cursor-pointer"
            >
              Get Started Free
            </button>
            <button 
              onClick={onLogin} 
              className="py-3.5 px-8 bg-zinc-950 hover:bg-zinc-900 border border-zinc-800 text-zinc-300 font-bold text-xs uppercase tracking-wider rounded-xl font-mono transition-all cursor-pointer"
            >
              Access Study Room
            </button>
          </div>
        </div>
      </section>

      {/* 11. FOOTER WITH COMPLIANCE POLICY LINKS */}
      <footer className="border-t border-white/5 bg-zinc-950/80 py-12 text-center font-sans text-[11px] text-zinc-400 select-none">
        <div className="max-w-7xl mx-auto px-6 space-y-8">
          <div className="flex flex-col md:flex-row justify-between items-center gap-6 border-b border-white/5 pb-8">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-violet-600 to-cyan-500 flex items-center justify-center">
                <Brain className="w-4 h-4 text-white" />
              </div>
              <span className="font-extrabold text-white tracking-widest uppercase font-mono">LUNITO AI</span>
            </div>
            
            {/* Regulatory and Business Compliance Navigation Links */}
            <div className="flex flex-wrap justify-center gap-x-6 gap-y-3 font-mono text-[10px] text-zinc-450">
              <button onClick={() => scrollToSection("features")} className="hover:text-white transition-colors cursor-pointer uppercase">Features</button>
              <button onClick={() => scrollToSection("pricing")} className="hover:text-white transition-colors cursor-pointer uppercase">Pricing</button>
              <a href="/terms-and-conditions" target="_blank" rel="noopener noreferrer" className="hover:text-violet-400 transition-colors cursor-pointer uppercase font-semibold">Terms & Conditions</a>
              <a href="/privacy-policy" target="_blank" rel="noopener noreferrer" className="hover:text-violet-400 transition-colors cursor-pointer uppercase font-semibold">Privacy Policy</a>
              <a href="/refund-and-cancellation" target="_blank" rel="noopener noreferrer" className="hover:text-violet-400 transition-colors cursor-pointer uppercase font-semibold">Refund & Cancellation</a>
              <a href="/shipping-and-delivery" target="_blank" rel="noopener noreferrer" className="hover:text-violet-400 transition-colors cursor-pointer uppercase font-semibold">Shipping & Delivery</a>
              <a href="/contact-us" target="_blank" rel="noopener noreferrer" className="hover:text-violet-400 transition-colors cursor-pointer uppercase font-semibold font-bold">Contact Us</a>
            </div>
          </div>

          <div className="flex flex-col md:flex-row justify-between items-center gap-4 text-zinc-500 font-mono text-[10px]">
            <div>
              &copy; {new Date().getFullYear()} Lunito Technologies Inc. All Rights Reserved. Fully Encrypted & Socratic Sovereign.
            </div>
            <div className="flex items-center gap-2 text-[9.5px]">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
              <span>SaaS Merchant ID Compliant (Cashfree / Razorpay Verified Setup)</span>
            </div>
          </div>
        </div>
      </footer>

      {/* COMPLIANCE POLICIES LIGHTBOX MODAL */}
      <AnimatePresence>
        {activePolicy && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[2000] flex items-center justify-center p-4 bg-black/85 backdrop-blur-md"
            onClick={() => setActivePolicy(null)}
          >
            <motion.div 
              initial={{ scale: 0.95, y: 15 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.95, y: 15 }}
              transition={{ type: "spring", duration: 0.4 }}
              className="relative w-full max-w-2xl max-h-[85vh] overflow-y-auto bg-zinc-950 border border-zinc-800 rounded-2xl p-6 sm:p-8 space-y-6 shadow-2xl text-left"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Header */}
              <div className="flex items-center justify-between border-b border-zinc-900 pb-4">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-lg bg-violet-600/10 flex items-center justify-center">
                    <FileText className="w-4 h-4 text-violet-400" />
                  </div>
                  <div>
                    <h3 className="text-base sm:text-lg font-black text-white tracking-tight">
                      {activePolicy === "terms" && "Terms & Conditions"}
                      {activePolicy === "privacy" && "Privacy Policy"}
                      {activePolicy === "refund" && "Cancellation & Refund Policy"}
                      {activePolicy === "shipping" && "Shipping & Delivery Policy"}
                      {activePolicy === "contact" && "Contact Customer Support"}
                    </h3>
                    <p className="text-[10px] text-zinc-550 font-mono">Last updated: June 6, 2026</p>
                  </div>
                </div>
                <button 
                  onClick={() => setActivePolicy(null)}
                  className="w-8 h-8 rounded-full bg-zinc-900 hover:bg-zinc-800 text-zinc-400 hover:text-white transition-colors flex items-center justify-center cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Policy Body */}
              <div className="text-zinc-300 text-xs leading-relaxed space-y-4 max-h-[50vh] overflow-y-auto pr-2 custom-scrollbar font-sans font-medium">
                
                {activePolicy === "terms" && (
                  <>
                    <p>Welcome to <b>LUNITO AI</b> (Website/Service). LUNITO AI is owned and operated by <b>Lunito Technologies Inc.</b> By accessing our platform, website, or using our Socratic AI Tutors, Notebook workspaces, and other services, you agree to comply with and be bound by the following Terms & Conditions.</p>
                    
                    <h4 className="text-white font-bold font-mono text-[11px] uppercase tracking-wider pt-2">1. Use of Services</h4>
                    <p>You agree to use this platform only for academic support, non-commercial self-guided study, and research purposes. You must not use the AI model's text outputs to cheat, disrupt external platforms, or violate local intellectual property criteria.</p>
                    
                    <h4 className="text-white font-bold font-mono text-[11px] uppercase tracking-wider pt-2">2. User Account Security</h4>
                    <p>To access personal studies, diagnostic roadmaps, or billing history, you must authenticate over Google/Email registration. You are solely responsible for protecting your credentials and session cookies.</p>

                    <h4 className="text-white font-bold font-mono text-[11px] uppercase tracking-wider pt-2">3. Subscription, Payments & Renewal</h4>
                    <p>We provide multiple billing tiers: <b>Scholar Standard (Free)</b>, <b>Socratic Pro ($1/Month)</b>, and <b>Socratic Elite ($5/Month)</b>. Subscription fees are charged on a monthly recurring basis through our verified payment processing gateways (Cashfree / Razorpay). You authorize automated billing renewals until active cancellation is triggered in your account dashboard.</p>

                    <h4 className="text-white font-bold font-mono text-[11px] uppercase tracking-wider pt-2">4. Disclaimers of Liability</h4>
                    <p>All learning guides, math step breakdowns, and AI feedbacks are diagnostic tools. We do not guarantee perfect scores, exact research outcomes, or error-free parsing accuracy. No warranties are offered for continuous server uptime or database absolute immutability.</p>
                  </>
                )}

                {activePolicy === "privacy" && (
                  <>
                    <p>At <b>LUNITO AI</b> (Lunito Technologies Inc.), we are fully committed to protecting your personal data, identity details, and learning metadata under strict cryptographic standards.</p>
                    
                    <h4 className="text-white font-bold font-mono text-[11px] uppercase tracking-wider pt-2">1. Information We Collect</h4>
                    <ul className="list-disc pl-5 space-y-1 text-zinc-450">
                      <li><b>Account Data:</b> Registration email, Display Name, Profile avatar images.</li>
                      <li><b>Study Materials:</b> Uploaded notes text files, generated flashcards, and testing records.</li>
                      <li><b>Diagnostic Telemetry:</b> Answer accuracy, reaction hesitation speeds, and weak topics lists.</li>
                    </ul>

                    <h4 className="text-white font-bold font-mono text-[11px] uppercase tracking-wider pt-2">2. How We Guard and Process Your Information</h4>
                    <p>We do not lease, share, sell, or monetize your uploaded study outlines or profile logs under any marketing criteria. Data is securely processed on sandboxed server nodes and used purely to customize the Socratic companion's helpfulness index for your distinct profile.</p>

                    <h4 className="text-white font-bold font-mono text-[11px] uppercase tracking-wider pt-2">3. Cookies & Security Integrity</h4>
                    <p>We leverage local secure cookies to maintain continuous login states. Payment tokens and card detail collections are fully handled by end-to-end PCIDSS compliant secure gateways with no raw credential transit over our own database.</p>
                  </>
                )}

                {activePolicy === "refund" && (
                  <>
                    <p>Thank you for subscribing to LUNITO AI's premium learning environments. Please review our fair, transparent cancellation and refund models below.</p>
                    
                    <h4 className="text-white font-bold font-mono text-[11px] uppercase tracking-wider pt-2">1. Subscription Cancellation</h4>
                    <p>You can cancel your <b>Socratic Pro ($1/mo)</b> or <b>Socratic Elite ($5/mo)</b> premium subscription at any moment directly from your profile interface. Cancellation turns off future billing cycles, and you will maintain full premium workspace keys until the active monthly term expires.</p>

                    <h4 className="text-white font-bold font-mono text-[11px] uppercase tracking-wider pt-2">2. Return & Refund Window</h4>
                    <p>Since LUNITO AI delivers instantly accessible cloud-hosted digital SaaS solutions, standard physical product returns are completely inapplicable. However, we provide a <b>7-day refund guarantee</b> for new users. If you face platform errors, failed AI compilations, or billing accidents within the first 7 days, write to us to claim your payments back.</p>

                    <h4 className="text-white font-bold font-mono text-[11px] uppercase tracking-wider pt-2">3. Refund Processing Turnaround</h4>
                    <p>Once refund claims are approved by our compliance desk, the dynamic processing instructions are sent directly to the partner payment processor. Funds will be credited back via the original payment source (Credit Card, UPI, Netbanking) within <b>5 to 7 working business days</b>.</p>
                  </>
                )}

                {activePolicy === "shipping" && (
                  <>
                    <p>As a modern, cloud-native Artificial Intelligence platform, LUNITO's delivery is fully digitized for absolute instant activation:</p>
                    
                    <h4 className="text-white font-bold font-mono text-[11px] uppercase tracking-wider pt-2">1. No Physical Logistics</h4>
                    <p>LUNITO AI products are virtual software-as-a-service (SaaS) entities. Consequently, there are zero physical shipping logs, freight metrics, postage calculations, or courier delays associated with our business.</p>

                    <h4 className="text-white font-bold font-mono text-[11px] uppercase tracking-wider pt-2">2. Instant Delivery and Activation</h4>
                    <p>Upon successful authorization of your pricing tier charge over our PCIDSS gate (Razorpay/Cashfree), your account is upgraded in real-time. Unlimited study chats, notebook highlights, and customized diagnostic path views are fully unlocked and accessible <b>instantly (0 seconds delay)</b> inside your active browser session.</p>

                    <h4 className="text-white font-bold font-mono text-[11px] uppercase tracking-wider pt-2">3. Service Interruption Safeguards</h4>
                    <p>In the event of network delays causing license latency, we run automated validation scripts that restore premium access credentials immediately. Drop an email to support if the activation exceeds 10 minutes from purchase.</p>
                  </>
                )}

                {activePolicy === "contact" && (
                  <div className="space-y-4">
                    <p>For any questions, operational support requests, cancellation help, billing inquiries, or refund reviews, please contact the <b>LUNITO AI support desk</b>. We are committed to responding to your queries within 24 to 48 business hours.</p>

                    <div className="space-y-3 pt-2">
                      <div className="flex items-center gap-3 p-3 bg-zinc-900/50 rounded-xl border border-zinc-900">
                        <Mail className="w-4 h-4 text-violet-400" />
                        <div>
                          <div className="text-[10px] uppercase tracking-wider text-zinc-500 font-bold font-mono">Support Email</div>
                          <a href="mailto:cricketportal64@gmail.com" className="text-[12px] text-white hover:text-violet-400 transition-colors font-semibold">cricketportal64@gmail.com</a>
                        </div>
                      </div>

                      <div className="flex items-center gap-3 p-3 bg-zinc-900/50 rounded-xl border border-zinc-900">
                        <MapPin className="w-4 h-4 text-violet-400" />
                        <div>
                          <div className="text-[10px] uppercase tracking-wider text-zinc-500 font-bold font-mono">Corporate Address</div>
                          <div className="text-[11px] text-white font-medium">
                            Lunito Technologies Inc., Operational Hub: Sector 62, Noida, Uttar Pradesh, 201301, India
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-3 p-3 bg-zinc-900/50 rounded-xl border border-zinc-900">
                        <Phone className="w-4 h-4 text-violet-400" />
                        <div>
                          <div className="text-[10px] uppercase tracking-wider text-zinc-500 font-bold font-mono">Business Phone</div>
                          <div className="text-[11px] text-white font-medium">+91 9876543210 (Mon-Fri, 10:00 AM - 6:00 PM IST)</div>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

              </div>

              {/* Action Button */}
              <div className="border-t border-zinc-900 pt-4 flex justify-end">
                <button 
                  onClick={() => setActivePolicy(null)}
                  className="py-2 px-5 bg-violet-600 hover:bg-violet-700 text-white font-bold text-xs uppercase tracking-wider rounded-xl font-mono transition-all cursor-pointer"
                >
                  I Understand & Close
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
