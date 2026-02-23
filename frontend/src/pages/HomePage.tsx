import React, { useState, useMemo } from "react";
import { SnippetCard } from "../components/SnippetCard";
import { Folder } from "../components/Folder";
import {
  SearchIcon,
  SparklesIcon,
  FolderIcon,
  CodeIcon,
} from "../components/Icons";
import type {
  UserData,
  Snippet,
  Folder as FolderType,
  PageName,
} from "../types";

interface Props {
  userData: UserData;
  onSnippetCopy: (code: string) => void;
  onDelete: (type: "folder" | "snippet", id: string) => void;
  onExpand: (snippet: Snippet) => void;
  onAiChat: (snippet: Snippet) => void;
  setPage: (page: PageName) => void;
  onFolderSelect: (folder: FolderType) => void;
  onToggleStar: (type: "folder" | "snippet", id: string) => void;
}

export const HomePage: React.FC<Props> = ({
  userData,
  onSnippetCopy,
  onDelete,
  onExpand,
  onAiChat,
  setPage,
  onFolderSelect,
  onToggleStar,
}) => {
  const [searchTerm, setSearchTerm] = useState("");

  const totalSnippets = useMemo(() => {
    let count = userData.standaloneSnippets?.length || 0;
    const countInFolders = (folders: FolderType[]): number => {
      let c = 0;
      for (const f of folders) {
        c += f.snippets?.length || 0;
        if (f.subfolders) c += countInFolders(f.subfolders);
      }
      return c;
    };
    count += countInFolders(userData.folders || []);
    return count;
  }, [userData]);

  const allSnippets = useMemo(() => {
    const collect = (folders: FolderType[]): Snippet[] => {
      const result: Snippet[] = [];
      for (const f of folders) {
        if (f.snippets) result.push(...f.snippets);
        if (f.subfolders) result.push(...collect(f.subfolders));
      }
      return result;
    };
    return [
      ...(userData.standaloneSnippets || []),
      ...collect(userData.folders || []),
    ];
  }, [userData]);

  const recentSnippets = useMemo(
    () =>
      [...allSnippets]
        .sort((a, b) =>
          (b.created_at || b.id).localeCompare(a.created_at || a.id),
        )
        .slice(0, 8),
    [allSnippets],
  );

  const searchResults = useMemo(() => {
    if (!searchTerm.trim()) return null;
    const term = searchTerm.toLowerCase();
    const snippets = allSnippets.filter(
      (s) =>
        s.title.toLowerCase().includes(term) ||
        s.code.toLowerCase().includes(term),
    );
    const folders = (userData.folders || []).filter((f) =>
      f.name.toLowerCase().includes(term),
    );
    return { snippets, folders };
  }, [searchTerm, allSnippets, userData.folders]);

  return (
    <div className="animate-fade-in-up pb-6">
      {/* Hero */}
      <div className="flex flex-col items-center justify-center py-8 px-6 text-center">
        <div className="mb-4 p-3 rounded-2xl bg-primary/10 inline-flex">
          <SparklesIcon className="w-8 h-8 text-primary" />
        </div>
        <h1 className="text-3xl md:text-4xl font-extrabold mb-3 gradient-text tracking-tight">
          Welcome, Coder.
        </h1>
        <p className="text-sm text-text-muted max-w-md mb-6 leading-relaxed">
          Your personal code snippets manager. Organize, star, and optimize your
          valuable code.
        </p>
        <div className="flex gap-6 justify-center">
          <div
            className="text-center group cursor-pointer p-4 glass-strong rounded-2xl hover-lift transition-all hover:bg-white/5 active:scale-95 border border-primary/10 hover:border-primary/30"
            onClick={() => setPage("projects")}
          >
            <div className="flex items-center justify-center gap-2 mb-1.5">
              <div className="p-1.5 bg-primary/10 rounded-lg group-hover:bg-primary/20 transition-colors shadow-inner">
                <FolderIcon className="w-4 h-4 text-primary" />
              </div>
              <span className="text-2xl font-extrabold text-transparent bg-clip-text bg-linear-to-br from-primary to-secondary drop-shadow-md">
                {userData.folders?.length || 0}
              </span>
            </div>
            <span className="text-[9px] text-text-muted uppercase tracking-widest font-bold">
              Projects
            </span>
          </div>
          <div
            className="text-center group cursor-pointer p-4 glass-strong rounded-2xl hover-lift transition-all hover:bg-white/5 active:scale-95 border border-accent/10 hover:border-accent/30"
            onClick={() => setPage("snippets")}
          >
            <div className="flex items-center justify-center gap-2 mb-1.5">
              <div className="p-1.5 bg-accent/10 rounded-lg group-hover:bg-accent/20 transition-colors shadow-inner">
                <CodeIcon className="w-4 h-4 text-accent" />
              </div>
              <span className="text-2xl font-extrabold text-transparent bg-clip-text bg-linear-to-br from-accent to-primary drop-shadow-md">
                {totalSnippets}
              </span>
            </div>
            <span className="text-[9px] text-text-muted uppercase tracking-widest font-bold">
              Snippets
            </span>
          </div>
        </div>
      </div>

      {/* Search */}
      <div className="relative max-w-lg mx-auto mb-8 px-6 group">
        <div className="absolute left-10 top-1/2 -translate-y-1/2 pointer-events-none z-10">
          <SearchIcon className="w-4 h-4 text-text-muted group-focus-within:text-primary transition-colors" />
        </div>
        <input
          type="text"
          className="w-full bg-bg-card border border-border rounded-full py-2.5 pl-12 pr-6 text-sm text-text placeholder-text-muted/50 focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary/30 transition-all shadow-sm"
          placeholder="Search snippets and folders..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
      </div>

      {/* Content */}
      <div className="max-w-6xl mx-auto px-6">
        {searchResults ? (
          <>
            <p className="text-text-muted text-xs mb-4">
              Found {searchResults.folders.length} folder(s) and{" "}
              {searchResults.snippets.length} snippet(s)
            </p>
            {searchResults.folders.length > 0 && (
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4 mb-6">
                {searchResults.folders.map((folder) => (
                  <Folder
                    key={folder.id}
                    folder={folder}
                    onFolderSelect={(f) => {
                      setPage("projects");
                      onFolderSelect(f);
                    }}
                    onToggleStar={(id) => onToggleStar("folder", id)}
                  />
                ))}
              </div>
            )}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {searchResults.snippets.map((snippet) => (
                <SnippetCard
                  key={snippet.id}
                  snippet={snippet}
                  onCopy={onSnippetCopy}
                  onDelete={() => onDelete("snippet", snippet.id)}
                  onExpand={onExpand}
                  onAiChat={onAiChat}
                  onToggleStar={(id) => onToggleStar("snippet", id)}
                />
              ))}
            </div>
          </>
        ) : recentSnippets.length > 0 ? (
          <>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-base font-bold text-text flex items-center gap-2">
                <span className="w-0.5 h-5 bg-primary rounded-full" />
                Recent Activity
              </h2>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {recentSnippets.map((snippet) => (
                <SnippetCard
                  key={snippet.id}
                  snippet={snippet}
                  onCopy={onSnippetCopy}
                  onDelete={() => onDelete("snippet", snippet.id)}
                  onExpand={onExpand}
                  onAiChat={onAiChat}
                  onToggleStar={(id) => onToggleStar("snippet", id)}
                />
              ))}
            </div>
          </>
        ) : (
          <div className="flex flex-col items-center justify-center py-10 text-center text-text-muted animate-fade-in">
            <div className="mb-4 p-4 rounded-full bg-bg-elevated/50 shadow-inner">
              <CodeIcon className="w-8 h-8 opacity-40" />
            </div>
            <p className="text-sm font-medium">No recent activity</p>
            <p className="text-xs mt-1 opacity-70">
              Create a snippet to see it here
            </p>
          </div>
        )}
      </div>
    </div>
  );
};
