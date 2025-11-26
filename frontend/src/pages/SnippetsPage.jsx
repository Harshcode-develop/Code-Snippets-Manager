import React from 'react';
import { SnippetCard } from '../components/SnippetCard';
import { PlusIcon } from '../components/Icons';

export const SnippetsPage = ({ snippets, onCopy, onDelete, onExpand, onAiChat, onAddSnippet, onToggleStar }) => {
    return (
        <div className="max-w-7xl mx-auto px-4 py-8 animate-fade-in-up h-[calc(100vh-80px)] overflow-y-auto no-scrollbar">
            <div className="flex items-center justify-between mb-8">
                <h2 className="text-3xl font-bold text-white">Standalone Snippets</h2>
                <button 
                    onClick={onAddSnippet}
                    className="px-4 py-2 bg-accent text-white font-bold rounded-lg shadow-lg hover:bg-cyan-600 transition-transform hover:scale-105 active:scale-95 flex items-center gap-2"
                >
                    <PlusIcon className="w-5 h-5" /> New Snippet
                </button>
            </div>

            {snippets.length === 0 ? (
                <div className="text-center py-20 text-text-muted">
                    <p className="text-xl">No standalone snippets yet.</p>
                    <p className="text-sm mt-2">Create one to get started!</p>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 pb-20">
                    {snippets.map(snippet => (
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
