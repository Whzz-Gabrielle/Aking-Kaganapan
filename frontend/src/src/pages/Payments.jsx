import { useEffect, useMemo, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { bookingsApi, paymentsApi } from '../api/services.js';
import { EmptyState, ErrorState, Field, FormAlert, Modal, Spinner, StatusPill } from '../components/ui.jsx';
import { useAuth } from '../context/AuthContext.jsx';
import { useApi } from '../hooks/useApi.js';
import { useFormError } from '../hooks/useFormError.js';
import { PAYMENT_METHODS, formatDate, formatMoney } from '../utils/format.js';
import { balanceOf, clientCanPay } from '../utils/bookingRules.js';

const MAX_PROOF_BYTES = 5 * 1024 * 1024;
const PROOF_TYPES = ['image/jpeg', 'image/png', 'image/webp'];

// /payments shows a different screen depending on who is signed in.
export default function Payments() {
  const { isCoordinator } = useAuth();
  return isCoordinator ? <PaymentReview /> : <MyPayments />;
}

/* ---------------- Client: pay approved bookings + payment history ---------------- */

function MyPayments() {
  const { setMessage } = useAuth();
  const [params, setParams] = useSearchParams();
  const bookings = useApi(bookingsApi.list);
  const history = useApi(paymentsApi.mine);
  const payable = useMemo(() => (Array.isArray(bookings.data) ? bookings.data.filter(clientCanPay) : []), [bookings.data]);
  const [picked, setPicked] = useState(null);

  // Arriving from "Pay" on the dashboard opens that booking's form.
  const wanted = params.get('booking');
  const paying = picked || payable.find((b) => b._id === wanted) || null;

  function closeForm() {
    setPicked(null);
    if (params.get('booking')) { params.delete('booking'); setParams(params, { replace: true }); }
  }

  function onSubmitted(message) {
    closeForm(); setMessage('success', message);
    bookings.reload(); history.reload();
  }

  const list = Array.isArray(history.data) ? history.data : [];

  return (
    <section className="dashboard-page">
      <div className="page-heading">
        <div><span className="eyebrow">YOUR PAYMENTS</span><h1>My <em>payments.</em></h1><p>Pay approved bookings and track whether each payment was verified.</p></div>
      </div>

      <section className="content-card">
        <div className="content-card-head"><div><h2>Ready for payment</h2><p>Approved bookings with a balance to pay.</p></div></div>
        {bookings.loading && !bookings.data ? <Spinner label="Loading bookings…" /> : bookings.error && !bookings.data ? <ErrorState message={bookings.error} onRetry={bookings.reload} /> : payable.length === 0 ? (
          <EmptyState title="Nothing to pay right now">Payments open once your coordinator approves a booking and sets its price. <Link to="/dashboard">View my bookings</Link></EmptyState>
        ) : (
          <div className="table-wrap"><table>
            <thead><tr><th>EVENT</th><th>DATE</th><th>TOTAL</th><th>PAID</th><th>BALANCE</th><th /></tr></thead>
            <tbody>{payable.map((b) => (
              <tr key={b._id}>
                <td><strong>{b.eventName}</strong><small className="table-sub">{b.preferredPaymentMethod || 'Choose a method when paying'}</small></td>
                <td>{formatDate(b.eventDate)}</td><td>{formatMoney(b.totalPrice)}</td><td>{formatMoney(b.amountPaid)}</td><td><strong>{formatMoney(balanceOf(b))}</strong></td>
                <td><button className="btn btn-primary btn-xs" onClick={() => setPicked(b)}>Pay now</button></td>
              </tr>))}</tbody>
          </table></div>
        )}
      </section>

      <section className="content-card section-gap">
        <div className="content-card-head"><div><h2>Payment history</h2><p>Every proof of payment you have submitted.</p></div><button className="btn btn-outline btn-sm" onClick={history.reload} disabled={history.loading}>↻ Refresh</button></div>
        {history.loading && !history.data ? <Spinner label="Loading payments…" /> : history.error && !history.data ? <ErrorState message={history.error} onRetry={history.reload} /> : list.length === 0 ? (
          <EmptyState title="No payments yet">Submitted payments will appear here.</EmptyState>
        ) : (
          <div className="table-wrap"><table>
            <thead><tr><th>EVENT</th><th>SUBMITTED</th><th>METHOD</th><th>REFERENCE</th><th>AMOUNT</th><th>STATUS</th><th>NOTE</th></tr></thead>
            <tbody>{list.map((p) => (
              <tr key={p._id}>
                <td><strong>{p.booking?.eventName || 'Removed booking'}</strong></td>
                <td>{formatDate(p.createdAt)}</td><td>{p.paymentMethod}</td><td>{p.referenceNumber}</td><td>{formatMoney(p.amount)}</td>
                <td><StatusPill value={p.verificationStatus} /></td>
                <td className="wrap-cell">{p.coordinatorRemarks || '—'}</td>
              </tr>))}</tbody>
          </table></div>
        )}
      </section>

      {paying && <PaymentForm booking={paying} onClose={closeForm} onSubmitted={onSubmitted} />}
    </section>
  );
}

function PaymentForm({ booking, onClose, onSubmitted }) {
  const [amount, setAmount] = useState(String(balanceOf(booking)));
  const [reference, setReference] = useState('');
  const [method, setMethod] = useState(booking.preferredPaymentMethod || '');
  const [file, setFile] = useState(null);
  const [preview, setPreview] = useState('');
  const [fileError, setFileError] = useState('');
  const [busy, setBusy] = useState(false);
  const formError = useFormError();
  const balance = balanceOf(booking);

  // Free the preview URL when it changes or the dialog closes.
  useEffect(() => () => { if (preview) URL.revokeObjectURL(preview); }, [preview]);

  function pickFile(e) {
    const chosen = e.target.files?.[0];
    setFileError('');
    if (!chosen) { setFile(null); setPreview(''); return; }
    if (!PROOF_TYPES.includes(chosen.type)) { setFileError('Please choose a JPG, PNG, or WEBP image.'); e.target.value = ''; setFile(null); setPreview(''); return; }
    if (chosen.size > MAX_PROOF_BYTES) { setFileError('That image is larger than 5 MB. Please choose a smaller one.'); e.target.value = ''; setFile(null); setPreview(''); return; }
    setFile(chosen); setPreview(URL.createObjectURL(chosen));
  }

  async function submit(event) {
    event.preventDefault(); formError.clear();
    const value = Number(amount);
    if (!Number.isFinite(value) || value <= 0) return formError.setError(new Error('Enter a payment amount greater than zero.'));
    if (value > balance) return formError.setError(new Error(`The amount cannot be more than your balance of ${formatMoney(balance)}.`));
    if (!file) return setFileError('Upload a screenshot or photo of your proof of payment.');

    const body = new FormData();
    body.append('bookingId', booking._id);
    body.append('amount', String(value));
    body.append('referenceNumber', reference.trim());
    if (!booking.preferredPaymentMethod) body.append('paymentMethod', method);
    body.append('proofOfPayment', file);

    setBusy(true);
    try {
      const res = await paymentsApi.submit(body);
      onSubmitted(res.message || 'Payment submitted. Waiting for verification.');
    } catch (err) { formError.setError(err); }
    finally { setBusy(false); }
  }

  return (
    <Modal eyebrow="SUBMIT PAYMENT" title={booking.eventName} onClose={busy ? () => {} : onClose}>
      <form className="form-stack" onSubmit={submit}>
        <FormAlert message={formError.message} />
        <div className="estimate">Balance to pay: <strong>{formatMoney(balance)}</strong> <small>of {formatMoney(booking.totalPrice)} total</small></div>
        <div className="form-grid">
          <Field label="Amount (₱) *"><input type="number" required min="1" step="0.01" max={balance} value={amount} onChange={(e) => setAmount(e.target.value)} /></Field>
          {booking.preferredPaymentMethod
            ? <Field label="Payment method"><input readOnly value={booking.preferredPaymentMethod} /></Field>
            : <Field label="Payment method *"><select required value={method} onChange={(e) => setMethod(e.target.value)}><option value="">Choose…</option>{PAYMENT_METHODS.map((m) => <option key={m}>{m}</option>)}</select></Field>}
        </div>
        <Field label="Reference number *"><input required value={reference} onChange={(e) => setReference(e.target.value)} placeholder="Transaction / reference no." /></Field>
        <Field label="Proof of payment *" hint="JPG, PNG or WEBP, up to 5 MB." error={fileError}>
          <input type="file" accept="image/jpeg,image/png,image/webp" onChange={pickFile} />
        </Field>
        {preview && <img className="proof-preview" src={preview} alt="Selected proof of payment" />}
        <div className="modal-actions"><button type="button" className="btn btn-outline" onClick={onClose} disabled={busy}>Cancel</button><button className="btn btn-primary" disabled={busy}>{busy ? 'Uploading…' : 'Submit payment'}</button></div>
      </form>
    </Modal>
  );
}

/* ---------------- Coordinator: verify or reject submitted payments ---------------- */

function PaymentReview() {
  const { setMessage } = useAuth();
  const { data, loading, error, reload, mutate } = useApi(paymentsApi.all);
  const [filter, setFilter] = useState('Pending');
  const [reviewing, setReviewing] = useState(null);
  const payments = useMemo(() => (Array.isArray(data) ? data : []), [data]);
  const visible = payments.filter((p) => filter === 'All' || p.verificationStatus === filter);
  const pendingCount = payments.filter((p) => p.verificationStatus === 'Pending').length;

  function onReviewed(res) {
    // Keep the populated booking/client; only the review fields changed.
    mutate((old) => (old || []).map((p) => (p._id === res.payment._id
      ? { ...p, verificationStatus: res.payment.verificationStatus, coordinatorRemarks: res.payment.coordinatorRemarks }
      : p)));
    setReviewing(null); setMessage('success', res.message);
  }

  return (
    <section className="dashboard-page">
      <div className="page-heading">
        <div><span className="eyebrow">COORDINATOR WORKSPACE</span><h1>Payment <em>verification.</em></h1><p>Check each proof of payment, then verify or reject it. Verified amounts update the booking balance.</p></div>
      </div>
      <section className="content-card">
        <div className="content-card-head"><div><h2>Submitted payments</h2><p>{pendingCount} waiting for review</p></div><button className="btn btn-outline btn-sm" onClick={reload} disabled={loading}>↻ Refresh</button></div>
        <div className="table-tools">
          <select aria-label="Filter payments" value={filter} onChange={(e) => setFilter(e.target.value)}><option>Pending</option><option>Verified</option><option>Rejected</option><option>All</option></select>
        </div>
        {error && payments.length > 0 && <FormAlert message={`Could not refresh: ${error}`} />}
        {loading && !data ? <Spinner label="Loading payments…" /> : error && !data ? <ErrorState message={error} onRetry={reload} /> : visible.length === 0 ? (
          <EmptyState title={filter === 'Pending' ? 'All caught up' : 'No payments found'}>{filter === 'Pending' ? 'No payments are waiting for review.' : 'Try a different status filter.'}</EmptyState>
        ) : (
          <div className="table-wrap"><table>
            <thead><tr><th>CLIENT</th><th>EVENT</th><th>SUBMITTED</th><th>METHOD / REF</th><th>AMOUNT</th><th>STATUS</th><th /></tr></thead>
            <tbody>{visible.map((p) => (
              <tr key={p._id}>
                <td><strong>{p.client?.fullName || p.booking?.clientName || '—'}</strong><small className="table-sub">{p.client?.email || p.booking?.clientEmail}</small></td>
                <td><strong>{p.booking?.eventName || 'Removed booking'}</strong><small className="table-sub">Total {formatMoney(p.booking?.totalPrice)}</small></td>
                <td>{formatDate(p.createdAt)}</td>
                <td>{p.paymentMethod}<small className="table-sub">{p.referenceNumber}</small></td>
                <td><strong>{formatMoney(p.amount)}</strong></td>
                <td><StatusPill value={p.verificationStatus} /></td>
                <td><button className="btn btn-outline btn-xs" onClick={() => setReviewing(p)}>{p.verificationStatus === 'Pending' ? 'Review' : 'View'}</button></td>
              </tr>))}</tbody>
          </table></div>
        )}
      </section>
      {reviewing && <ReviewDialog payment={reviewing} onClose={() => setReviewing(null)} onReviewed={onReviewed} />}
    </section>
  );
}

function ReviewDialog({ payment, onClose, onReviewed }) {
  const [remarks, setRemarks] = useState(payment.coordinatorRemarks || '');
  const [busy, setBusy] = useState(false);
  const [imageFailed, setImageFailed] = useState(false);
  const formError = useFormError();
  const isPending = payment.verificationStatus === 'Pending';

  async function decide(verificationStatus) {
    if (verificationStatus === 'Rejected' && !remarks.trim()) return formError.setError(new Error('Add a short reason so the client knows what to fix.'));
    setBusy(true); formError.clear();
    try { onReviewed(await paymentsApi.review(payment._id, { verificationStatus, coordinatorRemarks: remarks.trim() })); }
    catch (err) { formError.setError(err); setBusy(false); }
  }

  return (
    <Modal eyebrow="PAYMENT REVIEW" title={`${formatMoney(payment.amount)} · ${payment.paymentMethod}`} onClose={busy ? () => {} : onClose}>
      <div className="form-stack">
        <FormAlert message={formError.message} />
        <div className="review-meta">
          <span>Reference</span><strong>{payment.referenceNumber}</strong>
          <span>Event</span><strong>{payment.booking?.eventName || 'Removed booking'}</strong>
          <span>Status</span><StatusPill value={payment.verificationStatus} />
        </div>
        {imageFailed
          ? <div className="state-box state-error"><span>The proof image could not be loaded.</span><a className="btn btn-outline btn-sm" href={payment.proofOfPayment} target="_blank" rel="noreferrer">Open image in a new tab</a></div>
          : <a href={payment.proofOfPayment} target="_blank" rel="noreferrer"><img className="proof-preview" src={payment.proofOfPayment} alt="Proof of payment" onError={() => setImageFailed(true)} /></a>}
        <Field label={isPending ? 'Remarks (required when rejecting)' : 'Remarks'}><textarea rows="3" readOnly={!isPending} value={remarks} onChange={(e) => setRemarks(e.target.value)} placeholder="e.g. Amount does not match the reference number" /></Field>
        <div className="modal-actions">
          <button className="btn btn-outline" onClick={onClose} disabled={busy}>Close</button>
          {isPending && <>
            <button className="btn btn-danger" onClick={() => decide('Rejected')} disabled={busy}>Reject</button>
            <button className="btn btn-primary" onClick={() => decide('Verified')} disabled={busy}>{busy ? 'Saving…' : 'Verify payment'}</button>
          </>}
        </div>
      </div>
    </Modal>
  );
}
