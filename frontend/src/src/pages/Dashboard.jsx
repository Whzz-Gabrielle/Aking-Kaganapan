import { useCallback, useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { apiRequest } from '../api/api.js';
import { Field, StatusPill } from '../components/ui.jsx';
import { useAuth } from '../context/AuthContext.jsx';

const formatDate = (value) => value ? new Date(value).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' }) : 'Not set';

export default function Dashboard() {
  const { user, isCoordinator, setMessage } = useAuth();
  const [bookings, setBookings] = useState([]);
  const [filter, setFilter] = useState('All');
  const [search, setSearch] = useState('');
  const [editing, setEditing] = useState(null);
  const [busy, setBusy] = useState(false);

  const loadBookings = useCallback(async () => {
    try { const data = await apiRequest('/api/bookings'); setBookings(Array.isArray(data) ? data : []); }
    catch (error) { setMessage('error', error.message); }
  }, [setMessage]);

  useEffect(() => { loadBookings(); }, [loadBookings]);

  async function updateBooking(event) {
    event.preventDefault(); if (!editing) return; setBusy(true);
    try {
      const data = await apiRequest(`/api/bookings/${editing._id}`, { method: 'PUT', body: JSON.stringify(editing) });
      setBookings((old) => old.map((b) => b._id === editing._id ? (data.booking || editing) : b));
      setEditing(null); setMessage('success', data.message || 'Booking updated.');
    } catch (error) { setMessage('error', error.message); }
    finally { setBusy(false); }
  }

  async function deleteBooking(id) {
    if (!window.confirm('Delete this booking? This cannot be undone.')) return;
    try {
      const data = await apiRequest(`/api/bookings/${id}`, { method: 'DELETE' });
      setBookings((old) => old.filter((b) => b._id !== id));
      setMessage('success', data.message || 'Booking deleted.');
    } catch (error) { setMessage('error', error.message); }
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

      <div className="stats-grid">
        <div className="stat-card"><span className="stat-icon">▤</span><small>Total bookings</small><strong>{stats.total}</strong><span className="stat-caption">All your event requests</span></div>
        <div className="stat-card"><span className="stat-icon stat-amber">◷</span><small>Pending</small><strong>{stats.pending}</strong><span className="stat-caption">Waiting for review</span></div>
        <div className="stat-card"><span className="stat-icon stat-green">✓</span><small>Approved</small><strong>{stats.approved}</strong><span className="stat-caption">Ready to move forward</span></div>
        <div className="stat-card"><span className="stat-icon stat-blue">✦</span><small>Completed</small><strong>{stats.completed}</strong><span className="stat-caption">Events marked complete</span></div>
      </div>

      <section className="content-card">
        <div className="content-card-head">
          <div><h2>{isCoordinator ? 'All booking requests' : 'Your bookings'}</h2><p>{isCoordinator ? 'Manage client requests and update statuses.' : 'Track the progress of your event requests.'}</p></div>
          <button className="btn btn-outline btn-sm" onClick={loadBookings}>↻ Refresh</button>
        </div>
        <div className="table-tools">
          <label className="search-box"><span>⌕</span><input value={search} onChange={(e) => setSearch(e.target.value)} placeholder={isCoordinator ? 'Search client, event, venue…' : 'Search your bookings…'} /></label>
          <select aria-label="Filter booking status" value={filter} onChange={(e) => setFilter(e.target.value)}>
            <option>All</option><option>Pending</option><option>Approved</option><option>Completed</option><option>Cancelled</option>
          </select>
        </div>

        {visible.length === 0 ? (
          <div className="empty-state">
            <span>✳</span>
            <h3>{bookings.length ? 'No matching bookings' : 'Your plans start here'}</h3>
            <p>{bookings.length ? 'Try a different search or status filter.' : isCoordinator ? 'No booking requests have arrived yet.' : 'Submit a booking request and it will appear here.'}</p>
            {!isCoordinator && bookings.length === 0 && <Link className="btn btn-primary" to="/bookings/new">Create a booking</Link>}
          </div>
        ) : (
          <div className="table-wrap">
            <table>
              <thead><tr>{isCoordinator && <th>CLIENT</th>}<th>EVENT</th><th>DATE</th><th>VENUE</th><th>BOOKING STATUS</th><th>PAYMENT</th>{isCoordinator && <th>ACTIONS</th>}</tr></thead>
              <tbody>
                {visible.map((b) => (
                  <tr key={b._id}>
                    {isCoordinator && <td><strong>{b.clientName}</strong><small className="table-sub">{b.clientEmail}</small></td>}
                    <td><strong>{b.eventName}</strong><small className="table-sub">{b.eventTheme}</small></td>
                    <td>{formatDate(b.eventDate)}</td>
                    <td>{b.eventLocation}</td>
                    <td><StatusPill value={b.bookingStatus} /></td>
                    <td><StatusPill value={b.paymentStatus} /></td>
                    {isCoordinator && <td><div className="row-actions"><button className="btn btn-outline btn-xs" onClick={() => setEditing({ ...b })}>Edit</button><button className="btn btn-danger-ghost btn-xs" onClick={() => deleteBooking(b._id)}>Delete</button></div></td>}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      {editing && isCoordinator && (
        <div className="modal-backdrop" role="presentation" onMouseDown={(e) => { if (e.target === e.currentTarget) setEditing(null); }}>
          <section className="modal" role="dialog" aria-modal="true" aria-labelledby="edit-title">
            <div className="modal-heading"><div><span className="eyebrow">BOOKING MANAGEMENT</span><h2 id="edit-title">Update booking</h2></div><button className="close-button" onClick={() => setEditing(null)} aria-label="Close">×</button></div>
            <form className="form-stack" onSubmit={updateBooking}>
              <Field label="Event name"><input required value={editing.eventName || ''} onChange={setEdit('eventName')} /></Field>
              <div className="form-grid">
                <Field label="Booking status"><select value={editing.bookingStatus || 'Pending'} onChange={setEdit('bookingStatus')}><option>Pending</option><option>Approved</option><option>Completed</option><option>Cancelled</option></select></Field>
                <Field label="Payment status"><select value={editing.paymentStatus || 'Unpaid'} onChange={setEdit('paymentStatus')}><option>Unpaid</option><option>Half Payment</option><option>Fully Paid</option></select></Field>
              </div>
              <Field label="Venue"><input required value={editing.eventLocation || ''} onChange={setEdit('eventLocation')} /></Field>
              <Field label="Special requests"><textarea rows="3" value={editing.specialRequests || ''} onChange={setEdit('specialRequests')} /></Field>
              <div className="modal-actions"><button type="button" className="btn btn-outline" onClick={() => setEditing(null)}>Cancel</button><button className="btn btn-primary" disabled={busy}>{busy ? 'Saving…' : 'Save changes'}</button></div>
            </form>
          </section>
        </div>
      )}
    </section>
  );
}
