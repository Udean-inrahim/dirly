import { Thermometer } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { averageLatest } from '@/lib/metrics';
import type { DashboardSummary } from '@dirly/shared';
import { cn } from '@/lib/utils';

export function TempCard({ summary }: { summary: DashboardSummary | null }) {
  const { tempAvg } = averageLatest(summary);
  const min = summary?.settings.minTemperature ?? 15;
  const max = summary?.settings.maxTemperature ?? 35;
  const hasData = tempAvg !== null;
  const inRange = hasData && tempAvg >= min && tempAvg <= max;

  return (
    <Card className="flex flex-col" style={{ backgroundColor: 'rgba(255,255,255,0.62)' }}>
      <CardHeader className="pb-2">
        <CardTitle className="flex items-center gap-2">
          <Thermometer className="h-4 w-4 text-muted-foreground" aria-hidden />
          Suhu rata-rata
        </CardTitle>
        <CardDescription>Dari sensor yang online</CardDescription>
      </CardHeader>
      <CardContent className="pb-5">
        <p className={cn('tnum text-4xl font-semibold leading-none tracking-tight', !hasData && 'text-muted-foreground')}>
          {hasData ? tempAvg.toFixed(1) : '--'}
          <span className="ml-1 text-lg font-medium text-muted-foreground">°C</span>
        </p>
        <p
          className={cn(
            'mt-3 inline-block rounded-full px-3 py-1 text-xs font-medium',
            !hasData ? 'text-muted-foreground' : inRange ? 'bg-[#ddf3e6] text-[#287a53]' : 'bg-[#fdf3d3] text-[#9c7a1a]',
          )}
        >
          {hasData ? (inRange ? 'Dalam rentang ideal' : 'Di luar rentang ideal') : 'Belum ada data'}
        </p>
        <p className="mt-1 text-xs text-muted-foreground">
          Rentang ideal {min}°C sampai {max}°C
        </p>
      </CardContent>
    </Card>
  );
}