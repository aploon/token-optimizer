import { useMemo, useState } from 'react'
import { compact, fmt, pct } from '../lib/format'
import { Card, Kbd, Note, SectionHeader, Slider, Stat } from '../components/ui'

const WINDOW = 200_000

interface Point {
  n: number
  context: number
  cleared: boolean
}

/** Taille du contexte envoyé à chaque requête : base + historique accumulé depuis le dernier /clear. */
function simulate(base: number, perExchange: number, count: number, clearEvery: number): Point[] {
  const out: Point[] = []
  let sinceClear = 0
  for (let n = 1; n <= count; n++) {
    const cleared = clearEvery > 0 && n > 1 && (n - 1) % clearEvery === 0
    if (cleared) sinceClear = 0
    sinceClear++
    out.push({ n, context: base + sinceClear * perExchange, cleared })
  }
  return out
}

export default function Growth() {
  const [base, setBase] = useState(15_000)
  const [perExchange, setPerExchange] = useState(3_000)
  const [count, setCount] = useState(40)
  const [clearEvery, setClearEvery] = useState(0)
  const [hover, setHover] = useState<number | null>(null)

  const raw = useMemo(() => simulate(base, perExchange, count, 0), [base, perExchange, count])
  const withClear = useMemo(() => simulate(base, perExchange, count, clearEvery), [base, perExchange, count, clearEvery])
  const shown = clearEvery > 0 ? withClear : raw

  const sum = (pts: Point[]) => pts.reduce((s, p) => s + p.context, 0)
  const totalRaw = sum(raw)
  const totalShown = sum(shown)
  const maxY = Math.max(...raw.map((p) => p.context), WINDOW * 0.25)
  const focus = shown[(hover ?? shown.length) - 1]
  const firstLimit = raw.find((p) => p.context >= WINDOW)

  const W = 720
  const H = 240
  const gap = 2
  const bw = W / shown.length - gap
  const y = (v: number) => H - (v / maxY) * H
  const limitInView = WINDOW <= maxY

  // Courbe cumulée, sur sa propre échelle : c'est elle qui est quadratique.
  let running = 0
  const cumulative = shown.map((p) => (running += p.context))
  const cumMax = raw.reduce((s, p) => s + p.context, 0)
  const cumPath = cumulative
    .map((v, i) => `${i ? 'L' : 'M'}${(i * (bw + gap) + bw / 2).toFixed(1)},${(H - (v / cumMax) * H).toFixed(1)}`)
    .join(' ')

  return (
    <section>
      <SectionHeader
        index="03 — Croissance"
        title="Pourquoi les longues conversations coûtent cher"
        lead="Claude renvoie toute la conversation à chaque requête. Le message n°30 transporte les 29 précédents : la consommation cumulée croît de façon quadratique, pas linéaire."
      />

      <p className="mb-4 font-mono text-sm text-muted">
        Total ≈ N × B + S × N(N+1) / 2 <span className="text-faint">— B = contexte de base, S = tokens ajoutés par échange</span>
      </p>

      <Card className="p-4 sm:p-6">
        <svg viewBox={`0 0 ${W} ${H + 24}`} className="h-auto w-full" onMouseLeave={() => setHover(null)} role="img">
          <title>Taille du contexte à chaque message</title>
          {limitInView && (
            <g>
              <line x1={0} x2={W} y1={y(WINDOW)} y2={y(WINDOW)} stroke="var(--bad)" strokeDasharray="4 4" strokeWidth={1} />
              <text x={W} y={y(WINDOW) - 6} textAnchor="end" fontSize={11} fill="var(--bad)" fontFamily="IBM Plex Mono">
                limite 200 k (compaction auto)
              </text>
            </g>
          )}
          {clearEvery > 0 &&
            raw.map((p, i) => (
              <rect
                key={`g${i}`}
                x={i * (bw + gap)}
                y={y(p.context)}
                width={bw}
                height={H - y(p.context)}
                fill="var(--line)"
                opacity={0.6}
              />
            ))}
          {shown.map((p, i) => {
            const ratio = p.context / WINDOW
            const fill = ratio < 0.4 ? 'var(--good)' : ratio < 0.75 ? 'var(--warn)' : 'var(--bad)'
            const active = hover === p.n
            return (
              <g key={i} onMouseEnter={() => setHover(p.n)}>
                <rect x={i * (bw + gap)} y={0} width={bw + gap} height={H} fill="transparent" />
                <rect
                  x={i * (bw + gap)}
                  y={y(p.context)}
                  width={bw}
                  height={H - y(p.context)}
                  rx={1.5}
                  fill={active ? 'var(--ink)' : fill}
                  opacity={hover && !active ? 0.55 : 0.9}
                />
                {(p.n === 1 || p.n % 5 === 0) && (
                  <text
                    x={i * (bw + gap) + bw / 2}
                    y={H + 16}
                    textAnchor="middle"
                    fontSize={10}
                    fill="var(--faint)"
                    fontFamily="IBM Plex Mono"
                  >
                    {p.n}
                  </text>
                )}
                {p.cleared && (
                  <line x1={i * (bw + gap) - 1} x2={i * (bw + gap) - 1} y1={0} y2={H} stroke="var(--accent)" strokeWidth={1} />
                )}
              </g>
            )
          })}
          <path d={cumPath} fill="none" stroke="var(--ink)" strokeWidth={1.5} pointerEvents="none" />
        </svg>
        <p className="mt-2 flex flex-wrap gap-x-4 text-xs text-faint">
          <span>Barres : contexte envoyé à chaque message.</span>
          <span>Courbe : consommation cumulée.</span>
          {clearEvery > 0 && <span>Gris : la même session sans /clear. Traits orange : /clear.</span>}
        </p>
      </Card>

      <div className="mt-6 grid grid-cols-2 gap-x-6 gap-y-4 lg:grid-cols-4">
        <Stat label={`Contexte au message n°${focus.n}`} value={compact(focus.context)} hint="tokens envoyés" />
        <Stat
          label="Multiplié par"
          value={`×${(focus.context / shown[0].context).toFixed(1).replace('.', ',')}`}
          hint="par rapport au 1er message"
          tone="accent"
        />
        <Stat
          label="Fenêtre occupée"
          value={pct(focus.context / WINDOW)}
          hint={firstLimit && clearEvery === 0 ? `limite atteinte au message ${firstLimit.n}` : 'sur 200 k'}
          tone={focus.context / WINDOW > 0.75 ? 'bad' : 'ink'}
        />
        <Stat
          label="Consommation cumulée"
          value={compact(totalShown)}
          hint={clearEvery > 0 ? `−${pct(1 - totalShown / totalRaw)} grâce à /clear` : 'tokens d’entrée'}
          tone={clearEvery > 0 ? 'good' : 'ink'}
        />
      </div>

      <div className="mt-8 grid gap-6 sm:grid-cols-2">
        <Slider label="Contexte de base (B)" value={base} min={2_000} max={60_000} step={1_000} onChange={setBase} display={fmt(base)} />
        <Slider
          label="Tokens ajoutés par échange (S)"
          value={perExchange}
          min={200}
          max={15_000}
          step={100}
          onChange={setPerExchange}
          display={fmt(perExchange)}
        />
        <Slider label="Nombre de messages" value={count} min={5} max={80} onChange={setCount} />
        <Slider
          label="/clear tous les…"
          value={clearEvery}
          min={0}
          max={30}
          onChange={setClearEvery}
          display={clearEvery === 0 ? 'jamais' : `${clearEvery} messages`}
        />
      </div>

      <div className="mt-8 space-y-4">
        <Note tone="accent">
          Un « échange » ne se limite pas à votre message et la réponse : chaque lecture de fichier, chaque sortie de test
          s'ajoute à l'historique. Un <Kbd>npm test</Kbd> non filtré peut ajouter 10 000 tokens d'un coup.
        </Note>
        <Note>
          <Kbd>/compact</Kbd> résume l'historique mais relit d'abord toute la conversation : c'est une grosse requête en soi.
          Quand vous changez de sujet, <Kbd>/clear</Kbd> ne coûte rien.
        </Note>
      </div>
    </section>
  )
}
