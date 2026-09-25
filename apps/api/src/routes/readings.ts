import type { FastifyInstance } from 'fastify';
import { z } from 'zod';
import { prisma } from '../lib/prisma.js';
import { toReadingDTO, toSensorDTO } from '../lib/serialize.js';
import { getSettings, ingestReading, ingestSchema } from '../services/reading.service.js';

const historyQuery = z.object({
  sensorId: z.string().optional(),
  from: z.string().datetime().optional(),
  to: z.string().datetime().optional(),
  limit: z.coerce.number().min(1).max(2000).default(500),
});

export async function readingRoutes(app: FastifyInstance): Promise<void> {
  const deviceToken = app.getDeviceToken();

  app.post(
    '/api/readings',
    {
      preHandler: (request, reply, done) => {
        const token = request.headers['x-device-token'];
        if (deviceToken && token !== deviceToken) {
          reply.code(401).send({ error: 'UNAUTHORIZED', message: 'Device token tidak valid' });
          return;
        }
        done();
      },
    },
    async (request, reply) => {
      const parsed = ingestSchema.safeParse(request.body);
      if (!parsed.success) {
        return reply.code(400).send({ error: 'VALIDATION', message: 'Payload tidak valid' });
      }
      try {
        const result = await ingestReading(parsed.data);
        return reply.code(201).send({
          reading: result.reading,
          sensor: result.sensor,
          abnormal: result.abnormal,
        });
      } catch (err) {
        const statusCode = (err as { statusCode?: number }).statusCode ?? 500;
        const message = err instanceof Error ? err.message : 'Gagal menyimpan data';
        return reply.code(statusCode).send({ error: 'FAILED', message });
      }
    },
  );

  app.get('/api/readings', { preHandler: app.auth }, async (request, reply) => {
    const q = historyQuery.safeParse(request.query);
    if (!q.success) {
      return reply.code(400).send({ error: 'VALIDATION', message: 'Parameter tidak valid' });
    }
    const { sensorId, from, to, limit } = q.data;
    const readings = await prisma.reading.findMany({
      where: {
        ...(sensorId ? { sensorId } : {}),
        ...(from ? { recordedAt: { gte: new Date(from) } } : {}),
        ...(to ? { recordedAt: { lte: new Date(to) } } : {}),
      },
      orderBy: { recordedAt: 'desc' },
      take: limit,
    });
    return { readings: readings.map(toReadingDTO) };
  });

  app.get('/api/readings/latest', { preHandler: app.auth }, async () => {
    const settings = await getSettings();
    const sensors = await prisma.sensor.findMany({
      include: { readings: { orderBy: { recordedAt: 'desc' }, take: 1 } },
    });
    return {
      snapshots: sensors.map((s) => ({
        sensor: toSensorDTO({ ...s, latest: s.readings[0] ?? null }, settings.offlineTimeoutSec),
        latest: s.readings[0] ? toReadingDTO(s.readings[0]) : null,
      })),
    };
  });
}

export type { FastifyInstance };export async function dashboardSummary(app: FastifyInstance): Promise<void> {
  app.get('/api/dashboard/summary', { preHandler: app.auth }, async () => {
    const settings = await getSettings();
    const sensors = await prisma.sensor.findMany({
      include: { readings: { orderBy: { recordedAt: 'desc' }, take: 1 } },
    });
    const activeAlerts = await prisma.alert.count({ where: { status: 'ACTIVE' } });

    return {
      sensors: sensors.map((s) => ({
        sensor: toSensorDTO({ ...s, latest: s.readings[0] ?? null }, settings.offlineTimeoutSec),
        latest: s.readings[0] ? toReadingDTO(s.readings[0]) : null,
      })),
      settings: {
        minSoilMoisture: settings.minSoilMoisture,
        maxSoilMoisture: settings.maxSoilMoisture,
        minTemperature: settings.minTemperature,
        maxTemperature: settings.maxTemperature,
        refreshIntervalSec: settings.refreshIntervalSec,
        offlineTimeoutSec: settings.offlineTimeoutSec,
        updatedAt: settings.updatedAt.toISOString(),
      },
      activeAlerts,
      updatedAt: new Date().toISOString(),
    };
  });
}