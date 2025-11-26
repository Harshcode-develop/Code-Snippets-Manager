import React, { useState, useEffect } from 'react';
import { SparklesIcon, GoogleIcon, EmailIcon, LockIcon } from '../components/Icons';
import { GoogleLogin } from '@react-oauth/google';

export default function AuthPage({ onLogin, onSignup, onGoogleLogin, email, password, setEmail, setPassword }) {
    const [isLogin, setIsLogin] = useState(true);
    const [showPassword, setShowPassword] = useState(false);
    const [rememberMe, setRememberMe] = useState(false);

    // On component mount, check for saved email in localStorage
    useEffect(() => {
        const savedEmail = localStorage.getItem('rememberedEmail');
        if (savedEmail) {
            setEmail(savedEmail);
            setRememberMe(true);
        }
    }, [setEmail]);

    const handleLoginSubmit = (e) => {
        e.preventDefault();
        if (rememberMe) {
            localStorage.setItem('rememberedEmail', email);
        } else {
            localStorage.removeItem('rememberedEmail');
        }
        onLogin(e);
    };
    
    const handleSignupSubmit = (e) => {
        e.preventDefault();
        localStorage.removeItem('rememberedEmail'); // Clear saved email on signup
        onSignup(e);
    };

    return (
        <div className="h-screen w-screen flex items-center justify-center p-4 bg-bg relative overflow-hidden">
            {/* Background Elements */}
            <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none">
                <div className="absolute -top-[20%] -left-[10%] w-[50%] h-[50%] bg-primary/20 rounded-full blur-[100px]"></div>
                <div className="absolute top-[40%] -right-[10%] w-[40%] h-[40%] bg-secondary/20 rounded-full blur-[100px]"></div>
            </div>

            <div className="w-full max-w-md bg-bg-lighter/50 backdrop-blur-xl border border-border rounded-2xl shadow-2xl py-10 px-8 relative z-10 animate-fade-in-up">
                <div className="flex flex-col items-center justify-center mb-8">
                    <div className="flex items-center justify-center gap-3">
                         <SparklesIcon className="w-12 h-12 animate-color-cycle" />
                         <h1 className="text-4xl font-bold bg-clip-text text-transparent bg-linear-to-r from-primary to-accent">
                            sonicxcode
                        </h1>
                    </div>
                    <p className="text-text-muted text-sm mt-2">
                        {isLogin ? 'Log in to access snippets' : 'Create an account'}
                    </p>
                </div>

                <form onSubmit={isLogin ? handleLoginSubmit : handleSignupSubmit} className="space-y-4">
                    <div className="space-y-1">
                        <label htmlFor="email" className="block text-xs font-medium text-text-muted">Email</label>
                        <div className="relative">
                            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                <EmailIcon className="h-4 w-4 text-text-muted" />
                            </div>
                            <input 
                                type="email" 
                                id="email" 
                                value={email} 
                                onChange={e => setEmail(e.target.value)} 
                                placeholder="example@gmail.com" 
                                required 
                                className="block w-full pl-9 pr-3 py-2 bg-bg border border-border rounded-lg text-sm text-white placeholder-text-muted/50 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all"
                            />
                        </div>
                    </div>
                    
                    <div className="space-y-1">
                        <label htmlFor="password" className="block text-xs font-medium text-text-muted">Password</label>
                        <div className="relative">
                            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                <LockIcon className="h-4 w-4 text-text-muted" />
                            </div>
                            <input 
                                type={showPassword ? "text" : "password"} 
                                id="password" 
                                value={password} 
                                onChange={e => setPassword(e.target.value)} 
                                placeholder="Password"
                                required 
                                className="block w-full pl-9 pr-10 py-2 bg-bg border border-border rounded-lg text-sm text-white placeholder-text-muted/50 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all"
                            />
                            <button
                                type="button"
                                onClick={() => setShowPassword(!showPassword)}
                                className="absolute inset-y-0 right-0 pr-3 flex items-center text-text-muted hover:text-white transition-colors"
                            >
                                {showPassword ? (
                                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4">
                                        <path d="M12 15a3 3 0 100-6 3 3 0 000 6z" />
                                        <path fillRule="evenodd" d="M1.323 11.447C2.811 6.976 7.028 3.75 12.001 3.75c4.97 0 9.185 3.223 10.675 7.69.12.362.12.752 0 1.113-1.487 4.471-5.705 7.697-10.677 7.697-4.97 0-9.186-3.223-10.675-7.69a1.762 1.762 0 010-1.113zM17.25 12a5.25 5.25 0 11-10.5 0 5.25 5.25 0 0110.5 0z" clipRule="evenodd" />
                                    </svg>
                                ) : (
                                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4">
                                        <path d="M3.53 2.47a.75.75 0 00-1.06 1.06l18 18a.75.75 0 101.06-1.06l-18-18zM22.676 12.553a11.249 11.249 0 01-2.631 4.31l-3.099-3.099a5.25 5.25 0 00-6.71-6.71L7.759 4.577a11.217 11.217 0 014.242-.827c4.97 0 9.185 3.223 10.675 7.69.12.362.12.752 0 1.113z" />
                                        <path d="M15.75 12c0 .18-.013.357-.037.53l-4.244-4.243A3.75 3.75 0 0115.75 12zM12.53 15.713l-4.243-4.244a3.75 3.75 0 004.243 4.243z" />
                                        <path d="M6.75 12c0-.619.107-1.213.304-1.764l-3.1-3.1a11.25 11.25 0 00-2.63 4.31c-.12.362-.12.752 0 1.114 1.489 4.467 5.702 7.69 10.677 7.69.612 0 1.209-.048 1.791-.14l-3.097-3.097A5.25 5.25 0 016.75 12z" />
                                    </svg>
                                )}
                            </button>
                        </div>
                    </div>

                    {isLogin && (
                        <div className="flex items-center">
                            <input 
                                type="checkbox" 
                                id="rememberMe" 
                                checked={rememberMe} 
                                onChange={(e) => setRememberMe(e.target.checked)} 
                                className="h-3.5 w-3.5 text-primary focus:ring-primary border-border rounded bg-bg"
                            />
                            <label htmlFor="rememberMe" className="ml-2 block text-xs text-text-muted">Remember me</label>
                        </div>
                    )}
                    
                    <button 
                        type="submit" 
                        className="w-full flex justify-center py-2.5 px-4 border border-transparent rounded-lg shadow-sm text-sm font-bold text-white bg-primary hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary transition-all transform hover:scale-[1.02]"
                    >
                        {isLogin ? 'Log In' : 'Sign Up'}
                    </button>
                </form>

                <div className="relative my-6">
                    <div className="absolute inset-0 flex items-center">
                        <div className="w-full border-t border-border"></div>
                    </div>
                    <div className="relative flex justify-center text-xs">
                        <span className="px-2 bg-bg-lighter text-text-muted">Or continue with</span>
                    </div>
                </div>

                 <div className="flex justify-center">
                    <GoogleLogin
                        onSuccess={onGoogleLogin}
                        onError={() => {
                            alert('Login Failed. Please try again.');
                        }}
                        theme="filled_black"
                        shape="circle"
                        size="medium"
                    />
                </div>

                <div className="mt-6 text-center">
                    <p className="text-xs text-text-muted">
                        {isLogin ? "Don't have an account?" : "Already have an account?"}
                        <button 
                            type="button" 
                            onClick={() => setIsLogin(!isLogin)}
                            className="ml-2 font-medium text-accent hover:text-cyan-400 transition-colors"
                        >
                            {isLogin ? 'Sign Up' : 'Log In'}
                        </button>
                    </p>
                </div>
            </div>
        </div>
    );
};
