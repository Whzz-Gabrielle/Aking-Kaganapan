import { Link } from 'react-router-dom';

export function Brand() {
  return (
    <Link className="brand" to="/" aria-label="Aking Kaganapan home">
      <span className="brand-mark">AK</span>
      <span><strong>Aking Kaganapan</strong><small>Moments made memorable</small></span>
    </Link>
  );
}

export function Notice({ notice, clear }) {
  if (!notice) return null;
  return (
    <div className={`notice ${notice.type}`} role="status">
      <span>{notice.text}</span>
      <button onClick={clear} aria-label="Dismiss notification">×</button>
    </div>
  );
}

export function Field({ label, children, hint }) {
  return <label className="field"><span>{label}</span>{children}{hint && <small>{hint}</small>}</label>;
}

export function StatusPill({ value }) {
  const key = (value || 'Pending').toLowerCase().replaceAll(' ', '-');
  return <span className={`status status-${key}`}>{value || 'Pending'}</span>;
}

export function PageHeader({ eyebrow, title, children }) {
  return (
    <header className="static-hero">
      <span className="eyebrow">{eyebrow}</span>
      <h1>{title}</h1>
      {children && <p>{children}</p>}
    </header>
  );
}

export function Spinner({ label = 'Loading…' }) {
  return <div className="state-box" role="status" aria-live="polite"><span className="spinner" aria-hidden="true" /><span>{label}</span></div>;
}

export function ErrorState({ message, onRetry }) {
  return (
    <div className="state-box state-error" role="alert">
      <strong>Something went wrong</strong>
      <span>{message}</span>
      {onRetry && <button className="btn btn-outline btn-sm" onClick={onRetry}>Try again</button>}
    </div>
  );
}

export function EmptyState({ title, children }) {
  return <div className="state-box"><strong>{title}</strong>{children && <span>{children}</span>}</div>;
}
