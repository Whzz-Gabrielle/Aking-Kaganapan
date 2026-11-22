import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { apiRequest } from '../api/api.js';
import { Field } from '../components/ui.jsx';
import { useAuth } from '../context/AuthContext.jsx';

const initialForm = { eventName: '', eventDate: '', eventLocation: '', eventTheme: '', specialRequests: '' };

export default function NewBooking() {
  const { user, setMessage } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState(initialForm);
  const [busy, setBusy] = useState(false);
  const set = (key) => (e) => setForm({ ...form, [key]: e.target.value });

  async function submit(event) {
    event.preventDefault(); setBusy(true);
    try {
      const data = await apiRequest('/api/bookings', { method: 'POST', body: JSON.stringify({ ...form, clientName: user.fullName }) });
      setMessage('success', data.message || 'Your booking request has been submitted.');
      navigate('/dashboard');
    } catch (error) { setMessage('error', error.message); }
    finally { setBusy(false); }
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
          <Field label="Event name *"><input required value={form.eventName} onChange={set('eventName')} placeholder="e.g. Birthday celebration" /></Field>
          <Field label="Event date *"><input type="date" required min={new Date().toISOString().slice(0, 10)} value={form.eventDate} onChange={set('eventDate')} /></Field>
          <Field label="Event location / venue *"><input required value={form.eventLocation} onChange={set('eventLocation')} placeholder="Venue name or address" /></Field>
          <Field label="Event theme *"><input required value={form.eventTheme} onChange={set('eventTheme')} placeholder="e.g. Garden, elegant, minimalist" /></Field>
          <Field label="Special requests"><textarea rows="4" maxLength="1500" value={form.specialRequests} onChange={set('specialRequests')} placeholder="Tell us about any preferences or important details…" /></Field>
          <div className="form-actions">
            <button type="button" className="btn btn-outline" onClick={() => navigate('/dashboard')}>Cancel</button>
            <button className="btn btn-primary btn-large" disabled={busy}>{busy ? 'Submitting…' : 'Submit request'} <span>↗</span></button>
          </div>
        </form>
      </div>
    </section>
  );
}
