import { useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { CalendarDays, Filter, ScrollText } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input, Label } from '@/components/ui/input';
import { Select } from '@/components/ui/select';
import { Card, CardContent } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { EmptyState, ErrorState, LoadingRow } from '@/components/ui/states';
import { SoilBadge } from '@/components/dashboard/SoilBadge';
import { useLive } from '@/hooks/use-live';
import { fetchHistory, queryKeys } from '@/lib/queries';
import { formatDateTime } from '@/lib/format';
import { SoilLevelByValue } from '@/lib/metrics';
import { PageHeader } from '@/components/layout/PageHeader';
import type { Reading } from '@dirly/shared';

const PAGE = 100;

export function HistoryPage() {
  const { summary } = useLive();
  const [sensorId, setSensorId] = useState('all');
  const [fromDate, setFromDate] = useState('');
  const [toDate, setToDate] = useState('');
  const [limit, setLimit] = useState(PAGE);

  const from = useMemo(() => {
    if (!fromDate) return undefined;
    const d = new Date(`${fromDate}T00:00:00`);
    return Number.isNaN(d.getTime()) ? undefined : d.toISOString();
  }, [fromDate]);

  const to = useMemo(() => {
    if (!toDate) return undefined;
    const d = new Date(`${toDate}T23:59:59`);
    return Number.isNaN(d.getTime()) ? undefined : d.toISOString();
  }, [toDate]);

  const query = useQuery({
    queryKey: queryKeys.history(sensorId, from, to, limit),
    queryFn: () => fetchHistory(sensorId, from, to, limit),
    enabled: Boolean(summary),
  });

  const readings = query.data?.readings ?? [];
  const min = summary?.settings.minSoilMoisture ?? 30;
  const max = summary?.settings.maxSoilMoisture ?? 70;
  const sensorName = (id: string) =>
    summary?.sensors.find((s) => s.sensor.id === id)?.sensor.name ?? id;

  function levelFor(r: Reading) {
    return SoilLevelByValue(r.soilMoisture, min, max);
  }

  function resetFilters() {
    setSensorId('all');
    setFromDate('');
    setToDate('');
    setLimit(PAGE);
  }

  return (
    <div className="space-y-4">
      <PageHeader
        icon={<ScrollText className="h-6 w-6 text-[#d9f4e6]" aria-hidden />}
        title="Riwayat pengukuran"
        description="Data tersimpan berdasarkan waktu pengukuran"
      />
      <Card>
        <div className="border-b border-border px-5 py-4">
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <div>
            <Label htmlFor="hm-sensor">Sensor</Label>
            <Select
              id="hm-sensor"
              value={sensorId}
              onChange={(e) => {
                setSensorId(e.target.value);
                setLimit(PAGE);
              }}
            >
              <option value="all">Semua sensor</option>
              {(summary?.sensors ?? []).map(({ sensor }) => (
                <option key={sensor.id} value={sensor.id}>
                  {sensor.name}
                </option>
              ))}
            </Select>
          </div>
          <div>
            <Label htmlFor="hm-from">Mulai dari</Label>
            <Input id="hm-from" type="date" value={fromDate} onChange={(e) => { setFromDate(e.target.value); setLimit(PAGE); }} />
          </div>
          <div>
            <Label htmlFor="hm-to">Sampai</Label>
            <Input id="hm-to" type="date" value={toDate} onChange={(e) => { setToDate(e.target.value); setLimit(PAGE); }} />
          </div>
          <div className="flex items-end">
            <Button variant="outline" onClick={resetFilters} className="gap-2">
              <Filter className="h-4 w-4" aria-hidden />
              Atur ulang
            </Button>
          </div>
        </div>
      </div>

      <CardContent className="pt-5">
        {query.isLoading ? (
          <LoadingRow label="Memuat riwayat" />
        ) : query.isError ? (
          <ErrorState message="Gagal mengambil riwayat." onRetry={() => query.refetch()} />
        ) : readings.length === 0 ? (
          <EmptyState
            icon={<CalendarDays className="h-6 w-6" aria-hidden />}
            title="Tidak ada data pada filter ini"
            description="Coba ubah rentang tanggal atau pilih sensor lain."
            action={
              <Button variant="outline" onClick={resetFilters}>
                Tampilkan semua
              </Button>
            }
          />
        ) : (
          <>
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
                {readings.map((r) => (
                  <TableRow key={r.id}>
                    <TableCell className="tnum text-muted-foreground whitespace-nowrap">
                      {formatDateTime(r.recordedAt)}
                    </TableCell>
                    <TableCell className="font-medium">{sensorName(r.sensorId)}</TableCell>
                    <TableCell className="text-right tnum">{r.soilMoisture}%</TableCell>
                    <TableCell className="text-right tnum">{r.temperature}°C</TableCell>
                    <TableCell>
                      <SoilBadge level={levelFor(r)} />
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
            <div className="mt-4 flex justify-center">
              <Button
                variant="outline"
                onClick={() => setLimit((l) => l + PAGE)}
                disabled={readings.length < limit}
              >
                Muat lebih banyak
              </Button>
            </div>
          </>
        )}
      </CardContent>
      </Card>
    </div>
  );
}