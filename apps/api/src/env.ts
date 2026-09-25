export interface Env {
  databaseUrl: string;
  jwtSecret: string;
  port: number;
  corsOrigin: string;
  mqttUrl: string | null;
  mqttTopic: string;
  mqttUsername?: string;
  mqttPassword?: string;
  deviceToken: string | null;
  seedAdminEmail: string;
  seedAdminPassword: string;
  nodeEnv: string;
}

export function loadEnv(): Env {
  const databaseUrl = process.env.DATABASE_URL;
  if (!databaseUrl) {
    throw new Error('DATABASE_URL is required. Copy apps/api/.env.example to apps/api/.env');
  }

  const jwtSecret = process.env.JWT_SECRET ?? 'dirly-dev-secret-change-me';
  if (process.env.NODE_ENV === 'production' && jwtSecret === 'dirly-dev-secret-change-me') {
    throw new Error('JWT_SECRET must be set in production');
  }

  return {
    databaseUrl,
    jwtSecret,
    port: Number(process.env.PORT ?? 4000),
    corsOrigin: process.env.CORS_ORIGIN ?? 'http://localhost:5173',
    mqttUrl: process.env.MQTT_URL || null,
    mqttTopic: process.env.MQTT_TOPIC ?? 'soil/sensors/+/data',
    mqttUsername: process.env.MQTT_USERNAME || undefined,
    mqttPassword: process.env.MQTT_PASSWORD || undefined,
    deviceToken: process.env.DEVICE_TOKEN || null,
    seedAdminEmail: process.env.SEED_ADMIN_EMAIL ?? 'admin@dirly.dev',
    seedAdminPassword: process.env.SEED_ADMIN_PASSWORD ?? 'admin123',
    nodeEnv: process.env.NODE_ENV ?? 'development',
  };
}