'use client';

import { useEffect, useState, useMemo } from 'react';
import useUserStore from '../../store/userStore';
import Navbar from '../../components/Navbar';
import Link from 'next/link';
import { formatDate } from '../../utils/dateUtils';

const Dashboard = () => {
  const { 
    user, 
    materials, 
    schedules, 
    summaries, 
    loadUserData 
  } = useUserStore();

  // Pre-calculate star positions for the main dashboard background
  const knowledgeStarPositions = useMemo(() => {
    return [...Array(100)].map((_, i) => ({
      left: (i * 37 + 19) % 100,
      top: (i * 43 + 27) % 100,
      delay: (i % 5), // Keep as integer seconds
      duration: 2 + (i % 4), // Keep as integer seconds
      opacity: 0.3 + ((i % 7) * 0.1), // Use safe decimal increments
      colorIndex: i % 10,
      sizeIndex: i % 5,
      animationIndex: i % 10
    }));
  }, []);

  useEffect(() => {
    // Load dashboard data
    const loadData = async () => {
      try {
        // Check if we have real data (not just sample data)
        const hasRealData = materials.some(m => !m.id.startsWith('sample-material-'));
        
        if (!hasRealData) {
          // Load real user data from backend
          await loadUserData();
        }
      } catch (error) {
        console.error('Error loading dashboard data:', error);
      }
    };

    loadData();
  }, [loadUserData, materials]);

  // Get today's tasks (client-side only to prevent hydration issues)
  const [todaysTasks, setTodaysTasks] = useState<any[]>([]);
  
  useEffect(() => {
    const today = new Date();
    const tasks = schedules.filter(schedule => {
      const scheduleDate = new Date(schedule.scheduledDate);
      return scheduleDate.toDateString() === today.toDateString() && !schedule.completed;
    });
    setTodaysTasks(tasks);
  }, [schedules]);

  const recentSummaries = summaries.slice(0, 3);

  const stats = [
    {
      title: 'Study Materials',
      count: materials.length,
      description: 'Uploaded documents',
      icon: '📚',
      color: 'bg-blue-500',
      href: '/upload',
    },
    {
      title: 'Pending Tasks',
      count: schedules.filter(s => !s.completed).length,
      description: 'Scheduled sessions',
      icon: '⏰',
      color: 'bg-orange-500',
      href: '/schedule',
    },
    {
      title: 'Completed',
      count: schedules.filter(s => s.completed).length,
      description: 'Finished sessions',
      icon: '✅',
      color: 'bg-green-500',
      href: '/schedule',
    },
    {
      title: 'AI Summaries',
      count: summaries.length,
      description: 'Generated summaries',
      icon: '🤖',
      color: 'bg-purple-500',
      href: '/summary',
    },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-b from-black via-gray-900 to-purple-900 relative overflow-hidden">
      {/* Cosmic Knowledge Background */}
      <div className="absolute inset-0 overflow-hidden">
        {/* Knowledge Stars Field */}
        <div className="stars-container absolute inset-0">
          {/* Generate knowledge-themed moving stars */}
          {knowledgeStarPositions.map((star, i) => {
            const knowledgeColors = [
              'bg-gradient-to-r from-blue-400 to-cyan-400',
              'bg-gradient-to-r from-purple-400 to-pink-400', 
              'bg-gradient-to-r from-green-400 to-emerald-400',
              'bg-gradient-to-r from-yellow-400 to-orange-400',
              'bg-gradient-to-r from-indigo-400 to-purple-400',
              'bg-gradient-to-r from-cyan-400 to-blue-400',
              'bg-gradient-to-r from-rose-400 to-pink-400',
              'bg-white',
              'bg-gradient-to-r from-violet-400 to-purple-400',
              'bg-gradient-to-r from-amber-400 to-yellow-400'
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
                key={`knowledge-star-${i}`}
                className={`absolute rounded-full ${knowledgeColors[star.colorIndex]} ${sizes[star.sizeIndex]} ${animations[star.animationIndex]} shadow-lg`}
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
          
          {/* Knowledge Constellation Points */}
          <div className="absolute top-16 left-10 w-4 h-4 bg-gradient-to-r from-blue-400 to-cyan-500 rounded-full animate-star-twinkle opacity-90 shadow-lg" style={{filter: 'drop-shadow(0 0 8px #06b6d4)'}}></div>
          <div className="absolute top-32 right-24 w-3 h-3 bg-gradient-to-r from-purple-400 to-pink-400 rounded-full animate-star-twinkle-delayed opacity-80 shadow-lg" style={{animationDelay: '0.5s', filter: 'drop-shadow(0 0 6px #a855f7)'}}></div>
          <div className="absolute bottom-32 left-16 w-4 h-4 bg-gradient-to-r from-emerald-400 to-teal-500 rounded-full animate-star-twinkle opacity-90 shadow-lg" style={{animationDelay: '2s', filter: 'drop-shadow(0 0 8px #10b981)'}}></div>
          <div className="absolute top-40 right-1/3 w-3 h-3 bg-gradient-to-r from-yellow-400 to-orange-500 rounded-full animate-star-pulse opacity-85 shadow-lg" style={{animationDelay: '1.3s', filter: 'drop-shadow(0 0 6px #f59e0b)'}}></div>
          <div className="absolute bottom-20 left-1/3 w-2.5 h-2.5 bg-gradient-to-r from-rose-400 to-pink-500 rounded-full animate-star-twinkle-delayed opacity-75 shadow-lg" style={{animationDelay: '0.8s', filter: 'drop-shadow(0 0 5px #f43f5e)'}}></div>
        </div>
        
        {/* Knowledge Planets/Books floating in space */}
        <div 
          className="absolute top-10 right-10 w-16 h-16 bg-gradient-to-br from-blue-400 to-cyan-500 rounded-xl opacity-20 animate-float-planet shadow-2xl transform rotate-12"
          style={{
            boxShadow: '0 0 30px rgba(59, 130, 246, 0.4), 0 0 60px rgba(6, 182, 212, 0.2)',
            background: 'linear-gradient(45deg, #3b82f6, #06b6d4)',
            clipPath: 'polygon(10% 0%, 90% 0%, 100% 35%, 100% 70%, 90% 100%, 10% 100%, 0% 70%, 0% 35%)'
          }}
        ></div>
        <div 
          className="absolute bottom-20 left-12 w-12 h-12 bg-gradient-to-br from-purple-400 to-pink-500 rounded-lg opacity-15 animate-float-planet-slow shadow-2xl transform -rotate-12" 
          style={{
            animationDelay: '2s',
            boxShadow: '0 0 25px rgba(147, 51, 234, 0.4), 0 0 50px rgba(236, 72, 153, 0.2)',
            background: 'linear-gradient(45deg, #a855f7, #ec4899)',
            clipPath: 'polygon(20% 0%, 80% 0%, 100% 20%, 100% 80%, 80% 100%, 20% 100%, 0% 80%, 0% 20%)'
          }}
        ></div>
        <div 
          className="absolute top-1/2 right-8 w-10 h-10 bg-gradient-to-br from-green-400 to-emerald-500 rounded-lg opacity-18 animate-float-planet-reverse shadow-2xl transform rotate-45" 
          style={{
            animationDelay: '1s',
            boxShadow: '0 0 20px rgba(34, 197, 94, 0.4), 0 0 40px rgba(16, 185, 129, 0.2)',
            background: 'linear-gradient(45deg, #22c55e, #10b981)',
            clipPath: 'polygon(0% 20%, 60% 20%, 60% 0%, 100% 50%, 60% 100%, 60% 80%, 0% 80%)'
          }}
        ></div>
        <div 
          className="absolute top-1/3 left-8 w-14 h-14 bg-gradient-to-br from-orange-400 to-red-500 rounded-xl opacity-22 animate-float-planet shadow-2xl transform -rotate-6" 
          style={{
            animationDelay: '3s',
            boxShadow: '0 0 25px rgba(251, 146, 60, 0.4), 0 0 50px rgba(239, 68, 68, 0.2)',
            background: 'linear-gradient(45deg, #fb923c, #ef4444)',
            clipPath: 'polygon(25% 0%, 75% 0%, 100% 25%, 100% 75%, 75% 100%, 25% 100%, 0% 75%, 0% 25%)'
          }}
        ></div>
        
        {/* Knowledge Streams (like shooting stars but representing data flow) */}
        <div className="absolute top-20 left-0 w-1.5 h-1.5 bg-gradient-to-r from-blue-400 to-cyan-400 rounded-full animate-shooting-star opacity-0">
          <div className="absolute w-24 h-0.5 bg-gradient-to-r from-blue-400 via-cyan-200 to-transparent -translate-y-0.5 blur-sm"></div>
        </div>
        <div className="absolute top-60 left-0 w-1 h-1 bg-gradient-to-r from-purple-400 to-pink-400 rounded-full animate-shooting-star-delayed opacity-0" style={{animationDelay: '8s'}}>
          <div className="absolute w-20 h-0.5 bg-gradient-to-r from-purple-400 via-pink-200 to-transparent -translate-y-0.5 blur-sm"></div>
        </div>
        <div className="absolute bottom-40 left-0 w-1.5 h-1.5 bg-gradient-to-r from-green-400 to-emerald-400 rounded-full animate-shooting-star opacity-0" style={{animationDelay: '15s'}}>
          <div className="absolute w-28 h-0.5 bg-gradient-to-r from-green-400 via-emerald-200 to-transparent -translate-y-0.5 blur-sm"></div>
        </div>
        
        {/* Knowledge Nebula Clouds */}
        <div 
          className="absolute top-1/4 left-1/4 w-96 h-96 bg-gradient-to-r from-blue-600/10 via-purple-600/8 to-cyan-600/10 rounded-full filter blur-3xl animate-nebula-drift"
          style={{
            boxShadow: '0 0 100px rgba(59, 130, 246, 0.15)'
          }}
        ></div>
        <div 
          className="absolute bottom-1/4 right-1/4 w-80 h-80 bg-gradient-to-r from-purple-600/8 via-pink-600/6 to-indigo-600/8 rounded-full filter blur-3xl animate-nebula-drift-reverse"
          style={{
            boxShadow: '0 0 80px rgba(147, 51, 234, 0.12)'
          }}
        ></div>
        <div 
          className="absolute top-1/2 left-1/2 w-64 h-64 bg-gradient-to-r from-emerald-600/8 via-green-600/6 to-teal-600/8 rounded-full filter blur-3xl animate-nebula-pulse"
          style={{
            transform: 'translate(-50%, -50%)',
            boxShadow: '0 0 60px rgba(16, 185, 129, 0.12)'
          }}
        ></div>
        <div 
          className="absolute top-3/4 left-1/3 w-72 h-72 bg-gradient-to-r from-orange-600/6 via-yellow-600/4 to-amber-600/6 rounded-full filter blur-3xl animate-nebula-drift"
          style={{
            boxShadow: '0 0 70px rgba(251, 146, 60, 0.1)',
            animationDelay: '5s'
          }}
        ></div>
        
        {/* Floating Knowledge Symbols */}
        <div className="absolute top-24 right-1/4 text-2xl opacity-20 animate-float-planet text-blue-400">∞</div>
        <div className="absolute bottom-24 left-1/4 text-3xl opacity-15 animate-float-planet-reverse text-purple-400" style={{animationDelay: '2s'}}>π</div>
        <div className="absolute top-1/2 left-1/6 text-2xl opacity-18 animate-float-planet-slow text-green-400" style={{animationDelay: '1s'}}>Σ</div>
        <div className="absolute bottom-1/3 right-1/6 text-2xl opacity-16 animate-float-planet text-orange-400" style={{animationDelay: '3s'}}>∆</div>
        <div className="absolute top-1/6 left-1/2 text-xl opacity-12 animate-float-planet-reverse text-cyan-400" style={{animationDelay: '4s'}}>φ</div>
      </div>

      <Navbar />
      
      <main className="relative z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            {/* Welcome Section */}
            <div className="mb-8 animate-fadeIn">
              <div className="flex items-center space-x-4 mb-4">
                <div className="w-12 h-12 bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 rounded-full flex items-center justify-center shadow-2xl border-2 border-white/20 backdrop-blur-sm">
                  <span className="text-white font-bold text-lg animate-pulse">
                    {user?.name?.charAt(0)}
                  </span>
                </div>
                <div>
                  <h1 className="text-3xl font-bold text-white mb-2" style={{
                    backgroundImage: 'linear-gradient(45deg, #ffffff, #e879f9, #06b6d4, #8b5cf6)',
                    backgroundSize: '200% 200%',
                    WebkitBackgroundClip: 'text',
                    WebkitTextFillColor: 'transparent',
                    backgroundClip: 'text',
                    filter: 'drop-shadow(0 0 10px rgba(255, 255, 255, 0.2))'
                  }}>
                    Welcome back, {user?.name}! 🌟
                  </h1>
                  <p className="text-gray-300">
                    Navigate your universe of knowledge
                  </p>
                </div>
              </div>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8 animate-fadeIn">
              {stats.map((stat, index) => (
                <Link
                  key={index}
                  href={stat.href}
                  className="bg-black/20 backdrop-blur-xl rounded-2xl shadow-2xl hover:shadow-purple-500/20 transition-all duration-300 p-6 border border-white/10 hover:border-purple-500/30 group transform hover:scale-105 hover:-translate-y-1"
                  style={{ 
                    animationDelay: `${index * 0.1}s`,
                    boxShadow: '0 0 30px rgba(147, 51, 234, 0.1), inset 0 0 30px rgba(255, 255, 255, 0.05)'
                  }}
                >
                  <div className="flex items-center justify-between mb-4">
                    <div className={`${stat.color} p-3 rounded-xl text-white text-xl shadow-lg backdrop-blur-sm border border-white/20 transition-all duration-300 group-hover:scale-110 group-hover:rotate-6`}>
                      {stat.icon}
                    </div>
                    <div className="text-right">
                      <div className="text-3xl font-bold text-white group-hover:text-purple-300 transition-colors" style={{
                        textShadow: '0 0 10px rgba(255, 255, 255, 0.3)'
                      }}>
                        {stat.count}
                      </div>
                    </div>
                  </div>
                  <h3 className="font-semibold text-white mb-1 group-hover:text-purple-200 transition-colors">
                    {stat.title}
                  </h3>
                  <p className="text-sm text-gray-300 group-hover:text-gray-200 transition-colors">
                    {stat.description}
                  </p>
                  {/* Subtle glow effect */}
                  <div className="absolute -inset-1 bg-gradient-to-r from-blue-600/20 via-purple-600/20 to-pink-600/20 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-300 blur-sm -z-10"></div>
                </Link>
              ))}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 animate-fadeIn">
              {/* Today's Tasks */}
              <div className="bg-black/20 backdrop-blur-xl rounded-2xl shadow-2xl border border-white/10 p-8 hover:border-purple-500/30 transition-all duration-300" style={{
                boxShadow: '0 0 30px rgba(147, 51, 234, 0.1), inset 0 0 30px rgba(255, 255, 255, 0.05)'
              }}>
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-xl font-bold text-white flex items-center space-x-2">
                    <span className="text-2xl animate-pulse">📅</span>
                    <span style={{
                      backgroundImage: 'linear-gradient(45deg, #ffffff, #e879f9, #06b6d4)',
                      backgroundSize: '200% 200%',
                      WebkitBackgroundClip: 'text',
                      WebkitTextFillColor: 'transparent',
                      backgroundClip: 'text'
                    }}>Today&apos;s Tasks</span>
                  </h2>
                  <Link
                    href="/schedule"
                    className="text-purple-400 hover:text-purple-300 text-sm font-medium flex items-center space-x-1 hover:underline transition-colors duration-300 backdrop-blur-sm px-3 py-1 rounded-lg border border-purple-500/30 hover:border-purple-400/50"
                  >
                    <span>View All</span>
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </Link>
                </div>
                
                {todaysTasks.length === 0 ? (
                  <div className="text-center py-12">
                    <div className="w-16 h-16 bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 rounded-full mx-auto flex items-center justify-center mb-4 animate-pulse shadow-2xl border-2 border-white/20">
                      <span className="text-3xl">🎉</span>
                    </div>
                    <h3 className="text-lg font-semibold text-white mb-2">No cosmic missions scheduled for today!</h3>
                    <p className="text-gray-300 mb-6">Plan your journey through the knowledge universe</p>
                    <Link
                      href="/schedule"
                      className="bg-gradient-to-r from-blue-500 via-purple-600 to-pink-600 hover:from-blue-600 hover:via-purple-700 hover:to-pink-700 text-white px-6 py-3 rounded-xl font-semibold transition-all duration-300 transform hover:scale-105 shadow-2xl backdrop-blur-sm border border-white/20 hover:border-white/30"
                    >
                      Schedule New Mission
                    </Link>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {todaysTasks.map((task, index) => (
                      <div key={task.id} className="group relative overflow-hidden" style={{ animationDelay: `${index * 0.1}s` }}>
                        {/* Cosmic glow effect on hover */}
                        <div className="absolute -inset-1 bg-gradient-to-r from-blue-600/30 via-purple-600/30 to-pink-600/30 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity duration-500 blur-sm"></div>
                        
                        <div className="relative flex items-center space-x-4 p-5 bg-gradient-to-r from-black/40 via-gray-900/30 to-purple-900/20 rounded-xl border border-white/10 hover:border-purple-400/40 transition-all duration-300 backdrop-blur-sm group-hover:shadow-2xl group-hover:shadow-purple-500/20">
                          {/* Task Icon with Animation */}
                          <div className="w-12 h-12 bg-gradient-to-br from-blue-500 via-purple-500 to-pink-500 rounded-xl flex items-center justify-center shadow-2xl border border-white/20 group-hover:scale-110 group-hover:rotate-3 transition-all duration-300 relative overflow-hidden">
                            <div className="absolute inset-0 bg-gradient-to-r from-white/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                            <span className="text-xl relative z-10">📚</span>
                          </div>
                          
                          {/* Task Content */}
                          <div className="flex-1 min-w-0">
                            <h3 className="font-semibold text-white group-hover:text-purple-200 transition-colors duration-300 mb-1 text-lg">
                              {task.title}
                            </h3>
                            <p className="text-gray-300 group-hover:text-gray-200 transition-colors duration-300 text-sm mb-2">
                              {task.description || 'Study session scheduled'}
                            </p>
                            <div className="flex items-center space-x-3 text-xs">
                              <div className="flex items-center space-x-1 text-blue-400">
                                <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                                </svg>
                                <span>{new Date(task.scheduledDate).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                              </div>
                              <div className="flex items-center space-x-1 text-purple-400">
                                <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                                </svg>
                                <span>{task.duration} mins</span>
                              </div>
                              <div className="flex items-center space-x-1 text-emerald-400">
                                <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                                </svg>
                                <span>Pending</span>
                              </div>
                            </div>
                          </div>
                          
                          {/* Action Buttons */}
                          <div className="flex items-center space-x-2">
                            <button className="w-8 h-8 bg-gradient-to-r from-green-500 to-emerald-500 rounded-lg flex items-center justify-center text-white opacity-0 group-hover:opacity-100 transition-all duration-300 hover:scale-110 shadow-lg" title="Mark Complete">
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                              </svg>
                            </button>
                            <button className="w-8 h-8 bg-gradient-to-r from-blue-500 to-purple-500 rounded-lg flex items-center justify-center text-white opacity-0 group-hover:opacity-100 transition-all duration-300 hover:scale-110 shadow-lg" title="Edit Task">
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                              </svg>
                            </button>
                            <div className="w-2 h-2 bg-gradient-to-r from-blue-400 to-purple-400 rounded-full animate-pulse opacity-60"></div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Recent Summaries */}
              <div className="bg-black/20 backdrop-blur-xl rounded-2xl shadow-2xl border border-white/10 p-8 hover:border-purple-500/30 transition-all duration-300" style={{
                boxShadow: '0 0 30px rgba(147, 51, 234, 0.1), inset 0 0 30px rgba(255, 255, 255, 0.05)'
              }}>
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-xl font-bold text-white flex items-center space-x-2">
                    <span className="text-2xl animate-pulse">📝</span>
                    <span style={{
                      backgroundImage: 'linear-gradient(45deg, #ffffff, #8b5cf6, #06b6d4)',
                      backgroundSize: '200% 200%',
                      WebkitBackgroundClip: 'text',
                      WebkitTextFillColor: 'transparent',
                      backgroundClip: 'text'
                    }}>Recent Summaries</span>
                  </h2>
                  <Link
                    href="/summary"
                    className="text-cyan-400 hover:text-cyan-300 text-sm font-medium flex items-center space-x-1 hover:underline transition-colors duration-300 backdrop-blur-sm px-3 py-1 rounded-lg border border-cyan-500/30 hover:border-cyan-400/50"
                  >
                    <span>View All</span>
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </Link>
                </div>
                
                {recentSummaries.length === 0 ? (
                  <div className="text-center py-12">
                    <div className="w-16 h-16 bg-gradient-to-r from-purple-500 via-pink-500 to-cyan-500 rounded-full mx-auto flex items-center justify-center mb-4 animate-pulse shadow-2xl border-2 border-white/20">
                      <span className="text-3xl">🤖</span>
                    </div>
                    <h3 className="text-lg font-semibold text-white mb-2">No knowledge crystals forged yet</h3>
                    <p className="text-gray-300 mb-6">Transform raw materials into crystallized wisdom</p>
                    <Link
                      href="/summary"
                      className="bg-gradient-to-r from-purple-500 via-pink-600 to-cyan-600 hover:from-purple-600 hover:via-pink-700 hover:to-cyan-700 text-white px-6 py-3 rounded-xl font-semibold transition-all duration-300 transform hover:scale-105 shadow-2xl backdrop-blur-sm border border-white/20 hover:border-white/30"
                    >
                      Forge Knowledge Crystal
                    </Link>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {recentSummaries.map((summary, index) => (
                      <div key={summary.id} className="group relative overflow-hidden" style={{ animationDelay: `${index * 0.1}s` }}>
                        {/* Cosmic glow effect on hover */}
                        <div className="absolute -inset-1 bg-gradient-to-r from-cyan-600/30 via-blue-600/30 to-purple-600/30 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity duration-500 blur-sm"></div>
                        
                        <div className="relative p-5 bg-gradient-to-r from-black/40 via-gray-900/30 to-cyan-900/20 rounded-xl border border-white/10 hover:border-cyan-400/40 transition-all duration-300 backdrop-blur-sm group-hover:shadow-2xl group-hover:shadow-cyan-500/20">
                          {/* Header with Icon and Status */}
                          <div className="flex items-start justify-between mb-3">
                            <div className="flex items-center space-x-3">
                              <div className="w-10 h-10 bg-gradient-to-br from-cyan-500 via-blue-500 to-purple-500 rounded-xl flex items-center justify-center shadow-xl border border-white/20 group-hover:scale-110 group-hover:rotate-3 transition-all duration-300 relative overflow-hidden">
                                <div className="absolute inset-0 bg-gradient-to-r from-white/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                                <span className="text-lg relative z-10">🤖</span>
                              </div>
                              <div className="flex-1 min-w-0">
                                <h3 className="font-semibold text-white group-hover:text-cyan-200 transition-colors duration-300 text-lg line-clamp-1">
                                  {summary.title}
                                </h3>
                                <div className="flex items-center space-x-2 mt-1">
                                  <div className="flex items-center space-x-1 text-xs text-cyan-400">
                                    <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                    </svg>
                                    <span>{formatDate(summary.createdAt)}</span>
                                  </div>
                                  <div className="flex items-center space-x-1 text-xs text-purple-400">
                                    <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                                    </svg>
                                    <span>AI Generated</span>
                                  </div>
                                </div>
                              </div>
                            </div>
                            <div className="w-3 h-3 bg-gradient-to-r from-cyan-400 to-blue-400 rounded-full flex-shrink-0 animate-pulse shadow-lg" style={{
                              boxShadow: '0 0 8px rgba(6, 182, 212, 0.6)'
                            }}></div>
                          </div>
                          
                          {/* Content Preview */}
                          <div className="mb-4">
                            <p className="text-sm text-gray-300 line-clamp-3 group-hover:text-gray-200 transition-colors duration-300 leading-relaxed">
                              {summary.content}
                            </p>
                          </div>
                          
                          {/* Action Bar */}
                          <div className="flex items-center justify-between pt-3 border-t border-white/10">
                            <div className="flex items-center space-x-2">
                              <div className="flex items-center space-x-1 text-xs text-emerald-400">
                                <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                </svg>
                                <span>Knowledge Crystal</span>
                              </div>
                            </div>
                            <div className="flex items-center space-x-2">
                              <button className="text-cyan-400 hover:text-cyan-300 text-xs font-medium px-3 py-2 rounded-lg hover:bg-cyan-400/10 transition-all duration-300 border border-cyan-500/30 hover:border-cyan-400/50 backdrop-blur-sm flex items-center space-x-1 opacity-0 group-hover:opacity-100">
                                <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                                </svg>
                                <span>View</span>
                              </button>
                              <button className="text-purple-400 hover:text-purple-300 text-xs font-medium px-3 py-2 rounded-lg hover:bg-purple-400/10 transition-all duration-300 border border-purple-500/30 hover:border-purple-400/50 backdrop-blur-sm flex items-center space-x-1 opacity-0 group-hover:opacity-100">
                                <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.367 2.684 3 3 0 00-5.367-2.684z" />
                                </svg>
                                <span>Share</span>
                              </button>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Quick Actions */}
            <div className="mt-8 bg-gradient-to-r from-blue-600/80 via-purple-600/80 to-pink-600/80 backdrop-blur-xl rounded-2xl p-8 text-white shadow-2xl animate-fadeIn border border-white/20" style={{
              boxShadow: '0 0 60px rgba(147, 51, 234, 0.2), inset 0 0 60px rgba(255, 255, 255, 0.1)'
            }}>
              <h2 className="text-2xl font-bold mb-6 text-center" style={{
                backgroundImage: 'linear-gradient(45deg, #ffffff, #e879f9, #06b6d4, #8b5cf6)',
                backgroundSize: '200% 200%',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                backgroundClip: 'text',
                filter: 'drop-shadow(0 0 10px rgba(255, 255, 255, 0.3))'
              }}>Cosmic Command Center</h2>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <Link
                  href="/upload"
                  className="bg-white/10 hover:bg-white/20 backdrop-blur-sm rounded-xl p-6 text-center transition-all duration-300 hover:scale-105 group border border-white/20 hover:border-white/40 shadow-lg hover:shadow-2xl"
                >
                  <div className="text-3xl mb-3 group-hover:scale-110 transition-transform duration-300 animate-bounce" style={{animationDelay: '0s'}}>�</div>
                  <div className="font-semibold text-lg mb-2">Launch Materials</div>
                  <p className="text-sm opacity-80">Upload knowledge to the cosmos</p>
                  <div className="absolute -inset-1 bg-gradient-to-r from-blue-600/20 via-purple-600/20 to-pink-600/20 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity duration-300 blur-sm -z-10"></div>
                </Link>
                <Link
                  href="/schedule"
                  className="bg-white/10 hover:bg-white/20 backdrop-blur-sm rounded-xl p-6 text-center transition-all duration-300 hover:scale-105 group border border-white/20 hover:border-white/40 shadow-lg hover:shadow-2xl"
                >
                  <div className="text-3xl mb-3 group-hover:scale-110 transition-transform duration-300 animate-bounce" style={{animationDelay: '0.5s'}}>⭐</div>
                  <div className="font-semibold text-lg mb-2">Chart Course</div>
                  <p className="text-sm opacity-80">Navigate your learning journey</p>
                  <div className="absolute -inset-1 bg-gradient-to-r from-blue-600/20 via-purple-600/20 to-pink-600/20 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity duration-300 blur-sm -z-10"></div>
                </Link>
                <Link
                  href="/summary"
                  className="bg-white/10 hover:bg-white/20 backdrop-blur-sm rounded-xl p-6 text-center transition-all duration-300 hover:scale-105 group border border-white/20 hover:border-white/40 shadow-lg hover:shadow-2xl"
                >
                  <div className="text-3xl mb-3 group-hover:scale-110 transition-transform duration-300 animate-bounce" style={{animationDelay: '1s'}}>🔮</div>
                  <div className="font-semibold text-lg mb-2">Forge Wisdom</div>
                  <p className="text-sm opacity-80">Crystallize knowledge with AI</p>
                  <div className="absolute -inset-1 bg-gradient-to-r from-blue-600/20 via-purple-600/20 to-pink-600/20 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity duration-300 blur-sm -z-10"></div>
                </Link>
              </div>
            </div>
          </div>
        </main>
    </div>
  );
};

export default Dashboard;
