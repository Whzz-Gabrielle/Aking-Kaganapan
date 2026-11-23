import { Component } from 'react';

// Catches render errors so one broken page shows a friendly message instead of a blank screen.
export default class ErrorBoundary extends Component {
  state = { error: null };

  static getDerivedStateFromError(error) { return { error }; }

  componentDidCatch(error, info) {
    console.error('Unhandled UI error:', error, info?.componentStack);
  }

  render() {
    if (!this.state.error) return this.props.children;
    return (
      <section className="restricted" role="alert">
        <span>✳</span>
        <h2>Something went wrong</h2>
        <p>This page ran into a problem. Your data is safe — try reloading, or go back to the start.</p>
        <div className="form-actions" style={{ justifyContent: 'center' }}>
          <button className="btn btn-outline" onClick={() => window.location.reload()}>Reload page</button>
          <a className="btn btn-primary" href="/">Back to home</a>
        </div>
      </section>
    );
  }
}
