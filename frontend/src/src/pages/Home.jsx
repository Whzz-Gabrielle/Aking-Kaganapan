import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';

export default function Home() {
  const { user } = useAuth();
  return (
    <>
      <section className="hero">
        <div className="hero-copy">
          <span className="eyebrow"><span className="eyebrow-dot" /> YOUR DAY, YOUR WAY</span>
          <h1>Make every<br /><em>moment</em> count.</h1>
          <p>From intimate celebrations to big milestones, bring your event ideas to life with a booking experience that keeps everything organized.</p>
          <div className="hero-actions">
            <Link className="btn btn-primary btn-large" to={user ? '/bookings/new' : '/register'}>Start planning <span>↗</span></Link>
            {!user && <Link className="text-button" to="/login">Already have an account? Sign in</Link>}
          </div>
          <div className="hero-trust">
            <div className="avatar-stack"><span>A</span><span>M</span><span>J</span></div>
            <span><strong>One place for your plans</strong><small>Requests, updates, and details together</small></span>
          </div>
        </div>
        <div className="hero-art">
          <div className="art-glow" />
          <div className="art-card art-card-back"><span className="art-spark">✳</span><small>THE LITTLE DETAILS</small><strong>Make it<br />unforgettable.</strong><span className="art-line" /></div>
          <div className="art-card art-card-front">
            <div className="art-image"><span className="image-label">CELEBRATE YOUR WAY</span><span className="sun-shape" /><span className="hill hill-one" /><span className="hill hill-two" /><span className="flower flower-one">✿</span><span className="flower flower-two">✿</span></div>
            <div className="art-card-info"><div><small>YOUR NEXT CHAPTER</small><strong>Starts with a plan.</strong></div><span className="round-arrow">↗</span></div>
          </div>
          <div className="floating-note"><span>✦</span><div><strong>One less thing to worry about</strong><small>Your booking details, all in one place</small></div></div>
        </div>
      </section>

      <section className="feature-strip">
        <div><span className="feature-icon">✎</span><span><strong>Easy booking requests</strong><small>Share your event details in minutes.</small></span></div>
        <div><span className="feature-icon">◷</span><span><strong>Clear status updates</strong><small>Know where your request stands.</small></span></div>
        <div><span className="feature-icon">♡</span><span><strong>Plans in one place</strong><small>Keep your event details organized.</small></span></div>
      </section>

      <section className="steps-section">
        <div className="section-heading"><span className="eyebrow">A SIMPLE WAY TO PLAN</span><h2>From idea to <em>occasion.</em></h2><p>Three simple steps to get your event plans moving.</p></div>
        <div className="steps-grid">
          <article><span className="step-number">01</span><h3>Create your account</h3><p>Sign up so your event requests and updates stay connected to you.</p></article>
          <article><span className="step-number">02</span><h3>Tell us your vision</h3><p>Submit your date, venue, theme, and any special requests.</p></article>
          <article><span className="step-number">03</span><h3>Follow your booking</h3><p>Check your dashboard for the latest booking and payment status.</p></article>
        </div>
        <p className="section-cta"><Link className="text-button" to="/services">See what we can help with →</Link></p>
      </section>
    </>
  );
}
