import mongoose, { Schema } from 'mongoose';
import { IMaterial } from '@/types';

const materialSchema = new Schema<IMaterial>({
  userId: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'User ID is required']
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
  type: {
    type: String,
    required: [true, 'Type is required'],
    enum: ['pdf', 'docx', 'txt', 'manual']
  },
  filename: {
    type: String,
    trim: true
  },
  originalName: {
    type: String,
    trim: true
  },
  size: {
    type: Number,
    min: [0, 'Size cannot be negative']
  },
  metadata: {
    pages: {
      type: Number,
      min: [0, 'Pages cannot be negative']
    },
    wordCount: {
      type: Number,
      required: true,
      min: [0, 'Word count cannot be negative']
    },
    readingTime: {
      type: Number,
      required: true,
      min: [0, 'Reading time cannot be negative']
    },
    language: {
      type: String,
      default: 'en'
    },
    extractedImages: {
      type: Number,
      default: 0,
      min: [0, 'Extracted images cannot be negative']
    }
  },
  tags: [{
    type: String,
    trim: true,
    lowercase: true
  }],
  subject: {
    type: String,
    required: [true, 'Subject is required'],
    trim: true,
    maxlength: [100, 'Subject cannot exceed 100 characters']
  },
  difficulty: {
    type: String,
    required: [true, 'Difficulty is required'],
    enum: ['beginner', 'intermediate', 'advanced']
  },
  isPublic: {
    type: Boolean,
    default: false
  },
  uploadedAt: {
    type: Date,
    default: Date.now
  },
  lastAccessedAt: {
    type: Date,
    default: Date.now
  },
  accessCount: {
    type: Number,
    default: 0,
    min: [0, 'Access count cannot be negative']
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Indexes for performance
materialSchema.index({ userId: 1, uploadedAt: -1 });
materialSchema.index({ subject: 1, difficulty: 1 });
materialSchema.index({ tags: 1 });
materialSchema.index({ isPublic: 1, uploadedAt: -1 });
materialSchema.index({ title: 'text', content: 'text' });

// Virtual for reading time in minutes
materialSchema.virtual('readingTimeMinutes').get(function(this: any) {
  return Math.ceil(this.metadata.readingTime / 60);
});

// Pre-save middleware to update lastAccessedAt
materialSchema.pre('findOneAndUpdate', function(this: any) {
  this.set({ lastAccessedAt: new Date() });
});

export const Material = mongoose.model<IMaterial>('Material', materialSchema);
export default Material;
