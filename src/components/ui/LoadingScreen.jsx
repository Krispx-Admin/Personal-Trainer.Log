import Logo from './Logo.jsx';

// Branded full-screen loader — replaces the bare "Loading..." text.
export default function LoadingScreen({ label = 'Loading' }) {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center gap-5">
      <div
        className="flex items-center justify-center animate-pulse"
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
      <div className="flex items-center gap-1.5">
        {[0, 1, 2].map((i) => (
          <span
            key={i}
            className="w-1.5 h-1.5 rounded-full bg-brand-lime"
            style={{
              animation: 'pulseLime 1.2s ease-in-out infinite',
              animationDelay: `${i * 0.18}s`,
              opacity: 0.85,
            }}
          />
        ))}
      </div>
      <div className="text-[11px] uppercase tracking-[0.22em] font-semibold text-txt-muted">
        {label}
      </div>
    </div>
  );
}
