import React, { useState, useCallback, memo } from "react";
import { CodeSyntaxHighlighter } from "./CodeSyntaxHighlighter";
import {
  CopyIcon,
  TrashIcon,
  SparklesIcon,
  StarIcon,
  CheckIcon,
} from "./Icons";
import type { Snippet } from "../types";

interface Props {
  snippet: Snippet;
  onCopy: (code: string) => void;
  onDelete: () => void;
  onExpand: (snippet: Snippet) => void;
  onAiChat: (snippet: Snippet) => void;
  onToggleStar: (id: string) => void;
  disableGlow?: boolean;
}

export const SnippetCard: React.FC<Props> = memo(
  ({
    snippet,
    onCopy,
    onDelete,
    onExpand,
    onAiChat,
    onToggleStar,
    disableGlow,
  }) => {
    const [showCopied, setShowCopied] = useState(false);

    const handleCopy = useCallback(
      (e: React.MouseEvent) => {
        e.stopPropagation();
        onCopy(snippet.code);
        setShowCopied(true);
        setTimeout(() => setShowCopied(false), 2000);
      },
      [onCopy, snippet.code],
    );

    return (
      <div
        className={`group card card-contain relative flex flex-col overflow-hidden animate-scale-in gpu-accelerated hover-lift ${
          snippet.is_starred && !disableGlow
            ? "animate-star-glow shadow-warning/20 border-warning/50"
            : ""
        }`}
      >
        {/* Header */}
        <div className="p-3 flex items-center justify-between border-b border-border/50 bg-bg-elevated/30">
          <h3
            className="font-semibold text-sm text-text truncate pr-3"
            title={snippet.title}
          >
            {snippet.title}
          </h3>
          <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity duration-200 shrink-0">
            <button
              onClick={(e) => {
                e.stopPropagation();
                onToggleStar(snippet.id);
              }}
              className={`p-1 rounded-md transition-colors ${
                snippet.is_starred
                  ? "text-warning"
                  : "text-text-muted hover:text-warning"
              }`}
              title={snippet.is_starred ? "Unstar" : "Star"}
            >
              <StarIcon className="w-3.5 h-3.5" filled={snippet.is_starred} />
            </button>
            <button
              onClick={handleCopy}
              className={`p-1 rounded-md transition-colors ${
                showCopied
                  ? "text-success"
                  : "text-text-muted hover:text-primary"
              }`}
              title="Copy"
            >
              {showCopied ? (
                <CheckIcon className="w-3.5 h-3.5" />
              ) : (
                <CopyIcon className="w-3.5 h-3.5" />
              )}
            </button>
            <button
              onClick={(e) => {
                e.stopPropagation();
                onDelete();
              }}
              className="p-1 text-text-muted hover:text-error rounded-md transition-colors"
              title="Delete"
            >
              <TrashIcon className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* Code Preview */}
        <div
          className="h-40 overflow-hidden bg-bg/50 relative cursor-pointer"
          onClick={() => onExpand(snippet)}
        >
          <div className="absolute inset-0 pointer-events-none bg-gradient-to-b from-transparent via-transparent to-bg-card z-10" />
          <div className="p-1.5 text-xs opacity-80">
            <CodeSyntaxHighlighter
              code={snippet.code}
              language={snippet.language}
            />
          </div>
        </div>

        {/* Star indicator removed in favor of glow effect */}

        {/* AI Chat Button */}
        <button
          className="absolute bottom-3 right-3 p-2 bg-gradient-to-r from-primary to-secondary text-white rounded-xl shadow-lg hover:shadow-primary/30 transition-all hover:scale-110 active:scale-95 z-10 opacity-0 group-hover:opacity-100"
          onClick={(e) => {
            e.stopPropagation();
            onAiChat(snippet);
          }}
          title="Ask AI about this snippet"
        >
          <SparklesIcon className="w-4 h-4" />
        </button>

        {/* Copy tooltip */}
        {showCopied && (
          <div className="absolute top-12 right-2.5 z-50 bg-success text-white text-[10px] font-bold px-2 py-1 rounded-lg shadow-lg animate-fade-in-up pointer-events-none flex items-center gap-1">
            <CheckIcon className="w-2.5 h-2.5" /> Copied
          </div>
        )}
      </div>
    );
  },
);
