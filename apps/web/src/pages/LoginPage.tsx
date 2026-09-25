import { useState, type FormEvent } from 'react';
import { Navigate, useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/use-auth';
import { ApiRequestError } from '@/lib/api';
import { cn } from '@/lib/utils';

function MailIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-[18px] w-[18px]">
      <rect x="3" y="5" width="18" height="14" rx="2" />
      <path d="M3 7l9 6 9-6" />
    </svg>
  );
}

function LockIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-[19px] w-[19px]">
      <rect x="4" y="10" width="16" height="10" rx="2" />
      <path d="M8 10V7a4 4 0 0 1 8 0v3" />
    </svg>
  );
}

function UserIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-[19px] w-[19px]">
      <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
      <circle cx="12" cy="7" r="4" />
    </svg>
  );
}

function EyeIcon({ open }: { open: boolean }) {
  return open ? (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-[19px] w-[19px]">
      <path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7-10-7-10-7Z" />
      <circle cx="12" cy="12" r="3" />
      <line x1="3" y1="21" x2="21" y2="3" />
    </svg>
  ) : (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-[19px] w-[19px]">
      <path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7-10-7-10-7Z" />
      <circle cx="12" cy="12" r="3" />
    </svg>
  );
}

export function LoginPage() {
  const { user, login, register } = useAuth();
  const navigate = useNavigate();
  const [mode, setMode] = useState<'login' | 'register'>('login');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPw, setShowPw] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [showHint, setShowHint] = useState(false);

  if (user) return <Navigate to="/" replace />;

  async function onSubmit(event: FormEvent) {
    event.preventDefault();
    setError(null);
    setBusy(true);
    try {
      if (mode === 'register') {
        await register(name.trim(), email.trim(), password);
      } else {
        await login(email.trim(), password);
      }
      navigate('/', { replace: true });
    } catch (err) {
      setError(
        err instanceof ApiRequestError ? err.message : 'Terjadi kesalahan. Coba lagi nanti.',
      );
    } finally {
      setBusy(false);
    }
  }

  function switchMode(next: 'login' | 'register') {
    setMode(next);
    setError(null);
    setShowHint(false);
  }

  return (
    <div
      className={cn(
        'relative flex min-h-screen items-center justify-center overflow-hidden px-5 py-8',
      )}
    >
      <div
        className="absolute inset-0 bg-cover bg-center"
        style={{
          backgroundImage: 'url(/login-bg.jpg)',
        }}
        aria-hidden
      />
      <div className="absolute inset-0 bg-gradient-to-b from-black/55 via-black/30 to-[#0e2b1a]/80" aria-hidden />
      <main className="relative z-10 w-full max-w-[420px] rounded-[28px] border border-white/40 bg-white/80 px-8 py-10 text-center shadow-[0_30px_60px_-20px_rgba(10,40,25,0.45)] backdrop-blur-md sm:px-8">
        <h1 className="mb-2.5 text-[26px] font-bold tracking-[-0.01em] text-[#1a2430]">
          {mode === 'register' ? 'Daftar akun' : 'Masuk dengan email'}
        </h1>

        {error ? (
          <div
            role="alert"
            className="mb-4 rounded-2xl border border-[#efd6d3] bg-[#fbe9e7] px-3 py-2 text-left text-sm text-[#c0392b]"
          >
            {error}
          </div>
        ) : null}

        <form onSubmit={onSubmit} noValidate>
          {mode === 'register' ? (
            <div className="relative mb-3.5">
              <span className="pointer-events-none absolute left-3 top-1/2 z-10 -translate-y-1/2 text-[#9aa4ad]">
                <UserIcon />
              </span>
              <input
                type="text"
                placeholder="Nama lengkap"
                autoComplete="name"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="h-[52px] w-full rounded-[14px] border-none bg-[#eef2f4] pl-9 pr-4 text-left text-[15px] text-[#1a2430] outline-none placeholder:text-[#9aa4ad] focus:shadow-[0_0_0_2px_rgba(20,26,32,0.25)]"
              />
            </div>
          ) : null}

          <div className="relative mb-3.5">
            <span className="pointer-events-none absolute left-3 top-1/2 z-10 -translate-y-1/2 text-[#9aa4ad]">
              <MailIcon />
            </span>
            <input
              type="email"
              placeholder="Email"
              autoComplete="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="h-[52px] w-full rounded-[14px] border-none bg-[#eef2f4] pl-9 pr-4 text-left text-[15px] text-[#1a2430] outline-none placeholder:text-[#9aa4ad] focus:shadow-[0_0_0_2px_rgba(20,26,32,0.25)]"
            />
          </div>

          <div className="relative mb-3.5">
            <span className="pointer-events-none absolute left-3 top-1/2 z-10 -translate-y-1/2 text-[#9aa4ad]">
              <LockIcon />
            </span>
            <input
              type={showPw ? 'text' : 'password'}
              placeholder="Password"
              autoComplete="current-password"
              required
              minLength={6}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="h-[52px] w-full rounded-[14px] border-none bg-[#eef2f4] pl-9 pr-11 text-left text-[15px] text-[#1a2430] outline-none placeholder:text-[#9aa4ad] focus:shadow-[0_0_0_2px_rgba(20,26,32,0.25)]"
            />
            <button
              type="button"
              aria-label={showPw ? 'Sembunyikan password' : 'Tampilkan password'}
              onClick={() => setShowPw((v) => !v)}
              className="absolute right-2 top-1/2 flex -translate-y-1/2 cursor-pointer items-center border-none bg-transparent p-1.5 text-[#9aa4ad] hover:text-[#2fa06b]"
            >
              <EyeIcon open={showPw} />
            </button>
          </div>

          {mode === 'login' ? (
            <div className="mt-1.5 text-right">
              <button
                type="button"
                onClick={() => setShowHint((v) => !v)}
                className="cursor-pointer border-none bg-transparent p-0 text-[13.5px] font-medium text-black hover:text-neutral-700 hover:underline"
              >
                Lupa password?
              </button>
              {showHint ? (
                <p className="mx-auto mt-2 max-w-[260px] rounded-xl bg-[#ddf3e6] px-3 py-2 text-xs text-[#287a53]">
                  Hubungi administrator untuk reset password. Akun bawaan: admin@dirly.dev / admin123
                </p>
              ) : null}
            </div>
          ) : null}

          <button
            type="submit"
            disabled={busy}
            className="mt-6 h-[54px] w-full cursor-pointer rounded-[14px] border-none bg-black text-[16px] font-semibold text-white transition-colors hover:bg-neutral-800 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {busy ? 'Memproses...' : mode === 'register' ? 'Daftar' : 'Masuk'}
          </button>

          <div className="my-6 flex items-center gap-3 text-[13px] text-[#9aa4ad]">
            <span className="flex-1 bg-[radial-gradient(circle,#b9c3ca_1px,transparent_1.5px)] bg-[size:6px_1px] bg-repeat-x" />
            atau
            <span className="flex-1 bg-[radial-gradient(circle,#b9c3ca_1px,transparent_1.5px)] bg-[size:6px_1px] bg-repeat-x" />
          </div>

          <p className="text-[13.5px] text-[#8a97a3]">
            {mode === 'login' ? (
              <>
                Pengguna baru?{' '}
                <button
                  type="button"
                  onClick={() => switchMode('register')}
                  className="cursor-pointer border-none bg-transparent p-0 font-semibold text-black hover:text-neutral-700 hover:underline"
                >
                  Daftar akun
                </button>
              </>
            ) : (
              <>
                Sudah punya akun?{' '}
                <button
                  type="button"
                  onClick={() => switchMode('login')}
                  className="cursor-pointer border-none bg-transparent p-0 font-semibold text-black hover:text-neutral-700 hover:underline"
                >
                  Masuk
                </button>
              </>
            )}
          </p>
        </form>
      </main>
    </div>
  );
}