import React from 'react';
import { SparklesIcon } from './Icons';

export const Navbar = ({ onLogout, setPage, page, onOpenApiKeyModal }) => {
    const [isScrolled, setIsScrolled] = React.useState(false);

    React.useEffect(() => {
        const handleScroll = () => {
            setIsScrolled(window.scrollY > 20);
        };
        window.addEventListener('scroll', handleScroll);
        return () => window.removeEventListener('scroll', handleScroll);
    }, []);

    const [showLogoutConfirm, setShowLogoutConfirm] = React.useState(false);

    const handleLogoutClick = () => {
        setShowLogoutConfirm(true);
    };

    const confirmLogout = () => {
        setShowLogoutConfirm(false);
        onLogout();
    };

    const cancelLogout = () => {
        setShowLogoutConfirm(false);
    };

    return (
        <>
            <nav className={`sticky top-0 z-50 flex items-center justify-between px-2 py-4 transition-all duration-300 animate-fade-in-down ${
                isScrolled 
                    ? 'bg-bg/40 backdrop-blur-xl border-b border-border/50 shadow-lg' 
                    : 'bg-transparent border-transparent shadow-none'
            }`}>
                <div className="flex items-center gap-3">
                    <div className="flex items-center gap-1 text-2xl font-bold pl-32 bg-clip-text text-transparent bg-linear-to-r from-primary to-accent">
                        <SparklesIcon className="w-7 h-7 text-accent" />
                        <span>sonicxcode</span>
                    </div>
                </div>
                
                <div className="flex items-center gap-4 pr-10">
                    {['home', 'projects', 'snippets', 'starred'].map((tab) => (
                        <button
                            key={tab}
                            onClick={() => setPage(tab)}
                            className={`px-3 py-2 rounded-lg text-xs font-bold transition-all duration-300 ${
                                page === tab 
                                ? 'bg-primary text-white shadow-lg shadow-primary/25 scale-105' 
                                : 'text-text-muted hover:text-white hover:bg-white/5'
                            }`}
                        >
                            {tab.toUpperCase()}
                        </button>
                    ))}
                </div>
                <div className="flex items-center gap-2 mr-28">
                    <button 
                        onClick={onOpenApiKeyModal}
                        className="p-2 text-text-muted hover:text-warning border border-white/10 hover:border-warning/50 hover:bg-warning/10 rounded-lg transition-all group"
                        title="Enter Gemini API Key to access AI features"
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4 transition-transform group-hover:scale-110">
                            <path fillRule="evenodd" d="M15.75 1.5a6.75 6.75 0 00-6.651 7.906c.067.39-.032.717-.221.906l-6.5 6.499a3 3 0 00-.878 2.121v2.818c0 .414.336.75.75.75H6a.75.75 0 00.75-.75v-1.5h1.5a.75.75 0 00.75-.75v-1.5h1.5a.75.75 0 00.75-.75V14.5c.391-.391.718-.489 1.108-.422a6.75 6.75 0 102.642-12.578zm0 1.5a5.25 5.25 0 110 10.5 5.25 5.25 0 010-10.5z" clipRule="evenodd" />
                        </svg>
                    </button>
                    <button 
                        onClick={handleLogoutClick}
                        className="px-4 py-2 bg-error text-white text-xs font-bold rounded-lg shadow-lg hover:bg-red-600 hover:shadow-error/25 transition-all hover:scale-105 active:scale-95"
                    >
                        LOGOUT
                    </button>
                </div>
            </nav>

            {showLogoutConfirm && (
                <div className="fixed inset-0 z-60 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
                    <div className="bg-bg-lighter/30 backdrop-blur-xl border border-white/10 rounded-xl p-6 shadow-2xl max-w-sm w-full animate-scale-in text-center">
                        <h3 className="text-xl font-bold text-white mb-2">Confirm Logout</h3>
                        <p className="text-text-muted mb-6">Are you sure you want to log out?</p>
                        <div className="flex gap-4 justify-center">
                            <button 
                                onClick={cancelLogout}
                                className="px-4 py-2 text-text-muted hover:text-white hover:bg-white/5 rounded-lg transition-colors font-medium"
                            >
                                Cancel
                            </button>
                            <button 
                                onClick={confirmLogout}
                                className="px-4 py-2 bg-error text-white font-bold rounded-lg shadow-lg hover:bg-red-600 hover:shadow-error/25 transition-all hover:scale-105 active:scale-95"
                            >
                                Yes, Logout
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
};
