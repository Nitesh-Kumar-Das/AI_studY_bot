'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useState } from 'react';
import useUserStore from '../store/userStore';

const Navbar: React.FC = () => {
  const pathname = usePathname();
  const router = useRouter();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const { user, isAuthenticated, reset } = useUserStore();

  const handleLogout = () => {
    localStorage.removeItem('authToken');
    reset(); // This will clear all user data including materials and summaries
    router.push('/');
  };

  const navItems = [
    { href: '/dashboard', label: 'Mission Control', icon: '🌌' },
    { href: '/upload', label: 'Launch Materials', icon: '�' },
    { href: '/summary', label: 'Knowledge Crystals', icon: '�' },
    { href: '/schedule', label: 'Chart Course', icon: '⭐' },
  ];

  return (
    <nav className="bg-black/10 backdrop-blur-xl border-b border-white/10 sticky top-0 z-50 overflow-hidden">
      {/* Cosmic navbar background elements */}
      <div className="absolute inset-0 overflow-hidden">
        {/* Mini stars for navbar */}
        <div className="stars-mini absolute inset-0">
          {[...Array(15)].map((_, i) => {
            // Use deterministic values based on index
            const leftPos = ((i * 29) % 100);
            const topPos = ((i * 17) % 100);
            const size = 1 + ((i * 11) % 20) / 10;
            const delay = ((i * 7) % 30) / 10;
            const opacity = 0.2 + ((i * 5) % 30) / 100;
            
            return (
              <div
                key={`nav-star-${i}`}
                className="absolute rounded-full bg-white animate-star-twinkle"
                style={{
                  left: `${leftPos}%`,
                  top: `${topPos}%`,
                  width: `${size}px`,
                  height: `${size}px`,
                  animationDelay: `${delay}s`,
                  opacity: opacity,
                }}
              ></div>
            );
          })}
        </div>
        
        {/* Subtle cosmic gradient overlay */}
        <div className="absolute inset-0 bg-gradient-to-r from-blue-600/5 via-purple-600/5 to-pink-600/5"></div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="flex justify-between items-center h-16">
          {/* Logo */}
          <div className="flex items-center">
            
            <Link 
              href="/"
              className="flex items-center space-x-2 text-xl font-bold text-white hover:text-purple-300 transition-colors duration-300 group"
            >
              <div className="w-8 h-8 bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 rounded-lg flex items-center justify-center shadow-2xl border border-white/20 group-hover:scale-110 transition-transform duration-300 animate-pulse" style={{
                boxShadow: '0 0 20px rgba(147, 51, 234, 0.4)'
              }}>
                <span className="text-white text-sm font-bold">AI</span>
              </div>
              <span className="hidden sm:block" style={{
                backgroundImage: 'linear-gradient(45deg, #ffffff, #e879f9, #06b6d4)',
                backgroundSize: '200% 200%',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                backgroundClip: 'text',
                filter: 'drop-shadow(0 0 8px rgba(255, 255, 255, 0.3))'
              }}>Study Universe</span>
            </Link>
          </div>

          {/* Desktop Navigation */}
          {isAuthenticated && (
            <div className="hidden md:flex items-center space-x-1">
              {navItems.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`flex items-center space-x-2 px-4 py-2 rounded-lg text-sm font-medium transition-all duration-300 backdrop-blur-sm border group hover:scale-105 ${
                    pathname === item.href
                      ? 'bg-white/10 text-white border-white/30 shadow-lg'
                      : 'text-gray-300 hover:text-white hover:bg-white/10 border-white/10 hover:border-white/30'
                  }`}
                  style={{
                    boxShadow: pathname === item.href ? '0 0 20px rgba(147, 51, 234, 0.3)' : 'none'
                  }}
                >
                  <span className="text-lg group-hover:scale-110 transition-transform duration-300">{item.icon}</span>
                  <span>{item.label}</span>
                  {pathname === item.href && (
                    <div className="absolute -inset-1 bg-gradient-to-r from-blue-600/20 via-purple-600/20 to-pink-600/20 rounded-lg opacity-50 transition-opacity duration-300 blur-sm -z-10"></div>
                  )}
                </Link>
              ))}
            </div>
          )}

          {/* User Menu & Mobile Toggle */}
          <div className="flex items-center space-x-2">
            {isAuthenticated && (
              <>
                {/* User Info - Desktop */}
                <div className="hidden md:flex items-center space-x-3">
                  <div className="text-right">
                    <p className="text-sm font-medium text-white" style={{
                      textShadow: '0 0 8px rgba(255, 255, 255, 0.3)'
                    }}>
                      {user?.name}
                    </p>
                    <p className="text-xs text-gray-300">
                      {user?.email}
                    </p>
                  </div>
                  <div className="w-8 h-8 bg-gradient-to-r from-purple-400 via-pink-400 to-cyan-400 rounded-full flex items-center justify-center shadow-2xl border-2 border-white/20 animate-pulse" style={{
                    boxShadow: '0 0 15px rgba(147, 51, 234, 0.5)'
                  }}>
                    <span className="text-white text-sm font-medium">
                      {user?.name?.charAt(0)}
                    </span>
                  </div>
                  <button
                    onClick={handleLogout}
                    className="bg-gradient-to-r from-red-500 to-pink-500 hover:from-red-600 hover:to-pink-600 text-white px-4 py-2 rounded-lg text-sm font-medium transition-all duration-300 flex items-center space-x-1 backdrop-blur-sm border border-white/20 hover:border-white/40 transform hover:scale-105 shadow-lg hover:shadow-xl"
                  >
                    <span>🚪</span>
                    <span>Logout</span>
                  </button>
                </div>

                {/* Mobile Menu Button */}
                <button
                  onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                  className="md:hidden p-2 rounded-lg text-gray-300 hover:text-white hover:bg-white/10 transition-all duration-300 backdrop-blur-sm border border-white/20 hover:border-white/40"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    {isMobileMenuOpen ? (
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    ) : (
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                    )}
                  </svg>
                </button>
              </>
            )}

            {!isAuthenticated && (
              <>
                <Link
                  href="/"
                  className="bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 hover:from-blue-700 hover:via-purple-700 hover:to-pink-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-all duration-300 backdrop-blur-sm border border-white/20 hover:border-white/40 transform hover:scale-105 shadow-lg hover:shadow-xl"
                >
                  Get Started
                </Link>
              </>
            )}
          </div>
        </div>

        {/* Mobile Menu */}
        {isAuthenticated && isMobileMenuOpen && (
          <div className="md:hidden border-t border-white/10 py-4 animate-slideIn bg-black/20 backdrop-blur-xl">
            <div className="space-y-1">
              {navItems.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setIsMobileMenuOpen(false)}
                  className={`flex items-center space-x-3 px-4 py-3 rounded-lg text-base font-medium transition-all duration-300 backdrop-blur-sm border group hover:scale-105 mx-2 ${
                    pathname === item.href
                      ? 'bg-white/10 text-white border-white/30 shadow-lg'
                      : 'text-gray-300 hover:text-white hover:bg-white/10 border-white/10 hover:border-white/30'
                  }`}
                  style={{
                    boxShadow: pathname === item.href ? '0 0 20px rgba(147, 51, 234, 0.3)' : 'none'
                  }}
                >
                  <span className="text-xl group-hover:scale-110 transition-transform duration-300">{item.icon}</span>
                  <span>{item.label}</span>
                </Link>
              ))}
              
              {/* Mobile User Info */}
              <div className="px-4 py-3 border-t border-white/10 mt-4">
                <div className="flex items-center space-x-3 mb-3">
                  <div className="w-10 h-10 bg-gradient-to-r from-purple-400 via-pink-400 to-cyan-400 rounded-full flex items-center justify-center shadow-2xl border-2 border-white/20 animate-pulse" style={{
                    boxShadow: '0 0 15px rgba(147, 51, 234, 0.5)'
                  }}>
                    <span className="text-white font-medium">
                      {user?.name?.charAt(0)}
                    </span>
                  </div>
                  <div>
                    <p className="font-medium text-white" style={{
                      textShadow: '0 0 8px rgba(255, 255, 255, 0.3)'
                    }}>{user?.name}</p>
                    <p className="text-sm text-gray-300">{user?.email}</p>
                  </div>
                </div>
                
                <button
                  onClick={handleLogout}
                  className="w-full bg-gradient-to-r from-red-500 to-pink-500 hover:from-red-600 hover:to-pink-600 text-white px-4 py-2 rounded-lg text-sm font-medium transition-all duration-300 flex items-center justify-center space-x-2 backdrop-blur-sm border border-white/20 hover:border-white/40 transform hover:scale-105 shadow-lg hover:shadow-xl"
                >
                  <span>🚪</span>
                  <span>Logout</span>
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </nav>
  );
};

export default Navbar;
