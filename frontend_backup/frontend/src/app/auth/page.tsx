'use client';

import { useState, useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import useUserStore from '../../store/userStore';

export default function AuthPage() {
  const [isLogin, setIsLogin] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: ''
  });
  
  // Generate deterministic star positions using useMemo to ensure consistency between SSR and client
  const starPositions = useMemo(() => {
    // Reduce number of stars on mobile for better performance
    const isMobile = typeof window !== 'undefined' && window.innerWidth < 768;
    const starCount = isMobile ? 40 : 80;
    
    return [...Array(starCount)].map((_, i) => ({
      left: ((i * 73) % 100), // Deterministic position based on index
      top: ((i * 37 + 23) % 100), // Deterministic position based on index
      delay: (i % 5), // Deterministic delay based on index
      duration: 2 + (i % 4), // Deterministic duration based on index
      opacity: 0.4 + ((i % 6) * 0.1) // Deterministic opacity based on index
    }));
  }, []);
  
  const router = useRouter();
  const { setAuthenticated, setUser, loadUserData } = useUserStore();

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    // Basic validation
    if (!isLogin && formData.password !== formData.confirmPassword) {
      setError('Passwords do not match!');
      setIsLoading(false);
      return;
    }

    if (formData.password.length < 6) {
      setError('Password must be at least 6 characters long');
      setIsLoading(false);
      return;
    }

    // Password strength validation for signup
    if (!isLogin) {
      const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/;
      if (!passwordRegex.test(formData.password)) {
        setError('Password must contain at least one lowercase letter, one uppercase letter, and one number');
        setIsLoading(false);
        return;
      }
    }

    // Name validation for signup
    if (!isLogin && (!formData.name || formData.name.trim().length < 2 || formData.name.trim().length > 50)) {
      setError('Name must be between 2 and 50 characters');
      setIsLoading(false);
      return;
    }

    try {
      const endpoint = isLogin ? '/api/auth/login' : '/api/auth/signup';
      const requestBody = isLogin 
        ? { email: formData.email, password: formData.password }
        : { name: formData.name, email: formData.email, password: formData.password };

      const response = await fetch(`http://localhost:5000${endpoint}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Authentication failed');
      }

      if (data.success) {
        // Store the JWT token
        localStorage.setItem('authToken', data.data.token);
        setAuthenticated(true);
        setUser({
          id: data.data.user.id,
          name: data.data.user.name,
          email: data.data.user.email,
          createdAt: new Date(data.data.user.createdAt),
        });
        
        // Load user data (materials and summaries) after successful authentication
        try {
          await loadUserData();
        } catch (loadError) {
          console.warn('Failed to load user data after login:', loadError);
          // Don't block navigation if data loading fails
        }
        
        router.push('/dashboard');
      } else {
        throw new Error(data.message || 'Authentication failed');
      }
    } catch (err: any) {
      console.error('Auth error:', err);
      setError(err.message || 'Authentication failed. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const toggleMode = () => {
    setIsLogin(!isLogin);
    setError('');
    setFormData({
      name: '',
      email: '',
      password: '',
      confirmPassword: ''
    });
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-black to-purple-900 relative overflow-hidden flex items-center justify-center p-3 sm:p-4 lg:p-6 xl:p-8">
      {/* Space Background with Stars */}
      <div className="absolute inset-0 overflow-hidden">
        {/* Stars field */}
        <div className="stars-container absolute inset-0">
          {/* Generate colorful moving stars - now using deterministic positions */}
          {starPositions.map((star, i) => {
            const colors = [
              'bg-gradient-to-r from-pink-400 to-red-400',
              'bg-gradient-to-r from-blue-400 to-cyan-400', 
              'bg-gradient-to-r from-purple-400 to-pink-400',
              'bg-gradient-to-r from-green-400 to-emerald-400',
              'bg-gradient-to-r from-yellow-400 to-orange-400',
              'bg-gradient-to-r from-indigo-400 to-purple-400',
              'bg-gradient-to-r from-cyan-400 to-blue-400',
              'bg-gradient-to-r from-rose-400 to-pink-400',
              'bg-white',
              'bg-gradient-to-r from-violet-400 to-purple-400'
            ];
            const animations = [
              'animate-star-twinkle',
              'animate-star-twinkle-delayed', 
              'animate-star-pulse',
              'animate-star-fade',
              'animate-star-pulse-delayed',
              'animate-star-fade-delayed',
              'animate-star-float-horizontal',
              'animate-star-float-vertical',
              'animate-star-orbit',
              'animate-star-drift'
            ];
            const sizes = ['w-3 h-3', 'w-2 h-2', 'w-1.5 h-1.5', 'w-1 h-1', 'w-0.5 h-0.5'];
            
            return (
              <div
                key={`star-${i}`}
                className={`absolute rounded-full ${colors[i % colors.length]} ${sizes[i % sizes.length]} ${animations[i % animations.length]} shadow-lg`}
                style={{
                  left: `${star.left}%`,
                  top: `${star.top}%`,
                  animationDelay: `${star.delay}s`,
                  animationDuration: `${star.duration}s`,
                  opacity: star.opacity,
                  filter: 'drop-shadow(0 0 6px currentColor)'
                }}
              ></div>
            );
          })}
          
          {/* Larger prominent colorful stars */}
          <div className="absolute top-20 left-10 w-3 h-3 bg-gradient-to-r from-pink-400 to-red-500 rounded-full animate-star-twinkle opacity-90 shadow-lg shadow-pink-400/60" style={{filter: 'drop-shadow(0 0 8px #f472b6)'}}></div>
          <div className="absolute top-32 right-24 w-2.5 h-2.5 bg-gradient-to-r from-blue-400 to-cyan-400 rounded-full animate-star-twinkle-delayed opacity-80 shadow-lg shadow-blue-400/50" style={{animationDelay: '0.5s', filter: 'drop-shadow(0 0 6px #60a5fa)'}}></div>
          <div className="absolute bottom-32 left-16 w-3 h-3 bg-gradient-to-r from-emerald-400 to-teal-500 rounded-full animate-star-twinkle opacity-90 shadow-lg shadow-emerald-400/60" style={{animationDelay: '2s', filter: 'drop-shadow(0 0 8px #34d399)'}}></div>
          <div className="absolute top-40 left-2/3 w-2.5 h-2.5 bg-gradient-to-r from-purple-400 to-violet-500 rounded-full animate-star-twinkle opacity-80 shadow-lg shadow-purple-400/50" style={{animationDelay: '1.3s', filter: 'drop-shadow(0 0 6px #a78bfa)'}}></div>
          <div className="absolute bottom-20 right-1/3 w-2 h-2 bg-gradient-to-r from-yellow-400 to-orange-500 rounded-full animate-star-pulse opacity-85 shadow-lg shadow-yellow-400/50" style={{animationDelay: '0.8s', filter: 'drop-shadow(0 0 5px #facc15)'}}></div>
          <div className="absolute top-60 left-1/4 w-2 h-2 bg-gradient-to-r from-rose-400 to-pink-500 rounded-full animate-star-twinkle-delayed opacity-75 shadow-lg shadow-rose-400/50" style={{animationDelay: '1.5s', filter: 'drop-shadow(0 0 5px #fb7185)'}}></div>
          
          {/* Medium colorful stars */}
          <div className="absolute top-24 right-1/4 w-1.5 h-1.5 bg-gradient-to-r from-indigo-400 to-blue-500 rounded-full animate-star-pulse opacity-70 shadow-lg shadow-indigo-400/50" style={{filter: 'drop-shadow(0 0 4px #6366f1)'}}></div>
          <div className="absolute top-56 left-3/4 w-1 h-1 bg-gradient-to-r from-green-400 to-emerald-500 rounded-full animate-star-pulse-delayed opacity-60 shadow-lg shadow-green-400/50" style={{animationDelay: '0.3s', filter: 'drop-shadow(0 0 3px #22c55e)'}}></div>
          <div className="absolute bottom-40 right-1/2 w-1.5 h-1.5 bg-gradient-to-r from-purple-400 to-fuchsia-500 rounded-full animate-star-pulse opacity-75 shadow-lg shadow-purple-400/50" style={{animationDelay: '0.7s', filter: 'drop-shadow(0 0 4px #a855f7)'}}></div>
          <div className="absolute top-72 right-12 w-1 h-1 bg-gradient-to-r from-pink-400 to-rose-500 rounded-full animate-star-pulse-delayed opacity-65 shadow-lg shadow-pink-400/50" style={{animationDelay: '1.1s', filter: 'drop-shadow(0 0 3px #ec4899)'}}></div>
          <div className="absolute bottom-60 left-1/3 w-1.5 h-1.5 bg-gradient-to-r from-orange-400 to-red-500 rounded-full animate-star-twinkle-delayed opacity-70 shadow-lg shadow-orange-400/50" style={{animationDelay: '1.8s', filter: 'drop-shadow(0 0 4px #fb923c)'}}></div>
          
          {/* Small colorful background stars */}
          <div className="absolute top-16 left-1/2 w-1 h-1 bg-gradient-to-r from-cyan-400 to-blue-500 rounded-full animate-star-fade opacity-50 shadow-lg shadow-cyan-400/40" style={{filter: 'drop-shadow(0 0 3px #06b6d4)'}}></div>
          <div className="absolute top-44 right-16 w-0.5 h-0.5 bg-gradient-to-r from-violet-400 to-purple-500 rounded-full animate-star-fade-delayed opacity-45 shadow-lg shadow-violet-400/40" style={{animationDelay: '0.4s', filter: 'drop-shadow(0 0 2px #8b5cf6)'}}></div>
          <div className="absolute bottom-24 left-1/4 w-1 h-1 bg-gradient-to-r from-teal-400 to-green-500 rounded-full animate-star-fade opacity-55 shadow-lg shadow-teal-400/40" style={{animationDelay: '0.9s', filter: 'drop-shadow(0 0 3px #14b8a6)'}}></div>
          <div className="absolute bottom-16 right-1/3 w-0.5 h-0.5 bg-gradient-to-r from-amber-400 to-yellow-500 rounded-full animate-star-fade-delayed opacity-50 shadow-lg shadow-amber-400/40" style={{animationDelay: '1.4s', filter: 'drop-shadow(0 0 2px #f59e0b)'}}></div>
          <div className="absolute top-88 left-20 w-0.5 h-0.5 bg-gradient-to-r from-red-400 to-pink-500 rounded-full animate-star-fade opacity-45 shadow-lg shadow-red-400/40" style={{animationDelay: '0.6s', filter: 'drop-shadow(0 0 2px #f87171)'}}></div>
          <div className="absolute top-36 right-2/3 w-1 h-1 bg-gradient-to-r from-lime-400 to-green-500 rounded-full animate-star-twinkle opacity-50 shadow-lg shadow-lime-400/40" style={{animationDelay: '2.2s', filter: 'drop-shadow(0 0 3px #84cc16)'}}></div>
          <div className="absolute bottom-48 left-2/3 w-0.5 h-0.5 bg-gradient-to-r from-sky-400 to-blue-500 rounded-full animate-star-pulse opacity-45 shadow-lg shadow-sky-400/40" style={{animationDelay: '1.7s', filter: 'drop-shadow(0 0 2px #0ea5e9)'}}></div>
        </div>
        
        {/* Moving planets/celestial bodies with enhanced independent movement */}
        <div 
          className="absolute top-10 right-10 w-12 h-12 bg-gradient-to-br from-purple-400 to-pink-500 rounded-full opacity-30 animate-float-planet shadow-2xl"
          style={{
            boxShadow: '0 0 30px rgba(147, 51, 234, 0.6), 0 0 60px rgba(236, 72, 153, 0.3)'
          }}
        ></div>
        <div 
          className="absolute bottom-20 left-12 w-8 h-8 bg-gradient-to-br from-blue-400 to-cyan-500 rounded-full opacity-25 animate-float-planet-slow shadow-2xl" 
          style={{
            animationDelay: '2s',
            boxShadow: '0 0 25px rgba(59, 130, 246, 0.5), 0 0 50px rgba(6, 182, 212, 0.3)'
          }}
        ></div>
        <div 
          className="absolute top-1/2 right-8 w-6 h-6 bg-gradient-to-br from-emerald-400 to-teal-500 rounded-full opacity-20 animate-float-planet-reverse shadow-2xl" 
          style={{
            animationDelay: '1s',
            boxShadow: '0 0 20px rgba(16, 185, 129, 0.4), 0 0 40px rgba(20, 184, 166, 0.2)'
          }}
        ></div>
        <div 
          className="absolute top-1/3 left-8 w-10 h-10 bg-gradient-to-br from-yellow-400 to-orange-500 rounded-full opacity-25 animate-float-planet shadow-2xl" 
          style={{
            animationDelay: '3s',
            boxShadow: '0 0 25px rgba(251, 191, 36, 0.5), 0 0 50px rgba(245, 158, 11, 0.3)'
          }}
        ></div>
        <div 
          className="absolute bottom-1/3 right-1/4 w-7 h-7 bg-gradient-to-br from-rose-400 to-red-500 rounded-full opacity-22 animate-float-planet-slow shadow-2xl" 
          style={{
            animationDelay: '4s',
            boxShadow: '0 0 22px rgba(251, 113, 133, 0.5), 0 0 45px rgba(239, 68, 68, 0.3)'
          }}
        ></div>
        
        {/* Enhanced shooting stars with trails */}
        <div className="absolute top-20 left-0 w-1 h-1 bg-white rounded-full animate-shooting-star opacity-0">
          <div className="absolute w-20 h-0.5 bg-gradient-to-r from-white via-blue-200 to-transparent -translate-y-0.5 blur-sm"></div>
        </div>
        <div className="absolute top-60 left-0 w-0.5 h-0.5 bg-blue-200 rounded-full animate-shooting-star-delayed opacity-0" style={{animationDelay: '8s'}}>
          <div className="absolute w-16 h-0.5 bg-gradient-to-r from-blue-200 via-purple-200 to-transparent -translate-y-0.5 blur-sm"></div>
        </div>
        <div className="absolute bottom-40 left-0 w-1 h-1 bg-purple-200 rounded-full animate-shooting-star opacity-0" style={{animationDelay: '15s'}}>
          <div className="absolute w-24 h-0.5 bg-gradient-to-r from-purple-200 via-pink-200 to-transparent -translate-y-0.5 blur-sm"></div>
        </div>
        <div className="absolute top-1/3 left-0 w-0.5 h-0.5 bg-cyan-200 rounded-full animate-shooting-star-delayed opacity-0" style={{animationDelay: '22s'}}>
          <div className="absolute w-18 h-0.5 bg-gradient-to-r from-cyan-200 via-blue-300 to-transparent -translate-y-0.5 blur-sm"></div>
        </div>
        
        {/* Enhanced nebula-like gradient orbs with independent depth movement */}
        <div 
          className="absolute top-1/4 left-1/4 w-96 h-96 bg-gradient-to-r from-purple-600/15 to-blue-600/15 rounded-full filter blur-3xl animate-nebula-drift"
          style={{
            boxShadow: '0 0 100px rgba(147, 51, 234, 0.2)'
          }}
        ></div>
        <div 
          className="absolute bottom-1/4 right-1/4 w-80 h-80 bg-gradient-to-r from-pink-600/12 to-purple-600/12 rounded-full filter blur-3xl animate-nebula-drift-reverse"
          style={{
            boxShadow: '0 0 80px rgba(236, 72, 153, 0.15)'
          }}
        ></div>
        <div 
          className="absolute top-1/2 left-1/2 w-64 h-64 bg-gradient-to-r from-cyan-600/12 to-blue-600/12 rounded-full filter blur-3xl animate-nebula-pulse"
          style={{
            transform: 'translate(-50%, -50%)',
            boxShadow: '0 0 60px rgba(6, 182, 212, 0.15)'
          }}
        ></div>
        <div 
          className="absolute top-3/4 left-1/3 w-72 h-72 bg-gradient-to-r from-emerald-600/10 to-teal-600/10 rounded-full filter blur-3xl animate-nebula-drift"
          style={{
            boxShadow: '0 0 70px rgba(16, 185, 129, 0.12)',
            animationDelay: '5s'
          }}
        ></div>
        <div 
          className="absolute top-1/6 right-1/3 w-88 h-88 bg-gradient-to-r from-orange-600/8 to-red-600/8 rounded-full filter blur-3xl animate-nebula-drift-reverse"
          style={{
            boxShadow: '0 0 90px rgba(251, 146, 60, 0.1)',
            animationDelay: '8s'
          }}
        ></div>
      </div>

      {/* Auth Container - Space Glass Effect */}
      <div className="relative z-10 w-full max-w-sm sm:max-w-md mx-auto">
        <div 
          className="bg-black/30 backdrop-blur-xl rounded-2xl sm:rounded-3xl shadow-2xl border border-white/10 overflow-hidden transform-gpu transition-all duration-500 hover:shadow-purple-500/20 hover:border-purple-500/30"
          style={{
            boxShadow: '0 0 60px rgba(147, 51, 234, 0.1), inset 0 0 60px rgba(255, 255, 255, 0.05)'
          }}
        >
          {/* Header with animated toggle */}
          <div className="relative p-5 sm:p-6 lg:p-8 text-center">
            <div className="mb-5 sm:mb-6">
              <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold mb-2 gradient-title animate-gradient-shift">
                <span className="inline-block animate-letter-float" style={{animationDelay: '0s'}}>A</span>
                <span className="inline-block animate-letter-float" style={{animationDelay: '0.1s'}}>I</span>
                <span className="inline-block mx-2"></span>
                <span className="inline-block animate-letter-float" style={{animationDelay: '0.2s'}}>S</span>
                <span className="inline-block animate-letter-float" style={{animationDelay: '0.3s'}}>t</span>
                <span className="inline-block animate-letter-float" style={{animationDelay: '0.4s'}}>u</span>
                <span className="inline-block animate-letter-float" style={{animationDelay: '0.5s'}}>d</span>
                <span className="inline-block animate-letter-float" style={{animationDelay: '0.6s'}}>y</span>
                <span className="inline-block mx-2"></span>
                <span className="inline-block animate-letter-float" style={{animationDelay: '0.7s'}}>U</span>
                <span className="inline-block animate-letter-float" style={{animationDelay: '0.8s'}}>n</span>
                <span className="inline-block animate-letter-float" style={{animationDelay: '0.9s'}}>i</span>
                <span className="inline-block animate-letter-float" style={{animationDelay: '1.0s'}}>v</span>
                <span className="inline-block animate-letter-float" style={{animationDelay: '1.1s'}}>e</span>
                <span className="inline-block animate-letter-float" style={{animationDelay: '1.2s'}}>r</span>
                <span className="inline-block animate-letter-float" style={{animationDelay: '1.3s'}}>s</span>
                <span className="inline-block animate-letter-float" style={{animationDelay: '1.4s'}}>e</span>
              </h1>
              <p className="text-gray-300 text-xs sm:text-sm lg:text-base animate-fadeInUp" style={{animationDelay: '1.5s'}}>Journey through the cosmos of knowledge</p>
            </div>

            {/* Toggle buttons with space theme */}
            <div className="relative bg-black/30 backdrop-blur-sm rounded-xl sm:rounded-2xl p-1 flex border border-white/10">
              <div 
                className={`absolute top-1 bottom-1 bg-gradient-to-r from-purple-500/80 via-blue-500/80 to-cyan-500/80 rounded-lg sm:rounded-xl transition-all duration-700 ease-out shadow-lg backdrop-blur-sm ${
                  isLogin ? 'left-1 right-1/2' : 'left-1/2 right-1'
                }`}
              ></div>
              <button
                onClick={() => !isLogin && toggleMode()}
                className={`relative z-10 flex-1 py-2.5 sm:py-3 rounded-lg sm:rounded-xl font-semibold text-sm sm:text-base transition-all duration-500 transform focus:outline-none focus:ring-2 focus:ring-purple-500/50 ${
                  isLogin 
                    ? 'text-white scale-105' 
                    : 'text-gray-400 hover:text-gray-300 hover:scale-105'
                }`}
                aria-pressed={isLogin}
                role="tab"
              >
                Login
              </button>
              <button
                onClick={() => isLogin && toggleMode()}
                className={`relative z-10 flex-1 py-2.5 sm:py-3 rounded-lg sm:rounded-xl font-semibold text-sm sm:text-base transition-all duration-500 transform focus:outline-none focus:ring-2 focus:ring-purple-500/50 ${
                  !isLogin 
                    ? 'text-white scale-105' 
                    : 'text-gray-400 hover:text-gray-300 hover:scale-105'
                }`}
                aria-pressed={!isLogin}
                role="tab"
              >
                Sign Up
              </button>
            </div>
          </div>

          {/* Form with Space Theme */}
          <div className="px-5 sm:px-6 lg:px-8 pb-5 sm:pb-6 lg:pb-8">
            {/* Error message with space styling */}
            {error && (
              <div className="mb-4 sm:mb-6 p-3 sm:p-4 bg-red-500/10 border border-red-400/30 rounded-xl backdrop-blur-sm">
                <div className="flex items-center gap-2 sm:gap-3">
                  <div className="flex-shrink-0">
                    <svg className="w-4 h-4 sm:w-5 sm:h-5 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                  <p className="text-xs sm:text-sm text-red-400">{error}</p>
                </div>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4 sm:space-y-6">
              {/* Name field for signup with space styling */}
              <div className={`transition-all duration-700 ease-out ${
                isLogin 
                  ? 'max-h-0 opacity-0 overflow-hidden transform -translate-y-4' 
                  : 'max-h-24 opacity-100 transform translate-y-0'
              }`}>
                <label className="block text-xs sm:text-sm font-medium text-gray-200 mb-2">
                  🚀 Astronaut Name
                </label>
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleInputChange}
                  className="w-full px-3 sm:px-4 py-2.5 sm:py-3 bg-black/20 backdrop-blur-sm border border-white/20 rounded-lg sm:rounded-xl text-white placeholder-gray-400 focus:border-purple-400 focus:ring-2 focus:ring-purple-400/30 transition-all duration-300 hover:border-white/30 focus:scale-[1.02] focus:shadow-lg focus:shadow-purple-500/20 text-sm sm:text-base"
                  placeholder="Enter your cosmic identity"
                  required={!isLogin}
                  style={{
                    boxShadow: 'inset 0 0 20px rgba(255, 255, 255, 0.05)'
                  }}
                />
              </div>

              {/* Email field with space styling */}
              <div className="animate-fadeInUp">
                <label className="block text-xs sm:text-sm font-medium text-gray-200 mb-2">
                  📡 Transmission ID
                </label>
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleInputChange}
                  className="w-full px-3 sm:px-4 py-2.5 sm:py-3 bg-black/20 backdrop-blur-sm border border-white/20 rounded-lg sm:rounded-xl text-white placeholder-gray-400 focus:border-cyan-400 focus:ring-2 focus:ring-cyan-400/30 transition-all duration-300 hover:border-white/30 focus:scale-[1.02] focus:shadow-lg focus:shadow-cyan-500/20 text-sm sm:text-base"
                  placeholder="your.signal@universe.space"
                  required
                  style={{
                    boxShadow: 'inset 0 0 20px rgba(255, 255, 255, 0.05)'
                  }}
                />
              </div>

              {/* Password field with space styling */}
              <div className="animate-fadeInUp" style={{ animationDelay: '0.1s' }}>
                <label className="block text-xs sm:text-sm font-medium text-gray-200 mb-2">
                  🔐 Access Code
                </label>
                <input
                  type="password"
                  name="password"
                  value={formData.password}
                  onChange={handleInputChange}
                  className="w-full px-3 sm:px-4 py-2.5 sm:py-3 bg-black/20 backdrop-blur-sm border border-white/20 rounded-lg sm:rounded-xl text-white placeholder-gray-400 focus:border-blue-400 focus:ring-2 focus:ring-blue-400/30 transition-all duration-300 hover:border-white/30 focus:scale-[1.02] focus:shadow-lg focus:shadow-blue-500/20 text-sm sm:text-base"
                  placeholder="Enter your cosmic password"
                  required
                  style={{
                    boxShadow: 'inset 0 0 20px rgba(255, 255, 255, 0.05)'
                  }}
                />
              </div>

              {/* Confirm Password field for signup with space styling */}
              <div className={`transition-all duration-700 ease-out ${
                isLogin 
                  ? 'max-h-0 opacity-0 overflow-hidden transform -translate-y-4' 
                  : 'max-h-32 opacity-100 transform translate-y-0'
              }`}>
                <label className="block text-xs sm:text-sm font-medium text-gray-200 mb-2">
                  🔒 Confirm Access Code
                </label>
                <input
                  type="password"
                  name="confirmPassword"
                  value={formData.confirmPassword}
                  onChange={handleInputChange}
                  className="w-full px-3 sm:px-4 py-2.5 sm:py-3 bg-black/20 backdrop-blur-sm border border-white/20 rounded-lg sm:rounded-xl text-white placeholder-gray-400 focus:border-green-400 focus:ring-2 focus:ring-green-400/30 transition-all duration-300 hover:border-white/30 focus:scale-[1.02] focus:shadow-lg focus:shadow-green-500/20 text-sm sm:text-base"
                  placeholder="Verify your cosmic password"
                  required={!isLogin}
                  style={{
                    boxShadow: 'inset 0 0 20px rgba(255, 255, 255, 0.05)'
                  }}
                />
              </div>

              {/* Forgot password link for login */}
              {isLogin && (
                <div className="text-right animate-fadeInUp" style={{ animationDelay: '0.2s' }}>
                  <button
                    type="button"
                    className="text-xs sm:text-sm text-purple-400 hover:text-purple-300 transition-colors duration-300"
                  >
                    Forgot your password?
                  </button>
                </div>
              )}

              {/* Submit button */}
              <button
                type="submit"
                disabled={isLoading}
                className="w-full group relative bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 hover:from-blue-700 hover:via-purple-700 hover:to-pink-700 text-white py-3 sm:py-4 rounded-lg sm:rounded-xl font-semibold transition-all duration-300 shadow-lg hover:shadow-purple-500/25 transform hover:scale-[1.02] hover:-translate-y-0.5 disabled:opacity-50 disabled:cursor-not-allowed overflow-hidden text-sm sm:text-base"
                style={{
                  boxShadow: '0 0 30px rgba(147, 51, 234, 0.4), 0 0 60px rgba(59, 130, 246, 0.3), 0 25px 50px -12px rgba(0, 0, 0, 0.25)'
                }}
              >
                <span className="relative z-10 flex items-center justify-center gap-2 sm:gap-3">
                  {isLoading ? (
                    <>
                      <div className="w-4 h-4 sm:w-5 sm:h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                      Processing...
                    </>
                  ) : (
                    <>
                      {isLogin ? '🚀 Sign In' : '✨ Create Account'}
                      <svg className="w-4 h-4 sm:w-5 sm:h-5 group-hover:translate-x-1 transition-transform duration-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                      </svg>
                    </>
                  )}
                </span>
                {/* Subtle glow effect instead of color reversal */}
                <div className="absolute -inset-1 bg-gradient-to-r from-blue-600/20 via-purple-600/20 to-pink-600/20 rounded-lg sm:rounded-xl opacity-0 group-hover:opacity-100 transition-opacity duration-300 blur-sm"></div>
              </button>
            </form>

            {/* Social login */}
            <div className="mt-6 sm:mt-8">
              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-gray-500/30"></div>
                </div>
                <div className="relative flex justify-center text-xs sm:text-sm">
                  <span className="px-2 bg-black/50 text-gray-300">Or continue with</span>
                </div>
              </div>

              <div className="mt-4 sm:mt-6 grid grid-cols-2 gap-2 sm:gap-3">
                <button className="group w-full inline-flex justify-center py-2.5 sm:py-3 px-3 sm:px-4 border border-white/20 rounded-lg sm:rounded-xl shadow-sm bg-black/30 backdrop-blur-sm text-xs sm:text-sm font-medium text-gray-300 hover:bg-black/50 hover:border-purple-500/50 transition-all duration-300">
                  <span className="flex items-center gap-1.5 sm:gap-2 group-hover:scale-105 transition-transform duration-300">
                    <svg className="w-4 h-4 sm:w-5 sm:h-5" viewBox="0 0 24 24">
                      <path fill="currentColor" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                      <path fill="currentColor" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                      <path fill="currentColor" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                      <path fill="currentColor" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                    </svg>
                    <span className="hidden sm:inline">Google</span>
                  </span>
                </button>

                <button className="group w-full inline-flex justify-center py-2.5 sm:py-3 px-3 sm:px-4 border border-white/20 rounded-lg sm:rounded-xl shadow-sm bg-black/30 backdrop-blur-sm text-xs sm:text-sm font-medium text-gray-300 hover:bg-black/50 hover:border-purple-500/50 transition-all duration-300">
                  <span className="flex items-center gap-1.5 sm:gap-2 group-hover:scale-105 transition-transform duration-300">
                    <svg className="w-4 h-4 sm:w-5 sm:h-5" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M12 0C5.374 0 0 5.373 0 12 0 17.302 3.438 21.8 8.207 23.387c.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23A11.509 11.509 0 0112 5.803c1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576C20.566 21.797 24 17.3 24 12c0-6.627-5.373-12-12-12z"/>
                    </svg>
                    <span className="hidden sm:inline">GitHub</span>
                  </span>
                </button>
              </div>
            </div>

            {/* Footer text */}
            <p className="mt-6 sm:mt-8 text-center text-xs sm:text-sm text-gray-400">
              {isLogin ? "Don't have an account? " : "Already have an account? "}
              <button
                onClick={toggleMode}
                className="text-purple-400 hover:text-purple-300 font-medium transition-colors duration-300"
              >
                {isLogin ? 'Sign up here' : 'Sign in here'}
              </button>
            </p>
          </div>
        </div>

        {/* Back to landing page */}
        <div className="text-center mt-4 sm:mt-6">
          <button
            onClick={() => router.push('/')}
            className="text-gray-400 hover:text-gray-300 transition-colors duration-300 flex items-center gap-1.5 sm:gap-2 mx-auto text-xs sm:text-sm"
          >
            <svg className="w-3 h-3 sm:w-4 sm:h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            Back to landing page
          </button>
        </div>
      </div>
    </div>
  );
}
