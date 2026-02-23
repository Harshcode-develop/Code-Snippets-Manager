// ============================================================
// Type definitions for Code Snippets Manager
// ============================================================

export interface Snippet {
  id: string;
  user_id?: string;
  folder_id: string | null;
  title: string;
  code: string;
  language?: string;
  is_starred: boolean;
  created_at?: string;
  updated_at?: string;
}

export interface Folder {
  id: string;
  user_id?: string;
  name: string;
  parent_id: string | null;
  is_starred: boolean;
  subfolders: Folder[];
  snippets: Snippet[];
  created_at?: string;
  updated_at?: string;
}

export interface UserData {
  folders: Folder[];
  standaloneSnippets: Snippet[];
}

export interface ChatMessage {
  sender: "user" | "ai" | "system";
  text: string;
}

export interface NotificationState {
  message: string;
  type: "success" | "error" | "";
}

export interface ConfirmModalState {
  isOpen: boolean;
  onConfirm: (() => void) | null;
  message: string;
}

export type ThemeMode = "light" | "dark";

export type PageName = "home" | "projects" | "snippets" | "starred";
