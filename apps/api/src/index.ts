import { loadEnv } from './env.js';
import { buildServer, shutdown } from './server.js';
import { startMqtt, stopMqtt } from './lib/mqtt.js';
import { startHeartbeat, stopHeartbeat } from './services/heartbeat.service.js';
import { prisma } from './lib/prisma.js';
import type { FastifyInstance } from 'fastify';

const env = loadEnv();
let app: FastifyInstance | null = null;

async function main(): Promise<void> {
  await prisma.$connect();
  console.log('[db] connected');

  app = await buildServer();

  if (env.mqttUrl) {
    await startMqtt({
      url: env.mqttUrl,
      topic: env.mqttTopic,
      username: env.mqttUsername,
      password: env.mqttPassword,
    });
  } else {
    console.log('[mqtt] disabled, HTTP ingest only');
  }

  startHeartbeat();

  const port = env.port;
  await app.listen({ port, host: '0.0.0.0' });
}

main().catch((err) => {
  console.error('[fatal]', err);
  process.exit(1);
});

for (const signal of ['SIGINT', 'SIGTERM'] as const) {
  process.on(signal, async () => {
    stopHeartbeat();
    stopMqtt();
    if (app) await shutdown(app);
    process.exit(0);
  });
}