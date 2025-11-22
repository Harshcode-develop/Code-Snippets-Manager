import React, { useState } from 'react';
import { CodeSyntaxHighlighter } from './CodeSyntaxHighlighter';
import { CopyIcon, TrashIcon, SparklesIcon, StarIcon, CheckIcon } from './Icons';

export const SnippetCard = React.memo(({ snippet, onCopy, onDelete, onExpand, onAiChat, onToggleStar }) => {
    const [showCopied, setShowCopied] = useState(false);

    const handleCopy = (e) => {
        e.stopPropagation();
        onCopy(snippet.code);
        setShowCopied(true);
        setTimeout(() => setShowCopied(false), 2000);
    };

    return (
        <div className="group relative flex flex-col bg-bg-lighter/40 border border-primary/10 rounded-xl overflow-hidden hover:border-primary/40 transition-all duration-200 shadow-sm hover:shadow-lg hover:shadow-primary/10 animate-scale-in gpu-accelerated">
            <div className="p-4 flex items-center justify-between border-b border-border/50 bg-bg/30">
                <h3 className="font-bold text-lg text-text truncate pr-4" title={snippet.title}>{snippet.title}</h3>
                <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                    <button 
                        onClick={(e) => { 
                            e.stopPropagation(); 
                            if (onToggleStar) {
                                onToggleStar(snippet.id);
                            }
                        }}
                        className={`p-1.5 rounded-lg transition-colors ${snippet.is_starred ? 'text-warning hover:bg-warning/10' : 'text-text-muted hover:text-warning hover:bg-warning/10'}`}
                        title={snippet.is_starred ? "Unstar" : "Star"}
                    >
                        <StarIcon className="w-4 h-4" filled={snippet.is_starred} />
                    </button>
                    <div className="relative">
                        <button 
                            onClick={handleCopy}
                            className={`p-1.5 rounded-lg transition-colors ${showCopied ? 'text-green-500 bg-green-500/10' : 'text-text-muted hover:text-primary hover:bg-primary/10'}`}
                            title="Copy Code"
                        >
                            {showCopied ? <CheckIcon className="w-4 h-4" /> : <CopyIcon className="w-4 h-4" />}
                        </button>
                        {showCopied && (
                            <div className="absolute top-full mt-2 left-1/2 -translate-x-1/2 bg-bg-darker border border-green-500/30 text-green-500 text-[10px] font-bold px-2 py-1 rounded shadow-lg flex items-center gap-1 whitespace-nowrap z-50 animate-fade-in-up pointer-events-none">
                                <CheckIcon className="w-3 h-3" /> Copied
                            </div>
                        )}
                    </div>
                    <button 
                        onClick={(e) => { e.stopPropagation(); onDelete(); }}
                        className="p-1.5 text-text-muted hover:text-error hover:bg-error/10 rounded-lg transition-colors"
                        title="Delete Snippet"
                    >
                        <TrashIcon className="w-4 h-4" />
                    </button>
                </div>
            </div>
            <div className="h-48 overflow-hidden bg-bg/50 relative cursor-pointer" onClick={() => onExpand(snippet)}>
                 <div className="absolute inset-0 pointer-events-none bg-linear-to-b from-transparent to-bg/10 z-10"></div>
                 <div className="p-2 text-xs opacity-75">
                    <CodeSyntaxHighlighter code={snippet.code} />
                 </div>
            </div>
            
            <button 
                className="absolute bottom-4 right-4 p-3 bg-secondary text-white rounded-full shadow-lg hover:bg-violet-600 transition-transform hover:scale-110 z-10" 
                onClick={(e) => { e.stopPropagation(); onAiChat(snippet); }}
                title="Ask AI about this snippet"
            >
                <SparklesIcon className="w-5 h-5" />
            </button>
        </div>
    );
});
