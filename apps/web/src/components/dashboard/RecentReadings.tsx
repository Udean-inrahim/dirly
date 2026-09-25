import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { ArrowRight, ScrollText } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { EmptyState, ErrorState, LoadingRow } from '@/components/ui/states';
import { SoilBadge } from '@/components/dashboard/SoilBadge';
import { fetchRecentReadings, queryKeys } from '@/lib/queries';
import { formatDateTime } from '@/lib/format';
import { useLive } from '@/hooks/use-live';
import { SoilLevelByValue } from '@/lib/metrics';
import type { Reading } from '@dirly/shared';

function levelFor(reading: Reading, min: number, max: number) {
  return SoilLevelByValue(reading.soilMoisture, min, max);
}

export function RecentReadings() {
  const { summary } = useLive();
  const query = useQuery({
    queryKey: queryKeys.recentReadings,
    queryFn: () => fetchRecentReadings(10),
    enabled: Boolean(summary),
    refetchInterval: 10_000,
  });

  const readingList = query.data?.readings ?? [];
  const sensorName = (sensorId: string) =>
    summary?.sensors.find((s) => s.sensor.id === sensorId)?.sensor.name ?? sensorId;
  const min = summary?.settings.minSoilMoisture ?? 30;
  const max = summary?.settings.maxSoilMoisture ?? 70;

  return (
    <Card>
      <CardHeader className="flex-row items-start justify-between gap-3 space-y-0">
        <div>
          <CardTitle className="flex items-center gap-2">
            <ScrollText className="h-4 w-4 text-muted-foreground" aria-hidden />
            Pengukuran terbaru
          </CardTitle>
          <CardDescription>10 data terakhir dari semua sensor</CardDescription>
        </div>
        <Link
          to="/history"
          className="inline-flex items-center gap-1 rounded-full border border-[#dfe4df] bg-white px-3 py-1.5 text-xs font-semibold text-[#288e5e] transition-colors hover:bg-[#f3f8ee]"
        >
          Lihat semua
          <ArrowRight className="h-3.5 w-3.5" aria-hidden />
        </Link>
      </CardHeader>
      <CardContent>
        {query.isLoading ? (
          <LoadingRow label="Memuat pengukuran" />
        ) : query.isError ? (
          <ErrorState message="Gagal mengambil pengukuran terbaru." onRetry={() => query.refetch()} />
        ) : readingList.length === 0 ? (
          <EmptyState
            icon={<ScrollText className="h-6 w-6" aria-hidden />}
            title="Belum ada pengukuran"
            description="Data sensor akan tampil di sini setelah sensor mulai mengirim."
          />
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Waktu</TableHead>
                <TableHead>Sensor</TableHead>
                <TableHead className="text-right">Kelembapan</TableHead>
                <TableHead className="text-right">Suhu</TableHead>
                <TableHead>Status tanah</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {readingList.map((r) => (
                <TableRow key={r.id}>
                  <TableCell className="tnum text-muted-foreground">{formatDateTime(r.recordedAt)}</TableCell>
                  <TableCell className="font-medium">{sensorName(r.sensorId)}</TableCell>
                  <TableCell className="text-right tnum">{r.soilMoisture.toFixed(1)}%</TableCell>
                  <TableCell className="text-right tnum">{r.temperature.toFixed(1)}°C</TableCell>
                  <TableCell>
                    <SoilBadge level={levelFor(r, min, max)} />
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </CardContent>
    </Card>
  );
}