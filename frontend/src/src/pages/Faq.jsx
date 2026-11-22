import { Link } from 'react-router-dom';
import { PageHeader } from '../components/ui.jsx';

const FAQS = [
  ['How do I request a booking?', 'Create an account, sign in, then choose “Book an event” and fill in your date, venue, theme, and any special requests.'],
  ['What do the booking statuses mean?', 'Pending means your request is waiting for review. Approved means the coordinator accepted it. Completed means the event is done. Cancelled means the booking will not go ahead.'],
  ['How do I know if I have paid?', 'Your dashboard shows a payment status beside each booking: Unpaid, Half Payment, or Fully Paid.'],
  ['Can I edit a booking after submitting?', 'Booking updates are handled by the coordinator. Contact us if you need to change your details.'],
  ['Can I change my name or email?', 'Not from your profile. Please contact the system coordinator.'],
];

export default function Faq() {
  return (
    <div className="static-page">
      <PageHeader eyebrow="FAQ" title={<>Questions, <em>answered.</em></>}>
        Quick answers about requesting and tracking your event.
      </PageHeader>
      <section className="static-section narrow">
        <div className="faq-list">
          {FAQS.map(([q, a]) => (
            <details className="faq-item" key={q}>
              <summary>{q}</summary>
              <p>{a}</p>
            </details>
          ))}
        </div>
        <p className="section-cta">Still have a question? <Link className="text-button" to="/contact">Contact us</Link></p>
      </section>
    </div>
  );
}
