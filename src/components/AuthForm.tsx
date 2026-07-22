import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { Mail, Lock, User } from 'lucide-react';

interface AuthFormProps {
  mode: 'login' | 'register';
  onToggleMode: () => void;
}

export function AuthForm({ mode, onToggleMode }: AuthFormProps) {
  const { login, register, isLoading } = useAuth();
  
  // useState: Manages form input state
  // These hooks are essential - without them, the form inputs wouldn't work
  const [email, setEmail] = useState(() => sessionStorage.getItem('auth_email') || '');
  const [password, setPassword] = useState(() => sessionStorage.getItem('auth_password') || '');
  const [username, setUsername] = useState(() => sessionStorage.getItem('auth_username') || '');
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsSubmitting(true);

    try {
      let success = false;
      if (mode === 'login') {
        // Real backend authentication - JWT token returned on success
        success = await login(email, password);
      } else {
        // Real user registration - creates user in MySQL database
        success = await register(username, email, password);
      }

      if (!success) {
        setError('Authentication failed. Please try again.');
      } else {
        // clear cached inputs on success
        try {
          sessionStorage.removeItem('auth_email');
          sessionStorage.removeItem('auth_password');
          sessionStorage.removeItem('auth_username');
        } catch {}
      }
      // If successful, AuthContext updates with real user data from backend
    } catch (err) {
      setError('An error occurred. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900">
      <div className="bg-white/10 backdrop-blur-md p-8 rounded-2xl shadow-2xl border border-white/20 w-full max-w-md">
        <h1 className="text-3xl font-bold text-white text-center mb-8">
          {mode === 'login' ? 'Welcome Back!' : 'Join the Mashup!'}
        </h1>

        <form onSubmit={handleSubmit} className="space-y-6">
          {mode === 'register' && (
            <div className="relative">
              <User className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
              <input
                type="text"
                placeholder="Username"
                value={username}
                onChange={(e) => {
                  setUsername(e.target.value);
                  try { sessionStorage.setItem('auth_username', e.target.value); } catch {}
                }}
                className="w-full pl-12 pr-4 py-3 bg-white/20 border border-white/30 rounded-lg text-white placeholder-gray-300 focus:outline-none focus:ring-2 focus:ring-purple-500"
                required
              />
            </div>
          )}

          <div className="relative">
            <Mail className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
            <input
              type="email"
              placeholder="Email"
              value={email}
              onChange={(e) => { setEmail(e.target.value); try { sessionStorage.setItem('auth_email', e.target.value); } catch {} }}
              className="w-full pl-12 pr-4 py-3 bg-white/20 border border-white/30 rounded-lg text-white placeholder-gray-300 focus:outline-none focus:ring-2 focus:ring-purple-500"
              required
            />
          </div>

          <div className="relative">
            <Lock className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
            <input
              type="password"
              placeholder="Password"
              value={password}
              onChange={(e) => { setPassword(e.target.value); try { sessionStorage.setItem('auth_password', e.target.value); } catch {} }}
              className="w-full pl-12 pr-4 py-3 bg-white/20 border border-white/30 rounded-lg text-white placeholder-gray-300 focus:outline-none focus:ring-2 focus:ring-purple-500"
              required
            />
          </div>

          <div className="flex justify-end -mt-4">
            <button
              type="button"
              onClick={() => {
                try {
                  sessionStorage.removeItem('auth_email');
                  sessionStorage.removeItem('auth_password');
                  sessionStorage.removeItem('auth_username');
                } catch {}
                setEmail(''); setPassword(''); setUsername('');
              }}
              className="text-sm text-gray-300 hover:text-white"
            >
              New
            </button>
          </div>

          {error && (
            <div className="bg-red-500/20 border border-red-500 text-red-200 px-4 py-3 rounded-lg">
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white font-semibold py-3 rounded-lg transition-all duration-200 disabled:opacity-50"
          >
            {isSubmitting ? 'Processing...' : (mode === 'login' ? 'Sign In' : 'Create Account')}
          </button>
        </form>

        <p className="text-center text-gray-300 mt-6">
          {mode === 'login' ? "Don't have an account? " : "Already have an account? "}
          <button
            onClick={onToggleMode}
            className="text-purple-400 hover:text-purple-300 font-semibold"
          >
            {mode === 'login' ? 'Sign Up' : 'Sign In'}
          </button>
        </p>
      </div>
    </div>
  );
}