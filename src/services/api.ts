import type { AIAgent, DashboardStats, Incident, User } from './mockData';

export const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api/v1';

export interface LoginResponse {
  token: string;
  user: User;
}

export interface RegisterPayload {
  name: string;
  email: string;
  password?: string;
  organization?: string;
}

// Helper to retrieve auth header
const getAuthHeaders = (): HeadersInit => {
  const token = localStorage.getItem('sentinel_token');
  return {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
};

export const authApi = {
  login: async (email: string, password?: string): Promise<LoginResponse> => {
    const response = await fetch(`${API_BASE_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    });

    const data = await response.json();
    if (!response.ok || !data.success) {
      throw new Error(data.message || 'Authentication failed. Please verify credentials.');
    }

    localStorage.setItem('sentinel_token', data.token);
    localStorage.setItem('sentinel_user', JSON.stringify(data.user));

    return {
      token: data.token,
      user: data.user,
    };
  },

  register: async (payload: RegisterPayload): Promise<LoginResponse> => {
    const response = await fetch(`${API_BASE_URL}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });

    const data = await response.json();
    if (!response.ok || !data.success) {
      throw new Error(data.message || 'Operator enrollment failed.');
    }

    localStorage.setItem('sentinel_token', data.token);
    localStorage.setItem('sentinel_user', JSON.stringify(data.user));

    return {
      token: data.token,
      user: data.user,
    };
  },

  getCurrentUser: async (): Promise<User | null> => {
    const token = localStorage.getItem('sentinel_token');
    if (!token) return null;

    try {
      const response = await fetch(`${API_BASE_URL}/auth/me`, {
        headers: getAuthHeaders(),
      });

      if (!response.ok) {
        localStorage.removeItem('sentinel_token');
        localStorage.removeItem('sentinel_user');
        return null;
      }

      const data = await response.json();
      return data.user as User;
    } catch {
      // Fallback to local storage if offline
      const stored = localStorage.getItem('sentinel_user');
      return stored ? (JSON.parse(stored) as User) : null;
    }
  },

  logout: async (): Promise<void> => {
    try {
      await fetch(`${API_BASE_URL}/auth/logout`, {
        method: 'POST',
        headers: getAuthHeaders(),
      });
    } catch {
      // Ignore network errors on logout
    } finally {
      localStorage.removeItem('sentinel_token');
      localStorage.removeItem('sentinel_user');
    }
  },
};

export const securityApi = {
  getDashboardStats: async (): Promise<DashboardStats> => {
    const response = await fetch(`${API_BASE_URL}/security/stats`, {
      headers: getAuthHeaders(),
    });

    const data = await response.json();
    if (!response.ok || !data.success) {
      throw new Error(data.message || 'Failed to retrieve telemetry stats.');
    }
    return data.data as DashboardStats;
  },

  getIncidents: async (severityFilter?: string): Promise<Incident[]> => {
    const url = new URL(`${API_BASE_URL}/security/incidents`);
    if (severityFilter && severityFilter !== 'all') {
      url.searchParams.set('severity', severityFilter);
    }

    const response = await fetch(url.toString(), {
      headers: getAuthHeaders(),
    });

    const data = await response.json();
    if (!response.ok || !data.success) {
      throw new Error(data.message || 'Failed to fetch incident ledger.');
    }
    return data.data as Incident[];
  },

  getAgents: async (): Promise<AIAgent[]> => {
    const response = await fetch(`${API_BASE_URL}/security/agents`, {
      headers: getAuthHeaders(),
    });

    const data = await response.json();
    if (!response.ok || !data.success) {
      throw new Error(data.message || 'Failed to fetch AI agents.');
    }
    return data.data as AIAgent[];
  },

  resolveIncident: async (incidentId: string): Promise<{ success: boolean; message: string }> => {
    const response = await fetch(`${API_BASE_URL}/security/incidents/${incidentId}/resolve`, {
      method: 'POST',
      headers: getAuthHeaders(),
    });

    const data = await response.json();
    if (!response.ok || !data.success) {
      throw new Error(data.message || 'Failed to isolate incident.');
    }
    return {
      success: true,
      message: data.message,
    };
  },
};
