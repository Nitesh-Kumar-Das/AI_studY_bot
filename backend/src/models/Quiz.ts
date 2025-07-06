import mongoose, { Schema } from 'mongoose';
import { IQuiz, IQuizAttempt } from '@/types';

const quizQuestionSchema = new Schema({
  question: {
    type: String,
    required: [true, 'Question is required'],
    trim: true
  },
  options: [{
    type: String,
    required: true,
    trim: true
  }],
  correctAnswer: {
    type: Number,
    required: [true, 'Correct answer is required'],
    min: [0, 'Correct answer must be non-negative']
  },
  explanation: {
    type: String,
    required: [true, 'Explanation is required'],
    trim: true
  },
  difficulty: {
    type: String,
    required: [true, 'Difficulty is required'],
    enum: ['easy', 'medium', 'hard']
  },
  category: {
    type: String,
    required: [true, 'Category is required'],
    trim: true
  },
  points: {
    type: Number,
    required: true,
    min: [1, 'Points must be at least 1'],
    default: 1
  }
}, { _id: false });

const quizSchema = new Schema<IQuiz>({
  userId: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'User ID is required']
  },
  materialId: {
    type: Schema.Types.ObjectId,
    ref: 'Material'
  },
  title: {
    type: String,
    required: [true, 'Title is required'],
    trim: true,
    maxlength: [200, 'Title cannot exceed 200 characters']
  },
  description: {
    type: String,
    trim: true,
    maxlength: [500, 'Description cannot exceed 500 characters']
  },
  questions: {
    type: [quizQuestionSchema],
    required: [true, 'Questions are required'],
    validate: {
      validator: function(questions: any[]) {
        return questions.length >= 1 && questions.length <= 50;
      },
      message: 'Quiz must have between 1 and 50 questions'
    }
  },
  timeLimit: {
    type: Number,
    min: [60, 'Time limit must be at least 1 minute'],
    max: [7200, 'Time limit cannot exceed 2 hours']
  },
  passingScore: {
    type: Number,
    required: [true, 'Passing score is required'],
    min: [0, 'Passing score cannot be negative'],
    max: [100, 'Passing score cannot exceed 100'],
    default: 70
  },
  difficulty: {
    type: String,
    required: [true, 'Difficulty is required'],
    enum: ['easy', 'medium', 'hard', 'mixed']
  },
  subject: {
    type: String,
    required: [true, 'Subject is required'],
    trim: true,
    maxlength: [100, 'Subject cannot exceed 100 characters']
  },
  tags: [{
    type: String,
    trim: true,
    lowercase: true
  }],
  isPublic: {
    type: Boolean,
    default: false
  },
  totalAttempts: {
    type: Number,
    default: 0,
    min: [0, 'Total attempts cannot be negative']
  },
  averageScore: {
    type: Number,
    default: 0,
    min: [0, 'Average score cannot be negative'],
    max: [100, 'Average score cannot exceed 100']
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

const quizAttemptSchema = new Schema<IQuizAttempt>({
  userId: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'User ID is required']
  },
  quizId: {
    type: Schema.Types.ObjectId,
    ref: 'Quiz',
    required: [true, 'Quiz ID is required']
  },
  answers: [{
    type: Number,
    required: true,
    min: [0, 'Answer cannot be negative']
  }],
  score: {
    type: Number,
    required: [true, 'Score is required'],
    min: [0, 'Score cannot be negative']
  },
  percentage: {
    type: Number,
    required: [true, 'Percentage is required'],
    min: [0, 'Percentage cannot be negative'],
    max: [100, 'Percentage cannot exceed 100']
  },
  timeSpent: {
    type: Number,
    required: [true, 'Time spent is required'],
    min: [0, 'Time spent cannot be negative']
  },
  correctAnswers: {
    type: Number,
    required: [true, 'Correct answers count is required'],
    min: [0, 'Correct answers cannot be negative']
  },
  incorrectAnswers: {
    type: Number,
    required: [true, 'Incorrect answers count is required'],
    min: [0, 'Incorrect answers cannot be negative']
  },
  passed: {
    type: Boolean,
    required: [true, 'Passed status is required']
  },
  completedAt: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Indexes for performance
quizSchema.index({ userId: 1, createdAt: -1 });
quizSchema.index({ subject: 1, difficulty: 1 });
quizSchema.index({ isPublic: 1, averageScore: -1 });
quizSchema.index({ tags: 1 });

quizAttemptSchema.index({ userId: 1, completedAt: -1 });
quizAttemptSchema.index({ quizId: 1, completedAt: -1 });
quizAttemptSchema.index({ passed: 1 });

// Virtual for total possible points
quizSchema.virtual('totalPoints').get(function(this: any) {
  return this.questions.reduce((total: number, question: any) => total + question.points, 0);
});

export const Quiz = mongoose.model<IQuiz>('Quiz', quizSchema);
export const QuizAttempt = mongoose.model<IQuizAttempt>('QuizAttempt', quizAttemptSchema);

export { Quiz as default };
