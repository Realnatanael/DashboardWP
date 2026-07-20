import mongoose from 'mongoose';

const habitSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
      maxlength: 80,
    },
    description: {
      type: String,
      trim: true,
      maxlength: 180,
      default: '',
    },
    color: {
      type: String,
      trim: true,
      default: '#8EF6A3',
    },
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
  }
);

export default mongoose.model('Habit', habitSchema);
