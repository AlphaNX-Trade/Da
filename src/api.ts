import { Game, Participant, ParticipationRecord, DashboardStats } from './types';

const API_BASE = '/api';

async function handleResponse<T>(res: Response): Promise<T> {
  if (!res.ok) {
    let errorMsg = `Server error (${res.status})`;
    try {
      const data = await res.json();
      if (data && data.error) {
        errorMsg = data.error;
      }
    } catch {
      // not json
    }
    throw new Error(errorMsg);
  }
  return res.json();
}

export const api = {
  // Stats
  async getStats(): Promise<DashboardStats> {
    const res = await fetch(`${API_BASE}/stats`);
    return handleResponse<DashboardStats>(res);
  },

  // Games
  async getGames(): Promise<Game[]> {
    const res = await fetch(`${API_BASE}/games`);
    return handleResponse<Game[]>(res);
  },

  async createGame(name: string): Promise<Game> {
    const res = await fetch(`${API_BASE}/games`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name }),
    });
    return handleResponse<Game>(res);
  },

  async updateGame(id: string, name: string): Promise<{ id: string; name: string }> {
    const res = await fetch(`${API_BASE}/games/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name }),
    });
    return handleResponse<{ id: string; name: string }>(res);
  },

  async deleteGame(id: string): Promise<{ success: boolean }> {
    const res = await fetch(`${API_BASE}/games/${id}`, {
      method: 'DELETE',
    });
    return handleResponse<{ success: boolean }>(res);
  },

  // Participants
  async getParticipants(): Promise<Participant[]> {
    const res = await fetch(`${API_BASE}/participants`);
    return handleResponse<Participant[]>(res);
  },

  async createParticipant(data: { name: string; age: number; class: string; section?: string | null }): Promise<Participant> {
    const res = await fetch(`${API_BASE}/participants`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    return handleResponse<Participant>(res);
  },

  async updateParticipant(id: string, data: { name: string; age: number; class: string; section?: string | null }): Promise<Participant> {
    const res = await fetch(`${API_BASE}/participants/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    return handleResponse<Participant>(res);
  },

  async deleteParticipant(id: string): Promise<{ success: boolean }> {
    const res = await fetch(`${API_BASE}/participants/${id}`, {
      method: 'DELETE',
    });
    return handleResponse<{ success: boolean }>(res);
  },

  // Participation
  async getParticipation(): Promise<ParticipationRecord[]> {
    const res = await fetch(`${API_BASE}/participation`);
    return handleResponse<ParticipationRecord[]>(res);
  },

  async toggleParticipation(participant_id: string, game_id: string, selected: boolean): Promise<{ selected: boolean }> {
    const res = await fetch(`${API_BASE}/participation/toggle`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ participant_id, game_id, selected }),
    });
    return handleResponse<{ selected: boolean }>(res);
  },

  // Export URL helpers
  getParticipantsExportUrl(): string {
    return `${API_BASE}/export/participants`;
  },

  getParticipationExportUrl(): string {
    return `${API_BASE}/export/participation`;
  },

  getAppZipUrl(): string {
    return `${API_BASE}/download-zip`;
  },
};
