import { useState } from 'react';
import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { Bell, LogOut, Menu, X } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAuth } from '@/hooks/use-auth';
import { useLive } from '@/hooks/use-live';
import { formatTime } from '@/lib/format';

const NAV_ITEMS: { to: string; label: string; adminOnly?: boolean }[] = [
  { to: '/', label: 'Dashboard' },
  { to: '/sensors', label: 'Sensor' },
  { to: '/history', label: 'Riwayat' },
  { to: '/alerts', label: 'Peringatan' },
  { to: '/settings', label: 'Pengaturan', adminOnly: true },
];

export function AppShell() {
  const { user, logout, isAdmin } = useAuth();
  const { activeAlerts, socketOpen, updatedAt } = useNavData();
  const [menuOpen, setMenuOpen] = useState(false);
  const navigate = useNavigate();

  const navItems = NAV_ITEMS.filter((item) => !item.adminOnly || isAdmin);

  const navLinks = (
    <nav className="flex items-center gap-7" aria-label="Navigasi utama">
      {navItems.map((item) => (
        <NavLink
          key={item.to}
          to={item.to}
          onClick={() => setMenuOpen(false)}
          className={({ isActive }) =>
            cn(
              'text-sm font-medium transition-colors',
              isActive ? 'text-[#288e5e]' : 'text-[#565c56] hover:text-[#288e5e]',
            )
          }
        >
          {item.label}
        </NavLink>
      ))}
    </nav>
  );

  const userBlock = (
    <div className="flex items-center gap-2.5">
      <button
        type="button"
        onClick={() => navigate('/alerts')}
        aria-label={activeAlerts > 0 ? `${activeAlerts} peringatan aktif` : 'Peringatan'}
        title="Peringatan"
        className="relative flex h-10 w-10 items-center justify-center rounded-full border border-[#dfe4df] bg-white text-[#2fa06b] transition-colors hover:bg-[#f3f8ee]"
      >
        <Bell className="h-4 w-4" aria-hidden />
        {activeAlerts > 0 ? (
          <span className="absolute -right-1 -top-1 flex h-5 min-w-5 items-center justify-center rounded-full bg-[#e6534a] px-1 text-[11px] font-bold leading-none text-white">
            {activeAlerts}
          </span>
        ) : null}
      </button>
      <div
        className="flex h-10 w-10 items-center justify-center rounded-full bg-[#2fa06b] text-sm font-bold text-white"
        aria-hidden
      >
        {user?.name.slice(0, 1).toUpperCase()}
      </div>
      <button
        type="button"
        onClick={() => {
          logout();
          navigate('/login');
        }}
        aria-label="Keluar"
        title="Keluar"
        className="flex h-10 w-10 items-center justify-center rounded-full border border-[#dfe4df] bg-white text-[#565c56] transition-colors hover:bg-[#f3f8ee]"
      >
        <LogOut className="h-4 w-4" />
      </button>
    </div>
  );

  return (
    <div className="min-h-screen bg-background p-2 sm:p-4">
      <div className="mx-auto flex min-h-[calc(100vh-1rem)] max-w-[1450px] flex-col rounded-[22px] border-[3px] border-[#506b36] bg-[#f7faf7] shadow-[0_15px_40px_rgba(54,75,45,0.12)]">
        <header className="flex h-16 items-center gap-3 px-4 sm:px-6">
          <div className="text-2xl font-bold tracking-wide text-[#2fa06b]">SPM</div>

          <div className="ml-6 hidden md:block">{navLinks}</div>

          <div className="ml-auto hidden items-center gap-3 md:flex">
            <LivePill socketOpen={socketOpen} updatedAt={updatedAt} />
            {userBlock}
          </div>

          <div className="ml-auto flex items-center gap-3 md:hidden">
            <LivePill socketOpen={socketOpen} updatedAt={updatedAt} compact />
            <button
              type="button"
              className="flex h-10 w-10 items-center justify-center rounded-full border border-[#dfe4df] bg-white text-[#565c56]"
              onClick={() => setMenuOpen((v) => !v)}
              aria-label="Buka menu"
              aria-expanded={menuOpen}
            >
              {menuOpen ? <X className="h-5 w-5" aria-hidden /> : <Menu className="h-5 w-5" aria-hidden />}
            </button>
          </div>
        </header>

        {menuOpen ? (
          <div className="border-t border-border px-4 py-3 md:hidden">
            <div className="flex flex-col gap-3">{navLinks}</div>
            <div className="mt-4">{userBlock}</div>
          </div>
        ) : null}

        <main className="flex-1 p-3 sm:p-5">
          <Outlet />
        </main>
      </div>
    </div>
  );
}

function LivePill({
  socketOpen,
  updatedAt,
  compact,
}: {
  socketOpen: boolean;
  updatedAt: string | null;
  compact?: boolean;
}) {
  return (
    <div className="flex items-center gap-2 rounded-full border border-[#e3eadb] bg-white px-3 py-1.5">
      <span className="relative flex h-2 w-2">
        <span
          className={cn(
            'absolute inline-flex h-full w-full animate-ping rounded-full opacity-60',
            socketOpen ? 'bg-[#34a85f]' : 'bg-[#d9a441]',
          )}
          aria-hidden
        />
        <span
          className={cn(
            'relative inline-flex h-2 w-2 rounded-full',
            socketOpen ? 'bg-[#34a85f]' : 'bg-[#c98c25]',
          )}
          aria-hidden
        />
      </span>
      {compact ? null : (
        <>
          <span className="text-xs font-medium text-[#565c56]">
            {socketOpen ? 'Live terhubung' : 'Mode polling'}
          </span>
          <span className="tnum text-xs text-muted-foreground">Update {formatTime(updatedAt)}</span>
        </>
      )}
    </div>
  );
}

function useNavData() {
  const { summary, socketOpen } = useLive();
  return {
    activeAlerts: summary?.activeAlerts ?? 0,
    socketOpen,
    updatedAt: summary?.updatedAt ?? null,
  };
}