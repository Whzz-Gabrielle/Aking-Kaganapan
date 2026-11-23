const peso = new Intl.NumberFormat('en-PH', { style: 'currency', currency: 'PHP', maximumFractionDigits: 0 });
const pesoExact = new Intl.NumberFormat('en-PH', { style: 'currency', currency: 'PHP', minimumFractionDigits: 2 });

export const formatPrice = (n) => (typeof n === 'number' ? peso.format(n) : '—');
export const formatMoney = (n) => pesoExact.format(Number(n) || 0);

export const formatDate = (value) =>
  value ? new Date(value).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' }) : 'Not set';

// yyyy-mm-dd in the user's local time zone (toISOString would use UTC).
export function todayLocal() {
  const d = new Date();
  const pad = (n) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

// ISO date string -> yyyy-mm-dd for <input type="date">.
export const toDateInput = (value) => (value ? String(value).slice(0, 10) : '');

export const PAYMENT_METHODS = ['GCash', 'Maya', 'Bank Transfer', 'Cash'];
