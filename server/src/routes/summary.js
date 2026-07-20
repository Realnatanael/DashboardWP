import express from 'express';
import Habit from '../models/Habit.js';
import HabitEntry from '../models/HabitEntry.js';
import { buildMonthlySummary, getMonthLabel, getMonthQuery } from '../services/habitMetrics.js';

const router = express.Router();

router.get('/', async (req, res) => {
  const month = req.query.month || getMonthLabel();
  const habits = await Habit.find().sort({ isActive: -1, name: 1 });
  const entries = await HabitEntry.find({
    date: getMonthQuery(month),
  }).sort({ date: 1 });

  res.json({
    month,
    summary: buildMonthlySummary(habits, entries),
  });
});

export default router;
