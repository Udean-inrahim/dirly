import { useEffect, useRef, type ReactNode } from 'react';
import { X } from 'lucide-react';

export interface DialogProps {
  open: boolean;
  title: string;
  description?: string;
  onClose: () => void;
  children: ReactNode;
  footer?: ReactNode;
}

export function Dialog({ open, title, description, onClose, children, footer }: DialogProps) {
  const ref = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (open && !el.open) el.showModal();
    if (!open && el.open) el.close();
  }, [open]);

  return (
    <dialog
      ref={ref}
      onClose={onClose}
      className="m-auto w-[calc(100vw-2rem)] max-w-md rounded-3xl bg-card p-0 text-card-foreground shadow-card-lg backdrop:bg-[#30352f]/50 sm:w-full"
    >
      <div className="flex items-start justify-between gap-4 p-6 pb-2">
        <div>
          <h2 className="text-base font-semibold tracking-tight">{title}</h2>
          {description ? <p className="mt-1 text-sm text-muted-foreground">{description}</p> : null}
        </div>
        <button
          type="button"
          onClick={onClose}
          aria-label="Tutup dialog"
          className="rounded-full p-2 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
        >
          <X className="h-4 w-4" />
        </button>
      </div>
      <div className="px-6 pb-5">{children}</div>
      {footer ? (
        <footer className="flex flex-wrap justify-end gap-2 rounded-b-3xl border-t border-border bg-muted/60 px-6 py-3">
          {footer}
        </footer>
      ) : null}
    </dialog>
  );
}