
import axios from 'axios';
import { supabase } from './supabase';

export const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL,
  timeout: 15000,
});

// Inject JWT on every request
api.interceptors.request.use(async (config) => {
  const { data: { session } } = await supabase.auth.getSession();
  if (session?.access_token) {
    config.headers.Authorization = `Bearer ${session.access_token}`;
  }
  return config;
});

// Handle 401 & 429
api.interceptors.response.use(
  (res) => res,
  async (err) => {
    if (err.response?.status === 401) {
      await supabase.auth.signOut();
      if (typeof window !== 'undefined') {
        window.location.href = '/login?expired=true';
      }
    }
    if (err.response?.status === 429) {
      const retryAfter = err.response.headers['retry-after'] || 5;
      await new Promise((r) => setTimeout(r, Number(retryAfter) * 1000));
      return api(err.config); // Retry once
    }
    return Promise.reject(err);
  }
);
