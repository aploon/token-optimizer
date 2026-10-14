import { useMemo, useState } from 'react'
import { tokenize, type Token } from '../lib/tokenize'
import { fmt } from '../lib/format'
import { Card, Note, SectionHeader, Segmented, Stat } from '../components/ui'

const SAMPLES = [
  { value: 'fr', label: 'Français', text: "Écris un article de blog sur l'IA" },
  { value: 'en', label: 'Anglais', text: 'Write a blog post about AI' },
  { value: 'code', label: 'Code', text: 'const total = items.reduce((sum, i) => sum + i.price, 0);' },
  { value: 'rare', label: 'Mots rares', text: 'La tokenisation anticonstitutionnellement hétérogène' },
]

const TINTS = ['var(--t1)', 'var(--t2)', 'var(--t3)', 'var(--t4)', 'var(--t5)']

function Chip({ token, i }: { token: Token; i: number }) {
  if (token.kind === 'newline') return <span className="basis-full" />
  const shown = token.text.replace(/ /g, '·').replace(/\t/g, '→')
  return (
    <span
      className="rounded-sm px-1 py-0.5 font-mono text-[13px] text-ink"
      style={{ background: TINTS[i % TINTS.length] }}
      title={`${token.kind} · « ${token.text} »`}
    >
      {shown}
    </span>
  )
}

export default function Tokenizer() {
  const [sample, setSample] = useState('fr')
  const [text, setText] = useState(SAMPLES[0].text)
  const tokens = useMemo(() => tokenize(text), [text])

  const words = text.trim() ? text.trim().split(/\s+/).length : 0
  const ratio = tokens.length ? text.length / tokens.length : 0

  return (
    <section>
      <SectionHeader
        index="01 — Tokens"
        title="Ce que Claude lit vraiment"
        lead="Un token est un fragment de texte : un mot courant, un morceau de mot rare, un signe de ponctuation. Tout ce qui entre et sort du modèle se compte en tokens, et c'est ce qui consomme vos limites."
      />

      <div className="mb-3">
        <Segmented
          options={SAMPLES.map((s) => ({ value: s.value, label: s.label }))}
          value={sample}
          onChange={(v) => {
            setSample(v)
            setText(SAMPLES.find((s) => s.value === v)!.text)
          }}
        />
      </div>

      <Card>
        <textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          rows={3}
          spellCheck={false}
          className="block w-full resize-y rounded-t-lg bg-transparent p-4 text-[15px] text-ink outline-none placeholder:text-faint"
          placeholder="Tapez ou collez un texte…"
        />
        <div className="flex min-h-14 flex-wrap gap-1 border-t border-line p-4">
          {tokens.length ? (
            tokens.map((t, i) => <Chip key={i} token={t} i={i} />)
          ) : (
            <span className="text-sm text-faint">Les tokens apparaîtront ici.</span>
          )}
        </div>
      </Card>

      <div className="mt-6 grid grid-cols-2 gap-x-6 gap-y-4 sm:grid-cols-4">
        <Stat label="Tokens (estimés)" value={fmt(tokens.length)} tone="accent" />
        <Stat label="Caractères" value={fmt(text.length)} />
        <Stat label="Mots" value={fmt(words)} />
        <Stat label="Caractères / token" value={ratio.toFixed(1).replace('.', ',')} hint="≈ 4 en anglais, moins en français" />
      </div>

      <div className="mt-10 grid gap-x-10 gap-y-5 sm:grid-cols-2">
        <Note>
          <strong className="text-ink">Mots courants : 1 token.</strong> « le », « the », « est » tiennent en un seul bloc.
        </Note>
        <Note>
          <strong className="text-ink">Mots rares : plusieurs fragments.</strong> « tokenisation » se découpe en 3–4 morceaux.
        </Note>
        <Note>
          <strong className="text-ink">L'espace fait partie du token.</strong> Il est collé au mot qui suit (affiché ici par ·).
        </Note>
        <Note>
          <strong className="text-ink">Accents, chiffres, ponctuation</strong> coûtent souvent plus : le français consomme
          environ 20 à 30 % de tokens de plus que l'anglais pour le même sens.
        </Note>
      </div>

      <p className="mt-8 text-xs text-faint">
        Découpage approximatif fait dans le navigateur. Pour un compte exact : <code className="font-mono">/context</code>{' '}
        dans Claude Code, ou l'endpoint <code className="font-mono">count_tokens</code> de l'API.
      </p>
    </section>
  )
}
