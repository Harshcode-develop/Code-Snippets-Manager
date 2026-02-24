import React, {
  useState,
  useEffect,
  useMemo,
  useCallback,
  Suspense,
  lazy,
} from "react";
import { Navbar } from "./components/Navbar";
import { Notification } from "./components/Notification";
import { Modal } from "./components/Modal";
import { ConfirmModal } from "./components/ConfirmModal";
import { SignInModal } from "./components/SignInModal";
import { ParticlesBackground } from "./components/ParticlesBackground";
import { SparklesIcon, FolderIcon, CodeIcon } from "./components/Icons";
import { supabase } from "./lib/supabase";
import { apiFetch } from "./lib/api";
import type {
  UserData,
  Folder,
  Snippet,
  NotificationState,
  ConfirmModalState,
  PageName,
  ChatMessage,
} from "./types";
import Cookies from "js-cookie";

// Lazy load heavy modals and pages
const HomePage = lazy(() =>
  import("./pages/HomePage").then((m) => ({ default: m.HomePage })),
);
const ProjectsPage = lazy(() =>
  import("./pages/ProjectsPage").then((m) => ({ default: m.ProjectsPage })),
);
const SnippetsPage = lazy(() =>
  import("./pages/SnippetsPage").then((m) => ({ default: m.SnippetsPage })),
);
const StarredPage = lazy(() =>
  import("./pages/StarredPage").then((m) => ({ default: m.StarredPage })),
);
const FolderViewPage = lazy(() =>
  import("./pages/FolderViewPage").then((m) => ({ default: m.FolderViewPage })),
);
const SnippetViewModal = lazy(() =>
  import("./components/SnippetViewModal").then((m) => ({
    default: m.SnippetViewModal,
  })),
);
const AiChatModal = lazy(() =>
  import("./components/AiChatModal").then((m) => ({ default: m.AiChatModal })),
);

export default function App() {
  // Auth state
  const [token, setToken] = useState<string | null>(
    () => Cookies.get("auth_token") || null,
  );
  const [isGuest, setIsGuest] = useState(() => !Cookies.get("auth_token"));
  const [isSignInOpen, setIsSignInOpen] = useState(false);

  // Data state
  const [userData, setUserData] = useState<UserData>({
    folders: [],
    standaloneSnippets: [],
  });
  const [isLoading, setIsLoading] = useState(true);
  const [isAiLoading, setIsAiLoading] = useState(false);

  // Navigation
  const [page, setPage] = useState<PageName>("home");
  const [folderHistory, setFolderHistory] = useState<Folder[]>([]);
  const currentFolder =
    folderHistory.length > 0 ? folderHistory[folderHistory.length - 1] : null;

  // Modal state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState("");
  const [targetFolderId, setTargetFolderId] = useState<string | null>(null);
  const [viewingSnippet, setViewingSnippet] = useState<Snippet | null>(null);
  const [aiChatSnippet, setAiChatSnippet] = useState<Snippet | null>(null);

  // Form state
  const [title, setTitle] = useState("");
  const [code, setCode] = useState("");
  const [folderName, setFolderName] = useState("");
  const [aiPrompt, setAiPrompt] = useState("");

  // UI state
  const [notification, setNotification] = useState<NotificationState>({
    message: "",
    type: "",
  });
  const [confirmModal, setConfirmModal] = useState<ConfirmModalState>({
    isOpen: false,
    onConfirm: null,
    message: "",
  });

  // ============================================================
  // Auth
  // ============================================================

  useEffect(() => {
    const initAuth = async () => {
      try {
        const {
          data: { session },
        } = await supabase.auth.getSession();
        if (session) {
          setToken(session.access_token);
          Cookies.set("auth_token", session.access_token, { expires: 30 });
          setIsGuest(false);
          await fetchUserData(session.access_token);
        } else if (token) {
          // If we had a token in cookies but supabase doesn't know it, we might be using custom JWT mapping
          setIsGuest(false);
          await fetchUserData(token);
        }
      } catch (err) {
        console.warn("Supabase not configured, running in guest mode:", err);
      }
      setIsLoading(false);
    };

    initAuth();

    let subscription: { unsubscribe: () => void } | null = null;
    try {
      const {
        data: { subscription: sub },
      } = supabase.auth.onAuthStateChange(async (_event, session) => {
        if (_event === "INITIAL_SESSION") return;

        if (session) {
          setToken(session.access_token);
          Cookies.set("auth_token", session.access_token, { expires: 30 });
          setIsGuest(false);
          await fetchUserData(session.access_token);
        } else if (_event === "SIGNED_OUT") {
          setToken(null);
          Cookies.remove("auth_token");
          setIsGuest(true);
        }
      });
      subscription = sub;
    } catch (err) {
      console.warn("Supabase auth listener not available:", err);
    }

    return () => subscription?.unsubscribe();
  }, []);

  const handleAuthSuccess = useCallback(
    async (newToken: string, _refreshToken: string) => {
      setToken(newToken);
      Cookies.set("auth_token", newToken, { expires: 30 }); // Default remember
      setIsGuest(false);
      await fetchUserData(newToken);
      setIsSignInOpen(false);
    },
    [],
  );

  const handleLogout = useCallback(async () => {
    await supabase.auth.signOut();
    setToken(null);
    Cookies.remove("auth_token");
    setIsGuest(true);
    setUserData({ folders: [], standaloneSnippets: [] });
    setPage("home");
    setFolderHistory([]);
  }, []);

  // ============================================================
  // Data fetching
  // ============================================================

  const fetchUserData = useCallback(
    async (authToken?: string): Promise<UserData | null> => {
      const t = authToken || token;
      if (!t) return null;
      try {
        const data = await apiFetch<UserData>("/data", "GET", null, t);
        setUserData(data);
        return data;
      } catch (error) {
        console.error("Failed to fetch user data:", error);
        return null;
      }
    },
    [token],
  );

  // ============================================================
  // Notifications
  // ============================================================

  const showNotification = useCallback(
    (message: string, type: "success" | "error" = "success") => {
      setNotification({ message, type });
      setTimeout(() => setNotification({ message: "", type: "" }), 3000);
    },
    [],
  );

  // ============================================================
  // Guest mode helpers - temp data stored in state, lost on refresh
  // ============================================================

  const generateTempId = () => crypto.randomUUID();

  // ============================================================
  // Folder tree helpers
  // ============================================================

  const findFolderById = useCallback(
    (folders: Folder[], id: string): Folder | null => {
      for (const folder of folders) {
        if (folder.id === id) return folder;
        if (folder.subfolders?.length) {
          const found = findFolderById(folder.subfolders, id);
          if (found) return found;
        }
      }
      return null;
    },
    [],
  );

  // ============================================================
  // Folder operations
  // ============================================================

  const resetForm = useCallback(() => {
    setTitle("");
    setCode("");
    setFolderName("");
    setAiPrompt("");
    setIsModalOpen(false);
  }, []);

  const handleAddFolder = useCallback(async () => {
    if (!folderName.trim()) return;

    const newFolder: Folder = {
      id: generateTempId(),
      name: folderName.trim(),
      parent_id: targetFolderId,
      is_starred: false,
      subfolders: [],
      snippets: [],
      created_at: new Date().toISOString(),
    };

    // Optimistic update
    const insertIntoTree = (folders: Folder[]): Folder[] => {
      if (!targetFolderId) return [...folders, newFolder];
      return folders.map((f) => {
        if (f.id === targetFolderId)
          return { ...f, subfolders: [...f.subfolders, newFolder] };
        return { ...f, subfolders: insertIntoTree(f.subfolders) };
      });
    };

    setUserData((prev) => ({ ...prev, folders: insertIntoTree(prev.folders) }));
    resetForm();

    if (!isGuest && token) {
      try {
        const created = await apiFetch<Folder>(
          "/folders",
          "POST",
          { name: folderName.trim(), parentId: targetFolderId },
          token,
        );
        // Replace temp id with real id
        const replaceTempId = (folders: Folder[]): Folder[] =>
          folders.map((f) => {
            if (f.id === newFolder.id)
              return { ...created, subfolders: [], snippets: [] };
            return { ...f, subfolders: replaceTempId(f.subfolders) };
          });
        setUserData((prev) => ({
          ...prev,
          folders: replaceTempId(prev.folders),
        }));
        showNotification("Folder created!", "success");
      } catch (error: unknown) {
        // Revert
        await fetchUserData();
        showNotification(
          error instanceof Error ? error.message : "Failed to create folder",
          "error",
        );
      }
    } else {
      showNotification(
        "Folder created (temporary - sign in to save)",
        "success",
      );
    }
  }, [
    folderName,
    targetFolderId,
    isGuest,
    token,
    resetForm,
    fetchUserData,
    showNotification,
  ]);

  const handleFolderRename = useCallback(
    async (folderId: string, newName: string) => {
      if (!isGuest && token) {
        try {
          await apiFetch(
            "/folders/" + folderId,
            "PUT",
            { name: newName },
            token,
          );
          const newData = await fetchUserData();
          if (newData && currentFolder) {
            const updated = findFolderById(newData.folders, currentFolder.id);
            if (updated) {
              setFolderHistory((prev) => {
                const copy = [...prev];
                copy[copy.length - 1] = updated;
                return copy;
              });
            }
          }
          showNotification("Folder renamed!", "success");
        } catch (error: unknown) {
          showNotification(
            error instanceof Error ? error.message : "Failed",
            "error",
          );
        }
      } else {
        // Guest: update locally
        const updateName = (folders: Folder[]): Folder[] =>
          folders.map((f) => {
            if (f.id === folderId) return { ...f, name: newName };
            return { ...f, subfolders: updateName(f.subfolders) };
          });
        setUserData((prev) => ({ ...prev, folders: updateName(prev.folders) }));
        showNotification("Folder renamed (temporary)", "success");
      }
    },
    [
      isGuest,
      token,
      currentFolder,
      fetchUserData,
      findFolderById,
      showNotification,
    ],
  );

  // ============================================================
  // Snippet operations
  // ============================================================

  const handleAddSnippet = useCallback(async () => {
    if (!title.trim() || !code.trim()) return;

    const newSnippet: Snippet = {
      id: generateTempId(),
      title: title.trim(),
      code: code.trim(),
      folder_id: targetFolderId,
      is_starred: false,
      created_at: new Date().toISOString(),
    };

    // Optimistic update
    if (targetFolderId) {
      const insertSnippet = (folders: Folder[]): Folder[] =>
        folders.map((f) => {
          if (f.id === targetFolderId)
            return { ...f, snippets: [newSnippet, ...f.snippets] };
          return { ...f, subfolders: insertSnippet(f.subfolders) };
        });
      setUserData((prev) => ({
        ...prev,
        folders: insertSnippet(prev.folders),
      }));
    } else {
      setUserData((prev) => ({
        ...prev,
        standaloneSnippets: [newSnippet, ...prev.standaloneSnippets],
      }));
    }
    resetForm();

    if (!isGuest && token) {
      try {
        const created = await apiFetch<Snippet>(
          "/snippets",
          "POST",
          { title: title.trim(), code: code.trim(), folderId: targetFolderId },
          token,
        );
        // Replace temp
        if (targetFolderId) {
          const replaceSnippet = (folders: Folder[]): Folder[] =>
            folders.map((f) => {
              if (f.id === targetFolderId)
                return {
                  ...f,
                  snippets: f.snippets.map((s) =>
                    s.id === newSnippet.id ? created : s,
                  ),
                };
              return { ...f, subfolders: replaceSnippet(f.subfolders) };
            });
          setUserData((prev) => ({
            ...prev,
            folders: replaceSnippet(prev.folders),
          }));
        } else {
          setUserData((prev) => ({
            ...prev,
            standaloneSnippets: prev.standaloneSnippets.map((s) =>
              s.id === newSnippet.id ? created : s,
            ),
          }));
        }
        showNotification("Snippet created!", "success");
      } catch (error: unknown) {
        await fetchUserData();
        showNotification(
          error instanceof Error ? error.message : "Failed",
          "error",
        );
      }
    } else {
      showNotification(
        "Snippet created (temporary - sign in to save)",
        "success",
      );
    }
  }, [
    title,
    code,
    targetFolderId,
    isGuest,
    token,
    resetForm,
    fetchUserData,
    showNotification,
  ]);

  const handleUpdateSnippet = useCallback(
    async (snippetId: string, updatedTitle: string, updatedCode: string) => {
      if (!isGuest && token) {
        try {
          await apiFetch(
            "/snippets/" + snippetId,
            "PUT",
            { title: updatedTitle, code: updatedCode },
            token,
          );
          await fetchUserData();
          if (aiChatSnippet?.id === snippetId) {
            setAiChatSnippet((prev) =>
              prev ? { ...prev, title: updatedTitle, code: updatedCode } : null,
            );
          }
          showNotification("Snippet updated!", "success");
        } catch (error: unknown) {
          showNotification(
            error instanceof Error ? error.message : "Failed",
            "error",
          );
        }
      } else {
        // Guest: update locally
        const updateSnippet = (s: Snippet) =>
          s.id === snippetId
            ? { ...s, title: updatedTitle, code: updatedCode }
            : s;
        const updateInFolders = (folders: Folder[]): Folder[] =>
          folders.map((f) => ({
            ...f,
            snippets: f.snippets.map(updateSnippet),
            subfolders: updateInFolders(f.subfolders),
          }));
        setUserData((prev) => ({
          ...prev,
          standaloneSnippets: prev.standaloneSnippets.map(updateSnippet),
          folders: updateInFolders(prev.folders),
        }));
        showNotification("Snippet updated (temporary)", "success");
      }
    },
    [isGuest, token, aiChatSnippet, fetchUserData, showNotification],
  );

  // ============================================================
  // Delete
  // ============================================================

  const handleDelete = useCallback((type: "folder" | "snippet", id: string) => {
    setConfirmModal({
      isOpen: true,
      message: `Are you sure you want to delete this ${type}? This action cannot be undone.`,
      onConfirm: () => {
        confirmDelete(type, id);
        setConfirmModal({ isOpen: false, onConfirm: null, message: "" });
      },
    });
  }, []);

  const confirmDelete = useCallback(
    async (type: "folder" | "snippet", id: string) => {
      if (!isGuest && token) {
        try {
          await apiFetch(`/${type}s/${id}`, "DELETE", null, token);
          const newData = await fetchUserData();
          if (type === "folder" && currentFolder?.id === id) {
            handleBack();
          } else if (newData && currentFolder) {
            const updated = findFolderById(newData.folders, currentFolder.id);
            if (updated) {
              setFolderHistory((prev) => {
                const copy = [...prev];
                copy[copy.length - 1] = updated;
                return copy;
              });
            } else {
              handleBack();
            }
          }
        } catch (error: unknown) {
          showNotification(
            error instanceof Error ? error.message : "Failed",
            "error",
          );
        }
      } else {
        // Guest: remove locally
        if (type === "folder") {
          const removeFolder = (folders: Folder[]): Folder[] =>
            folders
              .filter((f) => f.id !== id)
              .map((f) => ({ ...f, subfolders: removeFolder(f.subfolders) }));
          setUserData((prev) => ({
            ...prev,
            folders: removeFolder(prev.folders),
          }));
          if (currentFolder?.id === id) handleBack();
        } else {
          const removeSnippet = (folders: Folder[]): Folder[] =>
            folders.map((f) => ({
              ...f,
              snippets: f.snippets.filter((s) => s.id !== id),
              subfolders: removeSnippet(f.subfolders),
            }));
          setUserData((prev) => ({
            ...prev,
            standaloneSnippets: prev.standaloneSnippets.filter(
              (s) => s.id !== id,
            ),
            folders: removeSnippet(prev.folders),
          }));
        }
        showNotification(`${type} deleted (temporary)`, "success");
      }
    },
    [
      isGuest,
      token,
      currentFolder,
      fetchUserData,
      findFolderById,
      showNotification,
    ],
  );

  // ============================================================
  // Star toggle
  // ============================================================

  const handleToggleStar = useCallback(
    async (type: "folder" | "snippet", id: string) => {
      // Optimistic update
      const toggleInTree = (folders: Folder[]): Folder[] =>
        folders.map((f) => {
          const updated =
            type === "folder" && f.id === id
              ? { ...f, is_starred: !f.is_starred }
              : f;
          return {
            ...updated,
            snippets: updated.snippets.map((s) =>
              type === "snippet" && s.id === id
                ? { ...s, is_starred: !s.is_starred }
                : s,
            ),
            subfolders: toggleInTree(updated.subfolders),
          };
        });

      setUserData((prev) => ({
        ...prev,
        folders: toggleInTree(prev.folders),
        standaloneSnippets:
          type === "snippet"
            ? prev.standaloneSnippets.map((s) =>
                s.id === id ? { ...s, is_starred: !s.is_starred } : s,
              )
            : prev.standaloneSnippets,
      }));

      if (!isGuest && token) {
        try {
          await apiFetch(`/${type}s/${id}/star`, "PUT", null, token);
        } catch {
          await fetchUserData(); // Revert on error
          showNotification("Failed to update star status", "error");
        }
      }
    },
    [isGuest, token, fetchUserData, showNotification],
  );

  // ============================================================
  // AI (routed through backend)
  // ============================================================

  const callAiGenerate = useCallback(
    async (prompt: string): Promise<string | null> => {
      if (!token) {
        setIsSignInOpen(true);
        showNotification("Sign in to use AI features", "error");
        return null;
      }
      setIsAiLoading(true);
      try {
        const data = await apiFetch<{ response: string }>(
          "/ai/generate",
          "POST",
          { prompt },
          token,
        );
        return data.response
          .replace(/```[\w\s]*\n/g, "")
          .replace(/```/g, "")
          .trim();
      } catch (error: unknown) {
        showNotification(
          error instanceof Error ? error.message : "AI error",
          "error",
        );
        return null;
      } finally {
        setIsAiLoading(false);
      }
    },
    [token, showNotification],
  );

  const handleAiSnippetAction = useCallback(
    async (action: string, codeToProcess: string): Promise<string | null> => {
      if (!token) {
        setIsSignInOpen(true);
        showNotification("Sign in to use AI features", "error");
        return null;
      }
      setIsAiLoading(true);
      try {
        const data = await apiFetch<{ response: string }>(
          "/ai/action",
          "POST",
          { action, code: codeToProcess },
          token,
        );
        return data.response;
      } catch (error: unknown) {
        showNotification(
          error instanceof Error ? error.message : "AI error",
          "error",
        );
        return null;
      } finally {
        setIsAiLoading(false);
      }
    },
    [token, showNotification],
  );

  const handleAiChatQuery = useCallback(
    async (
      userPrompt: string,
      snippetCode: string,
      history: ChatMessage[],
    ): Promise<string | null> => {
      if (!token) {
        setIsSignInOpen(true);
        showNotification("Sign in to use AI features", "error");
        return null;
      }
      setIsAiLoading(true);
      try {
        const data = await apiFetch<{ response: string }>(
          "/ai/chat",
          "POST",
          { prompt: userPrompt, code: snippetCode, history },
          token,
        );
        return data.response;
      } catch (error: unknown) {
        showNotification(
          error instanceof Error ? error.message : "AI error",
          "error",
        );
        return null;
      } finally {
        setIsAiLoading(false);
      }
    },
    [token, showNotification],
  );

  const handleGenerateCode = useCallback(async () => {
    if (!aiPrompt.trim()) return;
    const result = await callAiGenerate(
      `${aiPrompt}. Only return the raw code, with no explanation or markdown formatting.`,
    );
    if (result) {
      setCode(result);
      if (!title) setTitle(aiPrompt.substring(0, 50));
    }
  }, [aiPrompt, title, callAiGenerate]);

  // ============================================================
  // Navigation
  // ============================================================

  const handleFolderSelect = useCallback((folder: Folder) => {
    setFolderHistory((prev) => [...prev, folder]);
  }, []);

  const handleBack = useCallback(() => {
    setFolderHistory((prev) => prev.slice(0, -1));
  }, []);

  const handlePageChange = useCallback((newPage: PageName) => {
    setPage(newPage);
    setFolderHistory([]);
  }, []);

  const openModal = useCallback((mode: string, id: string | null = null) => {
    setModalMode(mode);
    setTargetFolderId(id);
    setIsModalOpen(true);
  }, []);

  // ============================================================
  // Filtered data for search
  // ============================================================

  const filteredData = useMemo(() => userData, [userData]);

  // ============================================================
  // Flatten data for starred page (optimized with useMemo)
  // ============================================================

  const { allFolders, allSnippets } = useMemo(() => {
    const folders: Folder[] = [];
    const snippets: Snippet[] = [];

    const traverse = (nodes: Folder[]) => {
      for (const node of nodes) {
        folders.push(node);
        if (node.snippets) snippets.push(...node.snippets);
        if (node.subfolders) traverse(node.subfolders);
      }
    };

    traverse(userData.folders || []);
    if (userData.standaloneSnippets)
      snippets.push(...userData.standaloneSnippets);

    return { allFolders: folders, allSnippets: snippets };
  }, [userData]);

  // ============================================================
  // Render
  // ============================================================

  const renderPage = () => {
    if (currentFolder) {
      const parentFolder =
        folderHistory.length > 1
          ? folderHistory[folderHistory.length - 2]
          : null;
      return (
        <FolderViewPage
          folder={currentFolder}
          parentFolder={parentFolder}
          onBack={handleBack}
          onFolderSelect={handleFolderSelect}
          onFolderAdd={(parentId) => openModal("addFolder", parentId)}
          onFolderDelete={(id) => handleDelete("folder", id)}
          onFolderRename={handleFolderRename}
          onSnippetAdd={(folderId) => openModal("addSnippetToFolder", folderId)}
          onSnippetDelete={(snippetId) => handleDelete("snippet", snippetId)}
          onSnippetCopy={(c) => {
            navigator.clipboard.writeText(c);
            showNotification("Copied!", "success");
          }}
          onSnippetExpand={setViewingSnippet}
          onAiChat={setAiChatSnippet}
          onToggleStar={(id) => handleToggleStar("folder", id)}
          onSnippetToggleStar={(id) => handleToggleStar("snippet", id)}
        />
      );
    }

    switch (page) {
      case "home":
        return (
          <HomePage
            userData={userData}
            onSnippetCopy={(c) => {
              navigator.clipboard.writeText(c);
              showNotification("Copied!", "success");
            }}
            onDelete={handleDelete}
            onExpand={setViewingSnippet}
            onAiChat={setAiChatSnippet}
            setPage={setPage}
            onFolderSelect={handleFolderSelect}
            onToggleStar={handleToggleStar}
          />
        );
      case "projects":
        return (
          <ProjectsPage
            userData={filteredData}
            onFolderSelect={handleFolderSelect}
            onFolderAdd={(parentId) => openModal("addFolder", parentId)}
            onFolderDelete={(id) => handleDelete("folder", id)}
            onFolderRename={handleFolderRename}
            onToggleStar={(id) => handleToggleStar("folder", id)}
          />
        );
      case "snippets":
        return (
          <SnippetsPage
            snippets={filteredData.standaloneSnippets || []}
            onCopy={(c) => {
              navigator.clipboard.writeText(c);
              showNotification("Copied!", "success");
            }}
            onDelete={(id) => handleDelete("snippet", id)}
            onExpand={setViewingSnippet}
            onAiChat={setAiChatSnippet}
            onAddSnippet={() => openModal("addSnippet")}
            onToggleStar={(id) => handleToggleStar("snippet", id)}
          />
        );
      case "starred":
        return (
          <StarredPage
            folders={allFolders}
            snippets={allSnippets}
            onFolderSelect={handleFolderSelect}
            onFolderDelete={(id) => handleDelete("folder", id)}
            onFolderRename={handleFolderRename}
            onSnippetCopy={(c) => {
              navigator.clipboard.writeText(c);
              showNotification("Copied!", "success");
            }}
            onSnippetDelete={(id) => handleDelete("snippet", id)}
            onSnippetExpand={setViewingSnippet}
            onAiChat={setAiChatSnippet}
            onToggleStar={handleToggleStar}
          />
        );
      default:
        return (
          <HomePage
            userData={userData}
            onSnippetCopy={() => {}}
            onDelete={() => {}}
            onExpand={() => {}}
            onAiChat={() => {}}
            setPage={setPage}
            onFolderSelect={() => {}}
            onToggleStar={() => {}}
          />
        );
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-bg">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 border-3 border-primary/20 border-t-primary rounded-full animate-spin" />
          <span className="text-sm text-text-muted">Loading...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-bg text-text font-sans">
      <ParticlesBackground />
      <Navbar
        onLogout={handleLogout}
        setPage={handlePageChange}
        page={page}
        isGuest={isGuest}
        onSignInClick={() => setIsSignInOpen(true)}
      />

      <main className="pb-4">
        <Suspense
          fallback={
            <div className="flex items-center justify-center min-h-[60vh]">
              <div className="w-8 h-8 border-2 border-primary/20 border-t-primary rounded-full animate-spin" />
            </div>
          }
        >
          {renderPage()}
        </Suspense>
      </main>

      <Notification message={notification.message} type={notification.type} />

      {/* Create Folder / Snippet Modal */}
      <Modal isOpen={isModalOpen} onClose={resetForm}>
        {modalMode === "addFolder" && (
          <div className="p-2">
            <h3 className="text-xl font-extrabold mb-5 text-transparent bg-clip-text bg-linear-to-r from-primary to-secondary flex items-center gap-2 w-max">
              <FolderIcon className="w-6 h-6 text-primary" /> New Folder
            </h3>
            <div className="space-y-4">
              <input
                type="text"
                value={folderName}
                onChange={(e) => setFolderName(e.target.value)}
                placeholder="Folder Name"
                onKeyDown={(e) => e.key === "Enter" && handleAddFolder()}
                className="w-full p-3.5 bg-bg-card/50 border border-border/50 rounded-xl text-sm font-medium text-text focus:outline-none focus:-translate-y-0.5 focus:ring-2 focus:ring-primary/50 transition-all placeholder:text-text-muted/50 shadow-sm"
              />
              <button
                onClick={handleAddFolder}
                className="w-full p-3.5 bg-linear-to-r from-primary to-secondary text-white text-sm font-bold rounded-xl hover:opacity-90 transition-all shadow-lg shadow-primary/20 hover:shadow-primary/40 active:scale-95 flex items-center justify-center gap-2"
              >
                Create Folder
              </button>
            </div>
          </div>
        )}
        {(modalMode === "addSnippet" || modalMode === "addSnippetToFolder") && (
          <div className="p-0">
            <h3 className="text-lg font-extrabold mb-4 text-transparent bg-clip-text bg-linear-to-r from-accent to-primary flex items-center gap-2 w-max">
              <CodeIcon className="w-5 h-5 text-accent" /> New Snippet
            </h3>

            <div className="mb-4 p-3 bg-primary/5 rounded-xl border border-primary/10 relative overflow-hidden group">
              <div className="absolute top-0 right-0 w-24 h-24 bg-primary/10 rounded-full blur-2xl -mr-12 -mt-12 transition-opacity group-hover:opacity-100 opacity-50"></div>
              <label className="block text-[10px] font-extrabold mb-1.5 text-primary/80 uppercase tracking-widest relative z-10">
                AI Assistant
              </label>
              <div className="flex gap-2 relative z-10">
                <input
                  type="text"
                  value={aiPrompt}
                  onChange={(e) => setAiPrompt(e.target.value)}
                  placeholder="e.g., a python function to sort a list..."
                  onKeyDown={(e) => e.key === "Enter" && handleGenerateCode()}
                  className="w-full p-2.5 bg-bg-card/20 border border-primary/20 rounded-lg text-xs text-text focus:outline-none focus:ring-1 focus:ring-primary/50 transition-all placeholder:text-text-muted/50 backdrop-blur-sm shadow-inner"
                />
                <button
                  onClick={handleGenerateCode}
                  disabled={isAiLoading}
                  className="px-4 bg-primary text-white text-xs font-bold rounded-lg flex items-center hover:bg-primary-hover transition-all disabled:opacity-50 hover:shadow-md hover:shadow-primary/30 active:scale-95 whitespace-nowrap"
                >
                  <SparklesIcon className="w-3.5 h-3.5 mr-1" />
                  {isAiLoading ? "..." : "Generate"}
                </button>
              </div>
            </div>

            <div className="space-y-3">
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Snippet Title"
                className="w-full p-2.5 bg-bg-card/30 border border-border/50 rounded-lg text-xs font-medium text-text focus:outline-none focus:ring-1 focus:ring-accent/50 transition-all placeholder:text-text-muted/50 shadow-inner backdrop-blur-sm"
              />
              <div className="relative group">
                <textarea
                  value={code}
                  onChange={(e) => setCode(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Tab") {
                      e.preventDefault();
                      const target = e.currentTarget;
                      const start = target.selectionStart;
                      const end = target.selectionEnd;
                      setCode(
                        code.substring(0, start) + "  " + code.substring(end),
                      );
                      requestAnimationFrame(() => {
                        target.selectionStart = target.selectionEnd = start + 2;
                      });
                    }
                  }}
                  placeholder="Enter code or let AI generate it for you..."
                  rows={8}
                  spellCheck="false"
                  className="w-full p-3 bg-bg-elevated/30 border border-border/50 rounded-lg text-xs text-text focus:outline-none focus:ring-1 focus:ring-accent/50 transition-all resize-y shadow-inner placeholder:text-text-muted/30 max-h-[50vh] overflow-auto backdrop-blur-sm"
                  style={{
                    fontFamily: "var(--font-mono)",
                    tabSize: 2,
                    overscrollBehavior: "contain",
                  }}
                />
              </div>
              <button
                onClick={handleAddSnippet}
                className="w-full p-2.5 bg-linear-to-r from-accent to-primary text-white text-xs font-bold rounded-lg hover:opacity-90 transition-all shadow-md hover:shadow-accent/25 active:scale-95 flex items-center justify-center gap-1.5 mt-1"
              >
                Save Snippet
              </button>
            </div>
          </div>
        )}
      </Modal>

      <Suspense fallback={null}>
        <SnippetViewModal
          snippet={viewingSnippet}
          isOpen={!!viewingSnippet}
          onClose={() => setViewingSnippet(null)}
          onCopy={(c) => {
            navigator.clipboard.writeText(c);
            showNotification("Copied!", "success");
          }}
          onUpdate={handleUpdateSnippet}
          onAiAction={handleAiSnippetAction}
          isAiLoading={isAiLoading}
        />
        <AiChatModal
          snippet={aiChatSnippet}
          isOpen={!!aiChatSnippet}
          onClose={() => setAiChatSnippet(null)}
          onSendQuery={handleAiChatQuery}
          isAiLoading={isAiLoading}
          onUpdate={handleUpdateSnippet}
        />
      </Suspense>

      <ConfirmModal
        isOpen={confirmModal.isOpen}
        onClose={() =>
          setConfirmModal({ isOpen: false, onConfirm: null, message: "" })
        }
        onConfirm={confirmModal.onConfirm}
        message={confirmModal.message}
      />

      <SignInModal
        isOpen={isSignInOpen}
        onClose={() => setIsSignInOpen(false)}
        onAuthSuccess={handleAuthSuccess}
        showNotification={showNotification}
      />
    </div>
  );
}
