import React from "react";
import { CloseIcon } from "./Icons";

interface Props {
  isOpen: boolean;
  onClose: () => void;
  children: React.ReactNode;
}

export const Modal: React.FC<Props> = ({ isOpen, onClose, children }) => {
  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-bg-overlay animate-fade-in"
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-lg glass-strong rounded-2xl shadow-2xl overflow-hidden animate-scale-in"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          onClick={onClose}
          className="absolute top-2.5 right-2.5 p-1.5 text-text-muted hover:text-text rounded-lg hover:bg-bg-elevated/50 transition-colors z-10"
        >
          <CloseIcon className="w-4 h-4" />
        </button>
        <div className="p-4 md:p-5 max-h-[85vh] overflow-y-auto no-scrollbar">
          {children}
        </div>
      </div>
    </div>
  );
};
