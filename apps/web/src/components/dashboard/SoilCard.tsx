import { Droplets } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { SoilBadge } from '@/components/dashboard/SoilBadge';
import { SoilLevelByValue } from '@/lib/metrics';
import type { DashboardSummary } from '@dirly/shared';
import { averageLatest } from '@/lib/metrics';
import { cn } from '@/lib/utils';
import { formatTime } from '@/lib/format';

export function SoilCard({ summary }: { summary: DashboardSummary | null }) {
  const { soilAvg } = averageLatest(summary);
  const min = summary?.settings.minSoilMoisture ?? 30;
  const max = summary?.settings.maxSoilMoisture ?? 70;
  const hasData = soilAvg !== null;

  const level = hasData ? SoilLevelByValue(soilAvg, min, max) : null;
  const latestTime = summary?.sensors.find((s) => s.latest)?.latest?.recordedAt ?? null;

  return (
    <Card className="flex flex-col border-white/50 bg-white/55 text-foreground shadow-card backdrop-blur-md">
      <CardHeader className="pb-2">
        <CardTitle className="flex items-center gap-2">
          <Droplets className="h-4 w-4 text-muted-foreground" aria-hidden />
          Kelembapan tanah rata-rata
        </CardTitle>
        <CardDescription>Rata-rata dari sensor yang online</CardDescription>
      </CardHeader>
      <CardContent className="flex flex-1 items-center gap-6 pb-5">
        <div className="flex-1">
          <p className={cn('tnum text-5xl font-semibold leading-none tracking-tight', !hasData && 'text-muted-foreground')}>
            {hasData ? soilAvg.toFixed(1) : '--'}
            <span className="ml-1 text-xl font-medium text-muted-foreground">%</span>
          </p>
          <div className="mt-3">{level ? <SoilBadge level={level} /> : null}</div>
          <p className="mt-3 text-xs text-muted-foreground">
            Rentang ideal {min}% sampai {max}% · terakhir {formatTime(latestTime)}
          </p>
        </div>
        <SoilGauge value={soilAvg} min={min} max={max} />
      </CardContent>
    </Card>
  );
}

export function SoilGauge({ value, min, max }: { value: number | null; min: number; max: number }) {
  const clamp = (v: number) => Math.max(0, Math.min(100, v));
  const bandTop = 100 - max;
  const bandHeight = max - min;
  const markerTop = value === null ? null : 100 - clamp(value);

  return (
    <div
      className="relative h-32 w-3 shrink-0 rounded-full bg-[#e9efe4]"
      role="img"
      aria-label={value === null ? 'Kelembapan belum ada' : `Kelembapan ${value.toFixed(1)} persen, rentang ideal ${min} sampai ${max}`}
    >
      <div
        className="absolute left-0 w-full rounded-full bg-[#bfe6cf]"
        style={{ top: `${bandTop}%`, height: `${bandHeight}%` }}
      />
      {markerTop !== null ? (
        <div
          className="absolute left-1/2 h-3 w-5 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-white bg-[#2fa06b] shadow-sm"
          style={{ top: `${markerTop}%` }}
        />
      ) : null}
    </div>
  );
}