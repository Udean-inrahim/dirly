import type { ReactNode } from 'react';

export function PageHeader({
  icon,
  title,
  description,
  action,
}: {
  icon: ReactNode;
  title: string;
  description?: string;
  action?: ReactNode;
}) {
  return (
    <div className="relative overflow-hidden rounded-[18px] bg-gradient-to-r from-[#2b7d55] via-[#256746] to-[#1d5734] p-5 text-white shadow-md">
      <div
        className="pointer-events-none absolute -right-10 -top-14 h-44 w-44 rounded-full bg-white/10 blur-2xl"
        aria-hidden
      />
      <div
        className="pointer-events-none absolute -bottom-16 right-24 h-40 w-40 rounded-full bg-[#9bd7a6]/20 blur-2xl"
        aria-hidden
      />
      <div className="relative flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3.5">
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl border border-white/30 bg-white/15 backdrop-blur-sm">
            {icon}
          </div>
          <div>
            <h1 className="text-lg font-semibold leading-tight tracking-tight">{title}</h1>
            {description ? <p className="mt-0.5 text-sm text-white/80">{description}</p> : null}
          </div>
        </div>
        {action ? <div className="shrink-0">{action}</div> : null}
      </div>
    </div>
  );
}