import React from "react";

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (() => void) | null;
  message: string;
}

export const ConfirmModal: React.FC<Props> = ({
  isOpen,
  onClose,
  onConfirm,
  message,
}) => {
  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-bg-overlay animate-fade-in"
      onClick={onClose}
    >
      <div
        className="glass-strong rounded-2xl p-6 w-full max-w-sm shadow-2xl animate-scale-in"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="w-12 h-12 rounded-full bg-error/10 flex items-center justify-center mx-auto mb-4">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 24 24"
            fill="currentColor"
            className="w-6 h-6 text-error"
          >
            <path
              fillRule="evenodd"
              d="M9.401 3.003c1.155-2 4.043-2 5.197 0l7.355 12.748c1.154 2-.29 4.5-2.599 4.5H4.645c-2.309 0-3.752-2.5-2.598-4.5L9.4 3.003zM12 8.25a.75.75 0 01.75.75v3.75a.75.75 0 01-1.5 0V9a.75.75 0 01.75-.75zm0 8.25a.75.75 0 100-1.5.75.75 0 000 1.5z"
              clipRule="evenodd"
            />
          </svg>
        </div>
        <h3 className="text-lg font-bold text-text mb-2 text-center">
          Confirm Action
        </h3>
        <p className="text-text-muted text-sm mb-6 text-center leading-relaxed">
          {message}
        </p>
        <div className="flex gap-3 justify-center">
          <button
            onClick={onClose}
            className="px-5 py-2 rounded-xl text-sm font-medium text-text-muted hover:text-text hover:bg-bg-elevated transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={() => onConfirm?.()}
            className="px-5 py-2 bg-error text-white text-sm font-bold rounded-xl hover:bg-red-600 transition-all hover:shadow-lg hover:shadow-error/20 active:scale-95"
          >
            Delete
          </button>
        </div>
      </div>
    </div>
  );
};
