import { useEffect } from 'react';
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
    <div className={`notice ${notice.type}`} role={notice.type === 'error' ? 'alert' : 'status'}>
      <span>{notice.text}</span>
      <button onClick={clear} aria-label="Dismiss notification">×</button>
    </div>
  );
}

export function Field({ label, children, hint, error }) {
  return (
    <label className={`field${error ? ' field-invalid' : ''}`}>
      <span>{label}</span>{children}
      {error ? <small className="field-error" role="alert">{error}</small> : hint && <small>{hint}</small>}
    </label>
  );
}

// Inline error shown right inside a form or dialog, where the person is looking.
export function FormAlert({ message }) {
  if (!message) return null;
  return <div className="form-alert" role="alert">{message}</div>;
}

// Reusable dialog. Closes on Escape or by clicking the backdrop.
export function Modal({ eyebrow, title, onClose, children }) {
  useEffect(() => {
    const onKey = (e) => { if (e.key === 'Escape') onClose(); };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [onClose]);
  return (
    <div className="modal-backdrop" role="presentation" onMouseDown={(e) => { if (e.target === e.currentTarget) onClose(); }}>
      <section className="modal" role="dialog" aria-modal="true" aria-label={title}>
        <div className="modal-heading">
          <div>{eyebrow && <span className="eyebrow">{eyebrow}</span>}<h2>{title}</h2></div>
          <button className="close-button" onClick={onClose} aria-label="Close">×</button>
        </div>
        {children}
      </section>
    </div>
  );
}

// Replaces window.confirm so destructive actions get a proper, accessible prompt.
export function ConfirmDialog({ title, message, confirmLabel = 'Confirm', danger, busy, error, onConfirm, onCancel }) {
  return (
    <Modal title={title} onClose={busy ? () => {} : onCancel}>
      <p className="confirm-text">{message}</p>
      <FormAlert message={error} />
      <div className="modal-actions">
        <button className="btn btn-outline" onClick={onCancel} disabled={busy}>Keep it</button>
        <button className={`btn ${danger ? 'btn-danger' : 'btn-primary'}`} onClick={onConfirm} disabled={busy}>{busy ? 'Please wait…' : confirmLabel}</button>
      </div>
    </Modal>
  );
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
