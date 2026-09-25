export function formatTime(value: string | null | undefined): string {
  if (!value) return '--:--:--';
  return new Intl.DateTimeFormat('id-ID', {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false,
  }).format(new Date(value));
}

export function formatDateTime(value: string | null | undefined): string {
  if (!value) return '--';
  return new Intl.DateTimeFormat('id-ID', {
    day: '2-digit',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  }).format(new Date(value));
}

export function formatLongDateTime(value: string | null | undefined): string {
  if (!value) return '--';
  return new Intl.DateTimeFormat('id-ID', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false,
  }).format(new Date(value));
}

export function relativeAgo(value: string | null | undefined): string {
  if (!value) return 'belum pernah';
  const diff = Date.now() - new Date(value).getTime();
  const sec = Math.round(diff / 1000);
  if (sec < 60) return `${sec}d yang lalu`;
  const min = Math.round(sec / 60);
  if (min < 60) return `${min}m yang lalu`;
  const hr = Math.round(min / 60);
  if (hr < 24) return `${hr}j yang lalu`;
  return `${Math.round(hr / 24)}h yang lalu`;
}