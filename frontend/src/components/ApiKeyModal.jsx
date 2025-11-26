import React, { useState, useEffect } from "react";
import { KeyIcon, TrashIcon } from "./Icons";

export const ApiKeyModal = ({
  isOpen,
  onClose,
  onSave,
  onDelete,
  savedKey,
}) => {
  const [apiKey, setApiKey] = useState("");

  useEffect(() => {
    if (isOpen) {
      setApiKey(savedKey || "");
    }
  }, [isOpen, savedKey]);

  const handleSave = () => {
    if (apiKey.trim()) {
      onSave(apiKey.trim());
      onClose();
    }
  };

  const handleDelete = () => {
    onDelete();
    setApiKey("");
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/20 backdrop-blur-sm animate-fade-in"
      onClick={onClose}
    >
      <div
        className="bg-bg-lighter/30 backdrop-blur-2xl border border-white/10 rounded-xl w-full max-w-md p-6 shadow-2xl animate-scale-in"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center gap-3 mb-6">
          <KeyIcon className="w-6 h-6 text-warning" />
          <h3 className="text-xl font-bold text-text">Gemini API Key</h3>
        </div>

        <p className="text-text-muted text-sm mb-4">
          Your API key is stored locally in your browser. It is never sent to
          our servers.
        </p>

        <input
          type="password"
          value={apiKey}
          onChange={(e) => setApiKey(e.target.value)}
          placeholder="Enter your Gemini API Key"
          className="w-full p-3 bg-bg border border-border rounded-lg mb-4 text-white focus:outline-none focus:ring-2 focus:ring-warning transition-all"
        />

        <div className="flex gap-3 justify-end">
          {savedKey && (
            <button
              onClick={handleDelete}
              className="px-4 py-2 text-red-400 hover:text-red-300 hover:bg-red-400/10 rounded-lg transition-colors flex items-center gap-2"
            >
              <TrashIcon className="w-4 h-4" /> Delete
            </button>
          )}
          <button
            onClick={onClose}
            className="px-4 py-2 text-text-muted hover:text-text transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            className="px-6 py-2 bg-warning text-black font-bold rounded-lg hover:bg-yellow-400 transition-colors shadow-lg hover:shadow-warning/20"
          >
            Save Key
          </button>
        </div>
      </div>
    </div>
  );
};
