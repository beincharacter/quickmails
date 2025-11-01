const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';

export const apiClient = {
  async get<T>(endpoint: string, token?: string): Promise<T> {
    const headers: HeadersInit = {
      'Content-Type': 'application/json',
    };
    
    if (token) {
      headers.Authorization = `Bearer ${token}`;
    }

    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
      method: 'GET',
      headers,
      credentials: 'include',
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ error: 'Request failed' }));
      console.error(`❌ GET ${endpoint} failed:`, errorData);
      throw new Error(errorData.error || 'Request failed');
    }

    return response.json();
  },

  async post<T>(endpoint: string, data?: any, token?: string): Promise<T> {
    const headers: HeadersInit = {
      'Content-Type': 'application/json',
    };
    
    if (token) {
      headers.Authorization = `Bearer ${token}`;
    }

    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
      method: 'POST',
      headers,
      body: data ? JSON.stringify(data) : undefined,
      credentials: 'include',
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ error: 'Request failed' }));
      console.error(`❌ POST ${endpoint} failed:`, errorData);
      console.error('Request data:', data ? { 
        ...data, 
        accessToken: data.accessToken ? '[REDACTED]' : undefined, 
        refreshToken: data.refreshToken ? '[REDACTED]' : undefined,
        userInfo: data.userInfo ? { email: data.userInfo.email, name: data.userInfo.name } : undefined
      } : 'No data');
      throw new Error(errorData.error || 'Request failed');
    }

    return response.json();
  },

  async put<T>(endpoint: string, data?: any, token?: string): Promise<T> {
    const headers: HeadersInit = {
      'Content-Type': 'application/json',
    };
    
    if (token) {
      headers.Authorization = `Bearer ${token}`;
    }

    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
      method: 'PUT',
      headers,
      body: data ? JSON.stringify(data) : undefined,
      credentials: 'include',
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ error: 'Request failed' }));
      console.error(`❌ PUT ${endpoint} failed:`, errorData);
      throw new Error(errorData.error || 'Request failed');
    }

    return response.json();
  },

  async delete<T>(endpoint: string, token?: string): Promise<T> {
    const headers: HeadersInit = {
      'Content-Type': 'application/json',
    };
    
    if (token) {
      headers.Authorization = `Bearer ${token}`;
    }

    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
      method: 'DELETE',
      headers,
      credentials: 'include',
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ error: 'Request failed' }));
      console.error(`❌ DELETE ${endpoint} failed:`, errorData);
      throw new Error(errorData.error || 'Request failed');
    }

    return response.json();
  },
};

