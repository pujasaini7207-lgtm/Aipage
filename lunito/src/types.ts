export type ActiveTab = "dashboard" | "chat" | "notebook" | "progress" | "flashcards" | "test" | "settings" | "roadmap";

export interface Message {
  id: string;
  sender: "user" | "ai";
  text: string;
  timestamp: string;
  isTyped?: boolean;
  sources?: Array<{ title: string; uri: string }>;
}

export interface ChatThread {
  id: string;
  title: string;
  createdAt: string;
  lastMessageAt: string;
  subject?: string;
  topic?: string;
}

export interface Flashcard {
  id: string;
  front: string;
  back: string;
  category: string;
  difficulty?: "easy" | "medium" | "hard" | "expert";
  type?: "definitions" | "conceptual" | "application" | "exam-style" | "mixed";
  bookmarked?: boolean;
  markedEasy?: boolean;
  markedHard?: boolean;
  lastReviewed?: string;
  nextReviewAt?: string;
}

export interface NotificationMsg {
  id: string;
  message: string;
  type: "success" | "error" | "info";
}

export interface SubjectProgress {
  chatsCount: number;
  quizCount: number;
  quizScoreSum: number;
  flashcardCount: number;
  notebookPageCount: number;
  masteryLevel: number;
}

export interface QuizQuestion {
  question: string;
  options: { key: string; text: string }[];
  correct: string;
  explanation: string;
}

export interface MemoryItem {
  id: string;
  subject: string;
  topic?: string;
  type: "weak" | "strong" | "gap" | "feedback";
  details: string;
  updatedAt: string;
}
