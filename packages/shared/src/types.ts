import { ALERT_MESSAGES, ALERT_SEVERITY, SOIL_LABELS, DEFAULT_SETTINGS } from './constants.js';
import type { SoilLevel } from './constants.js';

export type Role = 'ADMIN' | 'USER';

export type SensorHealth = 'ONLINE' | 'OFFLINE' | 'DISABLED';

export interface Sensor {
  id: string;
  sensorCode: string;
  name: string;
  location: string;
  plant: string | null;
  isActive: boolean;
  health: SensorHealth;
  lastSeenAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface Reading {
  id: string;
  sensorId: string;
  soilMoisture: number;
  temperature: number;
  recordedAt: string;
}

export type AlertType =
  | 'SOIL_TOO_DRY'
  | 'SOIL_TOO_WET'
  | 'TEMP_HIGH'
  | 'TEMP_LOW'
  | 'SENSOR_OFFLINE';

export type AlertSeverity = 'INFO' | 'WARNING' | 'CRITICAL';

export type AlertStatus = 'ACTIVE' | 'RESOLVED';

export interface Alert {
  id: string;
  sensorId: string;
  type: AlertType;
  value: number | null;
  threshold: number | null;
  message: string;
  severity: AlertSeverity;
  status: AlertStatus;
  createdAt: string;
  resolvedAt: string | null;
  sensor?: Sensor | null;
}

export interface Settings {
  minSoilMoisture: number;
  maxSoilMoisture: number;
  minTemperature: number;
  maxTemperature: number;
  refreshIntervalSec: number;
  offlineTimeoutSec: number;
  updatedAt: string;
}

export interface User {
  id: string;
  name: string;
  email: string;
  role: Role;
  createdAt: string;
}

export interface SensorSnapshot {
  sensor: Sensor;
  latest: Reading | null;
}

export interface DashboardSummary {
  sensors: SensorSnapshot[];
  settings: Settings;
  activeAlerts: number;
  updatedAt: string;
}

export interface AuthResponse {
  token: string;
  user: User;
}

export interface ApiError {
  error: string;
  message: string;
}

export const DEFAULT_SETTINGS_DTO: Settings = {
  ...DEFAULT_SETTINGS,
  updatedAt: '',
};

export interface SoilAlertCandidate {
  type: AlertType;
  value: number;
  threshold: number;
  message: string;
}

export function evaluateReading(
  soilMoisture: number,
  temperature: number,
  settings: Pick<Settings, 'minSoilMoisture' | 'maxSoilMoisture' | 'minTemperature' | 'maxTemperature'>,
): {
  soilLevel: SoilLevel;
  soilCanonical: boolean;
  alerts: SoilAlertCandidate[];
} {
  const alerts: SoilAlertCandidate[] = [];

  let soilLevel: SoilLevel = 'NORMAL';
  if (soilMoisture < settings.minSoilMoisture) {
    soilLevel = 'DRY';
    alerts.push({
      type: 'SOIL_TOO_DRY',
      value: soilMoisture,
      threshold: settings.minSoilMoisture,
      message: ALERT_MESSAGES.SOIL_TOO_DRY,
    });
  } else if (soilMoisture > settings.maxSoilMoisture) {
    soilLevel = 'WET';
    alerts.push({
      type: 'SOIL_TOO_WET',
      value: soilMoisture,
      threshold: settings.maxSoilMoisture,
      message: ALERT_MESSAGES.SOIL_TOO_WET,
    });
  }

  if (temperature > settings.maxTemperature) {
    alerts.push({
      type: 'TEMP_HIGH',
      value: temperature,
      threshold: settings.maxTemperature,
      message: ALERT_MESSAGES.TEMP_HIGH,
    });
  } else if (temperature < settings.minTemperature) {
    alerts.push({
      type: 'TEMP_LOW',
      value: temperature,
      threshold: settings.minTemperature,
      message: ALERT_MESSAGES.TEMP_LOW,
    });
  }

  return {
    soilLevel,
    soilCanonical: soilLevel === 'NORMAL',
    alerts,
  };
}

export function alertSeverity(type: SoilAlertCandidate['type']): AlertSeverity {
  return ALERT_SEVERITY[type];
}

export function soilLabel(level: SoilLevel): string {
  return SOIL_LABELS[level];
}

export function formatValue(value: number | null | undefined): string {
  if (value === null || value === undefined) return '--';
  return Number.isInteger(value) ? String(value) : value.toFixed(1);
}

export function isStale(lastSeenAt: string | null, timeoutSec: number, now = Date.now()): boolean {
  if (!lastSeenAt) return true;
  const last = new Date(lastSeenAt).getTime();
  if (Number.isNaN(last)) return true;
  return now - last > timeoutSec * 1000;
}