import React, { useState, useRef, useEffect } from 'react';
import { SparklesIcon, TrashIcon, CheckIcon, SpeakerWaveIcon, SpeakerXMarkIcon } from './Icons';
import { CodeSyntaxHighlighter } from './CodeSyntaxHighlighter';

export const AiChatModal = ({ snippet, isOpen, onClose, onSendQuery, isAiLoading, onUpdate }) => {
    const [prompt, setPrompt] = useState('');
    const [chatHistory, setChatHistory] = useState([]);
    const chatEndRef = useRef(null);
    const [isListening, setIsListening] = useState(false);
    const [isSpeaking, setIsSpeaking] = useState(false);
    const [isSpeechEnabled, setIsSpeechEnabled] = useState(false); // Default to off
    const [isFocused, setIsFocused] = useState(false);

    useEffect(() => {
        if (isOpen) {
            const defaultMsg = `Hi, I'm Sonic. How can I help with "${snippet.title}" today?`;
            setChatHistory([{ sender: 'ai', text: defaultMsg }]);
            speak(defaultMsg, true); // Force speak the welcome message
            
            // Prevent background scrolling
            document.body.style.overflow = 'hidden';
        } else {
            setChatHistory([]);
            setPrompt('');
            window.speechSynthesis.cancel();
            
            // Restore background scrolling
            document.body.style.overflow = 'unset';
        }

        // Cleanup function to ensure scroll is restored if component unmounts
        return () => {
            document.body.style.overflow = 'unset';
        };
    }, [isOpen, snippet]);

    useEffect(() => {
        chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [chatHistory]);

    const speak = (text, force = false) => {
        if (!window.speechSynthesis) return;
        window.speechSynthesis.cancel();

        if (!isSpeechEnabled && !force) return;
        
        // Clean text for speech: remove markdown symbols (*, `, #, etc) and parentheses if needed, but keep punctuation for pausing.
        // The user specifically asked to remove asterisks, backticks, and parentheses.
        const cleanText = text
            .replace(/[*`()\[\]#]/g, '') // Remove markdown chars and brackets/parentheses
            .replace(/https?:\/\/\S+/g, 'link') // Replace URLs
            .replace(/\n/g, '. ') // Replace newlines with pauses
            .trim();

        const utterance = new SpeechSynthesisUtterance(cleanText);
        
        // "Man" voice characteristics
        utterance.pitch = 1.0; // Normal pitch (lower than previous 1.5)
        utterance.rate = 1.0;  // Normal rate

        utterance.onstart = () => setIsSpeaking(true);
        utterance.onend = () => setIsSpeaking(false);
        window.speechSynthesis.speak(utterance);
    };

    const handleListen = () => {
        if (!('webkitSpeechRecognition' in window)) {
            alert("Speech recognition is not supported in this browser.");
            return;
        }

        const recognition = new window.webkitSpeechRecognition();
        recognition.continuous = false;
        recognition.interimResults = false;
        recognition.lang = 'en-US';

        recognition.onstart = () => setIsListening(true);
        recognition.onend = () => setIsListening(false);
        recognition.onresult = (event) => {
            const transcript = event.results[0][0].transcript;
            setPrompt(transcript);
        };

        recognition.start();
    };

    const handleOptionClick = (option) => {
        setPrompt(option);
        handleSend(option); // Pass option directly to avoid stale state
    };

    // Modified handleSend to accept an optional direct prompt
    const handleSend = async (directPrompt = null) => {
        const textToSend = directPrompt || prompt;
        if (!textToSend.trim() || isAiLoading) return;

        const newHistory = [...chatHistory, { sender: 'user', text: textToSend }];
        setChatHistory(newHistory);
        setPrompt('');
        window.speechSynthesis.cancel();

        const aiResponse = await onSendQuery(textToSend, snippet.code, newHistory);
        if (aiResponse) {
            setChatHistory(prev => [...prev, { sender: 'ai', text: aiResponse }]);
            speak(aiResponse);
        } else {
            const errorMsg = "Sorry, I couldn't get a response. Please try again.";
            setChatHistory(prev => [...prev, { sender: 'ai', text: errorMsg }]);
            speak(errorMsg);
        }
    };

    const handleClearChat = () => {
        setChatHistory([]);
        window.speechSynthesis.cancel();
    };

    const handleApplyCode = (codeToApply) => {
        if (onUpdate && snippet) {
            onUpdate(snippet.id, snippet.title, codeToApply);
            // Add a system message to the chat to confirm the change
            setChatHistory(prev => [...prev, { sender: 'system', text: "Code snippet changed successfully." }]);
        }
    };

    if (!isOpen || !snippet) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-md animate-fade-in" onClick={onClose}>
            <div className="bg-bg-lighter/20 backdrop-blur-2xl border border-white/10 rounded-2xl w-full max-w-5xl h-[85vh] flex flex-col shadow-2xl animate-scale-in overflow-hidden relative" onClick={e => e.stopPropagation()}>
                
                {/* Header */}
                <div className="flex items-center justify-between p-5 border-b border-white/10 bg-transparent backdrop-blur-md">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-linear-to-br from-secondary to-accent rounded-lg shadow-lg shadow-secondary/20">
                            <SparklesIcon className="w-6 h-6 text-white" />
                        </div>
                        <div>
                            <h3 className="text-lg font-bold text-white tracking-wide">Sonic AI</h3>
                            <p className="text-xs text-white/50 font-medium">Powered by Gemini AI</p>
                        </div>
                    </div>
                    <div className="flex items-center gap-2">
                        <button 
                            onClick={() => setIsSpeechEnabled(!isSpeechEnabled)} 
                            className={`transition-colors p-2 rounded-full ${isSpeechEnabled ? 'text-accent hover:bg-accent/10' : 'text-white/40 hover:text-white hover:bg-white/10'}`}
                            title={isSpeechEnabled ? "Mute Voice" : "Enable Voice"}
                        >
                            {isSpeechEnabled ? <SpeakerWaveIcon className="w-5 h-5" /> : <SpeakerXMarkIcon className="w-5 h-5" />}
                        </button>
                         <button 
                            onClick={handleClearChat} 
                            className="text-white/40 hover:text-error transition-colors p-2 hover:bg-white/10 rounded-full"
                            title="Clear Chat"
                        >
                            <TrashIcon className="w-5 h-5" />
                        </button>
                        <button onClick={onClose} className="text-white/40 hover:text-white transition-colors p-2 hover:bg-white/10 rounded-full">
                            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-6 h-6">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                            </svg>
                        </button>
                    </div>
                </div>

                <div className="flex-1 overflow-hidden flex flex-col md:flex-row">
                    {/* Code View */}
                    <div className="w-full md:w-1/2 h-1/2 md:h-full border-b md:border-b-0 md:border-r border-white/10 overflow-auto bg-black/20 custom-scrollbar">
                        <div className="p-4">
                            <div className="text-xs font-bold text-white/40 mb-2 uppercase tracking-wider">Context Code</div>
                            <CodeSyntaxHighlighter code={snippet.code} />
                        </div>
                    </div>

                    {/* Chat Area */}
                    <div className="w-full md:w-1/2 h-1/2 md:h-full flex flex-col bg-transparent relative">
                        <div className="flex-1 overflow-y-auto p-6 space-y-6 custom-scrollbar pb-24">
                            {chatHistory.map((msg, index) => (
                                <div key={index} className={`flex gap-4 ${msg.sender === 'user' ? 'flex-row-reverse' : ''} animate-fade-in-up`}>
                                    {msg.sender === 'ai' && (
                                        <div className="w-8 h-8 rounded-full bg-linear-to-br from-secondary to-accent flex items-center justify-center shadow-lg shadow-secondary/20 shrink-0 mt-1">
                                            <SparklesIcon className="w-4 h-4 text-white" />
                                        </div>
                                    )}
                                    {msg.sender === 'system' && (
                                        <div className="w-full flex justify-center my-2">
                                            <div className="bg-success/20 text-success border border-success/30 px-3 py-1 rounded-full text-xs font-bold flex items-center gap-1">
                                                <CheckIcon className="w-3 h-3" /> {msg.text}
                                            </div>
                                        </div>
                                    )}
                                    {msg.sender !== 'system' && (
                                    <div className={`p-4 rounded-2xl max-w-[85%] text-sm leading-relaxed shadow-md ${
                                        msg.sender === 'user' 
                                            ? 'bg-primary text-white rounded-tr-sm shadow-primary/10' 
                                            : 'bg-white/10 border border-white/5 text-gray-100 rounded-tl-sm backdrop-blur-md'
                                    }`}>
                                        {msg.sender === 'user' ? (
                                            <p className="whitespace-pre-wrap">{msg.text}</p>
                                        ) : (
                                            <div className="flex flex-col gap-3">
                                                {msg.text.split(/(```[\w-]*\n[\s\S]*?```)/g).map((part, i) => {
                                                    if (part.startsWith('```')) {
                                                        const match = part.match(/```([\w-]*)\n([\s\S]*?)```/);
                                                        const language = match ? match[1] : 'javascript';
                                                        const code = match ? match[2] : part.slice(3, -3);
                                                        return (
                                                            <div key={i} className="rounded-xl overflow-hidden my-2 border border-white/10 shadow-lg relative group">
                                                                <CodeSyntaxHighlighter code={code.trim()} language={language || 'javascript'} />
                                                                <button
                                                                    onClick={() => handleApplyCode(code.trim())}
                                                                    className="absolute top-2 right-2 p-2 bg-secondary/80 hover:bg-secondary text-white rounded-lg opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-1 text-xs font-bold shadow-lg backdrop-blur-sm"
                                                                    title="Apply to Snippet"
                                                                >
                                                                    <CheckIcon className="w-3 h-3" /> Apply
                                                                </button>
                                                            </div>
                                                        );
                                                    }
                                                    return part.trim() ? <p key={i} className="whitespace-pre-wrap">{part}</p> : null;
                                                })}
                                                {/* Render Yes/No buttons if this is the last message and asks the specific question */}
                                                {index === chatHistory.length - 1 && msg.text.includes("Do you want me to change your existing code snippet for better performance?") && (
                                                    <div className="flex gap-2 mt-2">
                                                        <button 
                                                            onClick={() => handleOptionClick("Yes, please.")}
                                                            className="px-4 py-2 bg-success/20 hover:bg-success/30 text-success border border-success/30 rounded-lg text-xs font-bold transition-colors"
                                                        >
                                                            Yes
                                                        </button>
                                                        <button 
                                                            onClick={() => handleOptionClick("No, thanks.")}
                                                            className="px-4 py-2 bg-white/5 hover:bg-white/10 text-white/70 border border-white/10 rounded-lg text-xs font-bold transition-colors"
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
                                <div className="flex gap-4 animate-pulse">
                                    <div className="w-8 h-8 rounded-full bg-linear-to-br from-secondary to-accent flex items-center justify-center shadow-lg shadow-secondary/20 shrink-0 mt-1 opacity-50">
                                        <SparklesIcon className="w-4 h-4 text-white" />
                                    </div>
                                    <div className="bg-white/5 border border-white/5 text-white/50 p-4 rounded-2xl rounded-tl-sm backdrop-blur-md">
                                        <div className="flex gap-1">
                                            <span className="w-2 h-2 bg-white/50 rounded-full animate-bounce" style={{animationDelay: '0ms'}}></span>
                                            <span className="w-2 h-2 bg-white/50 rounded-full animate-bounce" style={{animationDelay: '150ms'}}></span>
                                            <span className="w-2 h-2 bg-white/50 rounded-full animate-bounce" style={{animationDelay: '300ms'}}></span>
                                        </div>
                                    </div>
                                </div>
                            )}
                            <div ref={chatEndRef} />
                        </div>

                        {/* Floating Input Area */}
                        <div className="absolute bottom-6 left-6 right-6">
                            <div className={`transition-all duration-300 border rounded-2xl p-2 flex items-center gap-2 ${
                                isFocused || prompt.trim() 
                                    ? 'bg-bg-darker border-white/10 shadow-2xl ring-1 ring-white/5 backdrop-blur-xl' 
                                    : 'bg-transparent border-transparent shadow-none backdrop-blur-none'
                            }`}>
                                <button
                                    onClick={handleListen}
                                    className={`p-3 rounded-xl transition-all duration-300 ${
                                        isListening 
                                            ? 'bg-error text-white shadow-lg shadow-error/30 animate-pulse' 
                                            : 'text-white/50 hover:text-white hover:bg-white/10'
                                    }`}
                                    title="Speak"
                                >
                                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5">
                                        <path d="M8.25 4.5a3.75 3.75 0 117.5 0v8.25a3.75 3.75 0 11-7.5 0V4.5z" />
                                        <path d="M6 10.5a.75.75 0 01.75.75v1.5a5.25 5.25 0 1010.5 0v-1.5a.75.75 0 011.5 0v1.5a6.751 6.751 0 01-6 6.709v2.291h3a.75.75 0 010 1.5h-7.5a.75.75 0 010-1.5h3v-2.291a6.751 6.751 0 01-6-6.709v-1.5A.75.75 0 016 10.5z" />
                                    </svg>
                                </button>
                                
                                <input 
                                    type="text" 
                                    value={prompt}
                                    onChange={(e) => setPrompt(e.target.value)}
                                    onFocus={() => setIsFocused(true)}
                                    onBlur={() => setIsFocused(false)}
                                    onKeyDown={(e) => e.key === 'Enter' && handleSend()}
                                    placeholder="Ask Sonic anything..."
                                    disabled={isAiLoading}
                                    className={`flex-1 bg-transparent border-none text-white placeholder-white/30 focus:outline-none px-2 py-2 font-medium transition-opacity duration-300 ${
                                        isFocused || prompt.trim() ? 'opacity-100' : 'opacity-70'
                                    }`}
                                />
                                
                                <button 
                                    onClick={() => handleSend()} 
                                    disabled={isAiLoading || !prompt.trim()}
                                    className={`p-3 bg-linear-to-r from-secondary to-accent text-white rounded-xl hover:shadow-lg hover:shadow-secondary/25 transition-all disabled:opacity-50 disabled:cursor-not-allowed hover:scale-105 active:scale-95 ${
                                        isFocused || prompt.trim() ? 'opacity-100' : 'opacity-0 pointer-events-none'
                                    }`}
                                >
                                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5">
                                        <path d="M3.478 2.405a.75.75 0 00-.926.94l2.432 7.905H13.5a.75.75 0 010 1.5H4.984l-2.432 7.905a.75.75 0 00.926.94 60.519 60.519 0 0018.445-8.986.75.75 0 000-1.218A60.517 60.517 0 003.478 2.405z" />
                                    </svg>
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};
