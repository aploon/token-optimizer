import { useState } from 'react'
import { compact, fmt, pct } from '../lib/format'
import { CONTEXT_WINDOWS } from '../data/models'
import { Card, Kbd, Note, SectionHeader, Segmented, Slider } from '../components/ui'

interface Source {
  id: string
  name: string
  what: string
  tip: React.ReactNode
  max: number
  step: number
  initial: number
  optimized: number
  color: string
}

const SOURCES: Source[] = [
  {
    id: 'system',
    name: 'Prompt système',
    what: 'Instructions de base de Claude Code',
    tip: 'Fixe, et mis en cache automatiquement. Vous ne le contrôlez pas directement.',
    max: 20_000,
    step: 500,
    initial: 4_200,
    optimized: 4_200,
    color: '#8a8273',
  },
  {
    id: 'claudemd',
    name: 'CLAUDE.md',
    what: 'Chargé à chaque session',
    tip: (
      <>
        Visez moins de 200 lignes. Déplacez les workflows spécialisés (revue de PR, migrations) dans des skills, qui ne se
        chargent qu'à la demande.
      </>
    ),
    max: 20_000,
    step: 100,
    initial: 4_500,
    optimized: 1_500,
    color: '#4f8a68',
  },
  {
    id: 'mcp',
    name: 'Serveurs MCP',
    what: 'Noms d’outils + instructions des serveurs',
    tip: (
      <>
        Les définitions complètes sont différées, mais chaque serveur ajoute ses noms d'outils et instructions. <Kbd>/mcp</Kbd>{' '}
        pour désactiver ceux que vous n'utilisez pas, et préférez les CLI (<Kbd>gh</Kbd>, <Kbd>aws</Kbd>…).
      </>
    ),
    max: 30_000,
    step: 500,
    initial: 6_000,
    optimized: 1_500,
    color: '#c4552f',
  },
  {
    id: 'memory',
    name: 'Mémoire',
    what: 'Souvenirs persistants',
    tip: 'Faites le ménage régulièrement : les souvenirs périmés coûtent à chaque session.',
    max: 10_000,
    step: 100,
    initial: 1_200,
    optimized: 600,
    color: '#5b7db1',
  },
  {
    id: 'skills',
    name: 'Skills & plugins',
    what: 'Descriptions des skills disponibles',
    tip: 'Seules les descriptions sont chargées. Désinstallez les plugins dont vous ne vous servez jamais.',
    max: 10_000,
    step: 100,
    initial: 1_400,
    optimized: 900,
    color: '#b08a2e',
  },
  {
    id: 'history',
    name: 'Historique',
    what: 'Messages, lectures de fichiers, sorties d’outils',
    tip: (
      <>
        Le poste qui grossit le plus. <Kbd>/clear</Kbd> entre deux tâches, des hooks pour filtrer les sorties de tests et de
        logs, des sous-agents pour les opérations verbeuses.
      </>
    ),
    max: 900_000,
    step: 1_000,
    initial: 60_000,
    optimized: 12_000,
    color: '#7d6aa8',
  },
  {
    id: 'message',
    name: 'Votre message',
    what: 'Ce que vous écrivez maintenant',
    tip: 'Le plus petit poste. Un message précis évite surtout des lectures de fichiers inutiles ensuite.',
    max: 20_000,
    step: 50,
    initial: 300,
    optimized: 300,
    color: 'var(--ink)',
  },
]

export default function Context() {
  const [values, setValues] = useState<Record<string, number>>(() =>
    Object.fromEntries(SOURCES.map((s) => [s.id, s.initial])),
  )
  const [selected, setSelected] = useState('mcp')
  const [windowSize, setWindowSize] = useState(200_000)

  const total = SOURCES.reduce((sum, s) => sum + values[s.id], 0)
  const optimizedTotal = SOURCES.reduce((sum, s) => sum + Math.min(values[s.id], s.optimized), 0)
  const yours = values.message
  const sel = SOURCES.find((s) => s.id === selected)!

  return (
    <section>
      <SectionHeader
        index="02 — Contexte"
        title="D'où viennent vos tokens"
        lead={
          <>
            Votre message n'est qu'une petite partie de ce qui est envoyé. À chaque échange, Claude relit le prompt système,
            CLAUDE.md, les outils MCP, la mémoire et tout l'historique. Ajustez les curseurs selon ce que <Kbd>/context</Kbd>{' '}
            affiche chez vous.
          </>
        }
      />

      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <p className="text-sm text-muted">
          <span className="tabular font-mono text-ink">{fmt(total)}</span> / {compact(windowSize)} tokens —{' '}
          <span className="text-ink">{pct(total / windowSize, 1)}</span> de la fenêtre
        </p>
        <Segmented
          options={CONTEXT_WINDOWS.map((w) => ({ value: w, label: `Fenêtre ${compact(w)}` }))}
          value={windowSize}
          onChange={setWindowSize}
        />
      </div>

      {/* Barre empilée */}
      <div className="flex h-8 w-full overflow-hidden rounded-md border border-line bg-sunken">
        {SOURCES.map((s) => {
          const w = (values[s.id] / windowSize) * 100
          return (
            <button
              key={s.id}
              type="button"
              onClick={() => setSelected(s.id)}
              title={`${s.name} : ${fmt(values[s.id])} tokens`}
              className="h-full transition-[width,opacity] duration-300 hover:opacity-80"
              style={{
                width: `${Math.min(w, 100)}%`,
                background: s.color,
                opacity: selected === s.id ? 1 : 0.55,
              }}
            />
          )
        })}
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-[1fr_320px]">
        <Card className="divide-y divide-line">
          {SOURCES.map((s) => (
            <div
              key={s.id}
              className={`grid cursor-pointer grid-cols-[12px_1fr] gap-x-3 px-4 py-3 transition-colors sm:grid-cols-[12px_1fr_220px] ${
                selected === s.id ? 'bg-sunken' : ''
              }`}
              onClick={() => setSelected(s.id)}
            >
              <span className="mt-1.5 h-2.5 w-2.5 rounded-sm" style={{ background: s.color }} />
              <div className="min-w-0">
                <p className="flex items-baseline justify-between gap-2 text-sm">
                  <span className="font-medium text-ink">{s.name}</span>
                  <span className="tabular font-mono text-xs text-muted sm:hidden">{fmt(values[s.id])}</span>
                </p>
                <p className="truncate text-xs text-faint">{s.what}</p>
              </div>
              <div className="col-start-2 mt-2 sm:col-start-3 sm:mt-0" onClick={(e) => e.stopPropagation()}>
                <Slider
                  label={pct(values[s.id] / Math.max(total, 1))}
                  value={values[s.id]}
                  min={0}
                  max={s.max}
                  step={s.step}
                  display={fmt(values[s.id])}
                  onChange={(v) => {
                    setValues((prev) => ({ ...prev, [s.id]: v }))
                    setSelected(s.id)
                  }}
                />
              </div>
            </div>
          ))}
        </Card>

        <div className="space-y-6">
          <div>
            <p className="text-xs text-muted">Sélection</p>
            <p className="mt-1 font-display text-xl text-ink">{sel.name}</p>
            <p className="mt-2 text-sm leading-relaxed text-muted">{sel.tip}</p>
          </div>

          <div className="border-t border-line pt-4">
            <p className="text-xs text-muted">Part de votre message</p>
            <p className="tabular mt-1 font-mono text-3xl text-ink">{pct(yours / Math.max(total, 1), 1)}</p>
            <p className="mt-1 text-xs text-faint">Le reste, c'est le « coût caché » relu à chaque échange.</p>
          </div>

          <div className="border-t border-line pt-4">
            <p className="text-xs text-muted">Avec les bonnes pratiques</p>
            <p className="tabular mt-1 font-mono text-3xl text-good">{fmt(optimizedTotal)}</p>
            <p className="mt-1 text-xs text-faint">
              soit {pct(1 - optimizedTotal / Math.max(total, 1))} de moins par message (MCP triés, CLAUDE.md allégé, /clear
              entre les tâches).
            </p>
          </div>
        </div>
      </div>

      <div className="mt-8">
        <Note tone="accent">
          Le prompt caching rend la relecture du préfixe stable (système, outils, CLAUDE.md) environ 10× moins chère. Mais
          l'historique, lui, grandit à chaque message : c'est là que se joue l'essentiel.
        </Note>
      </div>
    </section>
  )
}
