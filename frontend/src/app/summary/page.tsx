'use client';

import { useState, useMemo, useEffect } from 'react';
import ReactMarkdown from 'react-markdown';
import useUserStore from '../../store/userStore';
import Loader from '../../components/Loader';
import Navbar from '../../components/Navbar';
import { useAI, SummaryGenerationOptions } from '../../hooks/useAI';
import { shouldRenderAsMarkdown, markdownComponents } from '../../utils/formatContent';
import { formatDate } from '../../utils/dateUtils';

const Summary = () => {
  const [selectedMaterial, setSelectedMaterial] = useState('');
  const [summaryType, setSummaryType] = useState<'brief' | 'detailed' | 'key-points' | 'flashcards'>('detailed');
  const [difficulty, setDifficulty] = useState<'beginner' | 'intermediate' | 'advanced'>('intermediate');
  const [focusAreas, setFocusAreas] = useState<string[]>([]);
  const [newFocusArea, setNewFocusArea] = useState('');

  const { 
    materials, 
    summaries, 
    addSummary, 
    removeSummary,
    setSummaries,
    loadUserData
  } = useUserStore();

  // Filter out any invalid materials or summaries
  const validMaterials = materials.filter(material => 
    material.id && 
    material.title && 
    (material.id.startsWith('sample-material-') || material.id.length === 24) // 24 chars for ObjectId
  );
  
  const validSummaries = summaries.filter(summary => 
    summary.materialId && 
    validMaterials.some(material => material.id === summary.materialId)
  );

  const {
    isGenerating,
    jobStatus,
    error: aiError,
    generateSummary,
    clearError,
    clearJobStatus,
    isJobCompleted,
    jobResult
  } = useAI();

  // Check for material parameter in URL and auto-select
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const materialParam = urlParams.get('material');
    if (materialParam && validMaterials.some(m => m.id === materialParam)) {
      setSelectedMaterial(materialParam);
    }
  }, [validMaterials]);

  // Load user data on component mount to ensure we have latest data
  useEffect(() => {
    loadUserData().catch(error => {
      console.warn('Failed to load user data in summary page:', error);
    });
  }, [loadUserData]);

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

  // Handle job completion
  useEffect(() => {
    if (isJobCompleted && jobResult) {
      // For real materials, the summary is already saved to backend
      // We need to refresh the summaries list
      const isDemo = selectedMaterial.startsWith('sample-material-');
      
      if (isDemo) {
        // Add the completed summary to the store for demo materials
        const newSummary = {
          id: Date.now().toString(),
          title: jobResult.title,
          content: jobResult.content,
          materialId: selectedMaterial,
          createdAt: new Date(),
          userId: 'current-user-id',
        };
        
        addSummary(newSummary);
      } else {
        // For real materials, reload summaries from backend
        const { apiHelper } = require('../../lib/api');
        apiHelper.summary.getAll()
          .then((response: any) => {
            if (response.data?.summaries) {
              setSummaries(response.data.summaries);
            }
          })
          .catch((error: any) => {
            console.error('Failed to reload summaries:', error);
          });
      }
      
      setSelectedMaterial('');
      clearJobStatus();
    }
  }, [isJobCompleted, jobResult, addSummary, selectedMaterial, clearJobStatus]);

  const handleGenerateSummary = async () => {
    if (!selectedMaterial) return;

    // Validate that the selected material exists in our materials list
    const materialExists = validMaterials.find(m => m.id === selectedMaterial);
    if (!materialExists) {
      console.error('Selected material not found in materials list:', selectedMaterial);
      alert('Error: Selected material not found. Please select a valid material.');
      return;
    }
    
    // Validate that sample materials have proper IDs
    if (selectedMaterial.startsWith('sample-material-')) {
      console.log('Using sample material:', selectedMaterial);
    } else {
      console.log('Using database material:', selectedMaterial);
    }

    try {
      clearError();
      
      const options: SummaryGenerationOptions = {
        materialId: selectedMaterial,
        summaryType,
        difficulty,
        ...(focusAreas.length > 0 && { focusAreas }),
      };

      await generateSummary(options);
    } catch (error) {
      console.error('Failed to generate summary:', error);
    }
  };

  const handleAddFocusArea = () => {
    if (newFocusArea.trim() && focusAreas.length < 5) {
      setFocusAreas([...focusAreas, newFocusArea.trim()]);
      setNewFocusArea('');
    }
  };

  const handleRemoveFocusArea = (index: number) => {
    setFocusAreas(focusAreas.filter((_, i) => i !== index));
  };

  const handleDelete = (summaryId: string) => {
    removeSummary(summaryId);
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
                key={`summary-star-${i}`}
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
        
        {/* Summary Constellation Points */}
        <div className="absolute top-20 left-16 w-3 h-3 bg-gradient-to-r from-purple-400 to-pink-500 rounded-full animate-star-twinkle opacity-80 shadow-lg" style={{filter: 'drop-shadow(0 0 8px #a855f7)'}}></div>
        <div className="absolute top-40 right-20 w-2.5 h-2.5 bg-gradient-to-r from-blue-400 to-cyan-400 rounded-full animate-star-pulse opacity-75 shadow-lg" style={{animationDelay: '1s', filter: 'drop-shadow(0 0 6px #06b6d4)'}}></div>
        <div className="absolute bottom-32 left-24 w-3 h-3 bg-gradient-to-r from-green-400 to-emerald-500 rounded-full animate-star-twinkle opacity-85 shadow-lg" style={{animationDelay: '2s', filter: 'drop-shadow(0 0 8px #10b981)'}}></div>
        
        {/* Floating Summary Symbols */}
        <div className="absolute top-32 right-1/4 text-2xl opacity-15 animate-float-planet text-purple-400">📝</div>
        <div className="absolute bottom-40 left-1/4 text-3xl opacity-12 animate-float-planet-reverse text-blue-400" style={{animationDelay: '2s'}}>💎</div>
        <div className="absolute top-1/2 left-1/8 text-2xl opacity-18 animate-float-planet-slow text-green-400" style={{animationDelay: '1s'}}>🧠</div>
        
        {/* Knowledge Nebula for Summary */}
        <div 
          className="absolute top-1/4 right-1/4 w-80 h-80 bg-gradient-to-r from-purple-600/8 via-pink-600/6 to-blue-600/8 rounded-full filter blur-3xl animate-nebula-drift"
          style={{
            boxShadow: '0 0 80px rgba(147, 51, 234, 0.12)'
          }}
        ></div>
        <div 
          className="absolute bottom-1/3 left-1/3 w-64 h-64 bg-gradient-to-r from-green-600/8 via-cyan-600/6 to-blue-600/8 rounded-full filter blur-3xl animate-nebula-pulse"
          style={{
            boxShadow: '0 0 60px rgba(16, 185, 129, 0.1)',
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
                backgroundImage: 'linear-gradient(45deg, #ffffff, #a855f7, #ec4899, #06b6d4)',
                backgroundSize: '200% 200%',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                backgroundClip: 'text',
                filter: 'drop-shadow(0 0 10px rgba(255, 255, 255, 0.3))'
              }}>Knowledge Crystal Generator</h1>
              <p className="text-gray-300">
                Transform your study materials into concentrated wisdom crystals
              </p>
            </div>

            {/* Generate Summary Section */}
            <div className="bg-black/20 backdrop-blur-md border border-white/10 rounded-2xl p-8 mb-8 animate-fadeIn relative overflow-hidden">
              {/* Card Background */}
              <div className="absolute inset-0 bg-gradient-to-br from-purple-600/10 via-pink-600/5 to-blue-600/10 rounded-2xl"></div>
              <div className="absolute top-2 right-4 w-1.5 h-1.5 bg-purple-400 rounded-full animate-star-twinkle opacity-60"></div>
              <div className="absolute bottom-4 left-6 w-1 h-1 bg-pink-400 rounded-full animate-star-pulse opacity-70"></div>
              
              <div className="relative z-10">
                <div className="flex items-center space-x-3 mb-6">
                  <div className="w-12 h-12 bg-gradient-to-r from-purple-500 to-pink-600 rounded-xl flex items-center justify-center shadow-lg" style={{filter: 'drop-shadow(0 0 8px rgba(147, 51, 234, 0.5))'}}>
                    <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                  </div>
                  <div>
                    <h2 className="text-2xl font-bold text-white">Generate New Crystal</h2>
                    <p className="text-gray-300">Transform your study materials into concentrated knowledge</p>
                  </div>
                </div>
              
              {materials.length === 0 ? (
                <div className="text-center py-12 bg-gradient-to-br from-purple-600/10 to-pink-600/10 rounded-xl border border-purple-500/20">
                  <div className="w-16 h-16 bg-gradient-to-r from-purple-500 to-pink-600 rounded-full mx-auto flex items-center justify-center mb-4 shadow-lg" style={{filter: 'drop-shadow(0 0 8px rgba(147, 51, 234, 0.5))'}}>
                    <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                    </svg>
                  </div>
                  <h3 className="text-lg font-semibold text-white mb-2">No Knowledge Materials Found</h3>
                  <p className="text-gray-300 mb-6">
                    Launch your first materials to start generating cosmic wisdom crystals
                  </p>
                  <a
                    href="/upload"
                    className="inline-flex items-center space-x-2 bg-gradient-to-r from-purple-500 to-pink-600 hover:from-purple-600 hover:to-pink-700 text-white px-6 py-3 rounded-xl font-semibold transition-all duration-300 transform hover:scale-105 shadow-lg hover:shadow-xl backdrop-blur-sm border border-white/20"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                    </svg>
                    <span>Launch Materials</span>
                  </a>
                </div>
              ) : (
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                  <div className="lg:col-span-2 space-y-6">
                    <div>
                      <label className="block text-sm font-semibold text-white mb-3">
                        Select Knowledge Material
                      </label>
                      <select
                        value={selectedMaterial}
                        onChange={(e) => setSelectedMaterial(e.target.value)}
                        className="w-full px-4 py-3 bg-white/10 border border-white/20 text-white rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500/50 focus:border-purple-500/50 backdrop-blur-sm"
                        disabled={isGenerating}
                      >
                        <option value="" className="text-gray-900">Choose a material to crystallize</option>
                        {validMaterials.map((material) => (
                          <option key={material.id} value={material.id} className="text-gray-900">
                            {material.type === 'pdf' ? '📄' :
                             material.type === 'video' ? '🎥' :
                             material.type === 'audio' ? '🎵' : '📝'} {material.title}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-semibold text-white mb-3">
                          Summary Type
                        </label>
                        <select
                          value={summaryType}
                          onChange={(e) => setSummaryType(e.target.value as any)}
                          className="w-full px-4 py-3 bg-white/10 border border-white/20 text-white rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500/50 focus:border-purple-500/50 backdrop-blur-sm"
                          disabled={isGenerating}
                        >
                          <option value="brief" className="text-gray-900">📝 Brief Summary</option>
                          <option value="detailed" className="text-gray-900">📚 Detailed Summary</option>
                          <option value="key-points" className="text-gray-900">🎯 Key Points</option>
                          <option value="flashcards" className="text-gray-900">🗂️ Flashcards</option>
                        </select>
                      </div>

                      <div>
                        <label className="block text-sm font-semibold text-white mb-3">
                          Difficulty Level
                        </label>
                        <select
                          value={difficulty}
                          onChange={(e) => setDifficulty(e.target.value as any)}
                          className="w-full px-4 py-3 bg-white/10 border border-white/20 text-white rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500/50 focus:border-purple-500/50 backdrop-blur-sm"
                          disabled={isGenerating}
                        >
                          <option value="beginner" className="text-gray-900">🌱 Beginner</option>
                          <option value="intermediate" className="text-gray-900">🌿 Intermediate</option>
                          <option value="advanced" className="text-gray-900">🌳 Advanced</option>
                        </select>
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-semibold text-white mb-3">
                        Focus Areas (Optional)
                      </label>
                      <div className="flex flex-wrap gap-2 mb-3">
                        {focusAreas.map((area, index) => (
                          <span
                            key={index}
                            className="inline-flex items-center space-x-2 bg-purple-500/20 text-purple-300 px-3 py-1 rounded-lg text-sm border border-purple-400/30"
                          >
                            <span>{area}</span>
                            <button
                              onClick={() => handleRemoveFocusArea(index)}
                              className="text-purple-400 hover:text-purple-300"
                            >
                              ×
                            </button>
                          </span>
                        ))}
                      </div>
                      <div className="flex space-x-2">
                        <input
                          type="text"
                          value={newFocusArea}
                          onChange={(e) => setNewFocusArea(e.target.value)}
                          placeholder="Add focus area..."
                          className="flex-1 px-4 py-2 bg-white/10 border border-white/20 text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500/50 focus:border-purple-500/50 backdrop-blur-sm placeholder-gray-400"
                          disabled={isGenerating || focusAreas.length >= 5}
                          onKeyPress={(e) => e.key === 'Enter' && handleAddFocusArea()}
                        />
                        <button
                          onClick={handleAddFocusArea}
                          disabled={!newFocusArea.trim() || focusAreas.length >= 5 || isGenerating}
                          className="px-4 py-2 bg-purple-500/20 text-purple-300 rounded-lg hover:bg-purple-500/30 disabled:opacity-50 disabled:cursor-not-allowed border border-purple-400/30"
                        >
                          Add
                        </button>
                      </div>
                      <p className="text-xs text-gray-400 mt-1">
                        Add up to 5 specific areas to focus on in the summary
                      </p>
                    </div>
                  </div>
                  
                  <div className="flex items-end">
                    <button
                      onClick={handleGenerateSummary}
                      disabled={!selectedMaterial || isGenerating}
                      className="w-full bg-gradient-to-r from-purple-500 to-pink-600 hover:from-purple-600 hover:to-pink-700 disabled:from-gray-500/50 disabled:to-gray-600/50 disabled:cursor-not-allowed text-white px-6 py-3 rounded-xl font-semibold transition-all duration-300 transform hover:scale-105 shadow-lg hover:shadow-xl disabled:transform-none disabled:shadow-none backdrop-blur-sm border border-white/20"
                    >
                      {isGenerating ? (
                        <div className="flex items-center justify-center space-x-2">
                          <div className="animate-spin w-5 h-5 border-2 border-white border-t-transparent rounded-full"></div>
                          <span>Crystallizing...</span>
                        </div>
                      ) : (
                        <div className="flex items-center justify-center space-x-2">
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                          </svg>
                          <span>Generate Crystal</span>
                        </div>
                      )}
                    </button>
                  </div>
                </div>
              )}

              {(isGenerating || jobStatus) && (
                <div className="mt-8 text-center bg-gradient-to-br from-purple-600/10 to-pink-600/10 rounded-xl p-8 border border-purple-500/20 backdrop-blur-sm">
                  <div className="animate-pulse-slow mb-4">
                    <div className="w-16 h-16 bg-gradient-to-r from-purple-500 to-pink-600 rounded-full mx-auto flex items-center justify-center shadow-lg" style={{filter: 'drop-shadow(0 0 8px rgba(147, 51, 234, 0.5))'}}>
                      <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                      </svg>
                    </div>
                  </div>
                  
                  {jobStatus && (
                    <div className="mb-4">
                      <div className="w-full bg-gray-700 rounded-full h-2 mb-2">
                        <div 
                          className="bg-gradient-to-r from-purple-500 to-pink-600 h-2 rounded-full transition-all duration-300"
                          style={{ width: `${jobStatus.progress}%` }}
                        ></div>
                      </div>
                      <p className="text-sm text-gray-300">
                        {jobStatus.status === 'processing' ? 'Cosmic AI is crystallizing your knowledge...' : 
                         jobStatus.status === 'completed' ? 'Crystal ready! ✨' :
                         jobStatus.status === 'failed' ? 'Crystallization failed 😔' :
                         'Preparing for crystallization...'}
                      </p>
                    </div>
                  )}

                  {aiError && (
                    <div className="mt-4 p-4 bg-red-500/20 border border-red-500/30 rounded-lg">
                      <p className="text-red-300 text-sm">{aiError}</p>
                      <button 
                        onClick={clearError}
                        className="mt-2 text-red-400 hover:text-red-300 text-xs underline"
                      >
                        Dismiss
                      </button>
                    </div>
                  )}

                  <Loader size="md" text="Cosmic AI is crystallizing your knowledge..." />
                </div>
              )}
              </div>
            </div>

            {/* Generated Summaries */}
            <div className="bg-black/20 backdrop-blur-md border border-white/10 rounded-2xl p-8 animate-fadeIn relative overflow-hidden">
              {/* Card Background */}
              <div className="absolute inset-0 bg-gradient-to-br from-blue-600/10 via-purple-600/5 to-cyan-600/10 rounded-2xl"></div>
              <div className="absolute top-2 right-4 w-1.5 h-1.5 bg-blue-400 rounded-full animate-star-twinkle opacity-60"></div>
              <div className="absolute bottom-4 left-6 w-1 h-1 bg-purple-400 rounded-full animate-star-pulse opacity-70"></div>
              
              <div className="relative z-10">
                <div className="flex items-center justify-between mb-6">
                  <div className="flex items-center space-x-3">
                    <div className="w-12 h-12 bg-gradient-to-r from-blue-500 to-purple-600 rounded-xl flex items-center justify-center shadow-lg" style={{filter: 'drop-shadow(0 0 8px rgba(59, 130, 246, 0.5))'}}>
                      <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                      </svg>
                    </div>
                    <div>
                      <h2 className="text-2xl font-bold text-white">Your Knowledge Crystals</h2>
                      <p className="text-gray-300">Access to all your crystallized wisdom</p>
                  </div>
                </div>
                <div className="bg-gradient-to-r from-blue-500 to-purple-600 text-white px-4 py-2 rounded-xl font-semibold">
                  {validSummaries.length} {validSummaries.length === 1 ? 'summary' : 'summaries'}
                </div>
              </div>
              
              {validSummaries.length === 0 ? (
                <div className="text-center py-12 bg-gradient-to-br from-purple-600/10 to-pink-600/10 rounded-xl border border-purple-500/20">
                  <div className="w-16 h-16 bg-gradient-to-r from-purple-500 to-pink-600 rounded-full mx-auto flex items-center justify-center mb-4 shadow-lg" style={{filter: 'drop-shadow(0 0 8px rgba(147, 51, 234, 0.5))'}}>
                    <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                  </div>
                  <h3 className="text-lg font-semibold text-white mb-2">No Crystals Generated Yet</h3>
                  <p className="text-gray-300">Generate your first cosmic wisdom crystal from the section above</p>
                </div>
              ) : (
                <div className="space-y-6">
                  {validSummaries.map((summary, index) => {
                    const material = validMaterials.find(m => m.id === summary.materialId);
                    return (
                      <div key={summary.id} 
                           className="group bg-black/20 backdrop-blur-md border border-white/10 rounded-2xl p-6 hover:border-purple-400/30 hover:shadow-lg transition-all duration-300 animate-fadeIn relative overflow-hidden list-glow list-shimmer"
                           style={{ 
                             animationDelay: `${index * 0.1}s`,
                             ['--glow-color' as any]: 'rgba(147, 51, 234, 0.4)'
                           }}>
                        {/* Cosmic enhanced background with crystal pulse */}
                        <div className="absolute inset-0 bg-gradient-to-br from-purple-600/5 via-pink-600/5 to-blue-600/5 rounded-2xl crystal-pulse"></div>
                        <div className="absolute top-2 right-4 w-1 h-1 bg-purple-400 rounded-full animate-star-twinkle opacity-50"></div>
                        
                        {/* Enhanced orbital icon */}
                        <div className="absolute top-4 left-4 w-8 h-8 rounded-full bg-gradient-to-r from-purple-500 to-pink-500 opacity-60 animate-icon-orbit" style={{
                          filter: 'drop-shadow(0 0 6px rgba(147, 51, 234, 0.6))'
                        }}></div>
                        
                        <div className="relative z-10">
                          <div className="flex justify-between items-start mb-4">
                            <div className="flex-1">
                              <h3 className="text-xl font-bold text-white mb-2">
                                {summary.title}
                              </h3>
                              <div className="flex items-center text-sm text-gray-300 space-x-4 mb-3">
                                <div className="flex items-center space-x-1">
                                  <span>📚</span>
                                  <span>{material?.title}</span>
                                </div>
                                <div className="flex items-center space-x-1">
                                  <span>📅</span>
                                  <span>{formatDate(summary.createdAt)}</span>
                                </div>
                              </div>
                            </div>
                            <button
                              onClick={() => handleDelete(summary.id)}
                              className="opacity-0 group-hover:opacity-100 text-red-400 hover:text-red-300 p-2 hover:bg-red-500/20 rounded-lg transition-all duration-200"
                            >
                              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                              </svg>
                            </button>
                          </div>
                          
                          <div className="bg-gradient-to-br from-blue-500/10 to-purple-500/10 rounded-xl p-6 mb-4 border border-blue-400/20 backdrop-blur-sm crystal-pulse group-hover:border-blue-400/40 transition-all duration-300" style={{
                            filter: 'drop-shadow(0 0 8px rgba(59, 130, 246, 0.2))'
                          }}>
                            {shouldRenderAsMarkdown(summary.content) ? (
                              <ReactMarkdown components={markdownComponents}>
                                {summary.content}
                              </ReactMarkdown>
                            ) : (
                              <p className="text-gray-200 leading-relaxed group-hover:text-white transition-colors duration-300">
                                {summary.content}
                              </p>
                            )}
                          </div>
                          
                          <div className="flex flex-wrap gap-3">
                            <button className="flex items-center space-x-2 bg-blue-500/20 hover:bg-blue-500/30 text-blue-300 py-2 px-4 rounded-lg text-sm font-medium transition-all duration-300 backdrop-blur-sm border border-blue-400/30 hover:border-blue-400/50 hover:scale-105 hover:shadow-lg hover:shadow-blue-400/20 list-shimmer">
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                              </svg>
                              <span>Copy Crystal</span>
                            </button>
                            <button className="flex items-center space-x-2 bg-green-500/20 hover:bg-green-500/30 text-green-300 py-2 px-4 rounded-lg text-sm font-medium transition-all duration-300 backdrop-blur-sm border border-green-400/30 hover:border-green-400/50 hover:scale-105 hover:shadow-lg hover:shadow-green-400/20 list-shimmer">
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                              </svg>
                              <span>Export Scroll</span>
                            </button>
                            <button className="flex items-center space-x-2 bg-purple-500/20 hover:bg-purple-500/30 text-purple-300 py-2 px-4 rounded-lg text-sm font-medium transition-all duration-300 backdrop-blur-sm border border-purple-400/30 hover:border-purple-400/50 hover:scale-105 hover:shadow-lg hover:shadow-purple-400/20 list-shimmer">
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                              </svg>
                              <span>Create Runes</span>
                            </button>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Cosmic Analytics Section */}
            {validSummaries.length > 0 && (
              <div className="mt-8 bg-black/20 backdrop-blur-md border border-white/10 rounded-2xl p-8 animate-fadeIn relative overflow-hidden">
                {/* Card Background */}
                <div className="absolute inset-0 bg-gradient-to-br from-green-600/10 via-cyan-600/5 to-blue-600/10 rounded-2xl"></div>
                <div className="absolute top-2 right-4 w-1.5 h-1.5 bg-green-400 rounded-full animate-star-twinkle opacity-60"></div>
                <div className="absolute bottom-4 left-6 w-1 h-1 bg-cyan-400 rounded-full animate-star-pulse opacity-70"></div>
                
                <div className="relative z-10">
                  <h2 className="text-2xl font-bold text-white mb-6 flex items-center space-x-3">
                    <div className="w-12 h-12 bg-gradient-to-r from-green-500 to-cyan-600 rounded-xl flex items-center justify-center shadow-lg" style={{filter: 'drop-shadow(0 0 8px rgba(16, 185, 129, 0.5))'}}>
                      <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                      </svg>
                    </div>
                    <span>Cosmic Analytics</span>
                  </h2>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className="text-center p-6 bg-gradient-to-br from-blue-500/20 to-cyan-500/20 rounded-xl border border-blue-400/30 backdrop-blur-sm crystal-pulse hover:scale-105 transition-transform duration-300 list-glow" style={{
                      ['--glow-color' as any]: 'rgba(59, 130, 246, 0.3)'
                    }}>
                      <div className="text-3xl font-bold text-blue-300 mb-2">{validSummaries.length}</div>
                      <div className="text-sm text-blue-200 font-medium">Crystal Summaries</div>
                    </div>
                    <div className="text-center p-6 bg-gradient-to-br from-green-500/20 to-emerald-500/20 rounded-xl border border-green-400/30 backdrop-blur-sm crystal-pulse hover:scale-105 transition-transform duration-300 list-glow" style={{
                      ['--glow-color' as any]: 'rgba(16, 185, 129, 0.3)'
                    }}>
                      <div className="text-3xl font-bold text-green-300 mb-2">
                        {new Set(validSummaries.map(s => s.materialId)).size}
                      </div>
                      <div className="text-sm text-green-200 font-medium">Materials Crystallized</div>
                    </div>
                    <div className="text-center p-6 bg-gradient-to-br from-purple-500/20 to-pink-500/20 rounded-xl border border-purple-400/30 backdrop-blur-sm crystal-pulse hover:scale-105 transition-transform duration-300 list-glow" style={{
                      ['--glow-color' as any]: 'rgba(147, 51, 234, 0.3)'
                    }}>
                      <div className="text-3xl font-bold text-purple-300 mb-2">
                        {Math.round(validSummaries.reduce((acc, summary) => acc + summary.content.length, 0) / 1000)}K
                      </div>
                      <div className="text-sm text-purple-200 font-medium">Wisdom Characters</div>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
        </main>
    </div>
  );
};

export default Summary;
