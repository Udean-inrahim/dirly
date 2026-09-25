import Fastify, { type FastifyInstance } from 'fastify';
import cors from '@fastify/cors';
import jwt from '@fastify/jwt';
import ws, { type WebSocket as FastifyWs } from '@fastify/websocket';
import { loadEnv } from './env.js';
import { prisma } from './lib/prisma.js';
import { broadcasts } from './lib/events.js';
import { toSettingDTO, toSensorDTO, toReadingDTO, toAlertDTO } from './lib/serialize.js';
import { getSettings } from './services/reading.service.js';
import { healthRoutes } from './routes/health.js';
import { authRoutes } from './routes/auth.js';
import { sensorRoutes } from './routes/sensors.js';
import { readingRoutes, dashboardSummary } from './routes/readings.js';
import { alertRoutes } from './routes/alerts.js';
import { settingRoutes } from './routes/settings.js';

type Client = { id: number; socket: FastifyWs };

export async function buildServer(): Promise<FastifyInstance> {
  const env = loadEnv();
  const app = Fastify({ logger: { level: env.nodeEnv === 'production' ? 'info' : 'warn' } });

  const clients = new Map<number, Client>();
  let nextId = 1;

  app.decorate('getDeviceToken', () => env.deviceToken);
  app.decorate('auth', async (request: { jwtVerify: () => Promise<unknown> }, reply: { code: (c: number) => { send: (b: unknown) => unknown } }) => {
    try {
      await request.jwtVerify();
    } catch {
      reply.code(401).send({ error: 'UNAUTHORIZED', message: 'Sesi tidak valid' });
    }
  });

  await app.register(cors, {
    origin: env.corsOrigin.split(',').map((o) => o.trim()).filter(Boolean),
    credentials: true,
  });
  await app.register(jwt, { secret: env.jwtSecret });
  await app.register(ws);

  app.get('/', async () => ({ name: 'dirly-api', docs: '/api/health' }));

  async function broadcast(message: { type: string; data: unknown }): Promise<void> {
    const payload = JSON.stringify(message);
    for (const client of clients.values()) {
      if (client.socket.readyState === client.socket.OPEN) {
        client.socket.send(payload);
      }
    }
  }

  broadcasts.on('reading', (reading) => void broadcast({ type: 'reading', data: reading }));
  broadcasts.on('sensor', (sensor) => void broadcast({ type: 'sensor', data: sensor }));
  broadcasts.on('alert', (alert) => void broadcast({ type: 'alert', data: alert }));

  app.get('/ws', { websocket: true }, (socket) => {
    const id = nextId++;
    clients.set(id, { id, socket });

    const send = (type: string, data: unknown) => {
      if (socket.readyState === socket.OPEN) socket.send(JSON.stringify({ type, data }));
    };

    void (async () => {
      const settings = await getSettings();
      const sensors = await prisma.sensor.findMany({
        include: { readings: { orderBy: { recordedAt: 'desc' }, take: 1 } },
      });
      const activeAlerts = await prisma.alert.count({ where: { status: 'ACTIVE' } });
      send('summary', {
        sensors: sensors.map((s) => ({
          sensor: toSensorDTO({ ...s, latest: s.readings[0] ?? null }, settings.offlineTimeoutSec),
          latest: s.readings[0] ? toReadingDTO(s.readings[0]) : null,
        })),
        settings: toSettingDTO(settings),
        activeAlerts,
        updatedAt: new Date().toISOString(),
      });
    })().catch((err) => console.error('[ws] initial summary failed', err));

    socket.on('close', () => {
      clients.delete(id);
    });
  });

  await app.register(healthRoutes);
  await app.register(authRoutes);
  await app.register(sensorRoutes);
  await app.register(readingRoutes);
  await app.register(dashboardSummary);
  await app.register(alertRoutes);
  await app.register(settingRoutes);

  return app;
}

export async function shutdown(app: FastifyInstance): Promise<void> {
  await prisma.$disconnect();
  await app.close();
}