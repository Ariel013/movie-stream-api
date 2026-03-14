import axios, { AxiosError, InternalAxiosRequestConfig } from 'axios';

const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001/api/v1';

export const api = axios.create({
  baseURL: API_BASE,
  headers: { 'Content-Type': 'application/json' },
});

// Attach access token
api.interceptors.request.use((config: InternalAxiosRequestConfig) => {
  if (typeof window !== 'undefined') {
    const raw = localStorage.getItem('hemosafe-auth');
    if (raw) {
      const { state } = JSON.parse(raw);
      if (state?.accessToken) {
        config.headers.Authorization = `Bearer ${state.accessToken}`;
      }
    }
  }
  return config;
});

// Refresh token on 401
api.interceptors.response.use(
  (res) => res,
  async (error: AxiosError) => {
    const original = error.config as InternalAxiosRequestConfig & { _retry?: boolean };
    if (error.response?.status === 401 && !original._retry) {
      original._retry = true;
      try {
        const raw = localStorage.getItem('hemosafe-auth');
        if (raw) {
          const { state } = JSON.parse(raw);
          const { data } = await axios.post(`${API_BASE}/auth/refresh`, {
            refreshToken: state.refreshToken,
          });
          const newToken: string = data.data.accessToken;
          // Patch the store
          const parsed = JSON.parse(raw);
          parsed.state.accessToken = newToken;
          localStorage.setItem('hemosafe-auth', JSON.stringify(parsed));
          original.headers.Authorization = `Bearer ${newToken}`;
          return api(original);
        }
      } catch {
        localStorage.removeItem('hemosafe-auth');
        window.location.href = '/auth/login';
      }
    }
    return Promise.reject(error);
  },
);

export default api;
