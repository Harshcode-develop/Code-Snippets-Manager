import React, { useState, useRef, useEffect, useCallback, memo } from "react";
import {
  SparklesIcon,
  TrashIcon,
  CheckIcon,
  SpeakerWaveIcon,
  SpeakerXMarkIcon,
  CloseIcon,
  SendIcon,
  MicIcon,
} from "./Icons";
import { CodeSyntaxHighlighter } from "./CodeSyntaxHighlighter";
import type { Snippet, ChatMessage } from "../types";

interface Props {
  snippet: Snippet | null;
  isOpen: boolean;
  onClose: () => void;
  onSendQuery: (
    prompt: string,
    code: string,
    history: ChatMessage[],
  ) => Promise<string | null>;
  isAiLoading: boolean;
  onUpdate: (snippetId: string, title: string, code: string) => void;
}

export const AiChatModal: React.FC<Props> = memo(
  ({ snippet, isOpen, onClose, onSendQuery, isAiLoading, onUpdate }) => {
    const [prompt, setPrompt] = useState("");
    const [chatHistory, setChatHistory] = useState<ChatMessage[]>([]);
    const chatEndRef = useRef<HTMLDivElement>(null);
    const [isListening, setIsListening] = useState(false);
    const [isSpeechEnabled, setIsSpeechEnabled] = useState(true);
    const [isFocused, setIsFocused] = useState(false);

    useEffect(() => {
      if (isOpen && snippet) {
        const defaultMsg = `Hi! I'm Sonic. How can I help with "${snippet.title}" today? I can analyze, fix bugs, optimize, add comments, or explain your code.`;
        setChatHistory([{ sender: "ai", text: defaultMsg }]);
        // Delay speaking slightly so the modal finishes opening and interaction registers
        setTimeout(() => speak(defaultMsg), 250);
        document.body.style.overflow = "hidden";
      } else {
        setChatHistory([]);
        setPrompt("");
        window.speechSynthesis?.cancel();
        document.body.style.overflow = "unset";
      }
      return () => {
        document.body.style.overflow = "unset";
      };
    }, [isOpen, snippet]);

    useEffect(() => {
      chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }, [chatHistory]);

    const speak = useCallback(
      (text: string) => {
        if (!window.speechSynthesis || !isSpeechEnabled) return;
        window.speechSynthesis.cancel();
        const cleanText = text
          .replace(/[*`()\[\]#]/g, "")
          .replace(/https?:\/\/\S+/g, "link")
          .replace(/\n/g, ". ")
          .trim();
        const utterance = new SpeechSynthesisUtterance(cleanText);
        utterance.pitch = 1.0;
        utterance.rate = 1.0;
        window.speechSynthesis.speak(utterance);
      },
      [isSpeechEnabled],
    );

    const handleListen = useCallback(() => {
      if (!("webkitSpeechRecognition" in window)) return;
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const SpeechRecognitionClass =
        (window as any).webkitSpeechRecognition ||
        (window as any).SpeechRecognition;
      if (!SpeechRecognitionClass) return;
      const recognition = new SpeechRecognitionClass();
      recognition.continuous = false;
      recognition.interimResults = false;
      recognition.lang = "en-US";
      recognition.onstart = () => setIsListening(true);
      recognition.onend = () => setIsListening(false);
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      recognition.onresult = (event: any) => {
        setPrompt(event.results[0][0].transcript);
      };
      recognition.start();
    }, []);

    const handleSend = useCallback(
      async (directPrompt?: string) => {
        const textToSend = directPrompt || prompt;
        if (!textToSend.trim() || isAiLoading || !snippet) return;

        const newHistory: ChatMessage[] = [
          ...chatHistory,
          { sender: "user", text: textToSend },
        ];
        setChatHistory(newHistory);
        setPrompt("");
        window.speechSynthesis?.cancel();

        const aiResponse = await onSendQuery(
          textToSend,
          snippet.code,
          newHistory,
        );
        if (aiResponse) {
          setChatHistory((prev) => [
            ...prev,
            { sender: "ai", text: aiResponse },
          ]);
          speak(aiResponse);
        } else {
          const errorMsg =
            "Sorry, I couldn't get a response. Please try again.";
          setChatHistory((prev) => [...prev, { sender: "ai", text: errorMsg }]);
        }
      },
      [prompt, isAiLoading, snippet, chatHistory, onSendQuery, speak],
    );

    const handleApplyCode = useCallback(
      (codeToApply: string) => {
        if (onUpdate && snippet) {
          onUpdate(snippet.id, snippet.title, codeToApply);
          setChatHistory((prev) => [
            ...prev,
            { sender: "system", text: "Code applied successfully ✓" },
          ]);
        }
      },
      [onUpdate, snippet],
    );

    const handleClearChat = useCallback(() => {
      setChatHistory([]);
      window.speechSynthesis?.cancel();
    }, []);

    if (!isOpen || !snippet) return null;

    return (
      <div
        className="fixed inset-0 z-50 flex items-center justify-center bg-bg-overlay animate-fade-in"
        onClick={onClose}
      >
        <div
          className="glass-strong rounded-2xl w-full max-w-5xl h-[85vh] flex flex-col shadow-2xl animate-scale-in overflow-hidden relative"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="flex items-center justify-between px-5 py-3 border-b border-white/10 bg-bg-elevated/30">
            <div className="flex items-center gap-2.5">
              <div className="p-1.5 bg-linear-to-br from-primary to-secondary rounded-lg shadow-md">
                <SparklesIcon className="w-4 h-4 text-white" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-text">Sonic AI</h3>
                <p className="text-[10px] text-text-muted">
                  Powered by Google AI
                </p>
              </div>
            </div>
            <div className="flex items-center gap-1">
              <button
                onClick={() => setIsSpeechEnabled(!isSpeechEnabled)}
                className={`p-1.5 rounded-lg transition-colors ${isSpeechEnabled ? "text-accent" : "text-text-muted hover:text-text"}`}
                title={isSpeechEnabled ? "Mute" : "Enable voice"}
              >
                {isSpeechEnabled ? (
                  <SpeakerWaveIcon className="w-4 h-4" />
                ) : (
                  <SpeakerXMarkIcon className="w-4 h-4" />
                )}
              </button>
              <button
                onClick={handleClearChat}
                className="p-1.5 text-text-muted hover:text-error rounded-lg transition-colors"
                title="Clear"
              >
                <TrashIcon className="w-4 h-4" />
              </button>
              <button
                onClick={onClose}
                className="p-1.5 text-text-muted hover:text-text rounded-lg transition-colors"
              >
                <CloseIcon className="w-4 h-4" />
              </button>
            </div>
          </div>

          <div className="flex-1 overflow-hidden flex flex-col md:flex-row">
            {/* Code View - optimized for large snippets */}
            <div
              className="w-full md:w-1/2 h-1/3 md:h-full border-b md:border-b-0 md:border-r border-white/10 overflow-auto bg-transparent"
              style={{ overscrollBehavior: "contain", contain: "layout style" }}
            >
              <div className="p-3">
                <div className="text-[10px] font-bold text-text-muted mb-2 uppercase tracking-wider">
                  Context: {snippet.title}
                </div>
                <CodeSyntaxHighlighter
                  code={snippet.code}
                  language={snippet.language}
                />
              </div>
            </div>

            {/* Chat Area */}
            <div className="w-full md:w-1/2 h-2/3 md:h-full flex flex-col relative">
              <div
                className="flex-1 overflow-y-auto p-4 space-y-4 pb-20"
                style={{ overscrollBehavior: "contain" }}
              >
                {chatHistory.map((msg, index) => (
                  <div
                    key={index}
                    className={`flex gap-3 ${msg.sender === "user" ? "flex-row-reverse" : ""} animate-fade-in-up`}
                  >
                    {msg.sender === "ai" && (
                      <div className="w-7 h-7 rounded-lg bg-linear-to-br from-primary to-secondary flex items-center justify-center shadow-md shrink-0 mt-0.5">
                        <SparklesIcon className="w-3.5 h-3.5 text-white" />
                      </div>
                    )}
                    {msg.sender === "system" ? (
                      <div className="w-full flex justify-center my-1">
                        <div className="bg-success/10 text-success border border-success/20 px-3 py-1 rounded-full text-[10px] font-bold flex items-center gap-1">
                          <CheckIcon className="w-2.5 h-2.5" /> {msg.text}
                        </div>
                      </div>
                    ) : (
                      <div
                        className={`p-3 max-w-[85%] text-xs leading-relaxed ${
                          msg.sender === "user"
                            ? "bg-linear-to-br from-primary to-secondary text-white rounded-2xl rounded-tr-sm shadow-md"
                            : "bg-bg-card/30 border border-white/10 backdrop-blur-sm text-text font-medium rounded-2xl rounded-tl-sm shadow-sm"
                        }`}
                      >
                        {msg.sender === "user" ? (
                          <p className="whitespace-pre-wrap">{msg.text}</p>
                        ) : (
                          <div className="flex flex-col gap-2">
                            {msg.text
                              .split(/(```[\w-]*\n[\s\S]*?```)/g)
                              .map((part, i) => {
                                if (part.startsWith("```")) {
                                  const match = part.match(
                                    /```([\w-]*)\n([\s\S]*?)```/,
                                  );
                                  const language = match
                                    ? match[1]
                                    : "javascript";
                                  const code = match
                                    ? match[2]
                                    : part.slice(3, -3);
                                  return (
                                    <div
                                      key={i}
                                      className="rounded-lg overflow-hidden my-1 border border-border shadow-md relative group/code"
                                    >
                                      <CodeSyntaxHighlighter
                                        code={code.trim()}
                                        language={language || "javascript"}
                                      />
                                      <button
                                        onClick={() =>
                                          handleApplyCode(code.trim())
                                        }
                                        className="absolute top-1.5 right-1.5 p-1.5 bg-primary/80 hover:bg-primary text-white rounded-md opacity-0 group-hover/code:opacity-100 transition-opacity text-[10px] font-bold shadow-md flex items-center gap-1"
                                        title="Apply to Snippet"
                                      >
                                        <CheckIcon className="w-2.5 h-2.5" />{" "}
                                        Apply
                                      </button>
                                    </div>
                                  );
                                }
                                return part.trim() ? (
                                  <p key={i} className="whitespace-pre-wrap">
                                    {part}
                                  </p>
                                ) : null;
                              })}
                            {/* Yes/No buttons */}
                            {index === chatHistory.length - 1 &&
                              msg.text.includes(
                                "Would you like me to apply",
                              ) && (
                                <div className="flex gap-2 mt-1">
                                  <button
                                    onClick={() =>
                                      handleSend(
                                        "Yes, please apply the optimizations.",
                                      )
                                    }
                                    className="px-3 py-1 bg-success/10 text-success border border-success/20 rounded-lg text-[10px] font-bold transition-colors hover:bg-success/20"
                                  >
                                    Yes
                                  </button>
                                  <button
                                    onClick={() => handleSend("No, thanks.")}
                                    className="px-3 py-1 bg-bg-input text-text-muted border border-border rounded-lg text-[10px] font-bold transition-colors hover:bg-bg-elevated"
                                  >
                                    No
                                  </button>
                                </div>
                              )}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                ))}
                {isAiLoading && (
                  <div className="flex gap-3 animate-pulse">
                    <div className="w-7 h-7 rounded-lg bg-linear-to-br from-primary to-secondary flex items-center justify-center opacity-50 shrink-0">
                      <SparklesIcon className="w-3.5 h-3.5 text-white" />
                    </div>
                    <div className="bg-bg-card/30 border border-white/10 backdrop-blur-sm p-3 rounded-2xl rounded-tl-sm shadow-sm">
                      <div className="flex gap-1">
                        <span
                          className="w-1.5 h-1.5 bg-text-muted rounded-full animate-bounce"
                          style={{ animationDelay: "0ms" }}
                        />
                        <span
                          className="w-1.5 h-1.5 bg-text-muted rounded-full animate-bounce"
                          style={{ animationDelay: "150ms" }}
                        />
                        <span
                          className="w-1.5 h-1.5 bg-text-muted rounded-full animate-bounce"
                          style={{ animationDelay: "300ms" }}
                        />
                      </div>
                    </div>
                  </div>
                )}
                <div ref={chatEndRef} />
              </div>

              {/* Input */}
              <div className="absolute bottom-4 left-4 right-4">
                <div
                  className={`transition-all duration-300 border rounded-full p-1.5 flex items-center gap-1.5 backdrop-blur-md ${
                    isFocused || prompt.trim()
                      ? "bg-bg-card/50 border-white/20 shadow-xl"
                      : "bg-bg-card/30 border-white/10"
                  }`}
                >
                  <button
                    onClick={handleListen}
                    className={`p-2 rounded-full transition-all ${isListening ? "bg-error text-white animate-pulse" : "text-text-muted hover:text-text hover:bg-bg-elevated/50"}`}
                    title="Speak"
                  >
                    <MicIcon className="w-4 h-4" />
                  </button>
                  <input
                    type="text"
                    value={prompt}
                    onChange={(e) => setPrompt(e.target.value)}
                    onFocus={() => setIsFocused(true)}
                    onBlur={() => setIsFocused(false)}
                    onKeyDown={(e) => e.key === "Enter" && handleSend()}
                    placeholder="Ask Sonic anything..."
                    disabled={isAiLoading}
                    className="flex-1 bg-transparent border-none text-text text-sm placeholder-text-muted/50 outline-none! px-1"
                  />
                  <button
                    onClick={() => handleSend()}
                    disabled={isAiLoading || !prompt.trim()}
                    className={`p-2 bg-linear-to-r from-primary to-secondary text-white rounded-full hover:shadow-lg transition-all disabled:opacity-30 disabled:cursor-not-allowed ${
                      prompt.trim()
                        ? "opacity-100"
                        : "opacity-0 pointer-events-none"
                    }`}
                  >
                    <SendIcon className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  },
);
