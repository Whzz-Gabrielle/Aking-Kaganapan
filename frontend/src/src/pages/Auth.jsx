import { useState } from 'react';
import { Link, Navigate, useLocation, useNavigate } from 'react-router-dom';
import { Field } from '../components/ui.jsx';
import { useAuth } from '../context/AuthContext.jsx';

export default function Auth({ mode }) {
  const isLogin = mode === 'login';
  const { user, login, register, setMessage, clearNotice } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [busy, setBusy] = useState(false);
  const [form, setForm] = useState({ fullName: '', email: '', password: '' });

  if (user) return <Navigate to="/dashboard" replace />;

  async function submit(event) {
    event.preventDefault(); setBusy(true); clearNotice();
    try {
      if (isLogin) {
        const u = await login(form.email, form.password);
        navigate(location.state?.from || '/dashboard', { replace: true });
        setMessage('success', `Welcome back, ${u.fullName || 'there'}!`);
      } else {
        await register(form);
        setMessage('success', 'Account created. You can now sign in.');
        navigate('/login', { replace: true });
      }
    } catch (error) { setMessage('error', error.message); }
    finally { setBusy(false); }
  }

  const set = (key) => (e) => setForm({ ...form, [key]: e.target.value });

  return (
    <section className="auth-layout">
      <div className="auth-side">
        <span className="eyebrow">LET'S MAKE IT HAPPEN</span>
        <h1>Your next<br /><em>great moment</em><br />starts here.</h1>
        <p>Sign in to keep planning, or create an account to submit your first event request.</p>
        <div className="auth-side-bottom">✳ &nbsp; Thoughtful plans. Memorable moments.</div>
      </div>
      <div className="auth-panel">
        <div className="auth-panel-head">
          <span className="eyebrow">{isLogin ? 'WELCOME BACK' : 'A NEW BEGINNING'}</span>
          <h2>{isLogin ? 'Sign in to your account' : 'Create your account'}</h2>
          <p>{isLogin ? 'Enter your details below to continue.' : 'A few details and you’re ready to start planning.'}</p>
        </div>
        <form className="form-stack" onSubmit={submit}>
          {!isLogin && <Field label="Full name"><input autoComplete="name" required value={form.fullName} onChange={set('fullName')} placeholder="e.g. Alex Santos" /></Field>}
          <Field label="Email address"><input type="email" autoComplete="email" required value={form.email} onChange={set('email')} placeholder="you@example.com" /></Field>
          <Field label="Password" hint={!isLogin ? 'Use at least 8 characters.' : undefined}>
            <input type="password" autoComplete={isLogin ? 'current-password' : 'new-password'} minLength={!isLogin ? 8 : undefined} required value={form.password} onChange={set('password')} placeholder="Enter your password" />
          </Field>
          <button className="btn btn-primary btn-full btn-large" disabled={busy}>{busy ? 'Please wait…' : isLogin ? 'Sign in' : 'Create account'} <span>↗</span></button>
        </form>
        <p className="auth-switch">
          {isLogin ? 'New to Aking Kaganapan?' : 'Already have an account?'}{' '}
          <Link to={isLogin ? '/register' : '/login'} onClick={clearNotice}>{isLogin ? 'Create an account' : 'Sign in'}</Link>
        </p>
        <p className="form-footnote">By continuing, you agree to our <Link to="/terms">Terms</Link> and <Link to="/privacy">Privacy policy</Link>.</p>
      </div>
    </section>
  );
}
