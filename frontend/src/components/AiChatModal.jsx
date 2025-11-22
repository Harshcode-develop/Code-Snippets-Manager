import React, { useState, useRef, useEffect } from 'react';
import { SparklesIcon } from './Icons';
import { CodeSyntaxHighlighter } from './CodeSyntaxHighlighter';

export const AiChatModal = ({ snippet, isOpen, onClose, onSendQuery, isAiLoading }) => {
    const [prompt, setPrompt] = useState('');
    const [chatHistory, setChatHistory] = useState([]);
    const chatEndRef = useRef(null);

    useEffect(() => {
        if (isOpen) {
            setChatHistory([{ sender: 'ai', text: `Hi! How can I help with "${snippet.title}" today?` }]);
        } else {
            setChatHistory([]);
            setPrompt('');
        }
    }, [isOpen, snippet]);

    useEffect(() => {
        chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [chatHistory]);

    const handleSend = async () => {
        if (!prompt.trim() || isAiLoading) return;

        const newHistory = [...chatHistory, { sender: 'user', text: prompt }];
        setChatHistory(newHistory);
        setPrompt('');

        const aiResponse = await onSendQuery(prompt, snippet.code);
        if (aiResponse) {
            setChatHistory(prev => [...prev, { sender: 'ai', text: aiResponse }]);
        } else {
            setChatHistory(prev => [...prev, { sender: 'ai', text: "Sorry, I couldn't get a response. Please try again." }]);
        }
    };

    if (!isOpen || !snippet) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm animate-fade-in" onClick={onClose}>
            <div className="bg-bg-lighter/40 backdrop-blur-xl border border-border/50 rounded-xl w-full max-w-4xl h-[85vh] flex flex-col shadow-2xl animate-scale-in overflow-hidden" onClick={e => e.stopPropagation()}>
                <div className="flex items-center justify-between p-4 border-b border-border bg-bg/50 backdrop-blur-md">
                    <div className="flex items-center gap-3">
                        <SparklesIcon className="w-7 h-7 text-secondary" />
                        <h3 className="text-lg font-bold text-text">AI Assistant</h3>
                    </div>
                    <button onClick={onClose} className="text-text-muted hover:text-text text-2xl leading-none">&times;</button>
                </div>
                <div className="flex-1 overflow-hidden flex flex-col md:flex-row">
                    <div className="w-full md:w-1/2 h-1/2 md:h-full border-b md:border-b-0 md:border-r border-border overflow-auto bg-bg-lighter/30">
                        <CodeSyntaxHighlighter code={snippet.code} />
                    </div>
                    <div className="w-full md:w-1/2 h-1/2 md:h-full flex flex-col bg-bg">
                        <div className="flex-1 overflow-y-auto p-4 space-y-4">
                            {chatHistory.map((msg, index) => (
                                <div key={index} className={`flex gap-3 ${msg.sender === 'user' ? 'flex-row-reverse' : ''}`}>
                                    {msg.sender === 'ai' && <SparklesIcon className="w-6 h-6 text-secondary shrink-0 mt-1" />}
                                    <div className={`p-3 rounded-lg max-w-[85%] text-sm leading-relaxed ${msg.sender === 'user' ? 'bg-primary text-white rounded-tr-none' : 'bg-bg-lighter border border-border text-text-muted rounded-tl-none'}`}>
                                        {msg.sender === 'user' ? (
                                            <p className="whitespace-pre-wrap">{msg.text}</p>
                                        ) : (
                                            <div className="flex flex-col gap-2">
                                                {msg.text.split(/(```[\w-]*\n[\s\S]*?```)/g).map((part, i) => {
                                                    if (part.startsWith('```')) {
                                                        const match = part.match(/```([\w-]*)\n([\s\S]*?)```/);
                                                        const language = match ? match[1] : 'javascript';
                                                        const code = match ? match[2] : part.slice(3, -3);
                                                        return (
                                                            <div key={i} className="rounded-md overflow-hidden my-2 border border-border/50">
                                                                <CodeSyntaxHighlighter code={code.trim()} language={language || 'javascript'} />
                                                            </div>
                                                        );
                                                    }
                                                    return part.trim() ? <p key={i} className="whitespace-pre-wrap">{part}</p> : null;
                                                })}
                                            </div>
                                        )}
                                    </div>
                                </div>
                            ))}
                            {isAiLoading && (
                                <div className="flex gap-3">
                                    <SparklesIcon className="w-6 h-6 text-secondary shrink-0 mt-1 animate-pulse" />
                                    <div className="bg-bg-lighter border border-border text-text-muted p-3 rounded-lg rounded-tl-none">
                                        <p className="animate-pulse">Thinking...</p>
                                    </div>
                                </div>
                            )}
                            <div ref={chatEndRef} />
                        </div>
                        <div className="p-4 border-t border-border bg-bg-lighter/50">
                            <div className="flex gap-2">
                                <input 
                                    type="text" 
                                    value={prompt}
                                    onChange={(e) => setPrompt(e.target.value)}
                                    onKeyDown={(e) => e.key === 'Enter' && handleSend()}
                                    placeholder="Ask about this snippet..."
                                    disabled={isAiLoading}
                                    className="flex-1 bg-bg border border-border rounded-lg px-4 py-2 text-text focus:outline-none focus:ring-2 focus:ring-secondary transition-all disabled:opacity-50"
                                />
                                <button 
                                    onClick={handleSend} 
                                    disabled={isAiLoading}
                                    className="px-6 py-2 bg-secondary text-white font-bold rounded-lg hover:bg-violet-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed shadow-lg hover:shadow-secondary/20"
                                >
                                    Send
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};
