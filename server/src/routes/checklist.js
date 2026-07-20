import express from 'express';
import Habit from '../models/Habit.js';
import HabitEntry from '../models/HabitEntry.js';
import {
  buildChecklistPayload,
  getMonthLabel,
  getMonthQuery,
} from '../services/habitMetrics.js';

const router = express.Router();

router.get('/', async (req, res) => {
  const month = req.query.month || getMonthLabel();
  const habits = await Habit.find().sort({ isActive: -1, name: 1 });
  const entries = await HabitEntry.find({
    date: getMonthQuery(month),
  }).sort({ date: 1 });

  res.json(buildChecklistPayload(habits, entries, month));
});

router.put('/:habitId/:date', async (req, res) => {
  const { habitId, date } = req.params;
  const { status, notes = '' } = req.body;

  if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) {
    return res.status(400).json({ message: 'Data invalida. Use o formato YYYY-MM-DD.' });
  }

  if (!['done', 'missed', 'empty'].includes(status)) {
    return res.status(400).json({ message: 'Status invalido.' });
  }

  const habit = await Habit.findById(habitId);

  if (!habit) {
    return res.status(404).json({ message: 'Habilidade nao encontrada.' });
  }

  if (status === 'empty') {
    await HabitEntry.findOneAndDelete({ habitId, date });
    return res.status(204).send();
  }

  const entry = await HabitEntry.findOneAndUpdate(
    { habitId, date },
    { status, notes: notes.trim() },
    {
      upsert: true,
      new: true,
      setDefaultsOnInsert: true,
      runValidators: true,
    }
  );

  return res.json({ entry });
});

export default router;
