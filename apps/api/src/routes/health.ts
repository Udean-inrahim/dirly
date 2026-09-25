import type { FastifyInstance } from 'fastify';
import { prisma } from '../lib/prisma.js';

export async function healthRoutes(app: FastifyInstance): Promise<void> {
  app.get('/api/health', async () => {
    let db = 'ok';
    try {
      await prisma.$queryRaw`SELECT 1`;
    } catch {
      db = 'unreachable';
    }
    return {
      status: db === 'ok' ? 'ok' : 'degraded',
      db,
      time: new Date().toISOString(),
    };
  });
}