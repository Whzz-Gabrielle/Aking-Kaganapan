import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { bookingsApi, paymentsApi } from '../api/services.js';
import { ConfirmDialog, ErrorState, Field, FormAlert, Modal, Spinner, StatusPill } from '../components/ui.jsx';
import { useApi } from '../hooks/useApi.js';
import { useFormError } from '../hooks/useFormError.js';
import { useAuth } from '../context/AuthContext.jsx';
import { PAYMENT_METHODS, formatDate, formatMoney, toDateInput } from '../utils/format.js';
import { balanceOf, clientCanCancel, clientCanPay, nextStatuses } from '../utils/bookingRules.js';

export default function Dashboard() {
  const { user, isCoordinator, setMessage } = useAuth();
  const { data, loading, error, reload, mutate } = useApi(bookingsApi.list);
  // Only coordinators review payments, so only they load them here.
  const payments = useApi(paymentsApi.all, { enabled: isCoordinator });
  const bookings = useMemo(() => (Array.isArray(data) ? data : []), [data]);
  const pendingPayments = Array.isArray(payments.data) ? payments.data.filter((p) => p.verificationStatus === 'Pending').length : 0;

  const [filter, setFilter] = useState('All');
  const [search, setSearch] = useState('');
  const [editing, setEditing] = useState(null);
  const [confirm, setConfirm] = useState(null); // { type: 'delete' | 'cancel', booking }
  const [busy, setBusy] = useState(false);
  const form = useFormError();

  function openEdit(b) { form.clear(); setEditing({ ...b, savedStatus: b.bookingStatus, eventDate: toDateInput(b.eventDate) }); }
  function closeEdit() { setEditing(null); form.clear(); }

  async function updateBooking(event) {
    event.preventDefault(); if (!editing) return; setBusy(true); form.clear();
    try {
      const res = await bookingsApi.update(editing._id, {
        eventName: editing.eventName, eventDate: editing.eventDate, eventLocation: editing.eventLocation,
        eventTheme: editing.eventTheme, specialRequests: editing.specialRequests,
        totalPrice: editing.totalPrice, preferredPaymentMethod: editing.preferredPaymentMethod || '',
        bookingStatus: editing.bookingStatus,
      });
      mutate((old) => (old || []).map((b) => (b._id === editing._id ? res.booking : b)));
      closeEdit(); setMessage('success', res.message || 'Booking updated.');
    } catch (err) { form.setError(err); }
    finally { setBusy(false); }
  }

  async function runConfirmed() {
    if (!confirm) return; setBusy(true); form.clear();
    const { type, booking } = confirm;
    try {
      const res = type === 'delete' ? await bookingsApi.remove(booking._id) : await bookingsApi.cancel(booking._id);
      mutate((old) => (old || [])
        .filter((b) => !(type === 'delete' && b._id === booking._id))
        .map((b) => (type === 'cancel' && b._id === booking._id ? res.booking : b)));
      setConfirm(null); setMessage('success', res.message);
    } catch (err) { form.setError(err); }
    finally { setBusy(false); }
  }

  const visible = useMemo(() => bookings.filter((b) =>
    (filter === 'All' || b.bookingStatus === filter) &&
    `${b.clientName} ${b.clientEmail} ${b.eventName} ${b.eventLocation}`.toLowerCase().includes(search.toLowerCase())
  ), [bookings, filter, search]);

  const stats = useMemo(() => ({
    total: bookings.length,
    pending: bookings.filter((b) => b.bookingStatus === 'Pending').length,
    approved: bookings.filter((b) => b.bookingStatus === 'Approved').length,
    completed: bookings.filter((b) => b.bookingStatus === 'Completed').length,
    // Money still owed on active bookings.
    balance: bookings.filter((b) => ['Approved', 'Completed'].includes(b.bookingStatus)).reduce((sum, b) => sum + balanceOf(b), 0),
  }), [bookings]);

  const setEdit = (key) => (e) => setEditing({ ...editing, [key]: e.target.value });

  return (
    <section className="dashboard-page">
      <div className="page-heading">
        <div>
          <span className="eyebrow">{isCoordinator ? 'COORDINATOR WORKSPACE' : 'YOUR PLANNING SPACE'}</span>
          <h1>{isCoordinator ? 'Booking overview' : <>Welcome back, <em>{user.fullName?.split(' ')[0] || 'there'}.</em></>}</h1>
          <p>{isCoordinator ? 'Review requests and keep every event moving.' : 'Your event plans, updates, and details in one place.'}</p>
        </div>
        {!isCoordinator && <Link className="btn btn-primary" to="/bookings/new">＋ New booking</Link>}
      </div>

      {isCoordinator && pendingPayments > 0 && (
        <Link to="/payments" className="callout">
          <strong>{pendingPayments} payment{pendingPayments > 1 ? 's' : ''} waiting for verification</strong>
          <span>Review proofs of payment →</span>
        </Link>
      )}

      <div className="stats-grid">
        <div className="stat-card"><span className="stat-icon">▤</span><small>Total bookings</small><strong>{stats.total}</strong><span className="stat-caption">{isCoordinator ? 'All client requests' : 'All your event requests'}</span></div>
        <div className="stat-card"><span className="stat-icon stat-amber">◷</span><small>Pending</small><strong>{stats.pending}</strong><span className="stat-caption">{isCoordinator ? 'Need your review' : 'Waiting for review'}</span></div>
        <div className="stat-card"><span className="stat-icon stat-green">✓</span><small>Approved</small><strong>{stats.approved}</strong><span className="stat-caption">{isCoordinator ? 'Confirmed events' : 'Ready for payment'}</span></div>
        {isCoordinator
          ? <div className="stat-card"><span className="stat-icon stat-blue">✦</span><small>Completed</small><strong>{stats.completed}</strong><span className="stat-caption">Events marked complete</span></div>
          : <div className="stat-card"><span className="stat-icon stat-blue">₱</span><small>Balance due</small><strong className="stat-money">{formatMoney(stats.balance)}</strong><span className="stat-caption">Across approved events</span></div>}
      </div>

      <section className="content-card">
        <div className="content-card-head">
          <div><h2>{isCoordinator ? 'All booking requests' : 'Your bookings'}</h2><p>{isCoordinator ? 'Set prices, approve requests, and update statuses.' : 'Track progress, pay approved bookings, or cancel a request.'}</p></div>
          <button className="btn btn-outline btn-sm" onClick={reload} disabled={loading}>↻ Refresh</button>
        </div>
        <div className="table-tools">
          <label className="search-box"><span>⌕</span><input value={search} onChange={(e) => setSearch(e.target.value)} placeholder={isCoordinator ? 'Search client, event, venue…' : 'Search your bookings…'} aria-label="Search bookings" /></label>
          <select aria-label="Filter booking status" value={filter} onChange={(e) => setFilter(e.target.value)}>
            <option>All</option><option>Pending</option><option>Approved</option><option>Completed</option><option>Cancelled</option>
          </select>
        </div>

        {error && bookings.length > 0 && <FormAlert message={`Could not refresh: ${error}`} />}
        {loading && bookings.length === 0 ? <Spinner label="Loading bookings…" /> : error && bookings.length === 0 ? <ErrorState message={error} onRetry={reload} /> : visible.length === 0 ? (
          <div className="empty-state">
            <span>✳</span>
            <h3>{bookings.length ? 'No matching bookings' : isCoordinator ? 'No requests yet' : 'Your plans start here'}</h3>
            <p>{bookings.length ? 'Try a different search or status filter.' : isCoordinator ? 'No booking requests have arrived yet.' : 'Submit a booking request and it will appear here.'}</p>
            {!isCoordinator && bookings.length === 0 && <Link className="btn btn-primary" to="/bookings/new">Create a booking</Link>}
          </div>
        ) : (
          <div className="table-wrap">
            <table>
              <thead><tr>{isCoordinator && <th>CLIENT</th>}<th>EVENT</th><th>DATE</th><th>VENUE</th><th>STATUS</th><th>PAYMENT</th><th>PRICE / BALANCE</th><th>ACTIONS</th></tr></thead>
              <tbody>
                {visible.map((b) => (
                  <tr key={b._id}>
                    {isCoordinator && <td><strong>{b.clientName}</strong><small className="table-sub">{b.clientEmail}</small></td>}
                    <td><strong>{b.eventName}</strong><small className="table-sub">{b.eventTheme}</small></td>
                    <td>{formatDate(b.eventDate)}</td>
                    <td>{b.eventLocation}</td>
                    <td><StatusPill value={b.bookingStatus} /></td>
                    <td><StatusPill value={b.paymentStatus} /></td>
                    <td>{Number(b.totalPrice) > 0 ? <><strong>{formatMoney(b.totalPrice)}</strong><small className="table-sub">Balance {formatMoney(balanceOf(b))}</small></> : <small className="table-sub">{isCoordinator ? 'Price not set' : 'Awaiting price'}</small>}</td>
                    <td>
                      <div className="row-actions">
                        {isCoordinator ? (
                          <>
                            <button className="btn btn-outline btn-xs" onClick={() => openEdit(b)}>Manage</button>
                            <button className="btn btn-danger-ghost btn-xs" onClick={() => { form.clear(); setConfirm({ type: 'delete', booking: b }); }}>Delete</button>
                          </>
                        ) : (
                          <>
                            {clientCanPay(b) && <Link className="btn btn-primary btn-xs" to={`/payments?booking=${b._id}`}>Pay</Link>}
                            {clientCanCancel(b) && <button className="btn btn-danger-ghost btn-xs" onClick={() => { form.clear(); setConfirm({ type: 'cancel', booking: b }); }}>Cancel</button>}
                            {!clientCanPay(b) && !clientCanCancel(b) && <small className="table-sub">—</small>}
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      {editing && isCoordinator && (
        <Modal eyebrow="BOOKING MANAGEMENT" title="Manage booking" onClose={closeEdit}>
          <form className="form-stack" onSubmit={updateBooking}>
            <FormAlert message={form.message} />
            <Field label="Event name" error={form.field('eventName')}><input required value={editing.eventName || ''} onChange={setEdit('eventName')} /></Field>
            <div className="form-grid">
              <Field label="Event date"><input type="date" required value={editing.eventDate || ''} onChange={setEdit('eventDate')} /></Field>
              <Field label="Theme" error={form.field('eventTheme')}><input required value={editing.eventTheme || ''} onChange={setEdit('eventTheme')} /></Field>
            </div>
            <Field label="Venue / location" error={form.field('eventLocation')}><input required value={editing.eventLocation || ''} onChange={setEdit('eventLocation')} /></Field>
            <div className="form-grid">
              <Field label="Total price (₱)" hint="Required before approval." error={form.field('totalPrice')}><input type="number" min="0" step="0.01" value={editing.totalPrice ?? 0} onChange={setEdit('totalPrice')} /></Field>
              <Field label="Payment method"><select value={editing.preferredPaymentMethod || ''} onChange={setEdit('preferredPaymentMethod')}><option value="">Not chosen yet</option>{PAYMENT_METHODS.map((m) => <option key={m}>{m}</option>)}</select></Field>
            </div>
            <div className="form-grid">
              <Field label="Booking status"><select value={editing.bookingStatus || 'Pending'} onChange={setEdit('bookingStatus')}>{nextStatuses(editing.savedStatus).map((s) => <option key={s}>{s}</option>)}</select></Field>
              <Field label="Payment status" hint="Updates automatically when payments are verified."><input readOnly value={`${editing.paymentStatus || 'Unpaid'} · ${formatMoney(editing.amountPaid)} paid`} /></Field>
            </div>
            <Field label="Special requests"><textarea rows="3" value={editing.specialRequests || ''} onChange={setEdit('specialRequests')} /></Field>
            <div className="modal-actions"><button type="button" className="btn btn-outline" onClick={closeEdit}>Cancel</button><button className="btn btn-primary" disabled={busy}>{busy ? 'Saving…' : 'Save changes'}</button></div>
          </form>
        </Modal>
      )}

      {confirm && (
        <ConfirmDialog
          title={confirm.type === 'delete' ? 'Delete this booking?' : 'Cancel this booking?'}
          message={confirm.type === 'delete'
            ? `“${confirm.booking.eventName}” will be permanently removed. This cannot be undone.`
            : `“${confirm.booking.eventName}” will be cancelled. You can submit a new request later.`}
          confirmLabel={confirm.type === 'delete' ? 'Delete booking' : 'Cancel booking'}
          danger busy={busy} error={form.message}
          onConfirm={runConfirmed} onCancel={() => { setConfirm(null); form.clear(); }}
        />
      )}
    </section>
  );
}
