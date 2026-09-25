import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

function env(key: string, fallback: string): string {
  try {
    const content = readFileSync(resolve('.env'), 'utf8');
    const line = content.split('\n').find((l) => l.startsWith(`${key}=`));
    const value = line?.split('=').slice(1).join('=').trim();
    return value || process.env[key] || fallback;
  } catch {
    return process.env[key] || fallback;
  }
}

const BASE = env('API_BASE', 'http://localhost:4000');
const rng = (min: number, max: number) => Math.round((min + Math.random() * (max - min)) * 10) / 10;

const sensors = ['SM-001', 'SM-002', 'SM-003'];
const intervalMs = 5000;

let phase = 0;

function nextReading(code: string): { soil_moisture: number; temperature: number } {
  const seed = code.split('-').pop()!.charCodeAt(0);
  phase = (phase + seed) % 360;

  const baseSoil = 48 + Math.sin((phase + seed) / 9) * 10;
  const baseTemp = 26 + Math.sin((phase + seed) / 13) * 3;
  const swell = Math.floor(Date.now() / 60_000) % 40;

  // Selama ~15 menit setiap periode, sensor pertama sengaja masuk zona kering (alert).
  const dry = code === 'SM-001' && swell > 30;
  const soil = dry ? rng(8, 24) : rng(baseSoil - 4, baseSoil + 4);
  const temperature = rng(baseTemp - 1.5, baseTemp + 1.5);
  return { soil_moisture: Math.max(0, Math.min(100, soil)), temperature };
}

async function post(code: string): Promise<void> {
  const body = nextReading(code);
  try {
    const res = await fetch(`${BASE}/api/readings`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ sensor_code: code, ...body }),
    });
    if (!res.ok) {
      const text = await res.text();
      console.error(`[sim] ${code} -> ${res.status} ${text}`);
      return;
    }
    const json = (await res.json()) as { abnormal?: boolean };
    console.log(`[sim] ${code} soil=${body.soil_moisture}% temp=${body.temperature}C${json.abnormal ? ' [abnormal]' : ''}`);
  } catch (err) {
    console.error(`[sim] ${code} gagal: ${err instanceof Error ? err.message : String(err)}`);
  }
}

console.log(`[sim] simulator menuju ${BASE}. Interval ${intervalMs / 1000}s. Tekan Ctrl+C untuk berhenti.`);
for (const code of sensors) {
  void post(code);
}
setInterval(() => {
  for (const code of sensors) {
    void post(code);
  }
}, intervalMs);