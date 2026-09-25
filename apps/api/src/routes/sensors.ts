import type { FastifyInstance } from 'fastify';
import { z } from 'zod';
import { prisma } from '../lib/prisma.js';
import { toSensorDTO } from '../lib/serialize.js';
import { getSettings } from '../services/reading.service.js';

const sensorBody = z.object({
  sensorCode: z.string().min(3).max(30),
  name: z.string().min(1).max(60),
  location: z.string().min(1).max(80),
  plant: z.string().max(80).optional().nullable(),
});

const idParams = z.object({ id: z.string().min(1) });

async function requireAdmin(user: { role: string }, reply: {
  code: (code: number) => { send: (body: unknown) => unknown };
}): Promise<boolean> {
  if (user.role !== 'ADMIN') {
    reply.code(403).send({ error: 'FORBIDDEN', message: 'Khusus admin' });
    return false;
  }
  return true;
}

export async function sensorRoutes(app: FastifyInstance): Promise<void> {
  app.get('/api/sensors', { preHandler: app.auth }, async () => {
    const settings = await getSettings();
    const sensors = await prisma.sensor.findMany({
      orderBy: { createdAt: 'asc' },
      include: { readings: { orderBy: { recordedAt: 'desc' }, take: 1 } },
    });
    return { sensors: sensors.map((s) => toSensorDTO({ ...s, latest: s.readings[0] ?? null }, settings.offlineTimeoutSec)) };
  });

  app.post('/api/sensors', { preHandler: app.auth }, async (request, reply) => {
    if (!(await requireAdmin(request.user as { role: string }, reply))) return;
    const parsed = sensorBody.safeParse(request.body);
    if (!parsed.success) {
      return reply.code(400).send({ error: 'VALIDATION', message: 'Data sensor tidak valid' });
    }
    try {
      const sensor = await prisma.sensor.create({ data: parsed.data });
      return { sensor: toSensorDTO(sensor) };
    } catch {
      return reply
        .code(409)
        .send({ error: 'CONFLICT', message: `Kode sensor ${parsed.data.sensorCode} sudah dipakai` });
    }
  });

  app.put('/api/sensors/:id', { preHandler: app.auth }, async (request, reply) => {
    if (!(await requireAdmin(request.user as { role: string }, reply))) return;
    const params = idParams.safeParse(request.params);
    const parsed = sensorBody.safeParse(request.body);
    if (!params.success || !parsed.success) {
      return reply.code(400).send({ error: 'VALIDATION', message: 'Data sensor tidak valid' });
    }
    try {
      const sensor = await prisma.sensor.update({
        where: { id: params.data.id },
        data: parsed.data,
      });
      return { sensor: toSensorDTO(sensor) };
    } catch (err) {
      const code = (err as { code?: string }).code;
      if (code === 'P2025') {
        return reply.code(404).send({ error: 'NOT_FOUND', message: 'Sensor tidak ditemukan' });
      }
      if (code === 'P2002') {
        return reply
          .code(409)
          .send({ error: 'CONFLICT', message: `Kode sensor ${parsed.data.sensorCode} sudah dipakai` });
      }
      return reply.code(500).send({ error: 'INTERNAL', message: 'Gagal memperbarui sensor' });
    }
  });

  app.patch('/api/sensors/:id/toggle', { preHandler: app.auth }, async (request, reply) => {
    if (!(await requireAdmin(request.user as { role: string }, reply))) return;
    const params = idParams.safeParse(request.params);
    if (!params.success) {
      return reply.code(400).send({ error: 'VALIDATION', message: 'ID tidak valid' });
    }
    try {
      const existing = await prisma.sensor.findUniqueOrThrow({ where: { id: params.data.id } });
      const sensor = await prisma.sensor.update({
        where: { id: params.data.id },
        data: { isActive: !existing.isActive },
      });
      return { sensor: toSensorDTO(sensor) };
    } catch {
      return reply.code(404).send({ error: 'NOT_FOUND', message: 'Sensor tidak ditemukan' });
    }
  });

  app.delete('/api/sensors/:id', { preHandler: app.auth }, async (request, reply) => {
    if (!(await requireAdmin(request.user as { role: string }, reply))) return;
    const params = idParams.safeParse(request.params);
    if (!params.success) {
      return reply.code(400).send({ error: 'VALIDATION', message: 'ID tidak valid' });
    }
    try {
      await prisma.sensor.delete({ where: { id: params.data.id } });
      return reply.code(204).send();
    } catch {
      return reply.code(404).send({ error: 'NOT_FOUND', message: 'Sensor tidak ditemukan' });
    }
  });
}