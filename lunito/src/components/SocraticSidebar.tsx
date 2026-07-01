import React from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Brain, 
  LayoutDashboard, 
  MessageSquare, 
  BookOpen, 
  HelpCircle, 
  TrendingUp, 
  Settings, 
  User, 
  LogOut, 
  Flame,
  ChevronLeft,
  ChevronRight,
  Sparkles,
  Layers,
  Compass
} from "lucide-react";
import { ActiveTab } from "../types";

interface SocraticSidebarProps {
  activeTab: ActiveTab;
  setActiveTab: (tab: ActiveTab) => void;
  sidebarOpen: boolean;
  setSidebarOpen: (val: boolean) => void;
  displayName: string;
  emailDisplay: string;
  realStreak: number;
  logout: () => void;
  setIsProfileModalOpen: (val: boolean) => void;
  setEditedName: (val: string) => void;
}

export const SocraticSidebar: React.FC<SocraticSidebarProps> = ({
  activeTab,
  setActiveTab,
  sidebarOpen,
  setSidebarOpen,
  displayName,
  emailDisplay,
  realStreak,
  logout,
  setIsProfileModalOpen,
  setEditedName
}) => {
  const navItems = [
    { id: "dashboard", label: "Dashboard", icon: LayoutDashboard },
    { id: "roadmap", label: "Socratic Chat", icon: Compass },
    { id: "chat", label: "AI Workspace", icon: MessageSquare },
    { id: "notebook", label: "Notebook Workspace", icon: BookOpen },
    { id: "flashcards", label: "Flashcards", icon: Layers },
    { id: "test", label: "Quizzes", icon: HelpCircle },
    { id: "progress", label: "Progress Analytics", icon: TrendingUp },
    { id: "settings", label: "Settings", icon: Settings },
  ];

  return (
    <AnimatePresence mode="wait">
      {sidebarOpen && (
        <motion.aside
          initial={{ x: -288, opacity: 0.8 }}
          animate={{ x: 0, opacity: 1 }}
          exit={{ x: -288, opacity: 0.8 }}
          transition={{ duration: 0.2, ease: "easeOut" }}
          className="fixed lg:sticky top-0 left-0 h-screen w-72 shrink-0 z-50 border-r border-[#E5E5E5] bg-[#F7F7F8] flex flex-col justify-between p-5 select-none"
        >
          {/* Top segment */}
          <div className="space-y-6">
            {/* Brand Logo Header */}
            <div className="flex items-center justify-between pb-4 border-b border-[#E5E5E5]">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-[#10A37F] flex items-center justify-center border border-[#10A37F]/10">
                  <Brain className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h1 className="text-sm font-semibold text-[#111111] tracking-tight">Lunito AI</h1>
                  <p className="text-[10px] text-[#666666] font-mono tracking-wide font-medium">Socratic Workspace v3</p>
                </div>
              </div>
              <button
                onClick={() => setSidebarOpen(false)}
                className="p-1 hover:bg-[#F3F4F6] rounded-md text-[#666666] hover:text-[#111111] transition-all cursor-pointer block"
                title="Collapse Sidebar"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
            </div>

            {/* Navigation links list */}
            <nav className="space-y-1">
              {navItems.map((item) => {
                const Icon = item.icon;
                const isActive = activeTab === item.id;
                return (
                  <button
                    key={item.id}
                    onClick={() => {
                      setActiveTab(item.id as ActiveTab);
                      if (window.innerWidth < 1024) {
                        setSidebarOpen(false);
                      }
                    }}
                    className={`w-full flex items-center gap-3.5 px-3 py-2.5 rounded-lg text-xs font-semibold tracking-wide transition-all duration-150 cursor-pointer text-left ${
                      isActive
                        ? "bg-white text-[#10A37F] border border-[#E5E5E5] shadow-sm"
                        : "text-[#666666] hover:text-[#111111] hover:bg-[#F3F4F6] border border-transparent"
                    }`}
                  >
                    <Icon className={`w-4 h-4 shrink-0 ${isActive ? "text-[#10A37F]" : "text-[#666666]/70"}`} />
                    <span className="flex-1 truncate">{item.label}</span>
                  </button>
                );
              })}

              {/* Profile click shortcut item as requested inside sidebar list */}
              <button
                onClick={() => {
                  setEditedName(displayName);
                  setIsProfileModalOpen(true);
                  if (window.innerWidth < 1024) {
                    setSidebarOpen(false);
                  }
                }}
                className={`w-full flex items-center gap-3.5 px-3 py-2.5 rounded-lg text-xs font-semibold tracking-wide transition-all duration-150 cursor-pointer text-left text-[#666666] hover:text-[#111111] hover:bg-[#F3F4F6] border border-transparent`}
              >
                <User className="w-4 h-4 shrink-0 text-[#666666]/70" />
                <span>My Profile</span>
              </button>
            </nav>
          </div>

          {/* Bottom user settings segment */}
          <div className="pt-4 border-t border-[#E5E5E5] space-y-3.5">
            {/* User profile summary block */}
            <button
              onClick={() => {
                setEditedName(displayName);
                setIsProfileModalOpen(true);
              }}
              className="w-full text-left flex items-center gap-3 p-2 rounded-xl bg-white/70 hover:bg-white border border-[#E5E5E5] transition-all cursor-pointer group shadow-none"
            >
              <div className="w-8 h-8 rounded-full bg-emerald-50 text-[#10A37F] border border-[#E5E5E5] flex items-center justify-center font-bold text-xs shrink-0 group-hover:scale-105 transition-transform font-sans">
                {displayName ? displayName.charAt(0).toUpperCase() : "A"}
              </div>
              <div className="overflow-hidden flex-1">
                <p className="text-xs font-semibold truncate text-[#111111] leading-tight flex items-center gap-1">
                  <span>{displayName || "Socratic Scholar"}</span>
                </p>
                <p className="text-[10px] text-[#666666] font-mono truncate">{emailDisplay}</p>
              </div>
              {realStreak > 0 && (
                <div className="flex items-center gap-0.5 text-amber-600 bg-amber-50 border border-amber-100 rounded px-1.5 py-0.5" title="Day streak">
                  <Flame className="w-3 h-3 fill-current" />
                  <span className="text-[9px] font-bold font-mono">{realStreak}</span>
                </div>
              )}
            </button>

            {/* Logout Trigger button */}
            <button
              onClick={logout}
              className="w-full py-2 bg-red-50 text-red-650 hover:bg-red-100 border border-red-100 rounded-lg text-[11px] font-semibold flex items-center justify-center gap-2 transition-all cursor-pointer"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span>Sign Out</span>
            </button>
          </div>
        </motion.aside>
      )}
    </AnimatePresence>
  );
};
