import { useLive } from '@/hooks/use-live';
import { SoilCard } from '@/components/dashboard/SoilCard';
import { TempCard } from '@/components/dashboard/TempCard';
import { SystemCard } from '@/components/dashboard/SystemCard';
import { MonitoringCharts } from '@/components/dashboard/MonitoringCharts';
import { RecentReadings } from '@/components/dashboard/RecentReadings';
import { DashboardHero, HERO_IMG } from '@/components/dashboard/DashboardHero';
import { EmptyState } from '@/components/ui/states';

export function DashboardPage() {
  const { summary, isLoading } = useLive();

  if (isLoading && !summary) {
    return <div className="flex justify-center py-16"><LoadingBlock /></div>;
  }

  if (summary && summary.sensors.length === 0) {
    return (
      <div className="grid gap-4">
        <EmptyState
          title="Belum ada sensor"
          description="Tambahkan sensor untuk mulai menerima pengukuran kelembapan tanah."
        />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="relative overflow-hidden rounded-[18px]">
        <div
          className="absolute inset-0 h-[440px] bg-cover bg-center"
          style={{ backgroundImage: `url(${HERO_IMG})` }}
          aria-hidden
        />
        <div className="absolute inset-0 h-[440px] bg-gradient-to-b from-black/55 via-black/30 to-[#eef2e9]/85" aria-hidden />
        <div className="relative z-10 p-2 sm:p-4">
          <DashboardHero summary={summary} />
          <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
            <SoilCard summary={summary} />
            <TempCard summary={summary} />
            <SystemCard summary={summary} />
          </div>
        </div>
      </div>
      <MonitoringCharts />
      <RecentReadings />
    </div>
  );
}

function LoadingBlock() {
  return (
    <span className="h-6 w-6 animate-spin rounded-full border-2 border-[#dfe4df] border-t-[#2fa06b]" aria-hidden />
  );
}
