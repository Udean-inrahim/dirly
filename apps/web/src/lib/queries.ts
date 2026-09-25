import { api } from './api';
import type {
  Alert,
  AlertStatus,
  AlertSeverity,
  AuthResponse,
  DashboardSummary,
  Reading,
  Sensor,
  Settings,
  User,
} from '@dirly/shared';

export const queryKeys = {
  summary: ['summary'] as const,
  sensors: ['sensors'] as const,
  readings: (sensorId: string, hours: number) => ['readings', sensorId, hours] as const,
  recentReadings: ['readings', 'recent'] as const,
  history: (sensorId: string, from: string | undefined, to: string | undefined, limit: number) =>
    ['history', sensorId, from ?? '', to ?? '', limit] as const,
  alerts: (status: AlertStatus | 'ALL') => ['alerts', status] as const,
  settings: ['settings'] as const,
};

export async function fetchSummary(): Promise<DashboardSummary> {
  return api<DashboardSummary>('/api/dashboard/summary');
}

export async function fetchSensors(): Promise<{ sensors: Sensor[] }> {
  return api<{ sensors: Sensor[] }>('/api/sensors');
}

export async function fetchReadings(
  sensorId: string,
  hours: number,
): Promise<{ readings: Reading[] }> {
  const from = new Date(Date.now() - hours * 3600_000).toISOString();
  const path = sensorId === 'all' ? '/api/readings' : `/api/readings?sensorId=${encodeURIComponent(sensorId)}`;
  const sep = sensorId === 'all' ? '?' : '&';
  return api<{ readings: Reading[] }>(`${path}${sep}from=${encodeURIComponent(from)}&limit=2000`);
}

export async function fetchAlerts(
  status: AlertStatus | 'ALL',
  severity?: AlertSeverity,
  limit = 100,
): Promise<{ alerts: Alert[] }> {
  const params = new URLSearchParams({ status, limit: String(limit) });
  if (severity) params.set('severity', severity);
  return api<{ alerts: Alert[] }>(`/api/alerts?${params.toString()}`);
}

export async function fetchSettings(): Promise<{ settings: Settings }> {
  return api<{ settings: Settings }>('/api/settings');
}

export async function fetchRecentReadings(limit = 10): Promise<{ readings: Reading[] }> {
  return api<{ readings: Reading[] }>(`/api/readings?limit=${limit}`);
}

export async function fetchHistory(
  sensorId: string,
  from?: string,
  to?: string,
  limit = 100,
): Promise<{ readings: Reading[] }> {
  const params = new URLSearchParams({ limit: String(limit) });
  if (sensorId && sensorId !== 'all') params.set('sensorId', sensorId);
  if (from) params.set('from', from);
  if (to) params.set('to', to);
  return api<{ readings: Reading[] }>(`/api/readings?${params.toString()}`);
}

export async function loginRequest(email: string, password: string): Promise<AuthResponse> {
  return api<AuthResponse>('/api/auth/login', {
    method: 'POST',
    body: JSON.stringify({ email, password }),
  });
}

export async function registerRequest(
  name: string,
  email: string,
  password: string,
): Promise<AuthResponse> {
  return api<AuthResponse>('/api/auth/register', {
    method: 'POST',
    body: JSON.stringify({ name, email, password }),
  });
}

export async function meRequest(): Promise<{ user: User }> {
  return api<{ user: User }>('/api/auth/me');
}

export type SensorInput = {
  sensorCode: string;
  name: string;
  location: string;
  plant?: string | null;
};

export async function createSensor(input: SensorInput): Promise<{ sensor: Sensor }> {
  return api<{ sensor: Sensor }>('/api/sensors', {
    method: 'POST',
    body: JSON.stringify(input),
  });
}

export async function updateSensor(id: string, input: SensorInput): Promise<{ sensor: Sensor }> {
  return api<{ sensor: Sensor }>(`/api/sensors/${id}`, {
    method: 'PUT',
    body: JSON.stringify(input),
  });
}

export async function toggleSensor(id: string): Promise<{ sensor: Sensor }> {
  return api<{ sensor: Sensor }>(`/api/sensors/${id}/toggle`, { method: 'PATCH' });
}

export async function deleteSensor(id: string): Promise<void> {
  return api<void>(`/api/sensors/${id}`, { method: 'DELETE' });
}

export type SettingsInput = Omit<Settings, 'updatedAt'>;

export async function updateSettings(input: SettingsInput): Promise<{ settings: Settings }> {
  return api<{ settings: Settings }>('/api/settings', {
    method: 'PUT',
    body: JSON.stringify(input),
  });
}

export async function resolveAlert(id: string): Promise<{ alert: Alert }> {
  return api<{ alert: Alert }>(`/api/alerts/${id}/resolve`, { method: 'PATCH' });
}