import { type ReactNode } from 'react';
import { Droplets, RadioTower, ThermometerSun } from 'lucide-react';
import { averageLatest, SoilLevelByValue } from '@/lib/metrics';
import { formatTime } from '@/lib/format';
import type { DashboardSummary } from '@dirly/shared';

export const HERO_IMG =
  'https://images.unsplash.com/photo-1501004318641-b39e6451bec6?auto=format&fit=crop&w=1600&q=85';

export function DashboardHero({ summary }: { summary: DashboardSummary | null }) {
  const { soilAvg, tempAvg } = averageLatest(summary);
  const sensors = summary?.sensors ?? [];
  const online = sensors.filter((s) => s.sensor.health === 'ONLINE').length;
  const minSoil = summary?.settings.minSoilMoisture ?? 30;
  const maxSoil = summary?.settings.maxSoilMoisture ?? 70;
  const level = soilAvg !== null ? SoilLevelByValue(soilAvg, minSoil, maxSoil) : null;
  const lastReading = sensors.find((s) => s.latest)?.latest?.recordedAt ?? null;

  return (
    <div className="flex flex-col gap-3">
      <div className="flex flex-wrap gap-4">
        <WeatherCard
          icon={<ThermometerSun className="h-6 w-6 text-[#d9f4e6]" aria-hidden />}
          title="Suhu rata-rata"
          value={tempAvg !== null ? `${tempAvg.toFixed(1)}°C` : '--'}
          small={tempAvg !== null ? 'Dari sensor yang online' : 'Belum ada data'}
        />
        <WeatherCard
          icon={<Droplets className="h-6 w-6 text-[#d9f4e6]" aria-hidden />}
          title="Kelembapan tanah"
          value={soilAvg !== null ? `${soilAvg.toFixed(1)}%` : '--'}
          small={level ? soilLevelText(level) : 'Belum ada data'}
        />
        <WeatherCard
          icon={<RadioTower className="h-6 w-6 text-[#d9f4e6]" aria-hidden />}
          title="Sensor online"
          value={`${online}/${sensors.length}`}
          small="Dari sensor terdaftar"
        />
      </div>

      <div className="grid grid-cols-2 gap-4 rounded-[10px] border border-white/35 bg-[#28412d]?? p-4 text-white backdrop-blur-md md:grid-cols-[2.3fr_1fr_1fr_1fr]">
        <div className="col-span-2 md:col-span-1">
          <p className="mb-2 text-sm">Monitoring tanah</p>
          <p className="text-2xl font-semibold">Kelembapan tanah</p>
          <p className="mt-1 text-sm text-white/90">
            {online} sensor aktif · pembaruan tiap {summary?.settings.refreshIntervalSec ?? 5} detik
          </p>
        </div>
        <FieldStat label="Rentang ideal" value={`${minSoil}-${maxSoil}%`} />
        <FieldStat label="Peringatan aktif" value={String(summary?.activeAlerts ?? 0)} />
        <FieldStat label="Update terakhir" value={formatTime(lastReading)} small />
      </div>
    </div>
  );
}

function WeatherCard({
  icon,
  title,
  value,
  small,
}: {
  icon: ReactNode;
  title: string;
  value: string;
  small: string;
}) {
  return (
    <div className="w-44 rounded-[11px] border border-white/35 bg-[#28412d]/30 p-4 text-white shadow-md backdrop-blur-md sm:w-48">
      {icon}
      <p className="mb-1 mt-2 text-sm">{title}</p>
      <p className="text-3xl font-semibold">{value}</p>
      <p className="mt-1 text-xs text-white/85">{small}</p>
    </div>
  );
}

function FieldStat({ label, value, small }: { label: string; value: string; small?: boolean }) {
  return (
    <div>
      <span className="block text-sm text-white/80">{label}</span>
      <strong className={small ? 'tnum text-xl font-medium' : 'text-2xl font-medium'}>{value}</strong>
    </div>
  );
}

function soilLevelText(level: 'NORMAL' | 'WET' | 'DRY') {
  switch (level) {
    case 'WET':
      return 'Terlalu basah';
    case 'DRY':
      return 'Terlalu kering';
    default:
      return 'Optimal';
  }
}
