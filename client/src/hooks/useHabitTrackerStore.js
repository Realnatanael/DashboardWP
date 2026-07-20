import { create } from 'zustand';
import { habitApi } from '../services/habitApi';

function getCurrentMonth() {
  return new Date().toISOString().slice(0, 7);
}

async function loadResources(month) {
  const [habitsResponse, checklistResponse, summaryResponse, historyResponse] = await Promise.all([
    habitApi.getHabits(),
    habitApi.getChecklist(month),
    habitApi.getSummary(month),
    habitApi.getHistory(month),
  ]);

  return {
    habits: habitsResponse.habits,
    checklist: checklistResponse,
    summary: summaryResponse.summary,
    history: historyResponse.months,
  };
}

export const useHabitTrackerStore = create((set, get) => ({
  month: getCurrentMonth(),
  habits: [],
  checklist: { month: getCurrentMonth(), days: [], habits: [] },
  summary: null,
  history: [],
  loading: true,
  saving: false,
  error: '',

  initialize: async () => {
    const { month } = get();

    set({ loading: true, error: '' });

    try {
      const data = await loadResources(month);
      set({ ...data, loading: false });
    } catch (error) {
      set({ error: error.message, loading: false });
    }
  },

  changeMonth: async (month) => {
    set({ month, loading: true, error: '' });

    try {
      const data = await loadResources(month);
      set({ ...data, loading: false });
    } catch (error) {
      set({ error: error.message, loading: false });
    }
  },

  createHabit: async (payload) => {
    set({ saving: true, error: '' });

    try {
      await habitApi.createHabit(payload);
      await get().changeMonth(get().month);
      set({ saving: false });
    } catch (error) {
      set({ error: error.message, saving: false });
      throw error;
    }
  },

  updateHabit: async (id, payload) => {
    set({ saving: true, error: '' });

    try {
      await habitApi.updateHabit(id, payload);
      await get().changeMonth(get().month);
      set({ saving: false });
    } catch (error) {
      set({ error: error.message, saving: false });
      throw error;
    }
  },

  archiveHabit: async (id, isActive) => {
    set({ saving: true, error: '' });

    try {
      await habitApi.archiveHabit(id, isActive);
      await get().changeMonth(get().month);
      set({ saving: false });
    } catch (error) {
      set({ error: error.message, saving: false });
      throw error;
    }
  },

  deleteHabit: async (id) => {
    set({ saving: true, error: '' });

    try {
      await habitApi.deleteHabit(id);
      await get().changeMonth(get().month);
      set({ saving: false });
    } catch (error) {
      set({ error: error.message, saving: false });
      throw error;
    }
  },

  updateEntry: async (habitId, date, status) => {
    set({ saving: true, error: '' });

    try {
      await habitApi.updateChecklistEntry(habitId, date, status);
      await get().changeMonth(get().month);
      set({ saving: false });
    } catch (error) {
      set({ error: error.message, saving: false });
      throw error;
    }
  },

  clearError: () => set({ error: '' }),
}));
