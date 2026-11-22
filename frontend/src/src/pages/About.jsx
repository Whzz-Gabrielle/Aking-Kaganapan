import { Link } from 'react-router-dom';
import { PageHeader } from '../components/ui.jsx';

export default function About() {
  return (
    <div className="static-page">
      <PageHeader eyebrow="ABOUT US" title={<>Events, <em>thoughtfully</em> planned.</>}>
        Aking Kaganapan is an event booking system that keeps requests, approvals, and payment status in one place, for clients and for the coordinator.
      </PageHeader>

      <section className="static-section">
        <div className="two-col">
          <div>
            <h2>What we do</h2>
            <p>Clients submit an event request with their date, venue, theme, and special requests. The coordinator reviews each request, updates its status, and tracks payment as the plan moves forward.</p>
          </div>
          <div>
            <h2>Why it helps</h2>
            <p>No more scattered messages. Everyone sees the same booking details, and you can check where your request stands any time from your dashboard.</p>
          </div>
        </div>
      </section>

      <section className="static-section">
        <h2>How we work</h2>
        <div className="card-grid">
          <article className="info-card"><span className="step-number">01</span><h3>Clear</h3><p>Plain booking statuses: Pending, Approved, Completed, or Cancelled.</p></article>
          <article className="info-card"><span className="step-number">02</span><h3>Organized</h3><p>Every request keeps its details together, from theme to special requests.</p></article>
          <article className="info-card"><span className="step-number">03</span><h3>Transparent</h3><p>Payment status is shown alongside the booking so nothing is a surprise.</p></article>
        </div>
      </section>

      <section className="cta-band">
        <h2>Ready to plan your event?</h2>
        <Link className="btn btn-primary btn-large" to="/register">Create an account <span>↗</span></Link>
      </section>
    </div>
  );
}
