import { PageHeader } from '../components/ui.jsx';

// Placeholder copy: have it reviewed before launch.
function LegalPage({ eyebrow, title, intro, sections }) {
  return (
    <div className="static-page">
      <PageHeader eyebrow={eyebrow} title={title}>{intro}</PageHeader>
      <section className="static-section narrow prose">
        {sections.map(([h, p]) => <div key={h}><h2>{h}</h2><p>{p}</p></div>)}
      </section>
    </div>
  );
}

export function Privacy() {
  return <LegalPage eyebrow="PRIVACY" title={<>Privacy <em>policy.</em></>} intro="How your information is used in this system." sections={[
    ['Information we collect', 'Your name, email address, and the event details you submit in booking requests.'],
    ['How it is used', 'To create your account, process booking requests, and show you booking and payment status.'],
    ['Your account', 'Passwords are handled by the backend. To correct or remove your information, contact the system coordinator.'],
  ]} />;
}

export function Terms() {
  return <LegalPage eyebrow="TERMS" title={<>Terms of <em>use.</em></>} intro="Please use this service responsibly." sections={[
    ['Bookings', 'A submitted request is not a confirmed booking until the coordinator approves it.'],
    ['Accounts', 'You are responsible for keeping your sign-in details secure and for the accuracy of information you submit.'],
    ['Changes', 'These terms may be updated as the system develops.'],
  ]} />;
}
