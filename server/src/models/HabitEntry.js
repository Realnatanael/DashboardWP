import mongoose from 'mongoose';

const habitEntrySchema = new mongoose.Schema(
  {
    habitId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Habit',
      required: true,
      index: true,
    },
    date: {
      type: String,
      required: true,
    },
    status: {
      type: String,
      enum: ['done', 'missed'],
      required: true,
    },
    notes: {
      type: String,
      trim: true,
      maxlength: 240,
      default: '',
    },
  },
  {
    timestamps: true,
  }
);

habitEntrySchema.index({ habitId: 1, date: 1 }, { unique: true });

export default mongoose.model('HabitEntry', habitEntrySchema);
