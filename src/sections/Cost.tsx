import { useMemo, useState } from 'react'
import { EFFORTS, MODELS, type ModelInfo } from '../data/models'
import { compact, fmt, money, pct } from '../lib/format'
import { Card, Kbd, Note, SectionHeader, Segmented, Slider, Stat } from '../components/ui'

type EffortId = (typeof EFFORTS)[number]['id']

interface Workload {
  sessions: number
  messages: number
  base: number
  perExchange: number
  output: number
  effort: EffortId
  cacheHit: number
  clearEvery: number
}

const THINKING_BASE = 1_500

function sessionCost(m: ModelInfo, w: Workload) {
  const factor = EFFORTS.find((e) => e.id === w.effort)!.factor
  let input = 0
  let output = 0
  let dollars = 0
  let since = 0
  for (let n = 1; n <= w.messages; n++) {
    if (w.clearEvery > 0 && n > 1 && (n - 1) % w.clearEvery === 0) since = 0
    since++
    const ctx = w.base + since * w.perExchange
    const cached = ctx * w.cacheHit
    const fresh = ctx - cached
    const out = w.output + THINKING_BASE * factor
    input += ctx
    output += out
    dollars +=
      (cached * m.cacheRead + fresh * (w.cacheHit > 0 ? m.cacheWrite : m.input) + out * m.output) / 1_000_000
  }
  return { input, output, dollars }
}

export default function Cost() {
  const [modelId, setModelId] = useState('opus')
  const [w, setW] = useState<Workload>({
    sessions: 4,
    messages: 30,
    base: 20_000,
    perExchange: 2_500,
    output: 600,
    effort: 'high',
    cacheHit: 0.85,
    clearEvery: 0,
  })
  const set = <K extends keyof Workload>(k: K) => (v: Workload[K]) => setW((p) => ({ ...p, [k]: v }))

  const model = MODELS.find((m) => m.id === modelId)!
  const current = useMemo(() => sessionCost(model, w), [model, w])
  const optimized = useMemo(
    () =>
      sessionCost(MODELS.find((m) => m.id === 'sonnet')!, {
        ...w,
        effort: w.effort === 'low' ? 'low' : 'medium',
        clearEvery: w.clearEvery || 10,
        base: Math.round(w.base * 0.6),
      }),
    [w],
  )
  const daily = current.dollars * w.sessions
  const monthly = daily * 21
  const optMonthly = optimized.dollars * w.sessions * 21

  return (
    <section>
      <SectionHeader
        index="04 — Modèles & coût"
        title="Le bon modèle pour la bonne tâche"
        lead="Sonnet gère bien la plupart des tâches de code et coûte deux fois moins qu'Opus. L'effort de réflexion pèse lui aussi : les tokens de réflexion sont facturés comme de la sortie."
      />

      <div className="grid gap-3 sm:grid-cols-3">
        {MODELS.map((m) => (
          <button
            key={m.id}
            type="button"
            onClick={() => setModelId(m.id)}
            className={`rounded-lg border p-4 text-left transition-colors ${
              m.id === modelId ? 'border-ink bg-surface' : 'border-line hover:border-muted'
            }`}
          >
            <p className="flex items-baseline justify-between">
              <span className="font-display text-lg text-ink">{m.name}</span>
              <span className="tabular font-mono text-xs text-muted">
                ${m.input.toFixed(2)} / ${m.output.toFixed(2)}
              </span>
            </p>
            <p className="mt-1 text-sm text-muted">{m.usage}</p>
          </button>
        ))}
      </div>
      <p className="mt-2 text-xs text-faint">Prix API par million de tokens (entrée / sortie). Lecture en cache : ~10 % du prix d'entrée ou moins.</p>

      <div className="mt-8 grid gap-8 lg:grid-cols-[1fr_300px]">
        <div className="grid gap-6 sm:grid-cols-2">
          <Slider label="Sessions par jour" value={w.sessions} min={1} max={20} onChange={set('sessions')} />
          <Slider label="Messages par session" value={w.messages} min={1} max={100} onChange={set('messages')} />
          <Slider
            label="Contexte de base"
            value={w.base}
            min={5_000}
            max={80_000}
            step={1_000}
            onChange={set('base')}
            display={fmt(w.base)}
          />
          <Slider
            label="Tokens ajoutés par échange"
            value={w.perExchange}
            min={200}
            max={15_000}
            step={100}
            onChange={set('perExchange')}
            display={fmt(w.perExchange)}
          />
          <Slider
            label="Taux de lecture en cache"
            value={Math.round(w.cacheHit * 100)}
            min={0}
            max={95}
            onChange={(v) => set('cacheHit')(v / 100)}
            display={pct(w.cacheHit)}
          />
          <Slider
            label="/clear tous les…"
            value={w.clearEvery}
            min={0}
            max={40}
            onChange={set('clearEvery')}
            display={w.clearEvery === 0 ? 'jamais' : `${w.clearEvery} messages`}
          />
          <div className="sm:col-span-2">
            <p className="mb-2 text-sm text-muted">
              Effort (<Kbd>/effort</Kbd>)
            </p>
            <Segmented options={EFFORTS.map((e) => ({ value: e.id, label: e.label }))} value={w.effort} onChange={set('effort')} />
          </div>
        </div>

        <div className="space-y-4">
          <Stat label="Par session" value={money(current.dollars)} hint={`${compact(current.input)} entrée · ${compact(current.output)} sortie`} />
          <Stat label="Par jour" value={money(daily)} />
          <Stat label="Par mois (21 jours)" value={money(monthly)} tone="accent" />
          <Stat
            label="Version optimisée / mois"
            value={money(optMonthly)}
            hint={`Sonnet, effort ≤ medium, /clear régulier, base −40 % → ${
              optMonthly < monthly ? `−${pct(1 - optMonthly / monthly)}` : 'déjà optimal'
            }`}
            tone="good"
          />
        </div>
      </div>

      <Card className="mt-10 overflow-x-auto">
        <table className="w-full min-w-[520px] text-sm">
          <thead>
            <tr className="border-b border-line text-left text-xs text-muted">
              <th className="px-4 py-3 font-normal">Même charge de travail</th>
              <th className="px-4 py-3 text-right font-normal">Session</th>
              <th className="px-4 py-3 text-right font-normal">Mois</th>
              <th className="px-4 py-3 text-right font-normal">vs Opus</th>
            </tr>
          </thead>
          <tbody>
            {MODELS.map((m) => {
              const c = sessionCost(m, w).dollars
              const opus = sessionCost(MODELS[2], w).dollars
              return (
                <tr key={m.id} className="border-b border-line last:border-0">
                  <td className="px-4 py-3 text-ink">{m.name}</td>
                  <td className="tabular px-4 py-3 text-right font-mono">{money(c)}</td>
                  <td className="tabular px-4 py-3 text-right font-mono">{money(c * w.sessions * 21)}</td>
                  <td className="tabular px-4 py-3 text-right font-mono text-muted">{pct(c / opus)}</td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </Card>

      <div className="mt-8 space-y-4">
        <Note tone="accent">
          Sur un abonnement Pro ou Max, vous ne payez pas au token mais vos limites d'usage suivent les mêmes proportions :
          une session Opus en effort élevé épuise votre quota bien plus vite.
        </Note>
        <Note>
          Pour les sous-agents qui font de la recherche ou du tri, précisez <Kbd>model: haiku</Kbd> dans leur configuration.
          Les réflexions étendues ne peuvent pas être désactivées sur les modèles 5.5 : baissez l'effort plutôt.
        </Note>
        <p className="text-xs text-faint">
          Estimation simplifiée : réflexion ≈ {fmt(THINKING_BASE)} tokens × un facteur par niveau d'effort (illustratif),
          écriture en cache à 1,25 × le prix d'entrée.
        </p>
      </div>
    </section>
  )
}
