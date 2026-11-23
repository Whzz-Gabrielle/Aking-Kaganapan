import { Link } from 'react-router-dom';
import { PageHeader } from '../components/ui.jsx';
import { SITE } from '../config/site.js';

export default function Contact() {
  return (
    <div className="static-page">
      <PageHeader eyebrow="CONTACT" title={<>Let’s <em>talk.</em></>}>
        Questions about an existing request or an upcoming event? Reach out below.
      </PageHeader>
      <section className="static-section">
        <div className="card-grid two">
          <article className="info-card">
            <span className="feature-icon">✉</span>
            <h3>Email</h3>
            <p><a href={`mailto:${SITE.contactEmail}`}>{SITE.contactEmail}</a></p>
            {SITE.contactPhone && <p>{SITE.contactPhone}</p>}
            {SITE.address && <p>{SITE.address}</p>}
          </article>
          <article className="info-card">
            <span className="feature-icon">✎</span>
            <h3>Ready to book?</h3>
            <p>The fastest way to get started is to submit a booking request. You can follow its status from your dashboard.</p>
            <Link className="btn btn-primary" to="/bookings/new">Request a booking</Link>
          </article>
        </div>
      </section>
    </div>
  );
}
