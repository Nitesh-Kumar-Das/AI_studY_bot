'use client';

import { useEffect, useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import useUserStore from '../store/userStore';
import LoadingSpinner from '../components/LoadingSpinner';

export default function Home() {
  const router = useRouter();
  const { isAuthenticated, setAuthenticated, setUser, loadUserData } = useUserStore();
  const [isLoaded, setIsLoaded] = useState(false);
  const [isRedirecting, setIsRedirecting] = useState(false);
  
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

  useEffect(() => {
    // Check if user is authenticated with real token validation
    const token = localStorage.getItem('authToken');
    if (token) {
      // In a real app, you should validate the token with the backend
      // For now, we'll just check if token exists and set authentication state
      // The user data should be persisted in Zustand store from previous login
      setAuthenticated(true);
      
      // Load user data if authenticated and not already loaded
      loadUserData().catch(error => {
        console.warn('Failed to load user data on app initialization:', error);
      });
    }
    setIsLoaded(true);
  }, [setAuthenticated, loadUserData]); // Zustand setters are stable

  // Handle navigation when authenticated
  // Remove automatic redirect - let users stay on landing page if they want
  // useEffect(() => {
  //   if (isAuthenticated && isLoaded && !isRedirecting) {
  //     setIsRedirecting(true);
  //     router.push('/dashboard');
  //   }
  // }, [isAuthenticated, isLoaded, isRedirecting, router]);

  const handleGetStarted = () => {
    // If authenticated, go to dashboard; otherwise go to auth page
    if (isAuthenticated) {
      router.push('/dashboard');
    } else {
      router.push('/auth');
    }
  };

  // Show loading state while checking authentication
  if (!isLoaded) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-gray-900 via-purple-900 to-black flex items-center justify-center">
        <LoadingSpinner 
          size="lg" 
          message="Loading..." 
        />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-900 via-purple-900 to-black relative overflow-hidden">
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
        
        {/* Moving planets/celestial bodies with enhanced independent movement - optimized for mobile */}
        <div 
          className="absolute top-10 right-10 w-8 h-8 sm:w-10 sm:h-10 lg:w-12 lg:h-12 bg-gradient-to-br from-purple-400 to-pink-500 rounded-full opacity-30 animate-float-planet shadow-2xl"
          style={{
            boxShadow: '0 0 30px rgba(147, 51, 234, 0.6), 0 0 60px rgba(236, 72, 153, 0.3)'
          }}
        ></div>
        <div 
          className="absolute bottom-20 left-12 w-6 h-6 sm:w-8 sm:h-8 bg-gradient-to-br from-blue-400 to-cyan-500 rounded-full opacity-25 animate-float-planet-slow shadow-2xl" 
          style={{
            animationDelay: '2s',
            boxShadow: '0 0 25px rgba(59, 130, 246, 0.5), 0 0 50px rgba(6, 182, 212, 0.3)'
          }}
        ></div>
        <div 
          className="absolute top-1/2 right-8 w-4 h-4 sm:w-6 sm:h-6 bg-gradient-to-br from-emerald-400 to-teal-500 rounded-full opacity-20 animate-float-planet-reverse shadow-2xl" 
          style={{
            animationDelay: '1s',
            boxShadow: '0 0 20px rgba(16, 185, 129, 0.4), 0 0 40px rgba(20, 184, 166, 0.2)'
          }}
        ></div>
        <div 
          className="hidden sm:block absolute top-1/3 left-8 w-8 h-8 lg:w-10 lg:h-10 bg-gradient-to-br from-yellow-400 to-orange-500 rounded-full opacity-25 animate-float-planet shadow-2xl" 
          style={{
            animationDelay: '3s',
            boxShadow: '0 0 25px rgba(251, 191, 36, 0.5), 0 0 50px rgba(245, 158, 11, 0.3)'
          }}
        ></div>
        <div 
          className="hidden lg:block absolute bottom-1/3 right-1/4 w-7 h-7 bg-gradient-to-br from-rose-400 to-red-500 rounded-full opacity-22 animate-float-planet-slow shadow-2xl" 
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
        
        {/* Enhanced nebula-like gradient orbs with independent depth movement - reduced for mobile */}
        <div 
          className="absolute top-1/4 left-1/4 w-64 sm:w-80 lg:w-96 h-64 sm:h-80 lg:h-96 bg-gradient-to-r from-purple-600/15 to-blue-600/15 rounded-full filter blur-3xl animate-nebula-drift"
          style={{
            boxShadow: '0 0 100px rgba(147, 51, 234, 0.2)'
          }}
        ></div>
        <div 
          className="absolute bottom-1/4 right-1/4 w-56 sm:w-64 lg:w-80 h-56 sm:h-64 lg:h-80 bg-gradient-to-r from-pink-600/12 to-purple-600/12 rounded-full filter blur-3xl animate-nebula-drift-reverse"
          style={{
            boxShadow: '0 0 80px rgba(236, 72, 153, 0.15)'
          }}
        ></div>
        <div 
          className="absolute top-1/2 left-1/2 w-48 sm:w-56 lg:w-64 h-48 sm:h-56 lg:h-64 bg-gradient-to-r from-cyan-600/12 to-blue-600/12 rounded-full filter blur-3xl animate-nebula-pulse"
          style={{
            transform: 'translate(-50%, -50%)',
            boxShadow: '0 0 60px rgba(6, 182, 212, 0.15)'
          }}
        ></div>
        <div 
          className="hidden sm:block absolute top-3/4 left-1/3 w-60 sm:w-72 h-60 sm:h-72 bg-gradient-to-r from-emerald-600/10 to-teal-600/10 rounded-full filter blur-3xl animate-nebula-drift"
          style={{
            boxShadow: '0 0 70px rgba(16, 185, 129, 0.12)',
            animationDelay: '5s'
          }}
        ></div>
        <div 
          className="hidden lg:block absolute top-1/6 right-1/3 w-88 h-88 bg-gradient-to-r from-orange-600/8 to-red-600/8 rounded-full filter blur-3xl animate-nebula-drift-reverse"
          style={{
            boxShadow: '0 0 90px rgba(251, 146, 60, 0.1)',
            animationDelay: '8s'
          }}
        ></div>
      </div>

      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12 lg:py-16">
        {/* Hero Section */}
        <div className={`text-center mb-12 sm:mb-16 lg:mb-20 ${isLoaded ? 'animate-fadeInUp' : 'opacity-0'}`}>
          <div className="mb-6 sm:mb-8">
            {/* AI Brain Logo */}
            <div className="inline-block mb-6 sm:mb-8">
              <div className="relative group cursor-pointer transform hover:scale-105 transition-all duration-500">
                <div className="w-24 h-24 sm:w-28 sm:h-28 lg:w-32 lg:h-32 mx-auto relative overflow-hidden">
                  {/* Brain SVG Logo */}
                  <svg 
                    viewBox="0 0 100 100" 
                    className="w-full h-full transform group-hover:scale-110 transition-all duration-500"
                    style={{
                      filter: 'drop-shadow(0 0 20px rgba(6, 182, 212, 0.4)) drop-shadow(0 0 40px rgba(34, 197, 94, 0.3))'
                    }}
                  >
                    {/* Left brain hemisphere - Cyan */}
                    <path
                      d="M25 30 C15 30, 10 40, 10 50 C10 60, 15 70, 25 70 C35 70, 45 65, 50 55 L50 45 C45 35, 35 30, 25 30 Z"
                      fill="url(#brainGradientCyan)"
                      className="animate-pulse"
                      style={{animationDelay: '0s', animationDuration: '3s'}}
                    />
                    
                    {/* Right brain hemisphere - Green */}
                    <path
                      d="M75 30 C85 30, 90 40, 90 50 C90 60, 85 70, 75 70 C65 70, 55 65, 50 55 L50 45 C55 35, 65 30, 75 30 Z"
                      fill="url(#brainGradientGreen)"
                      className="animate-pulse"
                      style={{animationDelay: '1s', animationDuration: '3s'}}
                    />
                    
                    {/* Neural pathways - Left side */}
                    <path
                      d="M20 40 Q30 45, 35 50 Q30 55, 20 60"
                      stroke="url(#brainGradientCyan)"
                      strokeWidth="2"
                      fill="none"
                      className="animate-pulse"
                      style={{animationDelay: '0.5s', animationDuration: '2.5s'}}
                    />
                    <path
                      d="M25 35 Q35 40, 40 45"
                      stroke="url(#brainGradientCyan)"
                      strokeWidth="1.5"
                      fill="none"
                      className="animate-pulse"
                      style={{animationDelay: '1.2s', animationDuration: '2s'}}
                    />
                    
                    {/* Neural pathways - Right side */}
                    <path
                      d="M80 40 Q70 45, 65 50 Q70 55, 80 60"
                      stroke="url(#brainGradientGreen)"
                      strokeWidth="2"
                      fill="none"
                      className="animate-pulse"
                      style={{animationDelay: '1.5s', animationDuration: '2.5s'}}
                    />
                    <path
                      d="M75 35 Q65 40, 60 45"
                      stroke="url(#brainGradientGreen)"
                      strokeWidth="1.5"
                      fill="none"
                      className="animate-pulse"
                      style={{animationDelay: '0.8s', animationDuration: '2s'}}
                    />
                    
                    {/* Central connection */}
                    <circle
                      cx="50"
                      cy="50"
                      r="3"
                      fill="url(#brainGradientCenter)"
                      className="animate-ping"
                      style={{animationDuration: '2s'}}
                    />
                    
                    {/* Neural nodes */}
                    <circle cx="25" cy="45" r="1.5" fill="#06b6d4" className="animate-pulse" style={{animationDelay: '0.3s'}} />
                    <circle cx="30" cy="55" r="1.5" fill="#06b6d4" className="animate-pulse" style={{animationDelay: '0.8s'}} />
                    <circle cx="75" cy="45" r="1.5" fill="#22c55e" className="animate-pulse" style={{animationDelay: '0.6s'}} />
                    <circle cx="70" cy="55" r="1.5" fill="#22c55e" className="animate-pulse" style={{animationDelay: '1.1s'}} />
                    
                    {/* Gradient definitions */}
                    <defs>
                      <linearGradient id="brainGradientCyan" x1="0%" y1="0%" x2="100%" y2="100%">
                        <stop offset="0%" stopColor="#06b6d4" />
                        <stop offset="100%" stopColor="#0891b2" />
                      </linearGradient>
                      <linearGradient id="brainGradientGreen" x1="0%" y1="0%" x2="100%" y2="100%">
                        <stop offset="0%" stopColor="#22c55e" />
                        <stop offset="100%" stopColor="#16a34a" />
                      </linearGradient>
                      <linearGradient id="brainGradientCenter" x1="0%" y1="0%" x2="100%" y2="100%">
                        <stop offset="0%" stopColor="#06b6d4" />
                        <stop offset="50%" stopColor="#8b5cf6" />
                        <stop offset="100%" stopColor="#22c55e" />
                      </linearGradient>
                    </defs>
                  </svg>
                  
                  {/* Glow effect background */}
                  <div className="absolute -inset-4 bg-gradient-to-r from-cyan-500/20 via-purple-500/20 to-green-500/20 rounded-full blur-xl opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
                </div>
              </div>
            </div>
            
            <h1 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl xl:text-8xl font-bold bg-gradient-to-r from-blue-400 via-purple-400 to-pink-400 bg-clip-text text-transparent mb-4 sm:mb-6 animate-gradient-x">
              AI Study Hub
            </h1>
            <div className="w-24 sm:w-28 lg:w-32 h-1 bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 mx-auto mb-6 sm:mb-8 rounded-full"></div>
          </div>
          
          <p className="text-lg sm:text-xl lg:text-2xl text-gray-300 mb-8 sm:mb-10 lg:mb-12 max-w-4xl mx-auto leading-relaxed px-4">
            Revolutionize your learning with AI-powered study tools. 
            <span className="text-transparent bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text font-semibold"> Upload, Analyze, Master</span> - 
            your complete learning ecosystem powered by artificial intelligence.
          </p>
          
          <div className="flex flex-col gap-4 sm:gap-6 justify-center items-center px-4">
            <button
              onClick={handleGetStarted}
              className="group relative bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 hover:from-blue-700 hover:via-purple-700 hover:to-pink-700 text-white px-8 sm:px-10 lg:px-12 py-4 sm:py-5 rounded-2xl text-base sm:text-lg font-semibold transition-all duration-300 shadow-2xl hover:shadow-purple-500/25 transform hover:scale-[1.02] hover:-translate-y-0.5 overflow-hidden w-full max-w-xs sm:max-w-sm"
              style={{
                boxShadow: '0 0 30px rgba(147, 51, 234, 0.4), 0 0 60px rgba(59, 130, 246, 0.3), 0 25px 50px -12px rgba(0, 0, 0, 0.25)'
              }}
            >
              <span className="relative z-10 flex items-center justify-center gap-2 sm:gap-3">
                🚀 Start Your Journey
                <svg className="w-4 h-4 sm:w-5 sm:h-5 group-hover:translate-x-1 transition-transform duration-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                </svg>
              </span>
              {/* Subtle glow effect instead of color reversal */}
              <div className="absolute -inset-1 bg-gradient-to-r from-blue-600/20 via-purple-600/20 to-pink-600/20 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-300 blur-sm"></div>
            </button>
            <button className="group relative text-gray-300 hover:text-white px-6 sm:px-8 lg:px-10 py-4 sm:py-5 rounded-2xl text-base sm:text-lg font-medium border-2 border-gray-600 hover:border-purple-500 transition-all duration-300 backdrop-blur-sm bg-gray-900/20 hover:bg-gray-800/40 w-full max-w-xs sm:max-w-sm transform hover:scale-[1.02] overflow-hidden">
              <span className="relative z-10 flex items-center justify-center gap-2 sm:gap-3">
                📹 Watch Demo
                <svg className="w-4 h-4 sm:w-5 sm:h-5 group-hover:scale-110 transition-transform duration-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.828 14.828a4 4 0 01-5.656 0M9 10h1m4 0h1m-6 4h1m4 0h1" />
                </svg>
              </span>
              {/* Subtle glow effect for secondary button */}
              <div className="absolute -inset-1 bg-purple-600/20 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-300 blur-sm"></div>
            </button>
          </div>
        </div>

        {/* Features Grid with 3D Cards */}
        <div className={`grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 sm:gap-8 mb-12 sm:mb-16 lg:mb-20 px-4 ${isLoaded ? 'animate-fadeInUp' : 'opacity-0'}`} style={{animationDelay: '0.2s'}}>
          {[
            {
              icon: "📚",
              title: "Smart Upload",
              description: "Upload PDFs, documents, videos, and audio files for AI processing",
              gradient: "from-blue-500 to-cyan-400",
              glowColor: "blue"
            },
            {
              icon: "🤖", 
              title: "AI Analysis",
              description: "Advanced AI algorithms analyze and extract key insights from your materials",
              gradient: "from-purple-500 to-pink-400",
              glowColor: "purple"
            },
            {
              icon: "⚡",
              title: "Instant Summaries", 
              description: "Get comprehensive summaries and key points in seconds",
              gradient: "from-green-500 to-teal-400",
              glowColor: "green"
            },
            {
              icon: "📊",
              title: "Progress Analytics",
              description: "Track your learning journey with detailed performance insights",
              gradient: "from-orange-500 to-red-400",
              glowColor: "orange"
            }
          ].map((feature, index) => (
            <div key={index} className="group perspective-1000">
              <div 
                className="relative bg-gray-900/60 backdrop-blur-xl rounded-2xl sm:rounded-3xl p-6 sm:p-8 text-center transition-all duration-300 hover:bg-gray-800/80 border border-gray-700/50 hover:border-purple-500/50 transform-gpu hover:scale-[1.03] hover:-translate-y-1 shadow-2xl hover:shadow-purple-500/20"
              >
                {/* Subtle glow effect - reduced opacity for smoother transition */}
                <div className={`absolute -inset-1 bg-gradient-to-r ${feature.gradient} rounded-2xl sm:rounded-3xl blur opacity-0 group-hover:opacity-10 transition-opacity duration-500`}></div>
                
                <div className="relative z-10">
                  <div className={`text-4xl sm:text-5xl lg:text-6xl mb-4 sm:mb-6 transition-transform duration-300 group-hover:scale-110 group-hover:rotate-6`}>
                    {feature.icon}
                  </div>
                  <h3 className="text-lg sm:text-xl font-bold text-white mb-3 sm:mb-4 group-hover:text-purple-300 transition-colors duration-300">
                    {feature.title}
                  </h3>
                  <p className="text-sm sm:text-base text-gray-400 leading-relaxed group-hover:text-gray-300 transition-colors duration-300">
                    {feature.description}
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* How It Works - 3D Timeline */}
        <div className={`text-center mb-12 sm:mb-16 lg:mb-20 px-4 ${isLoaded ? 'animate-fadeInUp' : 'opacity-0'}`} style={{animationDelay: '0.4s'}}>
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-white mb-3 sm:mb-4">How It Works</h2>
          <p className="text-gray-400 mb-10 sm:mb-12 lg:mb-16 text-lg sm:text-xl">Experience the future of learning in three simple steps</p>
          
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 sm:gap-10 lg:gap-12 max-w-6xl mx-auto">
            {[
              {
                step: "01",
                title: "Upload & Organize",
                description: "Drag and drop your study materials in any format",
                icon: "📤",
                color: "blue",
                bgGradient: "from-blue-500/20 to-cyan-500/20"
              },
              {
                step: "02", 
                title: "AI Processing",
                description: "Our advanced AI analyzes and processes your content intelligently",
                icon: "⚡",
                color: "purple", 
                bgGradient: "from-purple-500/20 to-pink-500/20"
              },
              {
                step: "03",
                title: "Smart Learning",
                description: "Access summaries, quizzes, and personalized study plans",
                icon: "🎯",
                color: "green",
                bgGradient: "from-green-500/20 to-teal-500/20"
              }
            ].map((step, index) => (
              <div key={index} className="relative group">
                {/* Connection line - only visible on lg+ screens */}
                {index < 2 && (
                  <div className="hidden lg:block absolute top-16 sm:top-20 left-full w-full h-0.5 bg-gradient-to-r from-purple-500/50 to-transparent z-0">
                    <div className="absolute inset-0 bg-gradient-to-r from-purple-500 to-pink-500 scale-x-0 group-hover:scale-x-100 transition-transform duration-1000 origin-left"></div>
                  </div>
                )}
                
                <div 
                  className={`relative z-10 bg-gradient-to-br ${step.bgGradient} backdrop-blur-xl rounded-2xl sm:rounded-3xl p-6 sm:p-8 lg:p-10 border border-gray-700/50 hover:border-purple-500/50 transition-all duration-300 transform hover:scale-[1.02] hover:-translate-y-2 shadow-2xl hover:shadow-purple-500/15`}
                >
                  <div className={`w-16 h-16 sm:w-18 sm:h-18 lg:w-20 lg:h-20 rounded-xl sm:rounded-2xl bg-gradient-to-r ${
                    step.color === 'blue' ? 'from-blue-500 to-cyan-500' :
                    step.color === 'purple' ? 'from-purple-500 to-pink-500' :
                    'from-green-500 to-teal-500'
                  } flex items-center justify-center text-white text-lg sm:text-xl font-bold mx-auto mb-6 sm:mb-8 shadow-lg group-hover:shadow-2xl transition-all duration-300 group-hover:rotate-6`}>
                    {step.step}
                  </div>
                  <div className="text-3xl sm:text-4xl lg:text-5xl mb-4 sm:mb-6 transition-transform duration-300 group-hover:scale-110 group-hover:rotate-3">{step.icon}</div>
                  <h3 className="text-xl sm:text-2xl font-bold text-white mb-3 sm:mb-4 group-hover:text-purple-300 transition-colors duration-300">
                    {step.title}
                  </h3>
                  <p className="text-gray-400 text-base sm:text-lg group-hover:text-gray-300 transition-colors duration-300">
                    {step.description}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* CTA Section with Enhanced 3D Effect */}
        <div className={`relative group px-4 ${isLoaded ? 'animate-fadeInUp' : 'opacity-0'}`} style={{animationDelay: '0.6s'}}>
          <div 
            className="bg-gradient-to-r from-blue-600/90 via-purple-600/90 to-pink-600/90 backdrop-blur-xl rounded-2xl sm:rounded-3xl shadow-2xl p-6 sm:p-8 lg:p-12 text-center text-white border border-gray-700/50 transform transition-all duration-300 hover:scale-[1.02] hover:-translate-y-1 hover:shadow-purple-500/30"
            style={{
              boxShadow: '0 25px 50px -12px rgba(147, 51, 234, 0.25), 0 0 0 1px rgba(147, 51, 234, 0.1)'
            }}
          >
            {/* Subtle glow effect instead of color reversal */}
            <div className="absolute inset-0 bg-gradient-to-r from-blue-600/30 via-purple-600/30 to-pink-600/30 rounded-2xl sm:rounded-3xl opacity-0 group-hover:opacity-100 transition-opacity duration-500 blur-xl"></div>
            
            <div className="relative z-10">
              <h2 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold mb-4 sm:mb-6">
                Ready to Transform Your Learning?
              </h2>
              <p className="text-base sm:text-lg lg:text-xl mb-6 sm:mb-8 lg:mb-10 opacity-90 max-w-3xl mx-auto">
                Join thousands of students who are already using AI to enhance their studies and achieve extraordinary results.
              </p>
              <div className="flex flex-col gap-4 sm:gap-6 justify-center items-center">
                <button
                  onClick={handleGetStarted}
                  className="group bg-white text-purple-600 hover:bg-gray-100 px-8 sm:px-10 py-4 sm:py-5 rounded-2xl font-bold transition-all duration-300 shadow-lg hover:shadow-xl transform hover:scale-[1.02] hover:-translate-y-0.5 w-full max-w-xs sm:max-w-sm"
                >
                  <span className="flex items-center justify-center gap-2 sm:gap-3">
                    Get Started Now
                    <svg className="w-4 h-4 sm:w-5 sm:h-5 group-hover:translate-x-1 transition-transform duration-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                    </svg>
                  </span>
                </button>
                <button className="group text-white hover:text-gray-200 px-8 sm:px-10 py-4 sm:py-5 rounded-2xl font-medium border-2 border-white/30 hover:border-white/50 transition-all duration-300 backdrop-blur-sm w-full max-w-xs sm:max-w-sm transform hover:scale-[1.02]">
                  <span className="flex items-center justify-center gap-2 sm:gap-3">
                    Learn More
                    <svg className="w-4 h-4 sm:w-5 sm:h-5 group-hover:scale-110 transition-transform duration-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </span>
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
