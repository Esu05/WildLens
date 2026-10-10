/**
 * Quiet decoration behind the app window on tablets and desktops: line-art leaves,
 * a sprig and lens rings on a repeating tile. Flat colour only, no gradients.
 * Hidden on phones, where the app fills the screen.
 */
export function Backdrop() {
  return (
    <svg
      aria-hidden="true"
      focusable="false"
      className="pointer-events-none fixed inset-0 hidden h-full w-full sm:block"
      style={{ color: 'rgb(var(--sage))' }}
    >
      <defs>
        <pattern id="wl-tile" width="220" height="220" patternUnits="userSpaceOnUse">
          <g fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" opacity="0.55">
            {/* single leaf */}
            <g transform="translate(46 64) rotate(-32)">
              <path d="M0 0c0-20 11-34 34-34 0 20-11 34-34 34zM0 0l25-25" />
            </g>
            {/* lens ring */}
            <g transform="translate(160 44)">
              <circle r="13" />
              <circle r="5" />
            </g>
            {/* sprig */}
            <g transform="translate(118 176) rotate(18)">
              <path d="M0 0v-52M0 -12c-12 -2 -16 -9 -16 -18 9 0 16 7 16 18zM0 -26c12 -2 16 -9 16 -18 -9 0 -16 7 -16 18zM0 -40c-7 -2 -10 -8 -10 -15 7 2 10 8 10 15z" />
            </g>
            {/* small leaf */}
            <g transform="translate(36 188) rotate(150) scale(0.75)">
              <path d="M0 0c0-20 11-34 34-34 0 20-11 34-34 34zM0 0l25-25" />
            </g>
          </g>
          <g fill="currentColor" opacity="0.5">
            <circle cx="196" cy="120" r="2" />
            <circle cx="88" cy="112" r="2" />
            <circle cx="14" cy="130" r="1.5" />
          </g>
        </pattern>
      </defs>
      <rect width="100%" height="100%" fill="url(#wl-tile)" />
    </svg>
  );
}