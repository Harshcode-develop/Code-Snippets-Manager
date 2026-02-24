# 🚀 SonicXCode: Advanced Code Snippets Manager

SonicXCode is a premium, AI-powered code snippet management platform designed for developers who want to organize, optimize, and supercharge their coding workflow. Built with a modern tech stack (React 19, Node.js, Supabase, and Gemini AI), it offers a seamless experience for managing thousands of snippets with ease.

---

## 🛠 Tech Stack Overview

### **Backend**

- **Runtime**: Node.js
- **Framework**: Express.js (v5)
- **Database**: Supabase (PostgreSQL with RLS)
- **Auth**: Supabase Auth (Email/Password & Google OAuth)
- **AI Engine**: Google Gemini 2.5 Flash
- **Middleware**:
  - `helmet`: Security headers
  - `cors`: Cross-Origin Resource Sharing (whitelisted origins)
  - `compression`: Gzip/Brotli response compression
  - `express-rate-limit`: DDoS and brute-force protection
  - `dotenv`: Environment variable management

### **Frontend**

- **Framework**: React 19 (Latest)
- **Build Tool**: Vite
- **Language**: TypeScript
- **Styling**: Tailwind CSS v4 (with custom glassmorphic design)
- **Icons**: Custom SVG implementation
- **Components**: Framer-motion like micro-animations (Particles Background)
- **Data Fetching**: Native Fetch API with custom wrappers
- **State Management**: React Hooks (useState, useMemo, useCallback)
- **Persistence**: `js-cookie` for session management

---

## 🏗 Backend Architecture & Logic

### **1. Server Setup & Security**

The backend (`server.js`) is designed as a high-performance API server.

- **Rate Limiting**: Three distinct tiers:
  - `apiLimiter`: 300 requests/15m for standard data operations.
  - `authLimiter`: 20 requests/15m to prevent credential stuffing.
  - `aiLimiter`: 30 requests/1m to manage AI costs and quotas.
- **Graceful Shutdown**: Handles `SIGTERM` and `SIGINT` to close database connections and server processes cleanly.
- **Token Caching**: Implements a simple in-memory `Map` to cache User JWTs for 60 seconds, reducing the number of roundtrips to Supabase Auth for high-traffic accounts.

### **2. Database Schema (Supabase)**

- **Profiles**: Extends Supabase's internal auth system to store user metadata.
- **Folders**: Recursive structure using `parent_id` (enables infinite nesting).
- **Snippets**: Linked to folders and users with language metadata.
- **RLS (Row Level Security)**: Highly secure policies ensuring users can _only_ access their own data, even at the database level.
- **Triggers**:
  - `handle_new_user()`: Automatically creates a public profile when a user signs up.
  - `handle_updated_at()`: Auto-updates the `updated_at` timestamp on any modification.

### **3. AI Implementation (The "Sonic" Engine)**

SonicXCode uses **Gemini 2.5 Flash** for blazing-fast code processing.

- **AI Proxy Route**: All AI requests are proxied through the backend. This ensures the API Key is never exposed to the client.
- **Logic Blocks**:
  - **Check**: Identifies the single most critical bug in a snippet.
  - **Correct**: Rewrites code to fix bugs while maintaining logic.
  - **Add Comments**: Injects descriptive documentation without altering code.
  - **Interactive Chat**: A stateful conversation handler that maintains the last 20 messages of context and the current code snippet for deep debugging.

---

## 🎨 Frontend Architecture & Logic

### **1. Core Infrastructure**

- **Lazy Loading**: Pages like `HomePage`, `ProjectsPage`, and complex modals are lazy-loaded using `React.lazy` and `Suspense` to minimize the initial bundle size.
- **Guest Mode**: A fully functional local-first experience. If not signed in, data is stored in React state (volatile). Upon signing in, the app syncs with the Supabase cloud.

### **2. Custom Hooks & Logic**

- **Tree Traversal Logic**:
  - The `findFolderById` recursive function allows for efficient searching through infinite folder depths.
  - `allFolders`/`allSnippets` use-memoized flattening to allow global searching and a "Starred" page across all nesting levels.
- **Optimistic Updates**:
  - When a user stars a snippet or creates a folder, the UI updates **instantly** using local state.
  - Success/Failure is handled in the background, with the UI reverting only if the server fails.

### **3. AI Integration (Sonic AI)**

- **Code Generation**: Users can type a natural language prompt (e.g., "Write a bubble sort in Python") and Sonic will inject the raw code directly into the editor.
- **Context-Aware Chat**: The `AiChatModal` sends the current snippet's code alongside the user's question, allowing the AI to "see" exactly what the developer is working on.

### **4. Design Aesthetics (Aesthetic-First)**

- **Glassmorphism**: Modals and cards use semi-transparent backgrounds with `backdrop-filter: blur()`.
- **Dynamic UX**:
  - `ParticlesBackground`: A custom Canvas-based particle engine that creates a high-end tech feel.
  - **Notifications**: A custom toast system for non-blocking user feedback.
  - **Syntax Highlighting**: Integrated `react-syntax-highlighter` to provide IDE-level readability for dozens of languages.

---

## 🚀 Deployment & Optimization

- **Hosting**: Deployed on **Vercel** with the backend running as a Serverless Function (`vercel.json` configuration).
- **Performance**:
  - Asset minification via Vite.
  - Gzip compression on all API responses.
  - `O(n)` tree building on the backend (using Maps) rather than recursive database queries to avoid the "N+1" problem.

---

## 🔮 Future Enhancements

- **Shared Snippets**: Public URLs for sharing specific code blocks.
- **Team Workspaces**: Real-time collaborative folder management.
- **IDE Extension**: Bringing Sonic AI directly into VS Code.

---

Designed with ❤️ by **SonicXCode Team**
