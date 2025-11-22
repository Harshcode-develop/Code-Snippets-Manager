import React from 'react';

export const ConfirmModal = ({ isOpen, onClose, onConfirm, message }) => {
    if (!isOpen) {
        return null;
    }

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm animate-fade-in">
            <div className="bg-bg-lighter border border-border rounded-xl p-6 w-full max-w-md shadow-2xl animate-scale-in">
                <h3 className="text-xl font-bold text-text mb-4">Confirm Action</h3>
                <p className="text-text-muted mb-8">{message}</p>
                <div className="flex justify-end gap-4">
                    <button onClick={onClose} className="px-4 py-2 rounded-lg text-text-muted hover:text-text hover:bg-bg transition-colors">
                        Cancel
                    </button>
                    <button onClick={onConfirm} className="px-4 py-2 bg-error text-white font-bold rounded-lg hover:bg-red-600 transition-colors shadow-lg hover:shadow-error/20">
                        Delete
                    </button>
                </div>
            </div>
        </div>
    );
};
