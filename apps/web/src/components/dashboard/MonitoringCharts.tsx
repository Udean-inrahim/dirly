import { useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  Area,
  AreaChart,
  CartesianGrid,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { Activity, Droplets, Thermometer } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Select } from '@/components/ui/select';
import { EmptyState, ErrorState, LoadingRow } from '@/components/ui/states';
import { fetchReadings, queryKeys } from '@/lib/queries';
import { formatTime } from '@/lib/format';
import { useLive } from '@/hooks/use-live';
import { TIME_RANGES, type TimeRangeKey } from '@dirly/shared';
import { cn } from '@/lib/utils';

const SENSOR_ALL = 'all';

export function MonitoringCharts() {
  const { summary } = useLive();
  const [rangeKey, setRangeKey] = useState<TimeRangeKey>('6h');
  const [sensorId, setSensorId] = useState<string>(SENSOR_ALL);

  const range = TIME_RANGES.find((r) => r.key === rangeKey)!;
  const hours = range.hours;

  const history = useQuery({
    queryKey: queryKeys.readings(sensorId, hours),
    queryFn: () => fetchReadings(sensorId, hours),
    enabled: Boolean(summary),
  });

  const data = useMemo(() => {
    const rows = history.data?.readings ?? [];
    const chronological = rows.slice().reverse();

    let merged: { time: string; label: string; soil: number; temp: number }[];
    if (sensorId === SENSOR_ALL) {
      const buckets = new Map<string, { soil: number[]; temp: number[] }>();
      for (const r of chronological) {
        const key = formatTime(r.recordedAt);
        const b = buckets.get(key);
        if (b) {
          b.soil.push(r.soilMoisture);
          b.temp.push(r.temperature);
        } else {
          buckets.set(key, { soil: [r.soilMoisture], temp: [r.temperature] });
        }
      }
      merged = Array.from(buckets.entries()).map(([label, b]) => ({
        time: label,
        label,
        soil: b.soil.reduce((s, v) => s + v, 0) / b.soil.length,
        temp: b.temp.reduce((s, v) => s + v, 0) / b.temp.length,
      }));
    } else {
      merged = chronological.map((r) => ({
        time: r.recordedAt,
        label: formatTime(r.recordedAt),
        soil: r.soilMoisture,
        temp: r.temperature,
      }));
    }

    const maxPoints = 240;
    if (merged.length > maxPoints) {
      const step = merged.length / maxPoints;
      const sampled: typeof merged = [];
      for (let i = 0; i < maxPoints; i++) {
        const idx = Math.min(merged.length - 1, Math.floor(i * step));
        sampled.push(merged[idx]);
      }
      return sampled;
    }
    return merged;
  }, [history.data, sensorId]);

  const minSoil = summary?.settings.minSoilMoisture ?? 30;
  const maxSoil = summary?.settings.maxSoilMoisture ?? 70;

  const tooltipStyle = {
    borderRadius: 12,
    border: '1px solid #dfe4df',
    fontSize: 12,
    background: '#ffffff',
    boxShadow: '0 8px 20px rgba(50, 70, 45, 0.12)',
  };

  return (
    <Card>
      <CardHeader className="flex-row items-start justify-between gap-3 space-y-0">
        <div>
          <CardTitle className="flex items-center gap-2">
            <Activity className="h-4 w-4 text-muted-foreground" aria-hidden />
            Tren pengukuran
          </CardTitle>
          <CardDescription>{range.label} terakhir · grafik kelembapan tanah dan suhu dipisah</CardDescription>
        </div>
        <div className="flex flex-col items-end gap-2">
          <Select
            aria-label="Sensor"
            value={sensorId}
            onChange={(e) => setSensorId(e.target.value)}
            className="w-auto"
          >
            <option value={SENSOR_ALL}>Semua sensor</option>
            {(summary?.sensors ?? []).map(({ sensor }) => (
              <option key={sensor.id} value={sensor.id}>
                {sensor.name}
              </option>
            ))}
          </Select>
          <div role="group" aria-label="Rentang waktu" className="flex gap-1 rounded-full border border-[#dfe4df] bg-white p-1">
            {TIME_RANGES.map((r) => (
              <button
                key={r.key}
                type="button"
                onClick={() => setRangeKey(r.key)}
                aria-pressed={rangeKey === r.key}
                className={cn(
                  'rounded-full px-3 py-1.5 text-xs font-medium transition-colors',
                  rangeKey === r.key
                    ? 'bg-[#2fa06b] text-white'
                    : 'text-muted-foreground hover:bg-[#f3f8ee] hover:text-foreground',
                )}
              >
                {r.label}
              </button>
            ))}
          </div>
        </div>
      </CardHeader>

      <CardContent>
        {history.isLoading ? (
          <LoadingRow label="Memuat riwayat pengukuran" />
        ) : history.isError ? (
          <ErrorState message="Gagal mengambil data riwayat." onRetry={() => history.refetch()} />
        ) : data.length === 0 ? (
          <EmptyState
            icon={<Activity className="h-6 w-6" aria-hidden />}
            title="Belum ada data pada rentang ini"
            description="Sensor belum mengirimkan pengukuran pada periode tersebut."
          />
        ) : (
          <div className="space-y-6">
            <div>
              <p className="mb-2 flex items-center gap-1.5 text-sm font-semibold text-foreground">
                <Droplets className="h-4 w-4 text-[#2fa06b]" aria-hidden />
                Kelembapan tanah
              </p>
              <div className="h-60 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={data} margin={{ top: 8, right: 8, left: -12, bottom: 0 }}>
                    <defs>
                      <linearGradient id="soilFill" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#2fa06b" stopOpacity={0.35} />
                        <stop offset="100%" stopColor="#2fa06b" stopOpacity={0.03} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid stroke="#dbe4d4" strokeDasharray="3 3" vertical={false} />
                    <XAxis
                      dataKey="label"
                      tick={{ fontSize: 11, fill: '#929892' }}
                      tickLine={false}
                      axisLine={{ stroke: '#dfe4df' }}
                      minTickGap={32}
                    />
                    <YAxis
                      domain={[0, 100]}
                      tick={{ fontSize: 11, fill: '#929892' }}
                      tickLine={false}
                      axisLine={false}
                      unit="%"
                    />
                    <Tooltip
                      contentStyle={tooltipStyle}
                      formatter={(value: number) => [`${Number(value).toFixed(1)}%`, 'Kelembapan tanah']}
                      labelFormatter={(label: string) => label}
                    />
                    <ReferenceLine y={minSoil} stroke="#b3bfa6" strokeDasharray="4 4" />
                    <ReferenceLine y={maxSoil} stroke="#b3bfa6" strokeDasharray="4 4" />
                    <Area
                      type="monotone"
                      dataKey="soil"
                      stroke="#2fa06b"
                      strokeWidth={2}
                      fill="url(#soilFill)"
                      isAnimationActive={false}
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
              <p className="mt-1 text-xs text-muted-foreground">
                Garis putus-putus: batas rentang ideal ({minSoil}% sampai {maxSoil}%)
              </p>
            </div>

            <hr className="border-[#e4e9e0]" />

            <div>
              <p className="mb-2 flex items-center gap-1.5 text-sm font-semibold text-foreground">
                <Thermometer className="h-4 w-4 text-[#4c7a5a]" aria-hidden />
                Suhu
              </p>
              <div className="h-60 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={data} margin={{ top: 8, right: 8, left: -12, bottom: 0 }}>
                    <defs>
                      <linearGradient id="tempFill" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#4c7a5a" stopOpacity={0.2} />
                        <stop offset="100%" stopColor="#4c7a5a" stopOpacity={0.03} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid stroke="#dbe4d4" strokeDasharray="3 3" vertical={false} />
                    <XAxis
                      dataKey="label"
                      tick={{ fontSize: 11, fill: '#929892' }}
                      tickLine={false}
                      axisLine={{ stroke: '#dfe4df' }}
                      minTickGap={32}
                    />
                    <YAxis
                      domain={[0, 50]}
                      tick={{ fontSize: 11, fill: '#929892' }}
                      tickLine={false}
                      axisLine={false}
                      unit="°C"
                    />
                    <Tooltip
                      contentStyle={tooltipStyle}
                      formatter={(value: number) => [`${Number(value).toFixed(1)}°C`, 'Suhu']}
                      labelFormatter={(label: string) => label}
                    />
                    <Area
                      type="monotone"
                      dataKey="temp"
                      stroke="#4c7a5a"
                      strokeWidth={2}
                      fill="url(#tempFill)"
                      isAnimationActive={false}
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}