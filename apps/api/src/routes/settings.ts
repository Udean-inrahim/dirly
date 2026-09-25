import type { FastifyInstance } from 'fastify';
import { z } from 'zod';
import { prisma } from '../lib/prisma.js';
import { toSettingDTO } from '../lib/serialize.js';
import { getSettings } from '../services/reading.service.js';

const settingsBody = z
  .object({
    minSoilMoisture: z.number().min(0).max(100),
    maxSoilMoisture: z.number().min(0).max(100),
    minTemperature: z.number().min(-40).max(80),
    maxTemperature: z.number().min(-40).max(80),
    refreshIntervalSec: z.number().int().min(1).max(300),
    offlineTimeoutSec: z.number().int().min(10).max(3600),
  })
  .refine((s) => s.minSoilMoisture < s.maxSoilMoisture, {
    message: 'minSoilMoisture harus lebih kecil dari maxSoilMoisture',
  })
  .refine((s) => s.minTemperature < s.maxTemperature, {
    message: 'minTemperature harus lebih kecil dari maxTemperature',
  });

export async function settingRoutes(app: FastifyInstance): Promise<void> {
  app.get('/api/settings', { preHandler: app.auth }, async () => {
    const settings = await getSettings();
    return { settings: toSettingDTO(settings) };
  });

  app.put('/api/settings', { preHandler: app.auth }, async (request, reply) => {
    const user = request.user as { role: string };
    if (user.role !== 'ADMIN') {
      return reply.code(403).send({ error: 'FORBIDDEN', message: 'Khusus admin' });
    }
    const parsed = settingsBody.safeParse(request.body);
    if (!parsed.success) {
      return reply.code(400).send({ error: 'VALIDATION', message: 'Pengaturan tidak valid' });
    }
    const settings = await prisma.setting.upsert({
      where: { id: 'singleton' },
      update: parsed.data,
      create: { id: 'singleton', ...parsed.data },
    });
    return { settings: toSettingDTO(settings) };
  });
}