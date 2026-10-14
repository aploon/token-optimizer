import { useState, type ReactNode } from 'react'

export function SectionHeader({ index, title, lead }: { index: string; title: string; lead: ReactNode }) {
  return (
    <header className="mb-8 max-w-2xl">
      <p className="font-mono text-xs tracking-wide text-faint">{index}</p>
      <h2 className="mt-1 font-display text-3xl leading-tight text-ink sm:text-4xl">{title}</h2>
      <p className="mt-3 text-[15px] leading-relaxed text-muted">{lead}</p>
    </header>
  )
}

export function Card({ children, className = '' }: { children: ReactNode; className?: string }) {
  return <div className={`rounded-lg border border-line bg-surface ${className}`}>{children}</div>
}

export function Stat({
  label,
  value,
  hint,
  tone = 'ink',
}: {
  label: string
  value: ReactNode
  hint?: ReactNode
  tone?: 'ink' | 'accent' | 'good' | 'warn' | 'bad'
}) {
  const color = {
    ink: 'text-ink',
    accent: 'text-accent',
    good: 'text-good',
    warn: 'text-warn',
    bad: 'text-bad',
  }[tone]
  return (
    <div className="border-t border-line pt-3">
      <p className="text-xs text-muted">{label}</p>
      <p className={`tabular mt-1 font-mono text-2xl font-medium ${color}`}>{value}</p>
      {hint && <p className="mt-0.5 text-xs text-faint">{hint}</p>}
    </div>
  )
}

export function Slider({
  label,
  value,
  min,
  max,
  step = 1,
  onChange,
  display,
}: {
  label: string
  value: number
  min: number
  max: number
  step?: number
  onChange: (v: number) => void
  display?: string
}) {
  return (
    <label className="block">
      <span className="flex items-baseline justify-between gap-3 text-sm">
        <span className="text-muted">{label}</span>
        <span className="tabular font-mono text-ink">{display ?? value}</span>
      </span>
      <input
        type="range"
        className="mt-2 w-full"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
      />
    </label>
  )
}

export function Segmented<T extends string | number>({
  options,
  value,
  onChange,
}: {
  options: { value: T; label: string }[]
  value: T
  onChange: (v: T) => void
}) {
  return (
    <div className="inline-flex flex-wrap rounded-md border border-line bg-sunken p-0.5">
      {options.map((o) => (
        <button
          key={String(o.value)}
          type="button"
          onClick={() => onChange(o.value)}
          className={`rounded px-3 py-1.5 text-sm transition-colors ${
            o.value === value ? 'bg-surface text-ink shadow-sm' : 'text-muted hover:text-ink'
          }`}
        >
          {o.label}
        </button>
      ))}
    </div>
  )
}

export function Note({ children, tone = 'neutral' }: { children: ReactNode; tone?: 'neutral' | 'accent' }) {
  return (
    <div
      className={`border-l-2 py-1 pl-4 text-sm leading-relaxed ${
        tone === 'accent' ? 'border-accent text-ink' : 'border-line text-muted'
      }`}
    >
      {children}
    </div>
  )
}

export function Kbd({ children }: { children: ReactNode }) {
  return (
    <code className="rounded border border-line bg-sunken px-1.5 py-0.5 font-mono text-[0.85em] text-ink">
      {children}
    </code>
  )
}

export function CopyButton({ text, label = 'Copier' }: { text: string; label?: string }) {
  const [done, setDone] = useState(false)
  return (
    <button
      type="button"
      onClick={async () => {
        try {
          await navigator.clipboard.writeText(text)
          setDone(true)
          setTimeout(() => setDone(false), 1400)
        } catch {
          /* presse-papiers indisponible */
        }
      }}
      className="rounded border border-line px-2 py-1 text-xs text-muted hover:border-ink hover:text-ink"
    >
      {done ? 'Copié' : label}
    </button>
  )
}

export function Meter({ value, tone }: { value: number; tone?: 'good' | 'warn' | 'bad' | 'accent' }) {
  const v = Math.max(0, Math.min(1, value))
  const t = tone ?? (v < 0.5 ? 'good' : v < 0.8 ? 'warn' : 'bad')
  const bg = { good: 'bg-good', warn: 'bg-warn', bad: 'bg-bad', accent: 'bg-accent' }[t]
  return (
    <div className="h-1.5 w-full overflow-hidden rounded-full bg-sunken">
      <div className={`h-full ${bg} transition-[width] duration-300`} style={{ width: `${v * 100}%` }} />
    </div>
  )
}
