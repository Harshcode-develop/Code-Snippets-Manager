import React, { useMemo } from "react";
import { SnippetCard } from "../components/SnippetCard";
import { Folder } from "../components/Folder";
import { StarIcon } from "../components/Icons";
import type { Folder as FolderType, Snippet } from "../types";

interface Props {
  folders: FolderType[];
  snippets: Snippet[];
  onFolderSelect: (folder: FolderType) => void;
  onFolderDelete: (id: string) => void;
  onFolderRename: (id: string, newName: string) => void;
  onSnippetCopy: (code: string) => void;
  onSnippetDelete: (id: string) => void;
  onSnippetExpand: (snippet: Snippet) => void;
  onAiChat: (snippet: Snippet) => void;
  onToggleStar: (type: "folder" | "snippet", id: string) => void;
}

export const StarredPage: React.FC<Props> = ({
  folders,
  snippets,
  onFolderSelect,
  onFolderDelete,
  onFolderRename,
  onSnippetCopy,
  onSnippetDelete,
  onSnippetExpand,
  onAiChat,
  onToggleStar,
}) => {
  const starredFolders = useMemo(
    () => folders.filter((f) => f.is_starred),
    [folders],
  );
  const starredSnippets = useMemo(
    () => snippets.filter((s) => s.is_starred),
    [snippets],
  );

  if (starredFolders.length === 0 && starredSnippets.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-[60vh] text-text-muted animate-fade-in-up">
        <div className="p-5 bg-bg-card rounded-2xl mb-4 border border-border">
          <StarIcon className="w-12 h-12 text-text-muted/30" />
        </div>
        <h2 className="text-lg font-bold text-text mb-1">No Starred Items</h2>
        <p className="text-sm text-center max-w-sm">
          Star your favorite folders and snippets for quick access.
        </p>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto px-6 py-6 animate-fade-in-up">
      <h2 className="text-xl font-bold text-text mb-6 flex items-center gap-2">
        <StarIcon className="w-5 h-5 text-warning" filled /> Starred Items
      </h2>

      {starredFolders.length > 0 && (
        <div className="mb-8">
          <h3 className="text-sm font-bold text-text-muted mb-3 border-b border-border/50 pb-2">
            Folders
          </h3>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
            {starredFolders.map((folder) => (
              <Folder
                key={folder.id}
                folder={folder}
                onFolderSelect={onFolderSelect}
                onFolderDelete={onFolderDelete}
                onFolderRename={onFolderRename}
                onToggleStar={(id) => onToggleStar("folder", id)}
                disableGlow={true}
              />
            ))}
          </div>
        </div>
      )}

      {starredSnippets.length > 0 && (
        <div>
          <h3 className="text-sm font-bold text-text-muted mb-3 border-b border-border/50 pb-2">
            Snippets
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 pb-16">
            {starredSnippets.map((snippet) => (
              <SnippetCard
                key={snippet.id}
                snippet={snippet}
                onCopy={onSnippetCopy}
                onDelete={() => onSnippetDelete(snippet.id)}
                onExpand={onSnippetExpand}
                onAiChat={onAiChat}
                onToggleStar={(id) => onToggleStar("snippet", id)}
                disableGlow={true}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
