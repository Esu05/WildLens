import { Icon, type IconName } from './ui';

export type Tab = 'identify' | 'journal' | 'settings';

const TABS: { id: Tab; label: string; icon: IconName }[] = [
  { id: 'identify', label: 'Identify', icon: 'lens' },
  { id: 'journal', label: 'Journal', icon: 'journal' },
  { id: 'settings', label: 'Settings', icon: 'settings' },
];

export function BottomNav({ active, onChange }: { active: Tab; onChange: (t: Tab) => void }) {
  return (
    <nav
      aria-label="Main"
      className="sticky bottom-0 z-20 mt-auto w-full border-t border-line bg-paper pb-[env(safe-area-inset-bottom)]"
    >
      <ul className="grid grid-cols-3">
        {TABS.map((t) => {
          const on = t.id === active;
          return (
            <li key={t.id}>
              <button
                onClick={() => onChange(t.id)}
                aria-current={on ? 'page' : undefined}
                className={`press flex min-h-16 w-full flex-col items-center justify-center gap-0.5 text-[0.9375rem] ${on ? 'font-semibold text-ink' : 'text-soft'}`}
              >
                <span className={`flex h-8 w-14 items-center justify-center rounded-full ${on ? 'bg-sand' : ''}`}>
                  <Icon name={t.icon} size={24} />
                </span>
                {t.label}
              </button>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}