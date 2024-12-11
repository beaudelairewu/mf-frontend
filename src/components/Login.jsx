import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Lock } from 'lucide-react';
import { BackgroundGrid } from './search/BackgroundGrid';

const Login = () => {
  const [token, setToken] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const existingToken = localStorage.getItem('authToken');
    if (existingToken) {
      navigate('/');
    }
  }, [navigate]);

  const handleLogin = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const response = await fetch(`${process.env.REACT_APP_API_BASE_URL}/api/auth/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ token }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Invalid token');
      }

      localStorage.setItem('authToken', data.token);
      navigate('/');
      
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="relative min-h-screen flex flex-col items-center justify-center bg-[#1a1d21] p-4 overflow-hidden">
      {/* Background Grid */}
      <div className="absolute inset-0">
        <BackgroundGrid />
      </div>

      {/* Content Container with higher z-index */}
      <div className="relative z-10 flex flex-col items-center w-full">
        {/* Logo and Title */}
        <div className="mb-8 text-center">
          <div className="flex items-center justify-center mb-4">
            <div className="bg-[#DE8344] p-3 rounded-full">
              <Lock className="w-6 h-6 text-white" />
            </div>
          </div>
          <h1 className="text-3xl font-bold text-white">Welcome Back</h1>
          <p className="text-gray-400 mt-2">Enter your access token to continue</p>
        </div>

        {/* Login Form */}
        <div className="w-full max-w-sm bg-gray-800/90 backdrop-blur-sm rounded-xl shadow-lg p-6">
          <form onSubmit={handleLogin} className="space-y-6">
            <div>
              <label 
                htmlFor="token" 
                className="block text-sm font-medium text-gray-200 mb-2"
              >
                Access Token
              </label>
              <input
                id="token"
                type="password"
                value={token}
                onChange={(e) => setToken(e.target.value)}
                className="w-full p-3 rounded-lg bg-gray-700/80 border border-gray-600 
                         text-white placeholder-gray-400 focus:outline-none focus:ring-2 
                         focus:ring-blue-500 focus:border-transparent"
                placeholder="Enter your token"
                required
              />
            </div>
            
            {error && (
              <div className="bg-red-500/10 border border-red-500 text-red-500 px-4 py-3 rounded-lg">
                {error}
              </div>
            )}
            
            <button
                type="submit"
                disabled={loading}
                className="w-full bg-[#DE8344] text-white py-3 px-4 rounded-lg
                        hover:bg-[#c67239] transition-colors duration-200
                        focus:outline-none focus:ring-2 focus:ring-[#DE8344]
                        focus:ring-offset-2 focus:ring-offset-gray-900
                        disabled:opacity-50 disabled:cursor-not-allowed
                        flex items-center justify-center space-x-2"
            >
            {loading ? (
                <>
                  <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  <span>Logging in...</span>
                </>
              ) : (
                <>
                  <Lock className="w-5 h-5" />
                  <span>Login</span>
                </>
              )}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default Login;