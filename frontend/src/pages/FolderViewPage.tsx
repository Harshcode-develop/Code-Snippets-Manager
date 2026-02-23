import React from "react";
import { Folder } from "../components/Folder";
import { SnippetCard } from "../components/SnippetCard";
import { PlusIcon, BackArrowIcon } from "../components/Icons";
import type { Folder as FolderType, Snippet } from "../types";

interface Props {
  folder: FolderType;
  parentFolder: FolderType | null;
  onBack: () => void;
  onFolderSelect: (folder: FolderType) => void;
  onFolderAdd: (parentId: string) => void;
  onFolderDelete: (id: string) => void;
  onFolderRename: (id: string, newName: string) => void;
  onSnippetAdd: (folderId: string) => void;
  onSnippetDelete: (snippetId: string) => void;
  onSnippetCopy: (code: string) => void;
  onSnippetExpand: (snippet: Snippet) => void;
  onAiChat: (snippet: Snippet) => void;
  onToggleStar: (id: string) => void;
  onSnippetToggleStar: (id: string) => void;
}

export const FolderViewPage: React.FC<Props> = ({
  folder,
  parentFolder,
  onBack,
  onFolderSelect,
  onFolderAdd,
  onFolderDelete,
  onFolderRename,
  onSnippetAdd,
  onSnippetDelete,
  onSnippetCopy,
  onSnippetExpand,
  onAiChat,
  onToggleStar,
  onSnippetToggleStar,
}) => {
  return (
    <div className="max-w-6xl mx-auto px-6 py-6 animate-fade-in-up">
      <button
        onClick={onBack}
        className="flex items-center gap-1.5 text-text-muted hover:text-primary transition-colors mb-4 group text-xs"
      >
        <BackArrowIcon className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
        {parentFolder ? `Back to ${parentFolder.name}` : "Back to All Projects"}
      </button>

      <div className="flex items-center justify-between mb-6">
        <h1 className="text-xl font-bold text-warning">{folder.name}</h1>
        <div className="flex gap-2">
          <button
            onClick={() => onFolderAdd(folder.id)}
            className="flex items-center gap-1.5 px-4 py-2 bg-linear-to-r from-primary to-secondary text-white text-xs font-bold rounded-lg hover:opacity-90 transition-all shadow-md shadow-primary/20 hover:shadow-primary/40 hover:-translate-y-0.5 active:scale-95"
          >
            <PlusIcon className="w-3.5 h-3.5" /> Subfolder
          </button>
          <button
            onClick={() => onSnippetAdd(folder.id)}
            className="flex items-center gap-1.5 px-4 py-2 bg-linear-to-r from-accent to-primary text-white text-xs font-bold rounded-lg hover:opacity-90 transition-all shadow-md shadow-accent/20 hover:shadow-accent/40 hover:-translate-y-0.5 active:scale-95"
          >
            <PlusIcon className="w-3.5 h-3.5" /> Snippet
          </button>
        </div>
      </div>

      {/* Subfolders */}
      {folder.subfolders && folder.subfolders.length > 0 && (
        <div className="mb-8">
          <h2 className="text-sm font-semibold text-text-muted mb-3 flex items-center gap-2">
            <span className="w-0.5 h-4 bg-warning rounded-full" /> Subfolders
          </h2>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
            {folder.subfolders.map((subfolder) => (
              <Folder
                key={subfolder.id}
                folder={subfolder}
                onFolderSelect={onFolderSelect}
                onFolderDelete={onFolderDelete}
                onFolderRename={onFolderRename}
                onToggleStar={onToggleStar}
              />
            ))}
          </div>
        </div>
      )}

      {/* Snippets */}
      {folder.snippets && folder.snippets.length > 0 && (
        <div>
          <h2 className="text-sm font-semibold text-text-muted mb-3 flex items-center gap-2">
            <span className="w-0.5 h-4 bg-accent rounded-full" /> Snippets
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {folder.snippets.map((snippet) => (
              <SnippetCard
                key={snippet.id}
                snippet={snippet}
                onCopy={onSnippetCopy}
                onDelete={() => onSnippetDelete(snippet.id)}
                onExpand={onSnippetExpand}
                onAiChat={onAiChat}
                onToggleStar={onSnippetToggleStar}
              />
            ))}
          </div>
        </div>
      )}

      {(!folder.subfolders || folder.subfolders.length === 0) &&
        (!folder.snippets || folder.snippets.length === 0) && (
          <div className="text-center py-16 text-text-muted">
            <p className="text-sm">This folder is empty.</p>
            <p className="text-xs mt-1">
              Add subfolders or snippets to get started.
            </p>
          </div>
        )}
    </div>
  );
};
