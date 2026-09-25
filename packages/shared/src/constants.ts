import type { AlertType, AlertSeverity } from './types.js';

export const DEFAULT_SETTINGS = {
  minSoilMoisture: 30,
  maxSoilMoisture: 70,
  minTemperature: 15,
  maxTemperature: 35,
  refreshIntervalSec: 5,
  offlineTimeoutSec: 60,
} as const;

export const SOIL_LABELS = {
  DRY: 'Kering',
  NORMAL: 'Normal',
  WET: 'Lembap',
} as const;

export type SoilLevel = keyof typeof SOIL_LABELS;

export const ALERT_MESSAGES = {
  SOIL_TOO_DRY: 'Kelembapan tanah terlalu kering',
  SOIL_TOO_WET: 'Kelembapan tanah terlalu tinggi',
  TEMP_HIGH: 'Suhu melebihi batas maksimum',
  TEMP_LOW: 'Suhu di bawah batas minimum',
  SENSOR_OFFLINE: 'Sensor tidak mengirim data',
} as const;

export const ALERT_SEVERITY: Record<AlertType, AlertSeverity> = {
  SOIL_TOO_DRY: 'CRITICAL',
  SOIL_TOO_WET: 'WARNING',
  TEMP_HIGH: 'WARNING',
  TEMP_LOW: 'WARNING',
  SENSOR_OFFLINE: 'CRITICAL',
};

export const TIME_RANGES = [
  { key: '1h', label: '1 jam', hours: 1 },
  { key: '6h', label: '6 jam', hours: 6 },
  { key: '12h', label: '12 jam', hours: 12 },
  { key: '24h', label: '24 jam', hours: 24 },
  { key: '7d', label: '7 hari', hours: 168 },
] as const;

export type TimeRangeKey = (typeof TIME_RANGES)[number]['key'];