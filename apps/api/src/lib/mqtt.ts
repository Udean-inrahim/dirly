import mqtt, { type MqttClient } from 'mqtt';
import { z } from 'zod';
import { prisma } from './prisma.js';
import { ingestReading } from '../services/reading.service.js';

const payloadSchema = z.object({
  soil_moisture: z.number().min(0).max(100),
  temperature: z.number().min(-40).max(80).optional(),
});

export interface MqttBridgeOptions {
  url: string;
  topic: string;
  username?: string;
  password?: string;
}

let client: MqttClient | null = null;

function sensorCodeFromTopic(topic: string): string | null {
  const parts = topic.split('/');
  if (parts.length >= 3 && parts[0] === 'soil' && parts[1] === 'sensors' && parts[parts.length - 1] === 'data') {
    return parts[2];
  }
  return null;
}

function parsePayload(raw: Buffer): unknown {
  const text = raw.toString('utf8').trim();
  if (text.startsWith('{')) {
    return JSON.parse(text);
  }
  if (text.includes(',')) {
    const [soil_moisture, temperature] = text.split(',').map((v) => Number(v));
    return { soil_moisture, temperature: Number.isNaN(temperature) ? undefined : temperature };
  }
  return { soil_moisture: Number(text) };
}

function handleMessage(topic: string, raw: Buffer): void {
  const code = sensorCodeFromTopic(topic);
  if (!code) return;

  let parsed: unknown;
  try {
    parsed = parsePayload(raw);
  } catch (err) {
    console.error(`[mqtt] unparseable payload on ${topic}`, err);
    return;
  }

  const result = payloadSchema.safeParse(parsed);
  if (!result.success) {
    console.error(`[mqtt] invalid payload on ${topic}`, result.error.flatten());
    return;
  }

  void ingestReading({ sensor_code: code, ...result.data }).catch((err) => {
    console.error(`[mqtt] ingest failed for ${code}:`, err instanceof Error ? err.message : err);
  });
}

export async function startMqtt(options: MqttBridgeOptions): Promise<void> {
  if (client) return;

  await prisma.$connect();
  const connection = mqtt.connect(options.url, {
    username: options.username,
    password: options.password,
    reconnectPeriod: 5000,
    connectTimeout: 10_000,
  });

  connection.on('connect', () => {
    console.log(`[mqtt] connected to ${options.url}, subscribing ${options.topic}`);
    connection.subscribe(options.topic, { qos: 0 });
  });

  connection.on('message', (topic, raw) => handleMessage(topic, raw));
  connection.on('error', (err) => console.error('[mqtt] error', err.message));
  connection.on('reconnect', () => console.log('[mqtt] reconnecting'));

  client = connection;
}

export function stopMqtt(): void {
  if (client) {
    client.end(true);
    client = null;
  }
}