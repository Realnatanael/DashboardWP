export function getMonthLabel(date = new Date()) {
  return date.toISOString().slice(0, 7);
}

export function getMonthRange(month = getMonthLabel()) {
  const [year, monthIndex] = month.split('-').map(Number);
  const start = new Date(Date.UTC(year, monthIndex - 1, 1));
  const end = new Date(Date.UTC(year, monthIndex, 0));

  return { start, end };
}

export function listMonthDays(month = getMonthLabel()) {
  const { start, end } = getMonthRange(month);
  const days = [];

  for (let day = start.getUTCDate(); day <= end.getUTCDate(); day += 1) {
    days.push(`${month}-${String(day).padStart(2, '0')}`);
  }

  return days;
}

export function getMonthQuery(month = getMonthLabel()) {
  const days = listMonthDays(month);

  return {
    $gte: days[0],
    $lte: days[days.length - 1],
  };
}

function buildStreaks(sortedEntries) {
  let currentStreak = 0;
  let bestStreak = 0;
  let running = 0;

  sortedEntries.forEach((entry) => {
    if (entry.status === 'done') {
      running += 1;
      bestStreak = Math.max(bestStreak, running);
    } else if (entry.status === 'missed') {
      running = 0;
    }
  });

  for (let index = sortedEntries.length - 1; index >= 0; index -= 1) {
    const entry = sortedEntries[index];

    if (entry.status !== 'done') {
      break;
    }

    currentStreak += 1;
  }

  return { currentStreak, bestStreak };
}

export function buildHabitStats(habits, entries) {
  return habits.map((habit) => {
    const habitEntries = entries
      .filter((entry) => String(entry.habitId) === String(habit._id))
      .sort((left, right) => left.date.localeCompare(right.date));

    const doneDays = habitEntries.filter((entry) => entry.status === 'done').length;
    const missedDays = habitEntries.filter((entry) => entry.status === 'missed').length;
    const trackedDays = doneDays + missedDays;
    const completionRate = trackedDays ? Math.round((doneDays / trackedDays) * 100) : 0;
    const { currentStreak, bestStreak } = buildStreaks(habitEntries);
    const lastCompletedAt =
      habitEntries.filter((entry) => entry.status === 'done').at(-1)?.date || null;

    return {
      habitId: habit._id,
      name: habit.name,
      color: habit.color,
      isActive: habit.isActive,
      doneDays,
      missedDays,
      trackedDays,
      completionRate,
      currentStreak,
      bestStreak,
      lastCompletedAt,
    };
  });
}

export function buildMonthlySummary(habits, entries) {
  const habitStats = buildHabitStats(habits, entries);
  const totalHabits = habits.filter((habit) => habit.isActive).length;
  const totalDone = entries.filter((entry) => entry.status === 'done').length;
  const totalMissed = entries.filter((entry) => entry.status === 'missed').length;
  const trackedDays = totalDone + totalMissed;
  const completionRate = trackedDays ? Math.round((totalDone / trackedDays) * 100) : 0;
  const currentStreak = habitStats.reduce((max, stat) => Math.max(max, stat.currentStreak), 0);
  const bestStreak = habitStats.reduce((max, stat) => Math.max(max, stat.bestStreak), 0);

  return {
    totalHabits,
    totalDone,
    totalMissed,
    trackedDays,
    completionRate,
    currentStreak,
    bestStreak,
    habitStats,
  };
}

export function buildChecklistPayload(habits, entries, month = getMonthLabel()) {
  const days = listMonthDays(month);

  return {
    month,
    days,
    habits: habits.map((habit) => {
      const habitEntries = entries.filter((entry) => String(entry.habitId) === String(habit._id));
      const entriesByDate = Object.fromEntries(habitEntries.map((entry) => [entry.date, entry.status]));
      const doneDays = habitEntries.filter((entry) => entry.status === 'done').length;
      const missedDays = habitEntries.filter((entry) => entry.status === 'missed').length;
      const trackedDays = doneDays + missedDays;

      return {
        _id: habit._id,
        name: habit.name,
        description: habit.description,
        color: habit.color,
        isActive: habit.isActive,
        doneDays,
        missedDays,
        trackedDays,
        completionRate: trackedDays ? Math.round((doneDays / trackedDays) * 100) : 0,
        entries: entriesByDate,
      };
    }),
  };
}

export function buildHistory(months, habitsByMonth, entriesByMonth) {
  return months.map((month) => {
    const summary = buildMonthlySummary(habitsByMonth[month] || [], entriesByMonth[month] || []);

    return {
      month,
      completionRate: summary.completionRate,
      totalDone: summary.totalDone,
      totalMissed: summary.totalMissed,
      trackedDays: summary.trackedDays,
    };
  });
}
