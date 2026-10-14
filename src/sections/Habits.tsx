import { useEffect, useState } from 'react'
import { HABITS, type Impact } from '../data/habits'
import { storageGet, storageSet } from '../lib/format'
import { Kbd, Meter, SectionHeader } from '../components/ui'

const KEY = 'carnet-tokens:habits'
const WEIGHT: Record<Impact, number> = { fort: 3, moyen: 2, faible: 1 }
const GROUPS = [...new Set(HABITS.map((h) => h.group))]

export default function Habits() {
  const [done, setDone] = useState<Record<string, boolean>>(() => storageGet(KEY, {}))
  useEffect(() => storageSet(KEY, done), [done])

  const max = HABITS.reduce((s, h) => s + WEIGHT[h.impact], 0)
  const score = HABITS.reduce((s, h) => s + (done[h.id] ? WEIGHT[h.impact] : 0), 0)
  const next = HABITS.filter((h) => !done[h.id]).sort((a, b) => WEIGHT[b.impact] - WEIGHT[a.impact])[0]

  return (
    <section>
      <SectionHeader
        index="07 — Habitudes"
        title="Votre bilan"
        lead="Cochez ce que vous faites déjà. Les habitudes sont pondérées selon leur impact ; vos réponses restent dans ce navigateur."
      />

      <div className="mb-10 grid gap-6 sm:grid-cols-[200px_1fr] sm:items-end">
        <div>
          <p className="text-xs text-muted">Score pondéré</p>
          <p className="tabular mt-1 font-mono text-5xl text-ink">
            {Math.round((score / max) * 100)}
            <span className="text-xl text-faint"> %</span>
          </p>
          <div className="mt-3">
            <Meter value={score / max} tone={score / max > 0.7 ? 'good' : score / max > 0.4 ? 'warn' : 'bad'} />
          </div>
        </div>
        {next ? (
          <div className="border-l-2 border-accent pl-4">
            <p className="text-xs text-muted">Prochaine habitude à adopter</p>
            <p className="mt-1 font-medium text-ink">{next.title}</p>
            <p className="mt-1 text-sm text-muted">{next.detail}</p>
          </div>
        ) : (
          <p className="border-l-2 border-good pl-4 text-sm text-ink">Toutes les habitudes sont en place.</p>
        )}
      </div>

      <div className="space-y-10">
        {GROUPS.map((g) => (
          <div key={g}>
            <h3 className="mb-3 font-mono text-xs tracking-wide text-faint uppercase">{g}</h3>
            <ul className="divide-y divide-line border-y border-line">
              {HABITS.filter((h) => h.group === g).map((h) => (
                <li key={h.id}>
                  <label className="flex cursor-pointer gap-3 py-3">
                    <input
                      type="checkbox"
                      checked={!!done[h.id]}
                      onChange={(e) => setDone((p) => ({ ...p, [h.id]: e.target.checked }))}
                      className="mt-1 h-4 w-4 shrink-0 accent-[var(--accent)]"
                    />
                    <span className="min-w-0 flex-1">
                      <span className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
                        <span className={`text-[15px] ${done[h.id] ? 'text-muted line-through decoration-faint' : 'text-ink'}`}>
                          {h.title}
                        </span>
                        {h.cmd && <Kbd>{h.cmd}</Kbd>}
                      </span>
                      <span className="mt-0.5 block text-sm text-muted">{h.detail}</span>
                    </span>
                    <span
                      className={`h-fit shrink-0 rounded px-1.5 py-0.5 font-mono text-[11px] ${
                        h.impact === 'fort'
                          ? 'bg-accent-soft text-accent'
                          : h.impact === 'moyen'
                            ? 'bg-sunken text-muted'
                            : 'text-faint'
                      }`}
                    >
                      {h.impact}
                    </span>
                  </label>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>

      <button
        type="button"
        onClick={() => setDone({})}
        className="mt-8 text-sm text-muted underline decoration-line underline-offset-4 hover:text-ink"
      >
        Tout décocher
      </button>
    </section>
  )
}
