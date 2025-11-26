import React, { useState, useEffect } from 'react';
import { SparklesIcon, CopyIcon, PencilIcon, CheckIcon } from './Icons';
import { CodeSyntaxHighlighter } from './CodeSyntaxHighlighter';

export const SnippetViewModal = ({ snippet, isOpen, onClose, onCopy, onUpdate, onAiAction, isAiLoading }) => { 
    const [currentCode, setCurrentCode] = useState(''); 
    const [currentTitle, setCurrentTitle] = useState(''); 
    const [aiAnalysis, setAiAnalysis] = useState(''); 
    const [isEditing, setIsEditing] = useState(false);
    const [showCopied, setShowCopied] = useState(false);
    
    useEffect(() => { 
        if (snippet) { 
            setCurrentCode(snippet.code); 
            setCurrentTitle(snippet.title); 
            setAiAnalysis(''); 
            setIsEditing(false);
        } 
    }, [snippet]); 
    
    const handleAiAction = async (action) => { 
        setAiAnalysis(''); 
        const result = await onAiAction(action, currentCode); 
        if (result) { 
            if (action === 'check') { 
                setAiAnalysis(result); 
            } else { 
                setCurrentCode(result); 
            } 
        } 
    }; 

    const handleCopy = () => {
        onCopy(currentCode);
        setShowCopied(true);
        setTimeout(() => setShowCopied(false), 2000);
    };
    
    const handleSave = () => { 
        onUpdate(snippet.id, currentTitle, currentCode); 
        onClose(); 
    }; 
    
    if (!isOpen || !snippet) return null; 
    
    return ( 
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fade-in" onClick={onClose}>
            <div 
                className="w-full max-w-5xl h-[90vh] flex flex-col bg-bg-lighter/30 backdrop-blur-md border border-border rounded-xl shadow-2xl overflow-hidden animate-scale-in" 
                onClick={e => e.stopPropagation()}
            >
                <div className="flex items-center justify-between p-4 border-b border-border bg-bg/50">
                    <input 
                        type="text" 
                        value={currentTitle} 
                        onChange={(e) => setCurrentTitle(e.target.value)} 
                        className="bg-transparent text-xl font-bold text-white focus:outline-none focus:border-b focus:border-primary w-full mr-4"
                    />
                    <button onClick={onClose} className="text-text-muted hover:text-white transition-colors">
                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </button>
                </div>
                
                <div className="flex-1 overflow-hidden relative flex flex-col min-h-0" onClick={() => setIsEditing(true)}>
                    {isEditing ? (
                        <textarea 
                            value={currentCode} 
                            onChange={(e) => setCurrentCode(e.target.value)} 
                            spellCheck="false"
                            autoFocus
                            className="w-full h-full p-4 bg-bg/50 font-mono text-sm text-white resize-none focus:outline-none custom-scrollbar backdrop-blur-sm"
                        />
                    ) : (
                        <div className="w-full h-full overflow-auto custom-scrollbar bg-bg/50 p-4 backdrop-blur-sm">
                            <CodeSyntaxHighlighter code={currentCode} />
                        </div>
                    )}
                </div>

                {aiAnalysis && ( 
                    <div className="p-4 bg-bg/50 border-t border-border max-h-40 overflow-y-auto custom-scrollbar">
                        <h4 className="text-sm font-bold text-secondary mb-2">AI Analysis:</h4>
                        <p className="text-sm text-text-muted whitespace-pre-wrap">{aiAnalysis}</p>
                    </div> 
                )}

                <div className="p-4 border-t border-border bg-bg/50 flex flex-wrap gap-4 justify-between items-center">
                    <div className="flex flex-wrap gap-2">
                        <button 
                            onClick={() => handleAiAction('check')} 
                            disabled={isAiLoading} 
                            className="flex items-center px-3 py-2 text-sm font-medium text-white bg-secondary/20 hover:bg-secondary/30 border border-secondary/50 rounded-lg transition-colors disabled:opacity-50"
                        >
                            <SparklesIcon className="w-4 h-4 mr-2"/> {isAiLoading ? '...' : 'Check Code'}
                        </button>
                        <button 
                            onClick={() => handleAiAction('correct')} 
                            disabled={isAiLoading} 
                            className="flex items-center px-3 py-2 text-sm font-medium text-white bg-primary/20 hover:bg-primary/30 border border-primary/50 rounded-lg transition-colors disabled:opacity-50"
                        >
                            <SparklesIcon className="w-4 h-4 mr-2"/> {isAiLoading ? '...' : 'Correct Code'}
                        </button>
                        <button 
                            onClick={() => handleAiAction('add_comments')} 
                            disabled={isAiLoading} 
                            className="flex items-center px-3 py-2 text-sm font-medium text-white bg-accent/20 hover:bg-accent/30 border border-accent/50 rounded-lg transition-colors disabled:opacity-50"
                        >
                            <SparklesIcon className="w-4 h-4 mr-2"/> {isAiLoading ? '...' : 'Add Comments'}
                        </button>
                    </div>
                    <div className="flex items-center gap-2">
                        <div className="relative">
                            <button 
                                onClick={handleCopy} 
                                className={`flex items-center px-4 py-2 text-sm font-medium border rounded-lg transition-colors ${showCopied ? 'text-green-500 border-green-500/50 bg-green-500/10' : 'text-text-muted hover:text-white bg-bg border-border'}`}
                            >
                                {showCopied ? <CheckIcon className="w-4 h-4 mr-2" /> : <CopyIcon className="w-4 h-4 mr-2" />}
                                {showCopied ? 'Copied' : 'Copy'}
                            </button>
                            {showCopied && (
                                <div className="absolute bottom-full mb-2 left-1/2 -translate-x-1/2 bg-bg-darker border border-green-500/30 text-green-500 text-[10px] font-bold px-2 py-1 rounded shadow-lg flex items-center gap-1 whitespace-nowrap z-50 animate-fade-in-up pointer-events-none">
                                    <CheckIcon className="w-3 h-3" /> Copied
                                </div>
                            )}
                        </div>
                        <button 
                            onClick={handleSave} 
                            className="px-6 py-2 text-sm font-bold text-white bg-success hover:bg-emerald-600 rounded-lg shadow-lg hover:shadow-success/20 transition-colors"
                        >
                            Save Changes
                        </button>
                    </div>
                </div>
            </div>
        </div> 
    ); 
};
