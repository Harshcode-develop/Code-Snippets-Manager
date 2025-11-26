import React from 'react';

export const Notification = ({ message, type }) => {
    if (!message) {
        return null;
    }

    const bgColor = type === 'error' ? 'bg-error' : 'bg-success';

    return (
        <div className={`fixed bottom-6 right-6 px-6 py-3 rounded-lg shadow-lg text-white font-medium animate-fade-in-up z-50 ${bgColor}`}>
            {message}
        </div>
    );
};
