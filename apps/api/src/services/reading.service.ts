import { z } from 'zod';
import { ALERT_SEVERITY, evaluateReading } from '@dirly/shared';
import { prisma } from '../lib/prisma.js';
import { broadcasts } from '../lib/events.js';
import { toAlertDTO, toReadingDTO, toSensorDTO } from '../lib/serialize.js';
import type { Alert, Reading, Sensor } from '@prisma/client';
import type { SoilAlertCandidate } from '@dirly/shared';

export const ingestSchema = z.object({
  sensor_code: z.string().min(1).max(30),
  soil_moisture: z.number().min(0).max(100),
  temperature: z.number().min(-40).max(80).optional(),
});

export type Ingests = {
  reading: Reading;
  sensor: Sensor;
  alertCount: number;
};

export async function getSettings() {
  return prisma.setting.upsert({
    where: { id: 'singleton' },
    update: {},
    create: { id: 'singleton' },
  });
}

async function createAlerts(sensorId: string, candidates: SoilAlertCandidate[]): Promise<Alert[]> {
  const open = await prisma.alert.findMany({
    where: { sensorId, status: 'ACTIVE', type: { in: candidates.map((c) => c.type) } },
    select: { type: true },
  });
  const openTypes = new Set(open.map((a) => a.type));

  const created: Alert[] = [];
  for (const c of candidates) {
    if (openTypes.has(c.type)) continue;
    created.push(
      await prisma.alert.create({
        data: {
          sensorId,
          type: c.type,
          value: c.value,
          threshold: c.threshold,
          message: c.message,
          severity: ALERT_SEVERITY[c.type],
        },
      }),
    );
  }
  return created;
}

async function resolveAlerts(
  sensorId: string,
  keepTypes: Set<string>,
): Promise<Alert[]> {
  const open = await prisma.alert.findMany({
    where: { sensorId, status: 'ACTIVE', NOT: { type: { in: [...keepTypes] } } },
  });
  if (open.length === 0) return [];

  await prisma.alert.updateMany({
    where: { id: { in: open.map((a) => a.id) } },
    data: { status: 'RESOLVED', resolvedAt: new Date() },
  });
  return open; // pre-update rows; caller only needs ids/type for broadcast
}

export async function ingestReading(input: z.infer<typeof ingestSchema>) {
  const sensor = await prisma.sensor.findUnique({ where: { sensorCode: input.sensor_code } });
  if (!sensor) {
    const err = new Error(`Sensor with code "${input.sensor_code}" not found`) as Error & {
      statusCode: number;
    };
    err.statusCode = 404;
    throw err;
  }
  if (!sensor.isActive) {
    const err = new Error('Sensor is disabled') as Error & { statusCode: number };
    err.statusCode = 423;
    throw err;
  }

  const settings = await getSettings();
  const temperature = input.temperature ?? 25;

  const reading = await prisma.reading.create({
    data: {
      sensorId: sensor.id,
      soilMoisture: input.soil_moisture,
      temperature,
    },
  });

  await prisma.sensor.update({
    where: { id: sensor.id },
    data: { lastSeenAt: reading.recordedAt },
  });

  const { alerts } = evaluateReading(input.soil_moisture, temperature, settings);
  const candidateTypes = new Set(alerts.map((a) => a.type));

  await resolveAlerts(sensor.id, new Set([...candidateTypes, 'SENSOR_OFFLINE']));
  const created = await createAlerts(sensor.id, alerts);

  broadcasts.emit('reading', toReadingDTO(reading));
  broadcasts.emit('sensor', toSensorDTO({ ...sensor, latest: reading }, settings.offlineTimeoutSec));

  for (const a of created) {
    const full = await prisma.alert.findUnique({ where: { id: a.id } });
    const sensorRow = await prisma.sensor.findUnique({ where: { id: a.sensorId } });
    if (full) broadcasts.emit('alert', toAlertDTO(full, sensorRow ? toSensorDTO(sensorRow) : null));
  }

  const status =
    input.soil_moisture < settings.minSoilMoisture ||
    input.soil_moisture > settings.maxSoilMoisture ||
    temperature < settings.minTemperature ||
    temperature > settings.maxTemperature;

  return {
    reading: toReadingDTO(reading),
    sensor: toSensorDTO(
      { ...sensor, latest: reading },
      settings.offlineTimeoutSec,
    ),
    alertsCreated: created.length,
    abnormal: status,
  };
}