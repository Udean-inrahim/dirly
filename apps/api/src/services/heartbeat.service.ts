import { ALERT_MESSAGES, ALERT_SEVERITY } from '@dirly/shared';
import { prisma } from '../lib/prisma.js';
import { broadcasts } from '../lib/events.js';
import { toAlertDTO, toSensorDTO } from '../lib/serialize.js';
import { getSettings } from './reading.service.js';
import { Prisma, type Sensor } from '@prisma/client';
import type { AlertType } from '@dirly/shared';

type SensorWithLatest = Sensor & { readings: Prisma.ReadingGetPayload<{ select: { recordedAt: true } }>[] };

let timer: NodeJS.Timeout | null = null;

const OFFLINE_TYPE: AlertType = 'SENSOR_OFFLINE';

export async function checkHeartbeat(): Promise<void> {
  const settings = await getSettings();
  const timeout = settings.offlineTimeoutSec * 1000;
  const cutoff = new Date(Date.now() - timeout);

  const sensors = (await prisma.sensor.findMany({
    where: { isActive: true },
    include: { readings: { orderBy: { recordedAt: 'desc' }, take: 1 } },
  })) as SensorWithLatest[];

  for (const sensor of sensors) {
    const latest = sensor.readings[0];
    const isOffline = !latest || latest.recordedAt < cutoff;

    const openOffline = await prisma.alert.findFirst({
      where: { sensorId: sensor.id, type: OFFLINE_TYPE, status: 'ACTIVE' },
    });

    if (isOffline && !openOffline) {
      const alert = await prisma.alert.create({
        data: {
          sensorId: sensor.id,
          type: OFFLINE_TYPE,
          value: null,
          threshold: settings.offlineTimeoutSec,
          message: ALERT_MESSAGES.SENSOR_OFFLINE,
          severity: ALERT_SEVERITY.SENSOR_OFFLINE,
        },
      });
      broadcasts.emit('alert', toAlertDTO(alert, toSensorDTO({ ...sensor, latest: sensor.readings[0] ?? null }, settings.offlineTimeoutSec)));
    } else if (!isOffline && openOffline) {
      await prisma.alert.update({
        where: { id: openOffline.id },
        data: { status: 'RESOLVED', resolvedAt: new Date() },
      });
    }
  }
}

export function startHeartbeat(): void {
  if (timer) return;
  void checkHeartbeat().catch((err) => console.error('[heartbeat] failed', err));
  timer = setInterval(() => {
    void checkHeartbeat().catch((err) => console.error('[heartbeat] failed', err));
  }, 15_000);
}

export function stopHeartbeat(): void {
  if (timer) {
    clearInterval(timer);
    timer = null;
  }
}

export type { Sensor };