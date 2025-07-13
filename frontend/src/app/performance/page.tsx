'use client';

import useUserStore from '../../store/userStore';
import Navbar from '../../components/Navbar';
import { 
  TrendingUp, 
  Clock, 
  Target, 
  Calendar as CalendarIcon,
  Award,
  BookOpen,
  Brain,
  Zap
} from 'lucide-react';

const Performance = () => {
  const { materials, schedules, summaries } = useUserStore();

  // Calculate performance metrics
  const totalMaterials = materials.length;
  const completedSessions = schedules.filter(s => s.completed).length;
  const totalSessions = schedules.length;
  const totalSummaries = summaries.length;
  const completionRate = totalSessions > 0 ? Math.round((completedSessions / totalSessions) * 100) : 0;

  // Mock data for charts and analytics
  const weeklyProgress = [
    { day: 'Mon', sessions: 3, hours: 2.5 },
    { day: 'Tue', sessions: 4, hours: 3.2 },
    { day: 'Wed', sessions: 2, hours: 1.8 },
    { day: 'Thu', sessions: 5, hours: 4.1 },
    { day: 'Fri', sessions: 3, hours: 2.7 },
    { day: 'Sat', sessions: 6, hours: 5.2 },
    { day: 'Sun', sessions: 4, hours: 3.5 }
  ];

  const achievements = [
    { id: 1, title: 'Early Bird', description: 'Study for 5 consecutive days', earned: true, icon: '🌅' },
    { id: 2, title: 'Summary Master', description: 'Generate 10 AI summaries', earned: totalSummaries >= 10, icon: '📝' },
    { id: 3, title: 'Consistency King', description: 'Complete 20 study sessions', earned: completedSessions >= 20, icon: '👑' },
    { id: 4, title: 'Knowledge Seeker', description: 'Upload 15 materials', earned: totalMaterials >= 15, icon: '📚' },
  ];

  const performanceMetrics = [
    {
      title: 'Study Materials',
      value: totalMaterials,
      change: '+12%',
      trend: 'up',
      icon: <BookOpen className="w-6 h-6" />,
      color: 'bg-blue-500'
    },
    {
      title: 'Completion Rate',
      value: `${completionRate}%`,
      change: '+8%',
      trend: 'up',
      icon: <Target className="w-6 h-6" />,
      color: 'bg-green-500'
    },
    {
      title: 'AI Summaries',
      value: totalSummaries,
      change: '+25%',
      trend: 'up',
      icon: <Brain className="w-6 h-6" />,
      color: 'bg-purple-500'
    },
    {
      title: 'Study Hours',
      value: Math.round(completedSessions * 1.5 * 10) / 10,
      change: '+15%',
      trend: 'up',
      icon: <Clock className="w-6 h-6" />,
      color: 'bg-orange-500'
    }
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      
      <main>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            <div className="mb-8 animate-fadeIn">
              <h1 className="text-3xl font-bold text-gray-900 mb-2">Performance Analytics</h1>
              <p className="text-gray-600">
                Track your learning progress and achievements
              </p>
            </div>

            {/* Performance Metrics Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8 animate-fadeIn">
              {performanceMetrics.map((metric, index) => (
                <div
                  key={index}
                  className="bg-white rounded-2xl shadow-xl p-6 border border-gray-100 transform hover:scale-105 transition-all duration-200"
                  style={{ animationDelay: `${index * 0.1}s` }}
                >
                  <div className="flex items-center justify-between mb-4">
                    <div className={`${metric.color} p-3 rounded-xl text-white shadow-lg`}>
                      {metric.icon}
                    </div>
                    <div className="text-right">
                      <div className="text-3xl font-bold text-gray-900">
                        {metric.value}
                      </div>
                      <div className={`text-sm flex items-center ${
                        metric.trend === 'up' ? 'text-green-600' : 'text-red-600'
                      }`}>
                        <TrendingUp className="w-4 h-4 mr-1" />
                        {metric.change}
                      </div>
                    </div>
                  </div>
                  <h3 className="font-semibold text-gray-900">
                    {metric.title}
                  </h3>
                </div>
              ))}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 animate-fadeIn">
              {/* Weekly Progress Chart */}
              <div className="bg-white rounded-2xl shadow-xl p-8 border border-gray-100">
                <h2 className="text-2xl font-bold text-gray-900 mb-6 flex items-center space-x-2">
                  <CalendarIcon className="w-6 h-6 text-blue-600" />
                  <span>Weekly Progress</span>
                </h2>
                
                <div className="space-y-4">
                  {weeklyProgress.map((day) => (
                    <div key={day.day} className="flex items-center space-x-4">
                      <div className="w-12 text-sm font-medium text-gray-600">
                        {day.day}
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center space-x-2 mb-1">
                          <div className="text-sm text-gray-900 font-medium">
                            {day.sessions} sessions
                          </div>
                          <div className="text-xs text-gray-500">
                            {day.hours}h
                          </div>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-2">
                          <div
                            className="bg-gradient-to-r from-blue-500 to-purple-600 h-2 rounded-full transition-all duration-500"
                            style={{ width: `${(day.sessions / 6) * 100}%` }}
                          />
                        </div>
                      </div>
                      <div className="text-lg">
                        {day.sessions >= 5 ? '🔥' : day.sessions >= 3 ? '⭐' : '📚'}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Achievements */}
              <div className="bg-white rounded-2xl shadow-xl p-8 border border-gray-100">
                <h2 className="text-2xl font-bold text-gray-900 mb-6 flex items-center space-x-2">
                  <Award className="w-6 h-6 text-yellow-600" />
                  <span>Achievements</span>
                </h2>
                
                <div className="space-y-4">
                  {achievements.map((achievement) => (
                    <div
                      key={achievement.id}
                      className={`flex items-center space-x-4 p-4 rounded-xl border transition-all duration-200 ${
                        achievement.earned
                          ? 'bg-gradient-to-r from-yellow-50 to-orange-50 border-yellow-200'
                          : 'bg-gray-50 border-gray-200 opacity-60'
                      }`}
                    >
                      <div className="text-2xl">{achievement.icon}</div>
                      <div className="flex-1">
                        <h3 className={`font-semibold ${
                          achievement.earned 
                            ? 'text-gray-900' 
                            : 'text-gray-600'
                        }`}>
                          {achievement.title}
                        </h3>
                        <p className={`text-sm ${
                          achievement.earned 
                            ? 'text-gray-700' 
                            : 'text-gray-500'
                        }`}>
                          {achievement.description}
                        </p>
                      </div>
                      {achievement.earned && (
                        <div className="text-yellow-500">
                          <Award className="w-6 h-6" />
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Study Insights */}
            <div className="mt-8 bg-gradient-to-r from-blue-500 via-purple-600 to-pink-600 rounded-2xl p-8 text-white shadow-2xl animate-fadeIn">
              <h2 className="text-2xl font-bold mb-6 text-center flex items-center justify-center space-x-2">
                <Zap className="w-6 h-6" />
                <span>AI-Powered Insights</span>
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-white/20 backdrop-blur-sm rounded-xl p-6 text-center border border-white/20">
                  <div className="text-3xl mb-3">📈</div>
                  <div className="font-semibold text-lg">Study Streak</div>
                  <p className="text-sm opacity-80 mt-1">You&apos;re on a 5-day streak!</p>
                </div>
                <div className="bg-white/20 backdrop-blur-sm rounded-xl p-6 text-center border border-white/20">
                  <div className="text-3xl mb-3">🎯</div>
                  <div className="font-semibold text-lg">Most Productive Time</div>
                  <p className="text-sm opacity-80 mt-1">2:00 PM - 4:00 PM</p>
                </div>
                <div className="bg-white/20 backdrop-blur-sm rounded-xl p-6 text-center border border-white/20">
                  <div className="text-3xl mb-3">💡</div>
                  <div className="font-semibold text-lg">Recommendation</div>
                  <p className="text-sm opacity-80 mt-1">Focus on consistent daily habits</p>
                </div>
              </div>
            </div>
          </div>
        </main>
    </div>
  );
};

export default Performance;
