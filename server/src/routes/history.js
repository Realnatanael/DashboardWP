import express from 'express';
import Habit from '../models/Habit.js';
import HabitEntry from '../models/HabitEntry.js';
import { buildHistory, getMonthLabel } from '../services/habitMetrics.js';

const router = express.Router();

function listRecentMonths(month = getMonthLabel(), count = 6) {
  const [year, monthIndex] = month.split('-').map(Number);
  const months = [];

  for (let offset = count - 1; offset >= 0; offset -= 1) {
    const current = new Date(Date.UTC(year, monthIndex - 1 - offset, 1));
    months.push(current.toISOString().slice(0, 7));
  }

  return months;
}

router.get('/', async (req, res) => {
  const month = req.query.month || getMonthLabel();
  const months = listRecentMonths(month, 6);
  const habits = await Habit.find().sort({ isActive: -1, name: 1 });
  const habitMap = Object.fromEntries(months.map((item) => [item, habits]));
  const entries = await HabitEntry.find({
    date: {
      $gte: `${months[0]}-01`,
      $lte: `${months[months.length - 1]}-31`,
    },
  }).sort({ date: 1 });

  const entriesByMonth = months.reduce((accumulator, currentMonth) => {
    accumulator[currentMonth] = entries.filter((entry) => entry.date.startsWith(currentMonth));
    return accumulator;
  }, {});

  res.json({
    months: buildHistory(months, habitMap, entriesByMonth),
  });
});

export default router;
