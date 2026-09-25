import { Badge } from '@/components/ui/badge';
import type { SensorHealth } from '@dirly/shared';

export function HealthBadge({ health }: { health: SensorHealth }) {
  if (health === 'ONLINE') {
    return (
      <Badge variant="success">
        <span className="relative flex h-2 w-2">
          <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-[#287a53] opacity-60" />
          <span className="relative inline-flex h-2 w-2 rounded-full bg-[#287a53]" />
        </span>
        Online
      </Badge>
    );
  }
  if (health === 'DISABLED') {
    return (
      <Badge variant="neutral">
        <span className="h-2 w-2 rounded-full bg-[#6b726b]" />
        Nonaktif
      </Badge>
    );
  }
  return (
    <Badge variant="critical">
      <span className="h-2 w-2 rounded-full bg-[#c0392b]" />
      Offline
    </Badge>
  );
}