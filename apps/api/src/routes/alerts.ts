import type { FastifyInstance } from 'fastify';
import { z } from 'zod';
import { prisma } from '../lib/prisma.js';
import { toAlertDTO, toSensorDTO } from '../lib/serialize.js';

const querySchema = z.object({
  status: z.enum(['ACTIVE', 'RESOLVED', 'ALL']).default('ALL'),
  severity: z.enum(['INFO', 'WARNING', 'CRITICAL']).optional(),
  sensorId: z.string().optional(),
  limit: z.coerce.number().min(1).max(500).default(100),
});

const idParams = z.object({ id: z.string().min(1) });

export async function alertRoutes(app: FastifyInstance): Promise<void> {
  app.get('/api/alerts', { preHandler: app.auth }, async (request, reply) => {
    const q = querySchema.safeParse(request.query);
    if (!q.success) {
      return reply.code(400).send({ error: 'VALIDATION', message: 'Parameter tidak valid' });
    }
    const { status, severity, sensorId, limit } = q.data;
    const alerts = await prisma.alert.findMany({
      where: {
        ...(status === 'ALL' ? {} : { status }),
        ...(severity ? { severity } : {}),
        ...(sensorId ? { sensorId } : {}),
      },
      include: { sensor: true },
      orderBy: { createdAt: 'desc' },
      take: limit,
    });
    return { alerts: alerts.map((a) => toAlertDTO(a, a.sensor ? toSensorDTO(a.sensor) : null)) };
  });

  app.patch(
    '/api/alerts/:id/resolve',
    { preHandler: app.auth },
    async (request, reply) => {
      const params = idParams.safeParse(request.params);
      if (!params.success) {
        return reply.code(400).send({ error: 'VALIDATION', message: 'ID tidak valid' });
      }
      try {
        const alert = await prisma.alert.update({
          where: { id: params.data.id },
          data: { status: 'RESOLVED', resolvedAt: new Date() },
          include: { sensor: true },
        });
        return { alert: toAlertDTO(alert, alert.sensor ? toSensorDTO(alert.sensor) : null) };
      } catch {
        return reply.code(404).send({ error: 'NOT_FOUND', message: 'Alert tidak ditemukan' });
      }
    },
  );
}