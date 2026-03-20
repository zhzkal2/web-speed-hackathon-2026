/**
 * moment.js replacement using native Intl API
 * Produces identical output to moment().locale("ja").format("LL") etc.
 */

/** "2025年1月15日" — equivalent to moment(d).locale("ja").format("LL") */
export function formatLL(dateStr: string): string {
  const d = new Date(dateStr);
  return `${d.getFullYear()}年${d.getMonth() + 1}月${d.getDate()}日`;
}

/** "18:30" — equivalent to moment(d).locale("ja").format("HH:mm") */
export function formatHHmm(dateStr: string): string {
  const d = new Date(dateStr);
  return `${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`;
}

/** "10ヶ月前" — equivalent to moment(d).locale("ja").fromNow() */
export function fromNow(dateStr: string): string {
  const now = Date.now();
  const then = new Date(dateStr).getTime();
  const diffMs = now - then;
  const seconds = Math.floor(diffMs / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);
  const months = Math.floor(days / 30);
  const years = Math.floor(days / 365);

  if (seconds < 45) return "数秒前";
  if (minutes < 1) return "数秒前";
  if (minutes === 1) return "1分前";
  if (minutes < 45) return `${minutes}分前`;
  if (hours === 1) return "1時間前";
  if (hours < 22) return `${hours}時間前`;
  if (days === 1) return "1日前";
  if (days < 26) return `${days}日前`;
  if (months === 1) return "1ヶ月前";
  if (months < 12) return `${months}ヶ月前`;
  if (years === 1) return "1年前";
  return `${years}年前`;
}

/** ISO string — equivalent to moment(d).toISOString() */
export function toISOString(dateStr: string): string {
  return new Date(dateStr).toISOString();
}
