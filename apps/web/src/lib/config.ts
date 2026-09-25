export const API_URL = import.meta.env.VITE_API_URL ?? 'http://localhost:4000';

export const WS_URL =
  import.meta.env.VITE_WS_URL ?? (API_URL.startsWith('https') ? 'wss://' : 'ws://') + API_URL.replace(/^https?:\/\//, '');