import React, { useState, useEffect, useCallback, useRef } from "react";
import { SparklesIcon, CopyIcon, CheckIcon, CloseIcon } from "./Icons";
import { CodeSyntaxHighlighter } from "./CodeSyntaxHighlighter";
import type { Snippet } from "../types";

interface Props {
  snippet: Snippet | null;
  isOpen: boolean;
  onClose: () => void;
  onCopy: (code: string) => void;
  onUpdate: (snippetId: string, title: string, code: string) => void;
  onAiAction: (action: string, code: string) => Promise<string | null>;
  isAiLoading: boolean;
}

export const SnippetViewModal: React.FC<Props> = ({
  snippet,
  isOpen,
  onClose,
  onCopy,
  onUpdate,
  onAiAction,
  isAiLoading,
}) => {
  const [currentCode, setCurrentCode] = useState("");
  const [currentTitle, setCurrentTitle] = useState("");
  const [aiAnalysis, setAiAnalysis] = useState("");
  const [isEditing, setIsEditing] = useState(false);
  const [showCopied, setShowCopied] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (snippet) {
      setCurrentCode(snippet.code);
      setCurrentTitle(snippet.title);
      setAiAnalysis("");
      setIsEditing(false);
    }
  }, [snippet]);

  const handleAiAction = useCallback(
    async (action: string) => {
      setAiAnalysis("");
      const result = await onAiAction(action, currentCode);
      if (result) {
        if (action === "check" || action === "explain") {
          setAiAnalysis(result);
        } else {
          setCurrentCode(result);
        }
      }
    },
    [currentCode, onAiAction],
  );

  const handleCopy = useCallback(() => {
    onCopy(currentCode);
    setShowCopied(true);
    setTimeout(() => setShowCopied(false), 2000);
  }, [currentCode, onCopy]);

  const handleSave = useCallback(() => {
    if (snippet) {
      onUpdate(snippet.id, currentTitle, currentCode);
      onClose();
    }
  }, [snippet, currentTitle, currentCode, onUpdate, onClose]);

  // Tab key support for code editing
  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
      if (e.key === "Tab") {
        e.preventDefault();
        const target = e.currentTarget;
        const start = target.selectionStart;
        const end = target.selectionEnd;
        const newCode =
          currentCode.substring(0, start) + "  " + currentCode.substring(end);
        setCurrentCode(newCode);
        // Set cursor position after the inserted spaces
        requestAnimationFrame(() => {
          target.selectionStart = target.selectionEnd = start + 2;
        });
      }
    },
    [currentCode],
  );

  if (!isOpen || !snippet) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-bg-overlay animate-fade-in"
      onClick={onClose}
    >
      <div
        className="w-full max-w-5xl h-[85vh] flex flex-col glass-strong rounded-2xl shadow-2xl overflow-hidden animate-scale-in"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-3 border-b border-white/10 bg-bg-elevated/30">
          <input
            type="text"
            value={currentTitle}
            onChange={(e) => setCurrentTitle(e.target.value)}
            className="bg-transparent text-base font-bold text-text focus:outline-none w-full mr-4"
          />
          <button
            onClick={onClose}
            className="p-1 text-text-muted hover:text-text transition-colors"
          >
            <CloseIcon className="w-5 h-5" />
          </button>
        </div>

        {/* Code Area - optimized for thousands of lines */}
        <div
          className="flex-1 overflow-hidden relative flex flex-col min-h-0"
          onClick={() => setIsEditing(true)}
        >
          {isEditing ? (
            <textarea
              ref={textareaRef}
              value={currentCode}
              onChange={(e) => setCurrentCode(e.target.value)}
              onKeyDown={handleKeyDown}
              spellCheck="false"
              autoFocus
              className="w-full h-full p-4 bg-transparent font-mono text-sm text-text resize-none focus:outline-none overflow-auto"
              style={{
                fontFamily: "var(--font-mono)",
                tabSize: 2,
                overscrollBehavior: "contain",
                whiteSpace: "pre",
                wordWrap: "normal",
                overflowWrap: "normal",
              }}
            />
          ) : (
            <div
              className="w-full h-full overflow-auto bg-transparent p-4"
              style={{
                overscrollBehavior: "contain",
                contain: "layout style",
              }}
            >
              <CodeSyntaxHighlighter
                code={currentCode}
                language={snippet.language}
              />
            </div>
          )}
        </div>

        {/* AI Analysis */}
        {aiAnalysis && (
          <div className="px-5 py-3 bg-bg-elevated/30 border-t border-white/10 max-h-36 overflow-y-auto no-scrollbar backdrop-blur-md">
            <h4 className="text-xs font-bold text-secondary mb-1.5">
              AI Analysis
            </h4>
            <p className="text-xs text-text-secondary whitespace-pre-wrap leading-relaxed">
              {aiAnalysis}
            </p>
          </div>
        )}

        {/* Actions */}
        <div className="px-5 py-3 border-t border-white/10 bg-bg-elevated/30 flex flex-wrap gap-2 justify-between items-center backdrop-blur-md">
          <div className="flex flex-wrap gap-1.5">
            {[
              { action: "check", label: "Check", color: "secondary" },
              { action: "correct", label: "Fix", color: "primary" },
              { action: "add_comments", label: "Comments", color: "accent" },
              { action: "explain", label: "Explain", color: "warning" },
            ].map(({ action, label, color }) => (
              <button
                key={action}
                onClick={() => handleAiAction(action)}
                disabled={isAiLoading}
                className={`flex items-center px-2.5 py-1.5 text-xs font-medium text-text bg-${color}/10 hover:bg-${color}/20 border border-${color}/30 rounded-md transition-colors disabled:opacity-50`}
              >
                <SparklesIcon className="w-3 h-3 mr-1" />
                {isAiLoading ? "..." : label}
              </button>
            ))}
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={handleCopy}
              className={`flex items-center px-3 py-1.5 text-xs font-medium border rounded-md transition-colors ${
                showCopied
                  ? "text-success border-success/30 bg-success/10"
                  : "text-text-muted hover:text-text bg-bg-input/50 backdrop-blur-sm border-white/10"
              }`}
            >
              {showCopied ? (
                <CheckIcon className="w-3 h-3 mr-1" />
              ) : (
                <CopyIcon className="w-3 h-3 mr-1" />
              )}
              {showCopied ? "Copied" : "Copy"}
            </button>
            <button
              onClick={handleSave}
              className="px-5 py-2 text-xs font-bold text-white bg-linear-to-r from-success to-emerald-500 rounded-md transition-all shadow-lg hover:shadow-success/25 active:scale-95"
            >
              Save
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
