import React, { useState, useCallback, memo } from "react";
import { FolderIcon, TrashIcon, PencilIcon, StarIcon } from "./Icons";
import type { Folder as FolderType } from "../types";

interface Props {
  folder: FolderType;
  onFolderSelect: (folder: FolderType) => void;
  onFolderDelete?: (id: string) => void;
  onFolderRename?: (id: string, newName: string) => void;
  onToggleStar?: (id: string) => void;
  disableGlow?: boolean;
}

export const Folder: React.FC<Props> = memo(
  ({
    folder,
    onFolderSelect,
    onFolderDelete,
    onFolderRename,
    onToggleStar,
    disableGlow,
  }) => {
    const [isRenaming, setIsRenaming] = useState(false);
    const [newName, setNewName] = useState(folder.name);

    const handleRenameStart = useCallback((e: React.MouseEvent) => {
      e.stopPropagation();
      setIsRenaming(true);
    }, []);

    const handleKeyDown = useCallback(
      (e: React.KeyboardEvent) => {
        if (e.key === "Enter") {
          e.stopPropagation();
          onFolderRename?.(folder.id, newName);
          setIsRenaming(false);
        } else if (e.key === "Escape") {
          e.stopPropagation();
          setNewName(folder.name);
          setIsRenaming(false);
        }
      },
      [folder.id, folder.name, newName, onFolderRename],
    );

    const snippetCount = folder.snippets?.length || 0;
    const subfolderCount = folder.subfolders?.length || 0;

    return (
      <div
        className={`group card card-contain relative p-5 cursor-pointer hover-lift animate-scale-in flex flex-col items-center justify-center gap-3 gpu-accelerated ${
          folder.is_starred && !disableGlow
            ? "animate-star-glow shadow-warning/20 border-warning/50"
            : ""
        }`}
        onClick={() => !isRenaming && onFolderSelect(folder)}
      >
        {/* Action buttons */}
        <div className="absolute top-2.5 right-2.5 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
          <button
            onClick={(e) => {
              e.stopPropagation();
              onToggleStar?.(folder.id);
            }}
            className={`p-1 rounded-lg transition-colors ${
              folder.is_starred
                ? "text-warning"
                : "text-text-muted hover:text-warning"
            }`}
            title={folder.is_starred ? "Unstar" : "Star"}
          >
            <StarIcon className="w-3.5 h-3.5" filled={folder.is_starred} />
          </button>
          {!isRenaming && onFolderRename && (
            <button
              onClick={handleRenameStart}
              className="p-1 text-text-muted hover:text-accent rounded-lg transition-colors"
              title="Rename"
            >
              <PencilIcon className="w-3.5 h-3.5" />
            </button>
          )}
          {onFolderDelete && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                onFolderDelete(folder.id);
              }}
              className="p-1 text-text-muted hover:text-error rounded-lg transition-colors"
              title="Delete"
            >
              <TrashIcon className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        {/* Star indicator removed in favor of glow effect */}

        {/* Folder content */}
        <div className="flex flex-col items-center gap-2 w-full overflow-hidden">
          <div className="p-3 rounded-xl bg-warning/10 text-warning">
            <FolderIcon className="w-8 h-8" />
          </div>
          {isRenaming ? (
            <input
              type="text"
              className="bg-bg-input border border-primary rounded-lg px-2 py-1 text-xs text-text focus:outline-none w-full text-center"
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              onClick={(e) => e.stopPropagation()}
              onKeyDown={handleKeyDown}
              autoFocus
              onBlur={() => {
                setIsRenaming(false);
                setNewName(folder.name);
              }}
            />
          ) : (
            <h2 className="text-sm font-semibold text-text truncate w-full text-center">
              {folder.name}
            </h2>
          )}
          <p className="text-[10px] text-text-muted">
            {subfolderCount > 0 &&
              `${subfolderCount} folder${subfolderCount > 1 ? "s" : ""}`}
            {subfolderCount > 0 && snippetCount > 0 && " · "}
            {snippetCount > 0 &&
              `${snippetCount} snippet${snippetCount > 1 ? "s" : ""}`}
            {subfolderCount === 0 && snippetCount === 0 && "Empty"}
          </p>
        </div>
      </div>
    );
  },
);
