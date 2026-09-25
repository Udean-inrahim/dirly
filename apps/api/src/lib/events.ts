import { EventEmitter } from 'node:events';
import type { Alert, Reading, Sensor, Settings, SensorSnapshot, DashboardSummary } from '@dirly/shared';

type Events = {
  reading: [Reading];
  alert: [Alert];
  sensor: [Sensor];
  settings: [Settings];
};

export class Broadcaster extends EventEmitter {
  private static instance: Broadcaster | null = null;

  static get(): Broadcaster {
    if (!this.instance) this.instance = new Broadcaster();
    return this.instance;
  }

  emit<K extends keyof Events>(type: K, payload: Events[K][0]): boolean {
    return super.emit(type as string, payload);
  }

  on<K extends keyof Events>(type: K, listener: (payload: Events[K][0]) => void): this {
    return super.on(type as string, listener as (p: unknown) => void);
  }
}

export const broadcasts = Broadcaster.get();
export type MessageType = keyof Events;
export type MessagePayload = DashboardSummary | SensorSnapshot | Reading | Alert | Settings | Sensor;