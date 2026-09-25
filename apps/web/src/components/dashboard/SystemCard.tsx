import { AlertTriangle, BellOff, RadioTower } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { HealthBadge } from '@/components/dashboard/HealthBadge';
import type { DashboardSummary } from '@dirly/shared';
import { formatTime } from '@/lib/format';

export function SystemCard({ summary }: { summary: DashboardSummary | null }) {
  const sensors = summary?.sensors ?? [];
  const activeAlerts = summary?.activeAlerts ?? 0;

  return (
    <Card className="flex flex-col" style={{ backgroundColor: 'rgba(255,255,255,0.62)' }}>
      <CardHeader className="pb-2">
        <CardTitle className="flex items-center gap-2">
          <RadioTower className="h-4 w-4 text-muted-foreground" aria-hidden />
          Status sistem
        </CardTitle>
        <CardDescription>{sensors.length} sensor terdaftar</CardDescription>
      </CardHeader>
      <CardContent className="flex-1 pb-5">
        <ul className="flex flex-col gap-2.5">
          {sensors.length === 0 ? (
            <li className="text-sm text-muted-foreground">Belum ada sensor. Tambahkan lewat halaman Sensor.</li>
          ) : (
            sensors.map(({ sensor, latest }) => (
              <li key={sensor.id} className="flex items-center gap-3">
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium">{sensor.name}</p>
                  <p className="truncate text-xs text-muted-foreground">
                    {latest
                      ? `${latest.soilMoisture}% tanah · ${latest.temperature}°C`
                      : 'Belum ada pengukuran'}
                  </p>
                </div>
                <span className="hidden sm:block text-xs text-muted-foreground tnum">
                  {formatTime(latest?.recordedAt)}
                </span>
                <HealthBadge health={sensor.health} />
              </li>
            ))
          )}
        </ul>

        <div className="mt-5 flex items-center gap-2 rounded-2xl border border-[#e3eadb] bg-[#f3f8ee] px-3 py-2.5">
          {activeAlerts > 0 ? (
            <AlertTriangle className="h-4 w-4 text-[#c98c25]" aria-hidden />
          ) : (
            <BellOff className="h-4 w-4 text-[#2fa06b]" aria-hidden />
          )}
          <p className="text-sm">
            <span className="font-medium">{activeAlerts}</span>{' '}
            <span className="text-muted-foreground">peringatan aktif</span>
          </p>
        </div>
      </CardContent>
    </Card>
  );
}