'use client';

import { useState, useMemo } from 'react';
import useUserStore from '../../store/userStore';
import Loader from '../../components/Loader';
import Navbar from '../../components/Navbar';

interface ScheduleItem {
  id: string;
  title: string;
  description: string;
  type: 'study' | 'review' | 'practice' | 'break';
  startTime: string;
  duration: number;
  completed: boolean;
  materialId?: string;
}

const Schedule = () => {
  const [schedules, setSchedules] = useState<ScheduleItem[]>([
    {
      id: '1',
      title: 'Morning Review',
      description: 'Review yesterday&apos;s materials and summaries',
      type: 'review',
      startTime: '09:00',
      duration: 60,
      completed: false
    },
    {
      id: '2',
      title: 'Deep Learning Session',
      description: 'Focus on new material absorption',
      type: 'study',
      startTime: '10:30',
      duration: 90,
      completed: false
    },
    {
      id: '3',
      title: 'Practice Break',
      description: 'Quick practice session and mental break',
      type: 'practice',
      startTime: '12:00',
      duration: 30,
      completed: true
    },
    {
      id: '4',
      title: 'Afternoon Study',
      description: 'Continue with core concepts',
      type: 'study',
      startTime: '14:00',
      duration: 120,
      completed: false
    }
  ]);

  const [generatingSchedule, setGeneratingSchedule] = useState(false);
  const { materials } = useUserStore();

  // Pre-calculate star positions to prevent hydration mismatches
  const starPositions = useMemo(() => {
    return [...Array(80)].map((_, i) => ({
      left: (i * 31 + 17) % 100,
      top: (i * 47 + 23) % 100,
      delay: (i % 5), // Keep as integer seconds
      duration: 2 + (i % 4), // Keep as integer seconds
      opacity: 0.3 + ((i % 7) * 0.1), // Use safe decimal increments
      colorIndex: i % 6,
      sizeIndex: i % 4,
      animationIndex: i % 3
    }));
  }, []);

  const handleGenerateSchedule = async () => {
    setGeneratingSchedule(true);

    try {
      // Simulate API call
      setTimeout(() => {
        const newScheduleItems = [
          {
            id: Date.now().toString(),
            title: 'AI-Generated Study Session',
            description: 'Optimized learning schedule based on your materials',
            type: 'study' as const,
            startTime: '16:00',
            duration: 90,
            completed: false
          }
        ];
        
        setSchedules(prev => [...prev, ...newScheduleItems]);
        setGeneratingSchedule(false);
      }, 2000);

    } catch (error) {
      setGeneratingSchedule(false);
      console.error('Failed to generate schedule:', error);
    }
  };

  const toggleCompletion = (id: string) => {
    setSchedules(prev => 
      prev.map(item => 
        item.id === id ? { ...item, completed: !item.completed } : item
      )
    );
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'study':
        return 'from-blue-500/20 to-cyan-500/20 border-blue-400/30 text-blue-300';
      case 'review':
        return 'from-purple-500/20 to-pink-500/20 border-purple-400/30 text-purple-300';
      case 'practice':
        return 'from-green-500/20 to-emerald-500/20 border-green-400/30 text-green-300';
      case 'break':
        return 'from-yellow-500/20 to-orange-500/20 border-yellow-400/30 text-yellow-300';
      default:
        return 'from-gray-500/20 to-gray-600/20 border-gray-400/30 text-gray-300';
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'study':
        return '📚';
      case 'review':
        return '🔍';
      case 'practice':
        return '⚡';
      case 'break':
        return '☕';
      default:
        return '📝';
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-black via-gray-900 to-purple-900 relative overflow-hidden">
      {/* Cosmic Knowledge Background */}
      <div className="absolute inset-0 overflow-hidden">
        {/* Knowledge Stars Field */}
        <div className="stars-container absolute inset-0">
          {starPositions.map((star, i) => {
            const knowledgeColors = [
              'bg-gradient-to-r from-blue-400 to-cyan-400',
              'bg-gradient-to-r from-purple-400 to-pink-400', 
              'bg-gradient-to-r from-green-400 to-emerald-400',
              'bg-gradient-to-r from-yellow-400 to-orange-400',
              'bg-gradient-to-r from-indigo-400 to-purple-400',
              'bg-white'
            ];
            const animations = ['animate-star-twinkle', 'animate-star-pulse', 'animate-star-fade'];
            const sizes = ['w-2 h-2', 'w-1.5 h-1.5', 'w-1 h-1', 'w-0.5 h-0.5'];
            
            return (
              <div
                key={`schedule-star-${i}`}
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
        </div>
        
        {/* Schedule Constellation Points */}
        <div className="absolute top-20 left-16 w-3 h-3 bg-gradient-to-r from-blue-400 to-cyan-500 rounded-full animate-star-twinkle opacity-80 shadow-lg" style={{filter: 'drop-shadow(0 0 8px #06b6d4)'}}></div>
        <div className="absolute top-40 right-20 w-2.5 h-2.5 bg-gradient-to-r from-purple-400 to-pink-400 rounded-full animate-star-pulse opacity-75 shadow-lg" style={{animationDelay: '1s', filter: 'drop-shadow(0 0 6px #a855f7)'}}></div>
        <div className="absolute bottom-32 left-24 w-3 h-3 bg-gradient-to-r from-green-400 to-emerald-500 rounded-full animate-star-twinkle opacity-85 shadow-lg" style={{animationDelay: '2s', filter: 'drop-shadow(0 0 8px #10b981)'}}></div>
        
        {/* Floating Schedule Symbols */}
        <div className="absolute top-32 right-1/4 text-2xl opacity-15 animate-float-planet text-blue-400">⏰</div>
        <div className="absolute bottom-40 left-1/4 text-3xl opacity-12 animate-float-planet-reverse text-purple-400" style={{animationDelay: '2s'}}>📅</div>
        <div className="absolute top-1/2 left-1/8 text-2xl opacity-18 animate-float-planet-slow text-green-400" style={{animationDelay: '1s'}}>⚡</div>
        
        {/* Knowledge Nebula for Schedule */}
        <div 
          className="absolute top-1/4 right-1/4 w-80 h-80 bg-gradient-to-r from-blue-600/8 via-purple-600/6 to-cyan-600/8 rounded-full filter blur-3xl animate-nebula-drift"
          style={{
            boxShadow: '0 0 80px rgba(59, 130, 246, 0.12)'
          }}
        ></div>
        <div 
          className="absolute bottom-1/3 left-1/3 w-64 h-64 bg-gradient-to-r from-purple-600/8 via-pink-600/6 to-blue-600/8 rounded-full filter blur-3xl animate-nebula-pulse"
          style={{
            boxShadow: '0 0 60px rgba(168, 85, 247, 0.1)',
            animationDelay: '3s'
          }}
        ></div>
      </div>

      <Navbar />
      
      <main className="relative z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* Enhanced Header */}
          <div className="page-header animate-fadeIn">
            <h1 className="text-3xl font-bold text-white mb-2" style={{
              backgroundImage: 'linear-gradient(45deg, #ffffff, #3b82f6, #a855f7, #10b981)',
              backgroundSize: '200% 200%',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              backgroundClip: 'text',
              filter: 'drop-shadow(0 0 10px rgba(255, 255, 255, 0.3))'
            }}>Cosmic Study Schedule</h1>
            <p className="text-gray-300">
              Orchestrate your learning journey through the knowledge cosmos
            </p>
          </div>

          {/* Enhanced Schedule Generator */}
          <div className="bg-black/20 backdrop-blur-md border border-white/10 rounded-2xl p-8 mb-8 animate-fadeIn relative overflow-hidden">
            {/* Card Background */}
            <div className="absolute inset-0 bg-gradient-to-br from-blue-600/10 via-purple-600/5 to-cyan-600/10 rounded-2xl"></div>
            <div className="absolute top-2 right-4 w-1.5 h-1.5 bg-blue-400 rounded-full animate-star-twinkle opacity-60"></div>
            <div className="absolute bottom-4 left-6 w-1 h-1 bg-purple-400 rounded-full animate-star-pulse opacity-70"></div>
            
            <div className="relative z-10">
              <h2 className="text-2xl font-bold text-white mb-6">
                Generate Optimal Schedule
              </h2>
              
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-2">
                  <p className="text-gray-300 mb-4">
                    Let AI analyze your materials and create a personalized study schedule optimized for maximum knowledge retention.
                  </p>
                  <div className="bg-blue-500/10 border border-blue-400/20 rounded-lg p-4 backdrop-blur-sm">
                    <div className="flex items-center space-x-3">
                      <div className="w-8 h-8 bg-gradient-to-r from-blue-500/20 to-cyan-500/20 rounded-lg flex items-center justify-center border border-blue-400/30">
                        <svg className="w-4 h-4 text-blue-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                        </svg>
                      </div>
                      <div>
                        <p className="text-blue-300 font-medium">AI-Powered Optimization</p>
                        <p className="text-blue-200 text-sm">Based on {materials.length} materials in your vault</p>
                      </div>
                    </div>
                  </div>
                </div>
                
                <div className="flex items-end">
                  <button
                    onClick={handleGenerateSchedule}
                    disabled={generatingSchedule}
                    className="w-full bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 disabled:from-gray-500 disabled:to-gray-600 text-white px-6 py-3 rounded-lg font-semibold transition-all duration-300 transform hover:scale-105 disabled:scale-100 shadow-lg hover:shadow-xl backdrop-blur-sm border border-white/20"
                  >
                    {generatingSchedule ? (
                      <div className="flex items-center justify-center space-x-2">
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                        <span>Optimizing...</span>
                      </div>
                    ) : (
                      'Generate Schedule'
                    )}
                  </button>
                </div>
              </div>
              
              {generatingSchedule && (
                <div className="mt-6 p-4 bg-gradient-to-r from-blue-500/20 to-purple-500/20 rounded-xl border border-blue-400/30 backdrop-blur-sm animate-fadeIn">
                  <Loader size="sm" text="AI is optimizing your cosmic study schedule..." />
                </div>
              )}
            </div>
          </div>

          {/* Enhanced Schedule Timeline */}
          <div className="bg-black/20 backdrop-blur-md border border-white/10 rounded-2xl p-8 animate-fadeIn relative overflow-hidden">
            {/* Card Background */}
            <div className="absolute inset-0 bg-gradient-to-br from-purple-600/10 via-blue-600/5 to-green-600/10 rounded-2xl"></div>
            <div className="absolute top-2 right-4 w-1.5 h-1.5 bg-purple-400 rounded-full animate-star-twinkle opacity-60"></div>
            <div className="absolute bottom-4 left-6 w-1 h-1 bg-blue-400 rounded-full animate-star-pulse opacity-70"></div>
            
            <div className="relative z-10">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold text-white">
                  Today's Learning Orbit
                </h2>
                <div className="bg-gradient-to-r from-purple-500/20 to-blue-500/20 text-white px-4 py-2 rounded-xl font-semibold border border-purple-400/30">
                  {schedules.filter(s => s.completed).length} / {schedules.length} completed
                </div>
              </div>
              
              <div className="space-y-4">
                {schedules.map((item, index) => (
                  <div 
                    key={item.id} 
                    className={`group relative bg-gradient-to-r ${getTypeColor(item.type)} backdrop-blur-sm rounded-xl p-6 border hover:shadow-lg transition-all duration-300 transform hover:scale-105 animate-fadeIn ${
                      item.completed ? 'opacity-60' : ''
                    }`}
                    style={{ animationDelay: `${index * 0.1}s` }}
                  >
                    {/* Completion Star */}
                    <div className="absolute top-2 right-2 w-1 h-1 bg-white rounded-full animate-star-twinkle opacity-50"></div>
                    
                    <div className="flex items-center space-x-4">
                      <div className="flex items-center space-x-3">
                        <button
                          onClick={() => toggleCompletion(item.id)}
                          className={`w-8 h-8 rounded-full border-2 flex items-center justify-center transition-all duration-200 ${
                            item.completed 
                              ? 'bg-green-500 border-green-500 text-white' 
                              : 'border-white/30 hover:border-white/50'
                          }`}
                        >
                          {item.completed && (
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                            </svg>
                          )}
                        </button>
                        <div className="text-2xl opacity-80">{getTypeIcon(item.type)}</div>
                      </div>
                      
                      <div className="flex-1">
                        <div className="flex items-center justify-between mb-2">
                          <h3 className={`font-semibold text-lg ${item.completed ? 'line-through opacity-60' : ''}`}>
                            {item.title}
                          </h3>
                          <div className="flex items-center space-x-4 text-sm opacity-75">
                            <span>{item.startTime}</span>
                            <span>{item.duration} min</span>
                            <span className="capitalize bg-white/10 px-2 py-1 rounded-full">
                              {item.type}
                            </span>
                          </div>
                        </div>
                        <p className="text-sm opacity-80">
                          {item.description}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default Schedule;
