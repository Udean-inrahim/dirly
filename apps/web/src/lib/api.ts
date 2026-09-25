import { API_URL } from './config';

const TOKEN_KEY = 'dirly_token';

export const authStorage = {
  get token(): string | null {
    return localStorage.getItem(TOKEN_KEY);
  },
  set token(value: string) {
    localStorage.setItem(TOKEN_KEY, value);
  },
  clear() {
    localStorage.removeItem(TOKEN_KEY);
  },
};

export class ApiRequestError extends Error {
  status: number;
  code: string;

  constructor(message: string, status: number, code: string) {
    super(message);
    this.name = 'ApiRequestError';
    this.status = status;
    this.code = code;
  }
}

export async function api<T>(path: string, options: RequestInit = {}): Promise<T> {
  const token = authStorage.token;
  const hasBody = options.body !== undefined && options.body !== null;
  const headers: Record<string, string> = {
    ...(hasBody ? { 'content-type': 'application/json' } : {}),
    ...(options.headers as Record<string, string> | undefined),
    ...(token ? { authorization: `Bearer ${token}` } : {}),
  };

  const res = await fetch(`${API_URL}${path}`, { ...options, headers });

  if (res.status === 401 && token) {
    authStorage.clear();
    window.location.assign('/login');
    throw new ApiRequestError('Sesi berakhir', 401, 'UNAUTHORIZED');
  }

  if (!res.ok) {
    let code = 'ERROR';
    let message = `Request gagal (${res.status})`;
    try {
      const body = (await res.json()) as { error?: string; message?: string };
      code = body.error ?? code;
      message = body.message ?? message;
    } catch {
      // body bukan JSON
    }
    throw new ApiRequestError(message, res.status, code);
  }

  if (res.status === 204) return undefined as T;
  return (await res.json()) as T;
}