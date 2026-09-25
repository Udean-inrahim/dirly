import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { AlarmClockCheck, Bell, BellRing, CheckCheck } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Select } from '@/components/ui/select';
import { Card, CardContent } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { EmptyState, ErrorState, LoadingRow } from '@/components/ui/states';
import { Badge } from '@/components/ui/badge';
import { useLive } from '@/hooks/use-live';
import { useResolveAlertMutation } from '@/hooks/use-mutations';
import { fetchAlerts, queryKeys } from '@/lib/queries';
import { formatLongDateTime } from '@/lib/format';
import { PageHeader } from '@/components/layout/PageHeader';
import type { Alert, AlertStatus, AlertSeverity, AlertType } from '@dirly/shared';

const TYPE_LABEL: Record<AlertType, string> = {
  SOIL_TOO_DRY: 'Tanah kering',
  SOIL_TOO_WET: 'Tanah terlalu basah',
  TEMP_HIGH: 'Suhu tinggi',
  TEMP_LOW: 'Suhu rendah',
  SENSOR_OFFLINE: 'Sensor offline',
};

function severityVariant(severity: AlertSeverity): 'success' | 'warning' | 'critical' | 'neutral' {
  if (severity === 'CRITICAL') return 'critical';
  if (severity === 'WARNING') return 'warning';
  return 'neutral';
}

export function AlertsPage() {
  const [status, setStatus] = useState<AlertStatus | 'ALL'>('ACTIVE');
  const resolveMutation = useResolveAlertMutation();
  const { summary } = useLive();

  const query = useQuery({
    queryKey: queryKeys.alerts(status),
    queryFn: () => fetchAlerts(status, undefined, 200),
  });

  const alerts = query.data?.alerts ?? [];
  const sensorName = (id: string) =>
    summary?.sensors.find((s) => s.sensor.id === id)?.sensor.name ?? id;

  return (
    <div className="space-y-4">
      <PageHeader
        icon={<Bell className="h-6 w-6 text-[#d9f4e6]" aria-hidden />}
        title="Peringatan"
        description="Kondisi di luar ambang batas dan gangguan sensor"
        action={
          <Select
            aria-label="Status peringatan"
            value={status}
            onChange={(e) => setStatus(e.target.value as AlertStatus | 'ALL')}
            className="w-auto border-white/40 bg-white/15 text-white focus-visible:outline-white"
          >
            <option value="ACTIVE" className="text-foreground">Aktif</option>
            <option value="ALL" className="text-foreground">Semua</option>
            <option value="RESOLVED" className="text-foreground">Teratasi</option>
          </Select>
        }
      />
      <Card>
        <CardContent className="pt-5">
        {query.isLoading ? (
          <LoadingRow label="Memuat peringatan" />
        ) : query.isError ? (
          <ErrorState message="Gagal memuat peringatan." onRetry={() => query.refetch()} />
        ) : alerts.length === 0 ? (
          <EmptyState
            icon={status === 'ACTIVE' ? <BellRing className="h-6 w-6" aria-hidden /> : <AlarmClockCheck className="h-6 w-6" aria-hidden />}
            title={status === 'ACTIVE' ? 'Tidak ada peringatan aktif' : 'Tidak ada peringatan'}
            description={
              status === 'ACTIVE'
                ? 'Semua sensor dalam kondisi normal.'
                : 'Belum ada riwayat peringatan tercatat.'
            }
          />
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Peringatan</TableHead>
                <TableHead>Sensor</TableHead>
                <TableHead>Nilai / Ambang</TableHead>
                <TableHead>Waktu</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Aksi</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {alerts.map((alert) => (
                <AlertRow
                  key={alert.id}
                  alert={alert}
                  sensorName={sensorName(alert.sensorId)}
                  resolving={resolveMutation.isPending}
                  onResolve={() => resolveMutation.mutate(alert.id)}
                />
              ))}
            </TableBody>
          </Table>
        )}
      </CardContent>
      </Card>
    </div>
  );
}

function AlertRow({
  alert,
  sensorName,
  resolving,
  onResolve,
}: {
  alert: Alert;
  sensorName: string;
  resolving: boolean;
  onResolve: () => void;
}) {
  return (
    <TableRow>
      <TableCell>
        <div className="flex items-center gap-2">
          <Badge variant={severityVariant(alert.severity)}>{TYPE_LABEL[alert.type]}</Badge>
        </div>
        <p className="mt-1 text-xs text-muted-foreground">{alert.message}</p>
      </TableCell>
      <TableCell className="font-medium">{sensorName}</TableCell>
      <TableCell className="tnum text-muted-foreground">
        {alert.type === 'SENSOR_OFFLINE'
          ? `> ${alert.threshold} detik tanpa data`
          : `${formatValue(alert.value)} melewati ${formatValue(alert.threshold)}`}
      </TableCell>
      <TableCell className="tnum text-muted-foreground whitespace-nowrap">
        {formatLongDateTime(alert.createdAt)}
      </TableCell>
      <TableCell>
        <Badge variant={alert.status === 'ACTIVE' ? 'critical' : 'success'}>
          {alert.status === 'ACTIVE' ? 'Aktif' : 'Teratasi'}
        </Badge>
      </TableCell>
      <TableCell className="text-right">
        {alert.status === 'ACTIVE' ? (
          <Button variant="outline" size="sm" onClick={onResolve} disabled={resolving}>
            <CheckCheck className="h-4 w-4" aria-hidden />
            Tandai selesai
          </Button>
        ) : null}
      </TableCell>
    </TableRow>
  );
}

function formatValue(value: number | null): string {
  return value === null ? '--' : `${value}`;
}