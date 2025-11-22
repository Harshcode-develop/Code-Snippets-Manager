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
                                className="block w-full pl-9 pr-3 py-2 bg-bg border border-border rounded-lg text-sm text-white placeholder-text-muted/50 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all"
                            />
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
