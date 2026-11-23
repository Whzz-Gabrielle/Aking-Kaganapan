import { useMemo, useState } from 'react';
import { bookingsApi, expensesApi, paymentsApi } from '../api/services.js';
import { ConfirmDialog, EmptyState, ErrorState, Field, FormAlert, Modal, Spinner, StatusPill } from '../components/ui.jsx';
import { useAuth } from '../context/AuthContext.jsx';
import { useApi } from '../hooks/useApi.js';
import { useFormError } from '../hooks/useFormError.js';
import { formatDate, formatMoney, todayLocal } from '../utils/format.js';

const TYPES = ['Event Expense', 'Monthly Operating Expense'];
const EMPTY = { expenseName: '', expenseType: TYPES[0], category: '', amount: '', expenseDate: todayLocal(), booking: '', description: '' };

// Coordinator only (route is guarded in App.jsx and again on the server).
export default function Expenses() {
  const { setMessage } = useAuth();
  const expenses = useApi(expensesApi.list);
  const bookings = useApi(bookingsApi.list);
  const payments = useApi(paymentsApi.all);
  const [filter, setFilter] = useState('All');
  const [adding, setAdding] = useState(false);
  const [cancelling, setCancelling] = useState(null);
  const [busy, setBusy] = useState(false);
  const formError = useFormError();

  const list = useMemo(() => (Array.isArray(expenses.data) ? expenses.data : []), [expenses.data]);
  const bookingList = Array.isArray(bookings.data) ? bookings.data : [];
  const visible = list.filter((e) => filter === 'All' || e.expenseType === filter);

  const totals = useMemo(() => {
    const spent = list.filter((e) => e.status === 'Active').reduce((sum, e) => sum + e.amount, 0);
    const revenue = (Array.isArray(payments.data) ? payments.data : []).filter((p) => p.verificationStatus === 'Verified').reduce((sum, p) => sum + p.amount, 0);
    return { spent, revenue, net: revenue - spent };
  }, [list, payments.data]);

  async function confirmCancel() {
    setBusy(true); formError.clear();
    try {
      const res = await expensesApi.cancel(cancelling._id);
      expenses.mutate((old) => (old || []).map((e) => (e._id === res.expense._id ? res.expense : e)));
      setCancelling(null); setMessage('success', res.message);
    } catch (err) { formError.setError(err); }
    finally { setBusy(false); }
  }

  return (
    <section className="dashboard-page">
      <div className="page-heading">
        <div><span className="eyebrow">COORDINATOR WORKSPACE</span><h1>Expense <em>tracking.</em></h1><p>Record event and monthly costs. Cancelled expenses stay on record but are not counted.</p></div>
        <button className="btn btn-primary" onClick={() => { formError.clear(); setAdding(true); }}>＋ Add expense</button>
      </div>

      <div className="stats-grid stats-three">
        <div className="stat-card"><span className="stat-icon stat-green">₱</span><small>Verified revenue</small><strong className="stat-money">{formatMoney(totals.revenue)}</strong><span className="stat-caption">{payments.error ? 'Could not load payments' : 'From verified payments'}</span></div>
        <div className="stat-card"><span className="stat-icon stat-amber">↓</span><small>Active expenses</small><strong className="stat-money">{formatMoney(totals.spent)}</strong><span className="stat-caption">Cancelled ones excluded</span></div>
        <div className="stat-card"><span className="stat-icon stat-blue">＝</span><small>Net</small><strong className={`stat-money${totals.net < 0 ? ' negative' : ''}`}>{formatMoney(totals.net)}</strong><span className="stat-caption">Revenue minus expenses</span></div>
      </div>

      <section className="content-card">
        <div className="content-card-head"><div><h2>Expense records</h2><p>Newest first.</p></div><button className="btn btn-outline btn-sm" onClick={expenses.reload} disabled={expenses.loading}>↻ Refresh</button></div>
        <div className="table-tools"><select aria-label="Filter expense type" value={filter} onChange={(e) => setFilter(e.target.value)}><option>All</option>{TYPES.map((t) => <option key={t}>{t}</option>)}</select></div>
        {expenses.error && list.length > 0 && <FormAlert message={`Could not refresh: ${expenses.error}`} />}
        {expenses.loading && !expenses.data ? <Spinner label="Loading expenses…" /> : expenses.error && !expenses.data ? <ErrorState message={expenses.error} onRetry={expenses.reload} /> : visible.length === 0 ? (
          <EmptyState title="No expenses recorded">{list.length ? 'Try a different type filter.' : 'Add your first expense to start tracking costs.'}</EmptyState>
        ) : (
          <div className="table-wrap"><table>
            <thead><tr><th>EXPENSE</th><th>TYPE</th><th>EVENT</th><th>DATE</th><th>AMOUNT</th><th>STATUS</th><th /></tr></thead>
            <tbody>{visible.map((e) => (
              <tr key={e._id} className={e.status === 'Cancelled' ? 'row-muted' : ''}>
                <td><strong>{e.expenseName}</strong><small className="table-sub">{e.category}</small></td>
                <td>{e.expenseType}</td>
                <td>{e.booking?.eventName || (e.expenseType === 'Event Expense' ? 'Removed booking' : '—')}</td>
                <td>{formatDate(e.expenseDate)}</td><td>{formatMoney(e.amount)}</td>
                <td><StatusPill value={e.status} /></td>
                <td>{e.status === 'Active' && <button className="btn btn-danger-ghost btn-xs" onClick={() => { formError.clear(); setCancelling(e); }}>Cancel</button>}</td>
              </tr>))}</tbody>
          </table></div>
        )}
      </section>

      {adding && <ExpenseForm bookings={bookingList} bookingsError={bookings.error} onClose={() => setAdding(false)}
        onSaved={(res) => { expenses.mutate((old) => [res.expense, ...(old || [])]); setAdding(false); setMessage('success', res.message); }} />}

      {cancelling && <ConfirmDialog title="Cancel this expense?" message={`“${cancelling.expenseName}” (${formatMoney(cancelling.amount)}) will no longer be counted. The record is kept.`}
        confirmLabel="Cancel expense" danger busy={busy} error={formError.message} onConfirm={confirmCancel} onCancel={() => { setCancelling(null); formError.clear(); }} />}
    </section>
  );
}

function ExpenseForm({ bookings, bookingsError, onClose, onSaved }) {
  const [form, setForm] = useState(EMPTY);
  const [busy, setBusy] = useState(false);
  const formError = useFormError();
  const isEvent = form.expenseType === 'Event Expense';
  const set = (key) => (e) => setForm({ ...form, [key]: e.target.value });

  async function submit(event) {
    event.preventDefault(); formError.clear();
    if (isEvent && !form.booking) return formError.setError(new Error('Choose the event this expense belongs to.'));
    setBusy(true);
    try {
      onSaved(await expensesApi.create({ ...form, amount: Number(form.amount), booking: isEvent ? form.booking : undefined }));
    } catch (err) { formError.setError(err); setBusy(false); }
  }

  return (
    <Modal eyebrow="NEW EXPENSE" title="Add expense" onClose={busy ? () => {} : onClose}>
      <form className="form-stack" onSubmit={submit}>
        <FormAlert message={formError.message} />
        <Field label="Expense name *" error={formError.field('expenseName')}><input required value={form.expenseName} onChange={set('expenseName')} placeholder="e.g. Florals, Staff meals" /></Field>
        <div className="form-grid">
          <Field label="Type *"><select value={form.expenseType} onChange={set('expenseType')}>{TYPES.map((t) => <option key={t}>{t}</option>)}</select></Field>
          <Field label="Category *" error={formError.field('category')}><input required value={form.category} onChange={set('category')} placeholder="e.g. Decor, Rent, Utilities" /></Field>
        </div>
        {isEvent && (
          <Field label="Event *" hint={bookingsError ? 'Events could not be loaded. Close and try again.' : undefined}>
            <select required value={form.booking} onChange={set('booking')}>
              <option value="">Choose an event…</option>
              {bookings.filter((b) => b.bookingStatus !== 'Cancelled').map((b) => <option key={b._id} value={b._id}>{b.eventName} · {b.clientName} · {formatDate(b.eventDate)}</option>)}
            </select>
          </Field>
        )}
        <div className="form-grid">
          <Field label="Amount (₱) *" error={formError.field('amount')}><input type="number" required min="0.01" step="0.01" value={form.amount} onChange={set('amount')} /></Field>
          <Field label="Date *"><input type="date" required value={form.expenseDate} onChange={set('expenseDate')} /></Field>
        </div>
        <Field label="Notes"><textarea rows="3" value={form.description} onChange={set('description')} /></Field>
        <div className="modal-actions"><button type="button" className="btn btn-outline" onClick={onClose} disabled={busy}>Cancel</button><button className="btn btn-primary" disabled={busy}>{busy ? 'Saving…' : 'Save expense'}</button></div>
      </form>
    </Modal>
  );
}
