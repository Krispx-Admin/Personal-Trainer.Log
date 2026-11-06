import { Component } from 'react';
import { RefreshCw } from 'lucide-react';
import Logo from './Logo.jsx';

// Catches render crashes anywhere below it so the coach sees a recover
// screen instead of a blank white page. Data is safe — state lives in
// Supabase; reloading re-hydrates.
export default class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { error: null };
  }

  static getDerivedStateFromError(error) {
    return { error };
  }

  componentDidCatch(error, info) {
    console.error('Fitats crashed:', error, info?.componentStack);
  }

  render() {
    if (!this.state.error) return this.props.children;
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-5 px-6 text-center">
        <div
          className="flex items-center justify-center"
          style={{
            width: 72,
            height: 72,
            borderRadius: 20,
            background: 'var(--c-avatar-bg)',
            border: '1px solid var(--c-avatar-border)',
          }}
        >
          <Logo size={42} />
        </div>
        <div>
          <div className="font-display font-semibold tracking-tight text-xl mb-1.5">
            Something went wrong
          </div>
          <div className="text-[13px] text-txt-secondary max-w-sm">
            Your data is safe in the cloud. Reload to pick up where you left
            off.
          </div>
        </div>
        <button
          onClick={() => window.location.reload()}
          className="h-11 px-5 rounded-full text-[12px] font-semibold uppercase tracking-wider flex items-center gap-2 bg-brand-lime text-black hover:opacity-90"
        >
          <RefreshCw size={14} />
          Reload
        </button>
        {this.state.error?.message && (
          <div className="text-[10px] tabular text-txt-muted max-w-md break-all">
            {String(this.state.error.message)}
          </div>
        )}
      </div>
    );
  }
}
