import { Link } from 'react-router-dom';
import { packagesApi, venuesApi } from '../api/services.js';
import { EmptyState, ErrorState, PageHeader, Spinner } from '../components/ui.jsx';
import { useAuth } from '../context/AuthContext.jsx';
import { useApi } from '../hooks/useApi.js';
import { formatPrice } from '../utils/format.js';

const OCCASIONS = [
  { icon: '✿', title: 'Weddings', text: 'Ceremonies and receptions planned around your date, venue, and theme.' },
  { icon: '✦', title: 'Birthdays', text: 'From small gatherings to big celebrations, with details tracked in one place.' },
  { icon: '♡', title: 'Debuts & milestones', text: 'Mark the big moments with a plan that is organized from the first request.' },
  { icon: '▤', title: 'Corporate events', text: 'Meetings, launches, and team gatherings submitted and tracked as bookings.' },
  { icon: '✳', title: 'Christenings & family', text: 'Intimate family occasions with your special requests noted up front.' },
  { icon: '◷', title: 'Custom events', text: 'Something different in mind? Describe it in your request.' },
];

function CardImage({ src, name }) {
  return src
    ? <img className="catalog-img" src={src} alt={name} loading="lazy" />
    : <div className="catalog-img catalog-img-fallback" aria-hidden="true">{name?.[0]?.toUpperCase() || '✳'}</div>;
}

function Inclusions({ items }) {
  if (!items?.length) return null;
  return (
    <ul className="inclusions">
      {items.slice(0, 4).map((i) => <li key={i}>{i}</li>)}
      {items.length > 4 && <li className="more">+{items.length - 4} more</li>}
    </ul>
  );
}

function PackageCard({ p, canBook }) {
  return (
    <article className="catalog-card">
      <CardImage src={p.imageUrl} name={p.packageName} />
      <div className="catalog-body">
        <div className="badges"><span className="badge">{p.eventType}</span>{p.pax > 0 && <span className="badge badge-soft">{p.pax} pax</span>}{p.isAvailable === false && <span className="badge badge-off">Unavailable</span>}</div>
        <h3>{p.packageName}</h3>
        {(p.eventTheme || p.colorMotif) && <small className="catalog-sub">{[p.eventTheme, p.colorMotif].filter(Boolean).join(' · ')}</small>}
        {p.description && <p>{p.description}</p>}
        <Inclusions items={p.inclusions} />
        <div className="catalog-foot">
          <strong className="price">{formatPrice(p.price)}</strong>
          {canBook && p.isAvailable !== false && <Link className="btn btn-primary btn-sm" to={`/bookings/new?package=${p._id}`}>Book this</Link>}
        </div>
      </div>
    </article>
  );
}

function VenueCard({ v, canBook }) {
  return (
    <article className="catalog-card">
      <CardImage src={v.imageUrl} name={v.venueName} />
      <div className="catalog-body">
        <div className="badges"><span className="badge">{v.venueType}</span><span className="badge badge-soft">Up to {v.capacity}</span>{v.isAvailable === false && <span className="badge badge-off">Unavailable</span>}</div>
        <h3>{v.venueName}</h3>
        <small className="catalog-sub">{v.address}</small>
        {v.description && <p>{v.description}</p>}
        <Inclusions items={v.inclusions} />
        <div className="catalog-foot">
          <strong className="price">{v.rentalPrice > 0 ? formatPrice(v.rentalPrice) : 'Ask for rate'}</strong>
          {canBook && v.isAvailable !== false && <Link className="btn btn-primary btn-sm" to={`/bookings/new?venue=${v._id}`}>Book here</Link>}
        </div>
      </div>
    </article>
  );
}

function CatalogSection({ title, intro, query, render }) {
  const { data, loading, error, reload } = query;
  const items = Array.isArray(data) ? data : [];
  return (
    <section className="static-section">
      <h2>{title}</h2>
      <p>{intro}</p>
      {loading ? <Spinner label={`Loading ${title.toLowerCase()}…`} />
        : error ? <ErrorState message={error} onRetry={reload} />
        : items.length === 0 ? <EmptyState title={`No ${title.toLowerCase()} yet`}>Please check back soon.</EmptyState>
        : <div className="card-grid catalog-grid">{items.map(render)}</div>}
    </section>
  );
}

export default function Services() {
  const { user, isCoordinator } = useAuth();
  const packages = useApi(packagesApi.list, { enabled: !!user });
  const venues = useApi(venuesApi.list, { enabled: !!user });
  const canBook = !!user && !isCoordinator;

  return (
    <div className="static-page">
      <PageHeader eyebrow="SERVICES" title={<>Celebrate <em>your way.</em></>}>
        Browse our packages and venues, then start a booking request and follow it from review to completion.
      </PageHeader>

      {user ? (
        <>
          <CatalogSection title="Packages" intro="Ready-made event packages with their inclusions." query={packages} render={(p) => <PackageCard key={p._id} p={p} canBook={canBook} />} />
          <CatalogSection title="Venues" intro="Places to hold your event, with capacity and rental rates." query={venues} render={(v) => <VenueCard key={v._id} v={v} canBook={canBook} />} />
        </>
      ) : (
        <>
          <section className="static-section">
            <h2>What we can help with</h2>
            <div className="card-grid">
              {OCCASIONS.map((s) => (
                <article className="info-card" key={s.title}><span className="feature-icon">{s.icon}</span><h3>{s.title}</h3><p>{s.text}</p></article>
              ))}
            </div>
          </section>
          <section className="cta-band">
            <h2>Want to see packages and venues?</h2>
            <p>Sign in to view our current packages, venues, and prices.</p>
            <Link className="btn btn-primary btn-large" to="/login" state={{ from: '/services' }}>Sign in <span>↗</span></Link>
          </section>
        </>
      )}
    </div>
  );
}
