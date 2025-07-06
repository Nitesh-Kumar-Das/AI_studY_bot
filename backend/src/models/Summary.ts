import mongoose, { Schema } from 'mongoose';
import { ISummary } from '@/types';

const summarySchema = new Schema<ISummary>({
  userId: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'User ID is required']
  },
  materialId: {
    type: Schema.Types.ObjectId,
    ref: 'Material',
    required: [true, 'Material ID is required']
  },
  title: {
    type: String,
    required: [true, 'Title is required'],
    trim: true,
    maxlength: [200, 'Title cannot exceed 200 characters']
  },
  content: {
    type: String,
    required: [true, 'Content is required']
  },
  keyPoints: [{
    type: String,
    trim: true
  }],
  summaryType: {
    type: String,
    required: [true, 'Summary type is required'],
    enum: ['brief', 'detailed', 'key-points', 'flashcards']
  },
  readingTime: {
    type: Number,
    required: true,
    min: [0, 'Reading time cannot be negative']
  },
  aiModel: {
    type: String,
    required: [true, 'AI model is required'],
    default: 'gpt-3.5-turbo'
  },
  userRating: {
    type: Number,
    min: [1, 'Rating must be at least 1'],
    max: [5, 'Rating cannot exceed 5']
  },
  userFeedback: {
    type: String,
    trim: true,
    maxlength: [1000, 'Feedback cannot exceed 1000 characters']
  },
  generatedAt: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Indexes for performance
summarySchema.index({ userId: 1, generatedAt: -1 });
summarySchema.index({ materialId: 1 });
summarySchema.index({ summaryType: 1 });
summarySchema.index({ userRating: -1 });

// Virtual for reading time in minutes
summarySchema.virtual('readingTimeMinutes').get(function(this: any) {
  return Math.ceil(this.readingTime / 60);
});

export const Summary = mongoose.model<ISummary>('Summary', summarySchema);
export default Summary;
