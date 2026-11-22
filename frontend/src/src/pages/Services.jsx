import { Link } from 'react-router-dom';
import { PageHeader } from '../components/ui.jsx';

// Static content for now. Swap for data from /api/packages and /api/venues
// once those routes are registered in server.js.
const SERVICES = [
  { icon: '✿', title: 'Weddings', text: 'Ceremonies and receptions planned around your date, venue, and theme.' },
  { icon: '✦', title: 'Birthdays', text: 'From small gatherings to big celebrations, with details tracked in one place.' },
  { icon: '♡', title: 'Debuts & milestones', text: 'Mark the big moments with a plan that is organized from the first request.' },
  { icon: '▤', title: 'Corporate events', text: 'Meetings, launches, and team gatherings submitted and tracked as bookings.' },
  { icon: '✳', title: 'Christenings & family', text: 'Intimate family occasions with your special requests noted up front.' },
  { icon: '◷', title: 'Custom events', text: 'Something different in mind? Describe it in your request and the coordinator will review it.' },
];

export default function Services() {
  return (
    <div className="static-page">
      <PageHeader eyebrow="SERVICES" title={<>Celebrate <em>your way.</em></>}>
        Whatever the occasion, start with a booking request and follow it from review to completion.
      </PageHeader>

      <section className="static-section">
        <div className="card-grid">
          {SERVICES.map((s) => (
            <article className="info-card" key={s.title}>
              <span className="feature-icon">{s.icon}</span>
              <h3>{s.title}</h3>
              <p>{s.text}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="cta-band">
        <h2>Have an event in mind?</h2>
        <Link className="btn btn-primary btn-large" to="/bookings/new">Request a booking <span>↗</span></Link>
      </section>
    </div>
  );
}
