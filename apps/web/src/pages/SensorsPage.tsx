import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Pencil, Plus, Power, RadioTower, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Card, CardContent } from '@/components/ui/card';
import { EmptyState, ErrorState, LoadingRow } from '@/components/ui/states';
import { HealthBadge } from '@/components/dashboard/HealthBadge';
import { SensorFormDialog } from '@/components/sensors/SensorFormDialog';
import { useAuth } from '@/hooks/use-auth';
import { useLive } from '@/hooks/use-live';
import { useSensorMutations } from '@/hooks/use-mutations';
import { fetchSensors, queryKeys } from '@/lib/queries';
import type { Sensor } from '@dirly/shared';
import { cn } from '@/lib/utils';
import { PageHeader } from '@/components/layout/PageHeader';

export function SensorsPage() {
  const { isAdmin } = useAuth();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<Sensor | null>(null);
  const [formError, setFormError] = useState<string | null>(null);
  const [formBusy, setFormBusy] = useState(false);
  const [deleting, setDeleting] = useState<Sensor | null>(null);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  const query = useQuery({ queryKey: queryKeys.sensors, queryFn: fetchSensors });
  const sensors = query.data?.sensors ?? [];
  const mutations = useSensorMutations();
  const { summary } = useLive();
  const latestById = new Map((summary?.sensors ?? []).map((snap) => [snap.sensor.id, snap.latest]));

  function openCreate() {
    setEditing(null);
    setFormError(null);
    setDialogOpen(true);
  }

  function openEdit(sensor: Sensor) {
    setEditing(sensor);
    setFormError(null);
    setDialogOpen(true);
  }

  async function handleSubmit(input: {
    sensorCode: string;
    name: string;
    location: string;
    plant: string | null;
  }) {
    setFormError(null);
    setFormBusy(true);
    try {
      if (editing) {
        await mutations.update.mutateAsync({ id: editing.id, input });
      } else {
        await mutations.create.mutateAsync(input);
      }
      setDialogOpen(false);
    } catch (err) {
      setFormError(err instanceof Error ? err.message : 'Gagal menyimpan sensor');
    } finally {
      setFormBusy(false);
    }
  }

  async function handleToggle(sensor: Sensor) {
    try {
      await mutations.toggle.mutateAsync(sensor.id);
    } catch {
      // kesalahan toggle ditangani query refetch
    }
  }

  async function handleDelete() {
    if (!deleting) return;
    setDeleteError(null);
    try {
      await mutations.remove.mutateAsync(deleting.id);
      setDeleting(null);
    } catch (err) {
      setDeleteError(err instanceof Error ? err.message : 'Gagal menghapus sensor');
    }
  }

  return (
    <div className="space-y-4">
      <PageHeader
        icon={<RadioTower className="h-6 w-6 text-[#d9f4e6]" aria-hidden />}
        title="Sensor"
        description={`${sensors.length} sensor terdaftar`}
        action={
          isAdmin ? (
            <Button onClick={openCreate} className="bg-[#d9f4e6] text-[#1d5734] hover:bg-white">
              <Plus aria-hidden />
              Tambah sensor
            </Button>
          ) : undefined
        }
      />
      <Card>
        <CardContent className="pt-5">
          {query.isLoading ? (
            <LoadingRow label="Memuat sensor" />
          ) : query.isError ? (
            <ErrorState message="Gagal memuat sensor." onRetry={() => query.refetch()} />
          ) : sensors.length === 0 ? (
            <EmptyState
              icon={<RadioTower className="h-6 w-6" aria-hidden />}
              title="Belum ada sensor"
              description="Tambahkan sensor pertama untuk mulai memantau tanah."
              action={
                isAdmin ? (
                  <Button onClick={openCreate}>
                    <Plus aria-hidden />
                    Tambah sensor pertama
                  </Button>
                ) : undefined
              }
            />
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Sensor</TableHead>
                  <TableHead>Lokasi</TableHead>
                  <TableHead className="text-right">Kelembapan</TableHead>
                  <TableHead className="text-right">Suhu</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Aksi</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {sensors.map((sensor) => {
                  const latest = latestById.get(sensor.id) ?? null;
                  return (
                  <TableRow key={sensor.id} className={cn(!sensor.isActive && 'opacity-60')}>
                    <TableCell>
                      <p className="font-medium">{sensor.name}</p>
                      <p className="text-xs text-muted-foreground">{sensor.sensorCode}</p>
                    </TableCell>
                    <TableCell className="text-muted-foreground">{sensor.location}</TableCell>
                    <TableCell className="text-right tnum">
                      {latest ? `${latest.soilMoisture}%` : '--'}
                    </TableCell>
                    <TableCell className="text-right tnum">
                      {latest ? `${latest.temperature}°C` : '--'}
                    </TableCell>
                    <TableCell>
                      <HealthBadge health={sensor.health} />
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-1">
                        <Button
                          variant="ghost"
                          size="icon"
                          aria-label={sensor.isActive ? 'Nonaktifkan sensor' : 'Aktifkan sensor'}
                          title={sensor.isActive ? 'Nonaktifkan' : 'Aktifkan'}
                          onClick={() => handleToggle(sensor)}
                          disabled={!isAdmin}
                        >
                          <Power className={cn('h-4 w-4', sensor.isActive && 'text-[#2fa06b]')} aria-hidden />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          aria-label="Ubah sensor"
                          title="Ubah"
                          onClick={() => openEdit(sensor)}
                          disabled={!isAdmin}
                        >
                          <Pencil className="h-4 w-4" aria-hidden />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          aria-label="Hapus sensor"
                          className="hover:text-destructive"
                          onClick={() => {
                            setDeleting(sensor);
                            setDeleteError(null);
                          }}
                          disabled={!isAdmin}
                        >
                          <Trash2 className="h-4 w-4" aria-hidden />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <SensorFormDialog
        open={dialogOpen}
        sensor={editing}
        onClose={() => setDialogOpen(false)}
        onSubmit={handleSubmit}
        busy={formBusy}
        error={formError}
      />

      {deleting ? (
        <DeleteDialog
          sensor={deleting}
          error={deleteError}
          busy={mutations.remove.isPending}
          onCancel={() => setDeleting(null)}
          onConfirm={handleDelete}
        />
      ) : null}
    </div>
  );
}

function DeleteDialog({
  sensor,
  error,
  busy,
  onCancel,
  onConfirm,
}: {
  sensor: Sensor;
  error: string | null;
  busy: boolean;
  onCancel: () => void;
  onConfirm: () => void;
}) {
  return (
    <>
      <div className="fixed inset-0 z-30 bg-[#30352f]/50" onClick={onCancel} aria-hidden />
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="delete-title"
        className="fixed left-1/2 top-1/2 z-40 w-[calc(100vw-2rem)] max-w-sm -translate-x-1/2 -translate-y-1/2 rounded-2xl border border-border bg-card p-6 shadow-card-lg"
      >
        <h2 id="delete-title" className="text-base font-semibold tracking-tight">
          Hapus {sensor.name}?
        </h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Sensor {sensor.sensorCode} dan seluruh riwayat pengukurannya akan dihapus permanen.
        </p>
        {error ? (
          <div className="mt-3 rounded-xl border border-[#efd6d3] bg-[#fbe9e7] px-3 py-2 text-sm text-[#c0392b]" role="alert">
            {error}
          </div>
        ) : null}
        <div className="mt-5 flex justify-end gap-2">
          <Button variant="outline" onClick={onCancel}>
            Batal
          </Button>
          <Button variant="destructive" onClick={onConfirm} disabled={busy}>
            {busy ? 'Menghapus...' : 'Hapus'}
          </Button>
        </div>
      </div>
    </>
  );
}