import type { DashboardSummary, SoilLevel } from '@dirly/shared';

export function SoilLevelByValue(value: number, min: number, max: number): SoilLevel {
  if (value < min) return 'DRY';
  if (value > max) return 'WET';
  return 'NORMAL';
}

export function averageLatest(summary: DashboardSummary | null): {
  soilAvg: number | null;
  tempAvg: number | null;
  online: number;
  offline: number;
  disabled: number;
} {
  if (!summary) return { soilAvg: null, tempAvg: null, online: 0, offline: 0, disabled: 0 };

  const readings = summary.sensors
    .map((s) => s.latest)
    .filter((r): r is NonNullable<typeof r> => r !== null);

  const soilAvg =
    readings.length > 0
      ? Math.round((readings.reduce((sum, r) => sum + r.soilMoisture, 0) / readings.length) * 10) / 10
      : null;
  const tempAvg =
    readings.length > 0
      ? Math.round((readings.reduce((sum, r) => sum + r.temperature, 0) / readings.length) * 10) / 10
      : null;

  const online = summary.sensors.filter((s) => s.sensor.health === 'ONLINE').length;
  const offline = summary.sensors.filter((s) => s.sensor.health === 'OFFLINE').length;
  const disabled = summary.sensors.filter((s) => s.sensor.health === 'DISABLED').length;

  return { soilAvg, tempAvg, online, offline, disabled };
}