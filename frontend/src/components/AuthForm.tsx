'use client';

import { useState } from 'react';
import { supabase } from '../lib/supabase';

export default function AuthForm() {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [isSignUp, setIsSignUp] = useState(false);
    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState<{ type: 'success' | 'danger'; text: string } | null>(null);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setMessage(null);

        const { error } = isSignUp
            ? await supabase.auth.signUp({ email, password })
            : await supabase.auth.signInWithPassword({ email, password });

        if (error) {
            setMessage({ type: 'danger', text: error.message });
        } else {
            setMessage({
                type: 'success',
                text: isSignUp ? 'Signup successful! Check your email.' : 'Logged in successfully!',
            });
        }
        setLoading(false);
    };

    return (
        <div className="card shadow-sm p-3 p-md-4">
            <h2 className="text-center mb-4">{isSignUp ? 'Create Account' : 'Welcome Back'}</h2>
            {message && (
                <div className={`alert alert-${message.type}`} role="alert">
                    {message.text}
                </div>
            )}
            <form onSubmit={handleSubmit}>
                <div className="mb-3">
                    <label className="form-label">Email address</label>
                    <input
                        type="email"
                        className="form-control"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        required
                    />
                </div>
                <div className="mb-3">
                    <label className="form-label">Password</label>
                    <input
                        type="password"
                        className="form-control"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        required
                    />
                </div>
                <button type="submit" className="btn btn-primary w-100" disabled={loading}>
                    {loading ? 'Processing...' : isSignUp ? 'Sign Up' : 'Login'}
                </button>
            </form>
            <div className="text-center mt-3">
                <button
                    type="button"
                    className="btn btn-link"
                    onClick={() => setIsSignUp(!isSignUp)}
                >
                    {isSignUp ? 'Already have an account? Login' : "Don't have an account? Sign Up"}
                </button>
            </div>
        </div>
    );
}
