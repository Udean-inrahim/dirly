import type {
  Alert as AlertDTO,
  Reading as ReadingDTO,
  Sensor as SensorDTO,
  Settings as SettingsDTO,
  User as UserDTO,
} from '@dirly/shared';
import { isStale } from '@dirly/shared';
import type {
  Alert,
  Reading,
  Setting,
  User,
} from '@prisma/client';

export function toUserDTO(user: User): UserDTO {
  return {
    id: user.id,
    name: user.name,
    email: user.email,
    role: user.role as UserDTO['role'],
    createdAt: user.createdAt.toISOString(),
  };
}

export function toSettingDTO(setting: Setting): SettingsDTO {
  return {
    minSoilMoisture: setting.minSoilMoisture,
    maxSoilMoisture: setting.maxSoilMoisture,
    minTemperature: setting.minTemperature,
    maxTemperature: setting.maxTemperature,
    refreshIntervalSec: setting.refreshIntervalSec,
    offlineTimeoutSec: setting.offlineTimeoutSec,
    updatedAt: setting.updatedAt.toISOString(),
  };
}

export function toReadingDTO(reading: Reading): ReadingDTO {
  return {
    id: reading.id,
    sensorId: reading.sensorId,
    soilMoisture: reading.soilMoisture,
    temperature: reading.temperature,
    recordedAt: reading.recordedAt.toISOString(),
  };
}

export function toAlertDTO(alert: Alert, sensor?: SensorDTO | null): AlertDTO {
  return {
    id: alert.id,
    sensorId: alert.sensorId,
    type: alert.type as AlertDTO['type'],
    value: alert.value,
    threshold: alert.threshold,
    message: alert.message,
    severity: alert.severity as AlertDTO['severity'],
    status: alert.status as AlertDTO['status'],
    createdAt: alert.createdAt.toISOString(),
    resolvedAt: alert.resolvedAt?.toISOString() ?? null,
    sensor: sensor ?? null,
  };
}

type SensorLike = {
  id: string;
  sensorCode: string;
  name: string;
  location: string;
  plant: string | null;
  isActive: boolean;
  lastSeenAt: Date | string | null;
  createdAt: Date | string;
  updatedAt: Date | string;
  latest?: { recordedAt: Date | string } | null;
};

export function toSensorDTO(
  sensor: SensorLike,
  offlineTimeoutSec = 60,
): SensorDTO {
  const latest = sensor.latest ?? null;
  const active = sensor.isActive;
  const health: SensorDTO['health'] = !active
    ? 'DISABLED'
    : isStale(
        latest ? new Date(latest.recordedAt).toISOString() : sensor.lastSeenAt ? new Date(sensor.lastSeenAt).toISOString() : null,
        offlineTimeoutSec,
      )
      ? 'OFFLINE'
      : 'ONLINE';

  return {
    id: sensor.id,
    sensorCode: sensor.sensorCode,
    name: sensor.name,
    location: sensor.location,
    plant: sensor.plant,
    isActive: sensor.isActive,
    health,
    lastSeenAt: latest
      ? new Date(latest.recordedAt).toISOString()
      : sensor.lastSeenAt
        ? new Date(sensor.lastSeenAt).toISOString()
        : null,
    createdAt: new Date(sensor.createdAt).toISOString(),
    updatedAt: new Date(sensor.updatedAt).toISOString(),
  };
}