import { useEffect, useState, type FormEvent } from 'react';
import { CheckCircle2, Settings as SettingsIcon, ShieldAlert } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input, Label } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useAuth } from '@/hooks/use-auth';
import { useLive } from '@/hooks/use-live';
import { useSettingsMutation } from '@/hooks/use-mutations';
import { PageHeader } from '@/components/layout/PageHeader';

export function SettingsPage() {
  const { isAdmin } = useAuth();
  const { summary } = useLive();
  const mutation = useSettingsMutation();
  const defaults = summary?.settings;

  const [minSoil, setMinSoil] = useState('30');
  const [maxSoil, setMaxSoil] = useState('70');
  const [minTemp, setMinTemp] = useState('15');
  const [maxTemp, setMaxTemp] = useState('35');
  const [interval, setIntervalSec] = useState('5');
  const [offline, setOffline] = useState('60');
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    if (!defaults) return;
    setMinSoil(String(defaults.minSoilMoisture));
    setMaxSoil(String(defaults.maxSoilMoisture));
    setMinTemp(String(defaults.minTemperature));
    setMaxTemp(String(defaults.maxTemperature));
    setIntervalSec(String(defaults.refreshIntervalSec));
    setOffline(String(defaults.offlineTimeoutSec));
    setSaved(false);
  }, [defaults]);

  if (!isAdmin) {
    return (
      <div className="space-y-4">
        <PageHeader
          icon={<SettingsIcon className="h-6 w-6 text-[#d9f4e6]" aria-hidden />}
          title="Pengaturan"
          description="Ambang batas pemantauan"
        />
        <Card>
          <CardContent className="flex flex-col items-center gap-3 py-16 text-center">
            <div className="flex h-14 w-14 items-center justify-center rounded-full bg-[#ddf3e6] text-[#287a53]">
              <ShieldAlert className="h-7 w-7" aria-hidden />
            </div>
            <h2 className="text-base font-semibold">Halaman khusus admin</h2>
            <p className="max-w-sm text-sm text-muted-foreground">
              Pengaturan ambang batas hanya dapat diubah oleh pengguna dengan peran admin.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  function clientError(): string | null {
    const s = Number(minSoil);
    const S = Number(maxSoil);
    const t = Number(minTemp);
    const T = Number(maxTemp);
    if (Number.isNaN(s) || Number.isNaN(S) || Number.isNaN(t) || Number.isNaN(T)) {
      return 'Nilai ambang harus berupa angka';
    }
    if (s >= S) return 'Batas bawah kelembapan harus lebih kecil dari batas atas';
    if (t >= T) return 'Batas bawah suhu harus lebih kecil dari batas atas';
    return null;
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    const err = clientError();
    if (err) return;
    await mutation.mutateAsync({
      minSoilMoisture: Number(minSoil),
      maxSoilMoisture: Number(maxSoil),
      minTemperature: Number(minTemp),
      maxTemperature: Number(maxTemp),
      refreshIntervalSec: Math.round(Number(interval)) || 5,
      offlineTimeoutSec: Math.round(Number(offline)) || 60,
    });
    setSaved(true);
  }

  const errorMessage = clientError() ?? (mutation.isError && mutation.error ? mutation.error.message : null);

  return (
    <div className="space-y-4">
      <PageHeader
        icon={<SettingsIcon className="h-6 w-6 text-[#d9f4e6]" aria-hidden />}
        title="Pengaturan"
        description="Ambang batas tanah, suhu, dan pemantauan"
      />
      <div className="grid gap-4 lg:grid-cols-2">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <SettingsIcon className="h-4 w-4 text-primary" aria-hidden />
            Ambang batas tanah
          </CardTitle>
          <CardDescription>
            Kelembapan di bawah batas bawah dianggap kering, di atas batas atas dianggap terlalu basah.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="st-min-soil">Kelembapan minimum (%)</Label>
                <Input id="st-min-soil" type="number" min={0} max={99} required value={minSoil} onChange={(e) => setMinSoil(e.target.value)} />
              </div>
              <div>
                <Label htmlFor="st-max-soil">Kelembapan maksimum (%)</Label>
                <Input id="st-max-soil" type="number" min={1} max={100} required value={maxSoil} onChange={(e) => setMaxSoil(e.target.value)} />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="st-min-temp">Suhu minimum (°C)</Label>
                <Input id="st-min-temp" type="number" step="0.5" required value={minTemp} onChange={(e) => setMinTemp(e.target.value)} />
              </div>
              <div>
                <Label htmlFor="st-max-temp">Suhu maksimum (°C)</Label>
                <Input id="st-max-temp" type="number" step="0.5" required value={maxTemp} onChange={(e) => setMaxTemp(e.target.value)} />
              </div>
            </div>

            <div className="flex items-center justify-between pt-1">
              {errorMessage ? (
                <p className="text-sm text-red-700" role="alert">
                  {errorMessage}
                </p>
              ) : saved ? (
                <p className="flex items-center gap-1.5 rounded-full border border-[#c4e8d5] bg-[#ddf3e6] px-3 py-1 text-sm font-medium text-[#287a53]">
                  <CheckCircle2 className="h-4 w-4" aria-hidden />
                  Pengaturan tersimpan
                </p>
              ) : null}
            </div>

            <div className="flex justify-end">
              <Button type="submit" disabled={mutation.isPending}>
                {mutation.isPending ? 'Menyimpan...' : 'Simpan ambang batas'}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>

      <div className="grid gap-4 content-start">
        <Card>
          <CardHeader>
            <CardTitle>Pemantauan</CardTitle>
            <CardDescription>Waktu pembaruan tampilan dan deteksi sensor offline.</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <Label htmlFor="st-interval">Interval tampilan (detik)</Label>
                <Input id="st-interval" type="number" min={1} max={300} required value={interval} onChange={(e) => setIntervalSec(e.target.value)} />
              </div>
              <div>
                <Label htmlFor="st-offline">Batas offline (detik)</Label>
                <Input id="st-offline" type="number" min={10} max={3600} required value={offline} onChange={(e) => setOffline(e.target.value)} />
              </div>
            </div>
            <p className="mt-4 text-xs text-muted-foreground">
              Sensor dianggap offline jika tidak mengirim data melebihi batas tersebut. Nilai disimpan
              bersama tombol "Simpan ambang batas".
            </p>
          </CardContent>
        </Card>
        </div>
      </div>
    </div>
  );
}