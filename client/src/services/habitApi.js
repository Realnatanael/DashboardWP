const defaultHeaders = {
  'Content-Type': 'application/json',
};

async function request(url, options = {}) {
  const response = await fetch(url, {
    headers: defaultHeaders,
    ...options,
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ message: 'Erro inesperado na requisicao.' }));
    throw new Error(error.message || 'Erro inesperado na requisicao.');
  }

  if (response.status === 204) {
    return null;
  }

  return response.json();
}

export const habitApi = {
  getHabits() {
    return request('/api/habits');
  },
  createHabit(payload) {
    return request('/api/habits', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  },
  updateHabit(id, payload) {
    return request(`/api/habits/${id}`, {
      method: 'PUT',
      body: JSON.stringify(payload),
    });
  },
  archiveHabit(id, isActive) {
    return request(`/api/habits/${id}/archive`, {
      method: 'PATCH',
      body: JSON.stringify({ isActive }),
    });
  },
  deleteHabit(id) {
    return request(`/api/habits/${id}`, {
      method: 'DELETE',
    });
  },
  getChecklist(month) {
    return request(`/api/checklist?month=${month}`);
  },
  updateChecklistEntry(habitId, date, status) {
    return request(`/api/checklist/${habitId}/${date}`, {
      method: 'PUT',
      body: JSON.stringify({ status }),
    });
  },
  getSummary(month) {
    return request(`/api/summary?month=${month}`);
  },
  getHistory(month) {
    return request(`/api/history?month=${month}`);
  },
};
