import type { FastifyInstance, FastifyRequest } from 'fastify';
import { z } from 'zod';
import { prisma } from '../lib/prisma.js';
import { hashPassword, verifyPassword } from '../lib/password.js';
import { toUserDTO } from '../lib/serialize.js';

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
});

const registerSchema = z.object({
  name: z.string().min(1).max(80),
  email: z.string().email(),
  password: z.string().min(6),
});

export async function authRoutes(app: FastifyInstance): Promise<void> {
  app.post('/api/auth/login', async (request, reply) => {
    const parsed = loginSchema.safeParse(request.body);
    if (!parsed.success) {
      return reply.code(400).send({ error: 'VALIDATION', message: 'Email dan password tidak valid' });
    }

    const user = await prisma.user.findUnique({ where: { email: parsed.data.email.toLowerCase() } });
    if (!user || !(await verifyPassword(parsed.data.password, user.password))) {
      return reply.code(401).send({ error: 'UNAUTHORIZED', message: 'Email atau password salah' });
    }

    const token = await reply.jwtSign({ sub: user.id, role: user.role });
    return { token, user: toUserDTO(user) };
  });

  app.post('/api/auth/register', async (request, reply) => {
    const parsed = registerSchema.safeParse(request.body);
    if (!parsed.success) {
      return reply.code(400).send({ error: 'VALIDATION', message: 'Data pendaftaran tidak lengkap atau tidak valid' });
    }

    const email = parsed.data.email.toLowerCase();
    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) {
      return reply.code(409).send({ error: 'CONFLICT', message: 'Email sudah terdaftar' });
    }

    const userCount = await prisma.user.count();
    const role = userCount === 0 ? 'ADMIN' : 'USER';

    const user = await prisma.user.create({
      data: {
        name: parsed.data.name.trim(),
        email,
        password: await hashPassword(parsed.data.password),
        role,
      },
    });

    const token = await reply.jwtSign({ sub: user.id, role: user.role });
    return reply.code(201).send({ token, user: toUserDTO(user) });
  });

  app.get('/api/auth/me', async (request, reply) => {
    try {
      await request.jwtVerify();
    } catch {
      return reply.code(401).send({ error: 'UNAUTHORIZED', message: 'Sesi tidak valid' });
    }
    const payload = request.user as { sub: string };
    const user = await prisma.user.findUnique({ where: { id: payload.sub } });
    if (!user) {
      return reply.code(404).send({ error: 'NOT_FOUND', message: 'User tidak ditemukan' });
    }
    return { user: toUserDTO(user) };
  });
}

export interface AuthRequest extends FastifyRequest {
  user: { sub: string; role: string };
}