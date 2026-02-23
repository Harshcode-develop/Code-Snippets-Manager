import React from "react";
import { SnippetCard } from "../components/SnippetCard";
import { PlusIcon, CodeIcon } from "../components/Icons";
import type { Snippet } from "../types";

interface Props {
  snippets: Snippet[];
  onCopy: (code: string) => void;
  onDelete: (id: string) => void;
  onExpand: (snippet: Snippet) => void;
  onAiChat: (snippet: Snippet) => void;
  onAddSnippet: () => void;
  onToggleStar: (id: string) => void;
}

export const SnippetsPage: React.FC<Props> = ({
  snippets,
  onCopy,
  onDelete,
  onExpand,
  onAiChat,
  onAddSnippet,
  onToggleStar,
}) => {
  return (
    <div className="max-w-6xl mx-auto px-6 py-6 animate-fade-in-up">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-2">
          <CodeIcon className="w-5 h-5 text-text-muted" />
          <h2 className="text-[18px] font-bold text-text-muted">
            Standalone Snippets
          </h2>
        </div>
        <button
          onClick={onAddSnippet}
          className="flex items-center gap-1.5 px-4 py-2 bg-linear-to-r from-accent to-primary text-white text-xs font-bold rounded-lg shadow-md shadow-accent/20 hover:shadow-accent/40 transition-all hover:-translate-y-0.5 hover:opacity-90 active:scale-95"
        >
          <PlusIcon className="w-3.5 h-3.5" /> New Snippet
        </button>
      </div>

      {snippets.length === 0 ? (
        <div className="flex flex-col items-center justify-center h-[60vh] text-center text-text-muted">
          <p className="text-lg font-bold">No standalone snippets yet.</p>
          <p className="text-sm mt-1">Create one to get started!</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 pb-16">
          {snippets.map((snippet) => (
            <SnippetCard
              key={snippet.id}
              snippet={snippet}
              onCopy={onCopy}
              onDelete={() => onDelete(snippet.id)}
              onExpand={onExpand}
              onAiChat={onAiChat}
              onToggleStar={onToggleStar}
            />
          ))}
        </div>
      )}
    </div>
  );
};
