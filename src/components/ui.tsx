import type { ButtonHTMLAttributes, ReactNode } from 'react';
import { useObjectUrl } from '../lib/hooks';

export type IconName =
  | 'lens' | 'journal' | 'settings' | 'back' | 'flash' | 'gallery' | 'flip'
  | 'leaf' | 'check' | 'warn' | 'download' | 'trash' | 'eye';

const PATHS: Record<IconName, ReactNode> = {
  lens: (<><circle cx="12" cy="12" r="9" /><circle cx="12" cy="12" r="3.6" /></>),
  journal: <path d="M5 4h11a3 3 0 0 1 3 3v13H8a3 3 0 0 1-3-3V4zM5 17a3 3 0 0 1 3-3h11" />,
  settings: (<><path d="M4 7h8M17 7h3M4 17h3M12 17h8" /><circle cx="14.5" cy="7" r="2.5" /><circle cx="9.5" cy="17" r="2.5" /></>),
  back: <path d="M15 5l-7 7 7 7" />,
  flash: <path d="M13 3L5 13.5h6L10 21l8-10.5h-6L13 3z" />,
  gallery: (<><rect x="4" y="5" width="16" height="14" rx="2.5" /><circle cx="9" cy="10" r="1.5" /><path d="M20 16l-4.5-4.5L7 19" /></>),
  flip: <path d="M4 8h13l-3-3M20 16H7l3 3" />,
  leaf: <path d="M5 19c0-9 5-14 14-14 0 9-5 14-14 14zM5 19l8-8" />,
  check: <path d="M5 12.5l4.5 4.5L19 7" />,
  warn: <path d="M12 4l9 16H3L12 4zM12 10v4M12 17v.5" />,
  download: <path d="M12 4v11M7 11l5 5 5-5M5 20h14" />,
  trash: <path d="M5 7h14M9 7V4h6v3M7 7l1 13h8l1-13" />,
  eye: (<><path d="M2.5 12S6 5.5 12 5.5 21.5 12 21.5 12 18 18.5 12 18.5 2.5 12 2.5 12z" /><circle cx="12" cy="12" r="2.8" /></>),
};

export function Icon({ name, size = 24, className = '' }: { name: IconName; size?: number; className?: string }) {
  return (
    <svg
      width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor"
      strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" className={className}
    >
      {PATHS[name]}
    </svg>
  );
}

/** Lens ring with a leaf at its centre. Same shapes as public/icon.svg. */
export function Logo({ size = 40 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 64 64" fill="none" aria-hidden="true">
      <circle cx="32" cy="32" r="26" stroke="currentColor" strokeWidth="3.5" />
      <path d="M20 42c0-11 6-18 24-18 0 11-6 18-24 18z" fill="currentColor" />
      <path d="M20 42l14-11" stroke="rgb(var(--paper))" strokeWidth="2.2" strokeLinecap="round" />
    </svg>
  );
}

type Variant = 'primary' | 'secondary' | 'quiet' | 'danger';

export function Button({
  variant = 'primary', icon, children, className = '', ...rest
}: ButtonHTMLAttributes<HTMLButtonElement> & { variant?: Variant; icon?: IconName }) {
  const styles: Record<Variant, string> = {
    primary: 'bg-moss text-moss-ink',
    secondary: 'border-2 border-moss text-ink bg-transparent',
    quiet: 'text-ink underline underline-offset-4 decoration-line',
    danger: 'border-2 border-clay text-clay bg-transparent',
  };
  return (
    <button
      {...rest}
      className={`press inline-flex min-h-14 items-center justify-center gap-2 rounded-full px-7 text-[1.0625rem] font-semibold disabled:opacity-50 ${styles[variant]} ${className}`}
    >
      {icon && <Icon name={icon} size={22} />}
      {children}
    </button>
  );
}

export function BackButton({ onClick, label = 'Back' }: { onClick: () => void; label?: string }) {
  return (
    <button onClick={onClick} className="press -ml-2 inline-flex min-h-12 items-center gap-1 rounded-full px-2 pr-4 font-medium text-ink">
      <Icon name="back" /> {label}
    </button>
  );
}

export function Rule({ className = '' }: { className?: string }) {
  return <hr className={`border-0 border-t border-line ${className}`} />;
}

export function Photo({ blob, alt, className = '' }: { blob: Blob | null | undefined; alt: string; className?: string }) {
  const url = useObjectUrl(blob);
  if (!url) return <div className={`bg-sand ${className}`} aria-hidden="true" />;
  return <img src={url} alt={alt} className={`reveal object-cover ${className}`} draggable={false} />;
}

export function ProgressBar({ value, label }: { value: number; label: string }) {
  return (
    <div role="progressbar" aria-label={label} aria-valuemin={0} aria-valuemax={100} aria-valuenow={Math.round(value * 100)}
      className="h-2 w-full overflow-hidden rounded-full bg-sand">
      <div className="h-full rounded-full bg-moss transition-[width] duration-300" style={{ width: `${Math.round(value * 100)}%` }} />
    </div>
  );
}

/** Small status line such as "● Local AI". Colour is never the only signal: the text says it too. */
export function StatusPill({ children, tone = 'moss' }: { children: ReactNode; tone?: 'moss' | 'clay' }) {
  return (
    <span className={`inline-flex min-h-8 items-center gap-2 rounded-full border border-line bg-card px-3 text-[0.9375rem] font-medium ${tone === 'clay' ? 'text-clay' : 'text-ink'}`}>
      <span aria-hidden="true" className={`h-2.5 w-2.5 rounded-full ${tone === 'clay' ? 'bg-clay' : 'bg-moss'}`} />
      {children}
    </span>
  );
}

export function Notice({ title, children, action, tone = 'sand' }: {
  title: string; children?: ReactNode; action?: ReactNode; tone?: 'sand' | 'sky' | 'clay';
}) {
  const bg = tone === 'sky' ? 'bg-sky' : 'bg-sand';
  const border = tone === 'clay' ? 'border-clay' : 'border-transparent';
  return (
    <div role="note" className={`rounded-2xl border ${border} ${bg} p-5`}>
      <p className="font-semibold">{title}</p>
      {children && <div className="mt-1 text-soft">{children}</div>}
      {action && <div className="mt-4">{action}</div>}
    </div>
  );
}
