import { useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { bookingsApi, packagesApi, venuesApi } from '../api/services.js';
import { Field, FormAlert } from '../components/ui.jsx';
import { useAuth } from '../context/AuthContext.jsx';
import { useApi } from '../hooks/useApi.js';
import { useFormError } from '../hooks/useFormError.js';
import { PAYMENT_METHODS, formatMoney, formatPrice, todayLocal } from '../utils/format.js';

export default function NewBooking() {
  const { user, setMessage } = useAuth();
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const packages = useApi(packagesApi.list);
  const venues = useApi(venuesApi.list);
  const [packageId, setPackageId] = useState(params.get('package') || '');
  const [venueId, setVenueId] = useState(params.get('venue') || '');
  const [form, setForm] = useState({ eventName: '', eventDate: '', eventLocation: '', eventTheme: '', specialRequests: '', preferredPaymentMethod: '' });
  const [busy, setBusy] = useState(false);
  const formError = useFormError();

  const pkgList = Array.isArray(packages.data) ? packages.data : [];
  const venueList = Array.isArray(venues.data) ? venues.data : [];
  const pkg = pkgList.find((p) => p._id === packageId);
  const venue = venueList.find((v) => v._id === venueId);
  const estimate = Number(pkg?.price || 0) + Number(venue?.rentalPrice || 0);

  // A chosen package/venue fills in blank fields; anything the user types wins.
  const eventTheme = form.eventTheme || pkg?.eventTheme || pkg?.packageName || '';
  const eventLocation = form.eventLocation || venue?.venueName || '';
  const set = (key) => (e) => setForm({ ...form, [key]: e.target.value });

  async function submit(event) {
    event.preventDefault(); setBusy(true); formError.clear();
    try {
      const data = await bookingsApi.create({
        ...form, eventTheme, eventLocation, clientName: user.fullName,
        packageId: packageId || undefined, venueId: venueId || undefined,
        preferredPaymentMethod: form.preferredPaymentMethod || undefined,
      });
      setMessage('success', data.message || 'Your booking request has been submitted.');
      navigate('/dashboard');
    } catch (error) {
      formError.setError(error);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } finally { setBusy(false); }
  }

  return (
    <section className="booking-layout">
      <div className="booking-intro">
        <span className="eyebrow">LET'S PLAN SOMETHING SPECIAL</span>
        <h1>Tell us about<br /><em>your event.</em></h1>
        <p>Share the details below to send your booking request. You can check its status anytime from your dashboard.</p>
        <div className="booking-tip"><span>✳</span><div><strong>A little detail goes a long way.</strong><small>Choose your date, venue, and theme so your coordinator can review your request.</small></div></div>
      </div>
      <div className="booking-form-card">
        <div className="form-card-heading"><span className="step-chip">NEW REQUEST</span><h2>Event details</h2><p>Fields marked with * are required.</p></div>
        <form className="form-stack" onSubmit={submit}>
          <FormAlert message={formError.message} />
          <div className="form-grid">
            <Field label="Package (optional)" hint={packages.error ? 'Packages are unavailable right now. You can still submit your request.' : undefined}>
              <select value={packageId} onChange={(e) => setPackageId(e.target.value)} disabled={packages.loading || !!packages.error}>
                <option value="">{packages.loading ? 'Loading…' : 'No package'}</option>
                {pkgList.map((p) => <option key={p._id} value={p._id}>{p.packageName} · {formatPrice(p.price)}</option>)}
              </select>
            </Field>
            <Field label="Venue (optional)" hint={venues.error ? 'Venues are unavailable right now. You can still enter your own venue.' : undefined}>
              <select value={venueId} onChange={(e) => setVenueId(e.target.value)} disabled={venues.loading || !!venues.error}>
                <option value="">{venues.loading ? 'Loading…' : 'I have my own venue'}</option>
                {venueList.map((v) => <option key={v._id} value={v._id}>{v.venueName} · up to {v.capacity}</option>)}
              </select>
            </Field>
          </div>
          {estimate > 0 && <div className="estimate">Estimated total: <strong>{formatMoney(estimate)}</strong> <small>Your coordinator confirms the final price when approving.</small></div>}
          <Field label="Event name *" error={formError.field('eventName')}><input required value={form.eventName} onChange={set('eventName')} placeholder="e.g. Birthday celebration" /></Field>
          <Field label="Event date *" error={formError.field('eventDate')}><input type="date" required min={todayLocal()} value={form.eventDate} onChange={set('eventDate')} /></Field>
          <Field label="Event location / venue *" error={formError.field('eventLocation')}><input required value={eventLocation} onChange={set('eventLocation')} placeholder="Venue name or address" /></Field>
          <Field label="Event theme *" error={formError.field('eventTheme')}><input required value={eventTheme} onChange={set('eventTheme')} placeholder="e.g. Garden, elegant, minimalist" /></Field>
          <Field label="Preferred payment method" hint="You’ll use this when paying after approval.">
            <select value={form.preferredPaymentMethod} onChange={set('preferredPaymentMethod')}>
              <option value="">Decide later</option>
              {PAYMENT_METHODS.map((m) => <option key={m}>{m}</option>)}
            </select>
          </Field>
          <Field label="Special requests"><textarea rows="4" maxLength="1200" value={form.specialRequests} onChange={set('specialRequests')} placeholder="Tell us about any preferences or important details…" /></Field>
          <div className="form-actions">
            <button type="button" className="btn btn-outline" onClick={() => navigate('/dashboard')}>Cancel</button>
            <button className="btn btn-primary btn-large" disabled={busy}>{busy ? 'Submitting…' : 'Submit request'} <span>↗</span></button>
          </div>
        </form>
      </div>
    </section>
  );
}
