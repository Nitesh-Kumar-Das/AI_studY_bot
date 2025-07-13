'use client';

import { useState, useCallback } from 'react';
import useUserStore from '../../store/userStore';
import Navbar from '../../components/Navbar';
import { 
  Brain, 
  Clock, 
  CheckCircle, 
  XCircle, 
  Play, 
  RotateCcw, 
  Trophy,
  Lightbulb,
  ArrowRight
} from 'lucide-react';

interface QuizQuestion {
  id: string;
  question: string;
  options: string[];
  correctAnswer: number;
  explanation: string;
  difficulty: 'easy' | 'medium' | 'hard';
  category: string;
}

const Quiz = () => {
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null);
  const [userAnswers, setUserAnswers] = useState<number[]>([]);
  const [showResults, setShowResults] = useState(false);
  const [quizStarted, setQuizStarted] = useState(false);
  const [timeLeft, setTimeLeft] = useState(300); // 5 minutes
  const [selectedMaterial, setSelectedMaterial] = useState('');
  const [generatingQuiz, setGeneratingQuiz] = useState(false);

  const { materials } = useUserStore();

  // Sample quiz questions
  const questions: QuizQuestion[] = [
    {
      id: '1',
      question: 'What is the primary benefit of using AI in education?',
      options: [
        'Replacing teachers entirely',
        'Personalizing learning experiences',
        'Making education more expensive',
        'Reducing student engagement'
      ],
      correctAnswer: 1,
      explanation: 'AI can personalize learning by adapting to individual student needs, learning pace, and preferences.',
      difficulty: 'easy',
      category: 'AI in Education'
    },
    {
      id: '2',
      question: 'Which study technique is most effective for long-term retention?',
      options: [
        'Cramming before exams',
        'Spaced repetition',
        'Reading notes once',
        'Highlighting everything'
      ],
      correctAnswer: 1,
      explanation: 'Spaced repetition involves reviewing material at increasing intervals, which has been proven to improve long-term retention.',
      difficulty: 'medium',
      category: 'Study Techniques'
    },
    {
      id: '3',
      question: 'What is the Pomodoro Technique?',
      options: [
        'A cooking method',
        'A time management technique using 25-minute focused work sessions',
        'A note-taking strategy',
        'A memory palace technique'
      ],
      correctAnswer: 1,
      explanation: 'The Pomodoro Technique involves working in focused 25-minute intervals followed by short breaks.',
      difficulty: 'easy',
      category: 'Time Management'
    }
  ];

  const handleGenerateQuiz = useCallback(async () => {
    setGeneratingQuiz(true);
    // Simulate API call to generate quiz
    setTimeout(() => {
      setGeneratingQuiz(false);
      setQuizStarted(true);
    }, 2000);
  }, []);

  const handleAnswerSelect = (answerIndex: number) => {
    setSelectedAnswer(answerIndex);
  };

  const handleNextQuestion = () => {
    if (selectedAnswer !== null) {
      const newAnswers = [...userAnswers];
      newAnswers[currentQuestion] = selectedAnswer;
      setUserAnswers(newAnswers);
      
      if (currentQuestion < questions.length - 1) {
        setCurrentQuestion(currentQuestion + 1);
        setSelectedAnswer(null);
      } else {
        setShowResults(true);
      }
    }
  };

  const calculateScore = () => {
    const correctAnswers = userAnswers.filter((answer, index) => answer === questions[index].correctAnswer).length;
    return Math.round((correctAnswers / questions.length) * 100);
  };

  const resetQuiz = () => {
    setCurrentQuestion(0);
    setSelectedAnswer(null);
    setUserAnswers([]);
    setShowResults(false);
    setQuizStarted(false);
    setTimeLeft(300);
  };

  // Quiz Start Screen
  if (!quizStarted && !showResults) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navbar />
        
        <main>
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            <div className="text-center mb-12 animate-fadeIn">
              <div className="w-20 h-20 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full flex items-center justify-center mx-auto mb-6 shadow-2xl">
                <Brain className="w-10 h-10 text-white" />
              </div>
              <h1 className="text-4xl font-bold text-gray-900 mb-4 gradient-text">
                AI Quiz Challenge
              </h1>
              <p className="text-xl text-gray-600 mb-8">
                Test your knowledge with AI-generated questions from your study materials
              </p>
            </div>

            <div className="bg-white rounded-2xl shadow-xl p-8 mb-8 border border-gray-100">
              <div className="grid md:grid-cols-2 gap-8 mb-8">
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Quiz Details</h3>
                  <div className="space-y-3">
                    <div className="flex items-center space-x-3">
                      <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
                        <Brain className="w-4 h-4 text-blue-600" />
                      </div>
                      <span className="text-gray-700">{questions.length} Questions</span>
                    </div>
                    <div className="flex items-center space-x-3">
                      <div className="w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center">
                        <Clock className="w-4 h-4 text-green-600" />
                      </div>
                      <span className="text-gray-700">5 minutes</span>
                    </div>
                    <div className="flex items-center space-x-3">
                      <div className="w-8 h-8 bg-purple-100 rounded-lg flex items-center justify-center">
                        <Trophy className="w-4 h-4 text-purple-600" />
                      </div>
                      <span className="text-gray-700">Mixed Difficulty</span>
                    </div>
                  </div>
                </div>

                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Generate from Material</h3>
                  <select
                    value={selectedMaterial}
                    onChange={(e) => setSelectedMaterial(e.target.value)}
                    className="w-full p-3 border border-gray-300 rounded-lg bg-white text-gray-900 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="">Select study material...</option>
                    {materials.map((material) => (
                      <option key={material.id} value={material.id}>
                        {material.title}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <button
                  onClick={() => setQuizStarted(true)}
                  disabled={generatingQuiz}
                  className="action-btn-primary disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
                >
                  <Play className="w-5 h-5" />
                  <span>Start Sample Quiz</span>
                </button>
                
                <button
                  onClick={handleGenerateQuiz}
                  disabled={!selectedMaterial || generatingQuiz}
                  className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 disabled:opacity-50 disabled:cursor-not-allowed text-white px-8 py-4 rounded-xl font-semibold transition-all duration-200 transform hover:scale-105 shadow-lg flex items-center space-x-2"
                >
                  {generatingQuiz ? (
                    <>
                      <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                      <span>Generating...</span>
                    </>
                  ) : (
                    <>
                      <Lightbulb className="w-5 h-5" />
                      <span>Generate from Material</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </main>
      </div>
    );
  }

  // Quiz Results Screen
  if (showResults) {
    const score = calculateScore();
    const correctAnswers = userAnswers.filter((answer, index) => answer === questions[index].correctAnswer).length;

    return (
      <div className="min-h-screen bg-gray-50">
        <Navbar />
        
        <main>
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            <div className="text-center mb-8 animate-fadeIn">
              <div className="w-24 h-24 bg-gradient-to-r from-green-500 to-blue-600 rounded-full flex items-center justify-center mx-auto mb-6 shadow-2xl">
                <Trophy className="w-12 h-12 text-white" />
              </div>
              <h1 className="text-4xl font-bold text-gray-900 mb-2">Quiz Complete!</h1>
              <p className="text-xl text-gray-600">Here are your results</p>
            </div>

            <div className="bg-white rounded-2xl shadow-xl p-8 mb-8 border border-gray-100">
              <div className="text-center mb-8">
                <div className="text-6xl font-bold text-gray-900 mb-2">{score}%</div>
                <p className="text-gray-600 text-lg">
                  {correctAnswers} out of {questions.length} questions correct
                </p>
                <div className={`inline-block px-4 py-2 rounded-full text-white font-semibold mt-4 ${
                  score >= 80 ? 'bg-green-500' : score >= 60 ? 'bg-yellow-500' : 'bg-red-500'
                }`}>
                  {score >= 80 ? 'Excellent!' : score >= 60 ? 'Good Job!' : 'Keep Studying!'}
                </div>
              </div>

              <div className="space-y-6">
                {questions.map((question, index) => (
                  <div key={question.id} className="border border-gray-200 rounded-lg p-6">
                    <div className="flex items-start space-x-4">
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${
                        userAnswers[index] === question.correctAnswer ? 'bg-green-500' : 'bg-red-500'
                      }`}>
                        {userAnswers[index] === question.correctAnswer ? (
                          <CheckCircle className="w-5 h-5 text-white" />
                        ) : (
                          <XCircle className="w-5 h-5 text-white" />
                        )}
                      </div>
                      <div className="flex-1">
                        <h3 className="font-semibold text-gray-900 mb-2">
                          Question {index + 1}: {question.question}
                        </h3>
                        <div className="space-y-2 mb-4">
                          {question.options.map((option, optionIndex) => (
                            <div key={optionIndex} className={`p-3 rounded-lg ${
                              optionIndex === question.correctAnswer 
                                ? 'bg-green-100 border border-green-300' 
                                : optionIndex === userAnswers[index] && userAnswers[index] !== question.correctAnswer
                                ? 'bg-red-100 border border-red-300'
                                : 'bg-gray-50'
                            }`}>
                              <span className="text-gray-900">{option}</span>
                              {optionIndex === question.correctAnswer && (
                                <span className="ml-2 text-green-600 font-semibold">✓ Correct</span>
                              )}
                              {optionIndex === userAnswers[index] && userAnswers[index] !== question.correctAnswer && (
                                <span className="ml-2 text-red-600 font-semibold">✗ Your answer</span>
                              )}
                            </div>
                          ))}
                        </div>
                        <div className="bg-blue-50 p-4 rounded-lg">
                          <div className="flex items-start space-x-2">
                            <Lightbulb className="w-5 h-5 text-blue-600 mt-0.5" />
                            <div>
                              <p className="font-semibold text-blue-900 mb-1">Explanation:</p>
                              <p className="text-blue-800">{question.explanation}</p>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              <div className="text-center mt-8">
                <button
                  onClick={resetQuiz}
                  className="bg-purple-600 hover:bg-purple-700 text-white px-8 py-4 rounded-xl font-semibold transition-all duration-200 transform hover:scale-105 shadow-lg flex items-center space-x-2 mx-auto"
                >
                  <RotateCcw className="w-5 h-5" />
                  <span>Take Another Quiz</span>
                </button>
              </div>
            </div>
          </div>
        </main>
      </div>
    );
  }

  // Quiz Question Screen
  const currentQ = questions[currentQuestion];
  const progress = ((currentQuestion + 1) / questions.length) * 100;

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      
      <main>
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* Quiz Header */}
          <div className="flex justify-between items-center mb-8 animate-fadeIn">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">AI Quiz Challenge</h1>
              <p className="text-gray-600">Question {currentQuestion + 1} of {questions.length}</p>
            </div>
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2">
                <Clock className="w-5 h-5 text-gray-500" />
                <span className="text-gray-600">{Math.floor(timeLeft / 60)}:{(timeLeft % 60).toString().padStart(2, '0')}</span>
              </div>
            </div>
          </div>

          {/* Progress Bar */}
          <div className="mb-8">
            <div className="flex justify-between text-sm text-gray-600 mb-2">
              <span>Progress</span>
              <span>{Math.round(progress)}%</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div 
                className="bg-gradient-to-r from-blue-500 to-purple-600 h-2 rounded-full transition-all duration-300"
                style={{ width: `${progress}%` }}
              ></div>
            </div>
          </div>

          {/* Question Card */}
          <div className="bg-white rounded-2xl shadow-xl p-8 mb-8 border border-gray-100 animate-fadeIn">
            <div className="mb-6">
              <div className="flex items-center justify-between mb-4">
                <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                  currentQ.difficulty === 'easy' 
                    ? 'bg-green-100 text-green-800'
                    : currentQ.difficulty === 'medium'
                    ? 'bg-yellow-100 text-yellow-800'
                    : 'bg-red-100 text-red-800'
                }`}>
                  {currentQ.difficulty.charAt(0).toUpperCase() + currentQ.difficulty.slice(1)}
                </span>
                <span className="text-sm text-gray-500">{currentQ.category}</span>
              </div>
              <h2 className="text-xl font-semibold text-gray-900 mb-6">
                {currentQ.question}
              </h2>
            </div>

            <div className="space-y-3 mb-8">
              {currentQ.options.map((option, index) => (
                <button
                  key={index}
                  onClick={() => handleAnswerSelect(index)}
                  className={`w-full text-left p-4 rounded-lg border-2 transition-all duration-200 ${
                    selectedAnswer === index
                      ? 'border-blue-500 bg-blue-50 text-blue-900'
                      : 'border-gray-200 hover:border-gray-300 bg-white text-gray-900'
                  }`}
                >
                  <div className="flex items-center space-x-3">
                    <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center ${
                      selectedAnswer === index
                        ? 'border-blue-500 bg-blue-500'
                        : 'border-gray-300'
                    }`}>
                      {selectedAnswer === index && (
                        <CheckCircle className="w-4 h-4 text-white" />
                      )}
                    </div>
                    <span className="flex-1">{option}</span>
                  </div>
                </button>
              ))}
            </div>

            <div className="flex justify-end">
              <button
                onClick={handleNextQuestion}
                disabled={selectedAnswer === null}
                className="action-btn-primary disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
              >
                <span>{currentQuestion === questions.length - 1 ? 'Finish Quiz' : 'Next Question'}</span>
                <ArrowRight className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default Quiz;
