import axios, { AxiosError, AxiosHeaders } from 'axios';

const baseURL = import.meta.env.VITE_API_BASE ?? '/api';

export const api = axios.create({
  baseURL,
  withCredentials: true,
});

let bearerToken: string | null = null;

export function setBearerToken(token: string | null) {
  bearerToken = token;
  if (token) {
    try {
      window.localStorage.setItem('stride_token', token);
    } catch {
      // ignore
    }
  } else {
    try {
      window.localStorage.removeItem('stride_token');
    } catch {
      // ignore
    }
  }
}

export function loadStoredToken(): string | null {
  try {
    const stored = window.localStorage.getItem('stride_token');
    if (stored) bearerToken = stored;
    return stored;
  } catch {
    return null;
  }
}

api.interceptors.request.use((config) => {
  if (bearerToken) {
    const headers = AxiosHeaders.from(config.headers ?? {});
    headers.set('Authorization', `Bearer ${bearerToken}`);
    config.headers = headers;
  }
  return config;
});

export interface ApiErrorBody {
  error: { code: string; message: string; details?: unknown };
}

export function isApiError(err: unknown): err is AxiosError<ApiErrorBody> {
  return Boolean(err) && typeof err === 'object' && (err as AxiosError).isAxiosError === true;
}

export function extractErrorMessage(err: unknown, fallback = 'Something went wrong'): string {
  if (isApiError(err)) {
    return err.response?.data?.error?.message ?? err.message ?? fallback;
  }
  if (err instanceof Error) return err.message;
  return fallback;
}
