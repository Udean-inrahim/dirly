import type { ReactNode } from 'react';
import { cn } from '@/lib/utils';

export function EmptyState({
  icon,
  title,
  description,
  action,
  className,
}: {
  icon?: ReactNode;
  title: string;
  description?: string;
  action?: ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        'flex flex-col items-center justify-center gap-2 rounded-2xl border-2 border-dashed border-[#d8dfd3] bg-card px-6 py-12 text-center',
        className,
      )}
    >
      {icon ? <div className="text-muted-foreground">{icon}</div> : null}
      <h3 className="text-sm font-semibold">{title}</h3>
      {description ? <p className="max-w-sm text-sm text-muted-foreground">{description}</p> : null}
      {action ? <div className="mt-2">{action}</div> : null}
    </div>
  );
}

export function LoadingRow({ label = 'Memuat data' }: { label?: string }) {
  return (
    <div className="flex items-center gap-3 rounded-2xl border border-border bg-card px-4 py-6 text-sm text-muted-foreground">
      <span
        className="h-4 w-4 animate-spin rounded-full border-2 border-[#dfe4df] border-t-[#2fa06b]"
        aria-hidden
      />
      {label}
    </div>
  );
}

export function ErrorState({ message, onRetry }: { message: string; onRetry?: () => void }) {
  return (
    <div className="flex flex-col items-center gap-2 rounded-2xl border border-[#efd6d3] bg-[#fbe9e7] px-6 py-8 text-center">
      <h3 className="text-sm font-semibold text-[#c0392b]">Gagal memuat data</h3>
      <p className="max-w-sm text-sm text-[#c0392b]">{message}</p>
      {onRetry ? (
        <button
          type="button"
          onClick={onRetry}
          className="mt-1 text-sm font-semibold text-[#c0392b] underline underline-offset-2 hover:text-[#a93226]"
        >
          Coba lagi
        </button>
      ) : null}
    </div>
  );
}