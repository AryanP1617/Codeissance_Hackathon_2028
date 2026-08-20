import React from 'react';

/* -----------------------------------------------------------------------
 * Small, composable UI primitives shared across the console.
 * Kept dependency-free (no class-variance libs) since the surface area
 * here is small enough that plain prop-driven components stay readable.
 * ---------------------------------------------------------------------*/

export function Chip({ tone = 'neutral', children, icon: Icon }) {
  return (
    <span className={`chip chip-${tone}`}>
      {Icon ? <Icon size={11} strokeWidth={2.5} /> : null}
      {children}
    </span>
  );
}

export function MonoTag({ children }) {
  return <span className="tag-mono">{children}</span>;
}

export function Button({ variant = 'secondary', size = 'md', icon: Icon, block, style, children, ...rest }) {
  const cls = ['btn', `btn-${variant}`, block ? 'btn-block' : '']
    .filter(Boolean)
    .join(' ');
  const padding = size === 'sm' ? '6px 11px' : undefined;
  const fontSize = size === 'sm' ? '12px' : undefined;
  return (
    <button className={cls} style={{ padding, fontSize, ...style }} {...rest}>
      {Icon ? <Icon size={14} /> : null}
      {children}
    </button>
  );
}

/* Source-system taxonomy: a stable colour + label per account type, so the
 * same category always reads the same way anywhere it appears in the app. */
export const SOURCE_SYSTEM_META = {
  EQUITY: { label: 'Equity', color: '#234A8F' },
  MUTUAL_FUNDS: { label: 'Mutual Funds', color: '#0B6B41' },
  LOANS: { label: 'Loans', color: '#8A4B0A' },
  INSURANCE: { label: 'Insurance', color: '#6B3FA0' },
  WEALTH: { label: 'Wealth Mgmt', color: '#0E6B79' },
};

export function SourceBadge({ system }) {
  const meta = SOURCE_SYSTEM_META[system] || { label: system, color: '#67727E' };
  return (
    <span
      className="mono"
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: 6,
        fontSize: 11,
        fontWeight: 600,
        letterSpacing: '0.03em',
        color: meta.color,
      }}
    >
      <span style={{ width: 6, height: 6, borderRadius: '50%', background: meta.color, display: 'inline-block' }} />
      {meta.label.toUpperCase()}
    </span>
  );
}

/* Confidence Match — rendered as a small radial gauge rather than a flat
 * number. This is the one deliberately "designed" moment in an otherwise
 * quiet, data-first interface: every profile-matching decision in this
 * product hinges on this score, so it earns a slightly heavier visual
 * treatment than a plain badge. */
export function ConfidenceRing({ value, size = 56, label }) {
  const radius = (size - 8) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference * (1 - value / 100);
  const tone = value >= 85 ? 'var(--success-500)' : value >= 60 ? 'var(--warning-500)' : 'var(--danger-500)';

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} style={{ flexShrink: 0 }}>
        <circle cx={size / 2} cy={size / 2} r={radius} fill="none" stroke="var(--line-200)" strokeWidth={4} />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke={tone}
          strokeWidth={4}
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          transform={`rotate(-90 ${size / 2} ${size / 2})`}
        />
        <text
          x="50%"
          y="52%"
          textAnchor="middle"
          dominantBaseline="middle"
          className="mono"
          style={{ fontSize: 13, fontWeight: 700, fill: 'var(--ink-900)' }}
        >
          {value}
        </text>
      </svg>
      {label ? (
        <div>
          <div style={{ fontSize: 11, color: 'var(--ink-500)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.04em' }}>
            {label}
          </div>
          <div style={{ fontSize: 12, color: tone, fontWeight: 700 }}>
            {value >= 85 ? 'High confidence' : value >= 60 ? 'Needs review' : 'Low confidence'}
          </div>
        </div>
      ) : null}
    </div>
  );
}

export function Avatar({ name, size = 40, tone = 'brand' }) {
  const initials = name
    .split(' ')
    .map((p) => p[0])
    .slice(0, 2)
    .join('')
    .toUpperCase();
  const bg = tone === 'brand' ? 'var(--brand-800)' : 'var(--ink-700)';
  return (
    <div
      className="mono"
      style={{
        width: size,
        height: size,
        borderRadius: '50%',
        background: bg,
        color: '#fff',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontSize: size * 0.36,
        fontWeight: 600,
        flexShrink: 0,
      }}
    >
      {initials}
    </div>
  );
}

export function RangeSlider({ value, min, max, onChange, trackTone = 'var(--brand-700)' }) {
  const pct = ((value - min) / (max - min)) * 100;
  return (
    <input
      type="range"
      min={min}
      max={max}
      value={value}
      onChange={onChange}
      className="range-input"
      style={{
        background: `linear-gradient(to right, ${trackTone} 0%, ${trackTone} ${pct}%, var(--line-300) ${pct}%, var(--line-300) 100%)`,
        accentColor: trackTone,
      }}
    />
  );
}

export function SectionHeading({ eyebrow, title, description, icon: Icon }) {
  return (
    <div style={{ marginBottom: 20 }}>
      {eyebrow ? (
        <div
          className="mono"
          style={{ fontSize: 11, fontWeight: 600, color: 'var(--brand-600)', letterSpacing: '0.08em', marginBottom: 6 }}
        >
          {eyebrow}
        </div>
      ) : null}
      <h3
        style={{
          fontSize: 17,
          fontWeight: 700,
          color: 'var(--ink-900)',
          margin: 0,
          display: 'flex',
          alignItems: 'center',
          gap: 8,
          fontFamily: 'var(--font-ui)',
        }}
      >
        {Icon ? <Icon size={18} color="var(--brand-700)" strokeWidth={2.2} /> : null}
        {title}
      </h3>
      {description ? (
        <p style={{ fontSize: 13, color: 'var(--ink-500)', margin: '6px 0 0 0', maxWidth: 640, lineHeight: 1.5 }}>
          {description}
        </p>
      ) : null}
    </div>
  );
}
