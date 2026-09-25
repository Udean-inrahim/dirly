import { useEffect, useState, type FormEvent } from 'react';
import { Dialog } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input, Label } from '@/components/ui/input';
import type { Sensor } from '@dirly/shared';

export function SensorFormDialog({
  open,
  sensor,
  onClose,
  onSubmit,
  busy,
  error,
}: {
  open: boolean;
  sensor: Sensor | null;
  onClose: () => void;
  onSubmit: (input: { sensorCode: string; name: string; location: string; plant: string | null }) => Promise<void>;
  busy: boolean;
  error: string | null;
}) {
  const [sensorCode, setSensorCode] = useState('');
  const [name, setName] = useState('');
  const [location, setLocation] = useState('');
  const [plant, setPlant] = useState('');

  useEffect(() => {
    if (!open) return;
    setSensorCode(sensor?.sensorCode ?? '');
    setName(sensor?.name ?? '');
    setLocation(sensor?.location ?? '');
    setPlant(sensor?.plant ?? '');
  }, [open, sensor]);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    await onSubmit({ sensorCode, name, location, plant: plant || null });
  }

  return (
    <Dialog
      open={open}
      onClose={onClose}
      title={sensor ? 'Ubah sensor' : 'Tambah sensor'}
      description={sensor ? `Kode ${sensor.sensorCode}` : 'Daftarkan sensor tanah baru'}
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {error ? (
          <div className="rounded-xl border border-[#efd6d3] bg-[#fbe9e7] px-3 py-2 text-sm text-[#c0392b]" role="alert">
            {error}
          </div>
        ) : null}
        <div>
          <Label htmlFor="f-code">Kode sensor</Label>
          <Input
            id="f-code"
            value={sensorCode}
            onChange={(e) => setSensorCode(e.target.value.toUpperCase())}
            required
            minLength={3}
            maxLength={30}
            placeholder="SM-004"
          />
        </div>
        <div>
          <Label htmlFor="f-name">Nama</Label>
          <Input
            id="f-name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
            maxLength={60}
            placeholder="Pot Alpukat"
          />
        </div>
        <div>
          <Label htmlFor="f-loc">Lokasi</Label>
          <Input
            id="f-loc"
            value={location}
            onChange={(e) => setLocation(e.target.value)}
            required
            maxLength={80}
            placeholder="Halaman belakang"
          />
        </div>
        <div>
          <Label htmlFor="f-plant">Tanaman (opsional)</Label>
          <Input
            id="f-plant"
            value={plant}
            onChange={(e) => setPlant(e.target.value)}
            maxLength={80}
            placeholder="Cabai"
          />
        </div>
        <div className="flex justify-end gap-2 pt-2">
          <Button type="button" variant="outline" onClick={onClose}>
            Batal
          </Button>
          <Button type="submit" disabled={busy}>
            {busy ? 'Menyimpan...' : sensor ? 'Simpan perubahan' : 'Tambahkan'}
          </Button>
        </div>
      </form>
    </Dialog>
  );
}