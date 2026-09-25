import { Badge } from '@/components/ui/badge';
import { soilLabel } from '@dirly/shared';
import type { SoilLevel } from '@dirly/shared';

const MAP: Record<SoilLevel, { variant: 'success' | 'warning' | 'critical'; dot: string }> = {
  NORMAL: { variant: 'success', dot: 'bg-[#4d7f12]' },
  WET: { variant: 'warning', dot: 'bg-[#9c7a1a]' },
  DRY: { variant: 'critical', dot: 'bg-[#c0392b]' },
};

export function SoilBadge({ level }: { level: SoilLevel }) {
  const { variant, dot } = MAP[level];
  return (
    <Badge variant={variant}>
      <span className={`h-2 w-2 rounded-full ${dot}`} aria-hidden />
      {soilLabel(level)}
    </Badge>
  );
}