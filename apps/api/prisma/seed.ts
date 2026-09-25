import { PrismaClient } from '@prisma/client';
import { DEFAULT_SETTINGS } from '@dirly/shared';
import { hashPassword } from '../src/lib/password.js';
import { readFileSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const prisma = new PrismaClient();

const __dirname = dirname(fileURLToPath(import.meta.url));
const envFile = resolve(__dirname, '../.env');

function envFromFile(key: string, fallback: string): string {
  try {
    const content = readFileSync(envFile, 'utf8');
    const line = content.split('\n').find((l) => l.startsWith(`${key}=`));
    const value = line?.split('=').slice(1).join('=').trim();
    return value || process.env[key] || fallback;
  } catch {
    return process.env[key] || fallback;
  }
}

const adminEmail = envFromFile('SEED_ADMIN_EMAIL', 'admin@dirly.dev');
const adminPassword = envFromFile('SEED_ADMIN_PASSWORD', 'admin123');

const demoPlants = [
  { code: 'SM-001', name: 'Polybag Cabai', location: 'Rumah kaca A', plant: 'Cabai' },
  { code: 'SM-002', name: 'Pot Tomat', location: 'Halaman belakang', plant: 'Tomat' },
  { code: 'SM-003', name: 'Bedeng Sawi', location: 'Rumah kaca B', plant: 'Sawi' },
];

function rng(min: number, max: number): number {
  return Math.round((min + Math.random() * (max - min)) * 10) / 10;
}

async function main(): Promise<void> {
  const password = await hashPassword(adminPassword);
  await prisma.user.upsert({
    where: { email: adminEmail },
    update: {},
    create: { name: 'Administrator', email: adminEmail, password, role: 'ADMIN' },
  });
  console.log(`[seed] admin: ${adminEmail} / ${adminPassword}`);

  await prisma.setting.upsert({
    where: { id: 'singleton' },
    update: {},
    create: {
      id: 'singleton',
      minSoilMoisture: DEFAULT_SETTINGS.minSoilMoisture,
      maxSoilMoisture: DEFAULT_SETTINGS.maxSoilMoisture,
      minTemperature: DEFAULT_SETTINGS.minTemperature,
      maxTemperature: DEFAULT_SETTINGS.maxTemperature,
      refreshIntervalSec: DEFAULT_SETTINGS.refreshIntervalSec,
      offlineTimeoutSec: DEFAULT_SETTINGS.offlineTimeoutSec,
    },
  });

  const now = Date.now();
  for (const plant of demoPlants) {
    const sensor = await prisma.sensor.upsert({
      where: { sensorCode: plant.code },
      update: {},
      create: {
        sensorCode: plant.code,
        name: plant.name,
        location: plant.location,
        plant: plant.plant,
      },
    });

    const hasReadings = await prisma.reading.count({ where: { sensorId: sensor.id } });
    if (hasReadings > 0) continue;

    for (let i = 24 * 6; i > 0; i -= 1) {
      const minutesAgo = i * 10;
      const drift = Math.sin(minutesAgo / 60) * 6;
      const soil = rng(42, 62) + drift;
      const temp = rng(24, 30) + drift / 2;
      const recordedAt = new Date(now - minutesAgo * 60_000);
      await prisma.reading.create({
        data: {
          sensorId: sensor.id,
          soilMoisture: Math.max(10, Math.min(90, soil)),
          temperature: Math.max(16, Math.min(38, temp)),
          recordedAt,
        },
      });
    }
    await prisma.sensor.update({ where: { id: sensor.id }, data: { lastSeenAt: new Date() } });
    console.log(`[seed] sensor ${plant.code} + 24h riwayat`);
  }

  console.log('[seed] selesai');
}

main()
  .catch((err) => {
    console.error(err);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());