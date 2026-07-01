import React from "react";
import { motion } from "framer-motion";
import { Settings, User, CreditCard, Sparkles, Sliders, Bell } from "lucide-react";
import { doc, updateDoc } from "firebase/firestore";

interface SocraticSettingsProps {
  displayName: string;
  setDisplayName: (val: string) => void;
  emailDisplay: string;
  isGuestBypass: boolean;
  guestChatsCounter: number;
  chatsToday: number;
  plan: string;
  setIsLimitModalOpen: (val: boolean) => void;
  tutoringStyle: string;
  setTutoringStyle: (val: string) => void;
  darkModeToggle: boolean;
  setDarkModeToggle: (val: boolean) => void;
  notificationsToggle: boolean;
  setNotificationsToggle: (val: boolean) => void;
  triggerNotification: (msg: string, type: "success" | "error" | "info") => void;
  db: any;
  auth: any;
}

export const SocraticSettings: React.FC<SocraticSettingsProps> = ({
  displayName,
  setDisplayName,
  emailDisplay,
  isGuestBypass,
  guestChatsCounter,
  chatsToday,
  plan,
  setIsLimitModalOpen,
  tutoringStyle,
  setTutoringStyle,
  darkModeToggle,
  setDarkModeToggle,
  notificationsToggle,
  setNotificationsToggle,
  triggerNotification,
  db,
  auth
}) => {
  const saveDisplayNameToCloud = async () => {
    if (!displayName.trim()) {
      triggerNotification("Scholar name cannot be blank!", "error");
      return;
    }

    if (auth.currentUser) {
      try {
        const userDocRef = doc(db, "users", auth.currentUser.uid);
        await updateDoc(userDocRef, { displayName: displayName.trim() });
        triggerNotification("Scholar profile updated in cloud database!", "success");
      } catch (err) {
        console.error("Failed to commit display name to Firestore:", err);
        triggerNotification("Could not sync change. Local cache updated.", "info");
      }
    } else {
      triggerNotification("Guest sandbox name updated locally!", "success");
    }
  };

  return (
    <motion.div
      key="settings"
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0 }}
      className="max-w-2xl mx-auto space-y-6 w-full font-sans"
    >
      {/* Title Segment */}
      <div className="flex items-center gap-3 border-b border-[#E5E5E5] pb-3">
        <div className="p-1 px-1.5 rounded bg-emerald-50 text-[#10A37F]">
          <Settings className="w-5 h-5 text-[#10A37F]" />
        </div>
        <div>
          <h2 className="text-xl font-bold text-[#111111] tracking-tight">Tutor Settings & Preferences</h2>
          <p className="text-xs text-[#666666] mt-0.5">Customize your academic identity, configure Socratic strictly limits, and track quota limits.</p>
        </div>
      </div>

      {/* Account Settings profile */}
      <div className="p-6 rounded-xl border border-[#E5E5E5] bg-white space-y-5 shadow-none">
        <h3 className="text-xs font-bold uppercase tracking-wider text-[#111111] font-mono flex items-center gap-1.5">
          <User className="w-4 h-4 text-[#10A37F]" />
          <span>Profile & Identity Preferences</span>
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-[10px] font-bold text-[#666666] uppercase tracking-wider mb-1.5 font-mono">Active Scholar Name</label>
            <div className="flex gap-2">
              <input 
                type="text" 
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                className="flex-1 bg-[#F7F7F8] border border-[#E5E5E5] focus:border-[#10A37F] rounded-lg px-3.5 py-2 outline-none text-xs text-[#111111] font-semibold"
              />
              <button
                onClick={saveDisplayNameToCloud}
                className="px-3.5 py-2 bg-[#10A37F] hover:bg-[#10A37F]/95 text-white text-xs font-semibold rounded-lg cursor-pointer transition-all active:scale-95 duration-100"
              >
                Save
              </button>
            </div>
          </div>

          <div>
            <label className="block text-[10px] font-bold text-[#666666] uppercase tracking-wider mb-1.5 font-mono">Registered Email</label>
            <input 
              type="email" 
              value={emailDisplay}
              readOnly
              className="w-full bg-[#F7F7F8]/60 border border-[#E5E5E5] rounded-lg px-3.5 py-2 text-xs text-[#666666] font-semibold cursor-not-allowed font-mono"
            />
          </div>
        </div>

        {/* Plan quota billing */}
        <div className="mt-4 pt-4 border-t border-[#E5E5E5]">
          <label className="block text-[10px] font-bold text-[#666666] uppercase tracking-wider mb-2 font-mono flex items-center gap-1">
            <CreditCard className="w-3.5 h-3.5" />
            <span>Active Subscription Limits</span>
          </label>
          <div className="p-4 rounded-xl bg-[#F7F7F8] border border-[#E5E5E5] flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div className="space-y-1">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-[#111111] text-xs font-bold uppercase">
                  {emailDisplay === "guest@lunito.edu" || isGuestBypass ? "Guest Sandbox Bypass" : `${plan.toUpperCase()} TIER`}
                </span>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-50 border border-emerald-100 text-[#10A37F] font-mono font-bold leading-none">
                  ACTIVE
                </span>
              </div>
              <p className="text-[11px] text-[#666666] leading-relaxed">
                {emailDisplay === "guest@lunito.edu" || isGuestBypass 
                  ? `Sandbox Quota: ${guestChatsCounter}/6 standard sessions spent. Connect an account to lift restrictions!`
                  : `Token usage: ${chatsToday} Socratic dialogue rounds completed in active cycles today.`}
              </p>
            </div>
            
            <button
              onClick={() => setIsLimitModalOpen(true)}
              className="px-4 py-2 bg-[#1s0A37F] hover:bg-[#10A37F]/95 text-[#111111] border border-[#E5E5E5] bg-white text-xs font-semibold rounded-lg transition-all cursor-pointer shrink-0"
            >
              Configure Subscription
            </button>
          </div>
        </div>
      </div>

      {/* Tutor brain metrics customization */}
      <div className="p-6 rounded-xl border border-[#E5E5E5] bg-white space-y-5 shadow-none">
        <h3 className="text-xs font-bold uppercase tracking-wider text-[#111111] font-mono flex items-center gap-1.5">
          <Sliders className="w-4 h-4 text-[#10A37F]" />
          <span>Tutor Brain Specifications</span>
        </h3>

        <div className="space-y-4 text-xs">
          <div>
            <label className="block text-[10px] font-bold text-[#666666] uppercase tracking-wider mb-1.5 font-mono">Tutoring Socratic Strictness level</label>
            <select 
              value={tutoringStyle}
              onChange={(e) => {
                setTutoringStyle(e.target.value);
                triggerNotification(`Tutoring style mutated to ${e.target.value}`, "info");
              }}
              className="w-full bg-[#F7F7F8] border border-[#E5E5E5] focus:border-[#10A37F] rounded-lg px-3.5 py-2.5 outline-none font-semibold text-[#111111] cursor-pointer"
            >
              <option value="Socratic Companion">Socratic (Guide with targeted logic questions - Recommended)</option>
              <option value="Academic Professor">Academic (Rigorous calculations with full math proofs)</option>
              <option value="Conversational peer helper">Conversational Peer (Friendly outlines, simplified slower steps)</option>
            </select>
          </div>

          {/* Style Toggles */}
          <div className="flex justify-between items-center p-4 bg-[#F7F7F8] rounded-xl border border-[#E5E5E5]">
            <div>
              <p className="font-bold text-[#111111] mb-0.5">High-contrast interface styling</p>
              <p className="text-[10px] text-[#666666]">Maintain optimal study-room clarity</p>
            </div>
            <button 
              onClick={() => {
                setDarkModeToggle(!darkModeToggle);
                triggerNotification("Interface display synchronized!", "info");
              }}
              className={`w-11 h-6 rounded-full p-0.5 transition-all focus:outline-none cursor-pointer ${
                darkModeToggle ? "bg-[#10A37F]" : "bg-gray-300"
              }`}
            >
              <div className={`w-5 h-5 bg-white rounded-full transition-transform duration-150 transform ${darkModeToggle ? "translate-x-5" : ""}`} />
            </button>
          </div>

          <div className="flex justify-between items-center p-4 bg-[#F7F7F8] rounded-xl border border-[#E5E5E5]">
            <div>
              <p className="font-bold text-[#111111] mb-0.5 flex items-center gap-1">
                <Bell className="w-3.5 h-3.5 text-[#10A37F]" />
                <span>Diagnostics decay alerts</span>
              </p>
              <p className="text-[10px] text-[#666666]">Send notifications when study streak risks resetting</p>
            </div>
            <button 
              onClick={() => {
                setNotificationsToggle(!notificationsToggle);
                triggerNotification(`Decay alerts ${!notificationsToggle ? "armed" : "disabled"}`, "info");
              }}
              className={`w-11 h-6 rounded-full p-0.5 transition-all focus:outline-none cursor-pointer ${
                notificationsToggle ? "bg-[#10A37F]" : "bg-gray-300"
              }`}
            >
              <div className={`w-5 h-5 bg-white rounded-full transition-transform duration-150 transform ${notificationsToggle ? "translate-x-5" : ""}`} />
            </button>
          </div>

        </div>
      </div>
    </motion.div>
  );
};
