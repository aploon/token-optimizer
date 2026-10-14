import { useMemo, useState } from 'react'
import { estimateTokens } from '../lib/tokenize'
import { fmt } from '../lib/format'
import { Card, CopyButton, Kbd, Meter, SectionHeader, Segmented } from '../components/ui'

interface Check {
  id: string
  ok: boolean
  weight: number
  label: string
  advice: React.ReactNode
}

const EXAMPLES = [
  { value: 'vague', label: 'Vague', text: 'Améliore le code, il y a des bugs un peu partout et c’est lent.' },
  {
    value: 'precise',
    label: 'Précis',
    text: 'Dans src/auth/login.ts, ajoute une validation de l’email dans la fonction `validateCredentials()` (format + longueur max 254). Ne touche pas aux autres fichiers. Vérifie avec `npm test -- login` : les tests existants doivent passer.',
  },
  {
    value: 'dump',
    label: 'Logs collés',
    text: 'Ça plante, voilà les logs :\n' + 'ERROR at Object.<anonymous> (/app/node_modules/x/index.js:12:5)\n'.repeat(60),
  },
]

const VAGUE = /\b(am[ée]liore[rz]?|optimise[rz]?|regarde[rz]?|v[ée]rifie tout|corrige tout|nettoie|refactor(?:ise)?|improve|clean ?up|fix (?:it|everything)|make it better|un peu partout|tout le (?:code|projet)|toute la base)\b/i
const FILE = /(?:[\w.-]+\/)*[\w-]+\.(?:tsx?|jsx?|py|go|rs|java|kt|rb|php|cs|css|scss|html|md|json|ya?ml|sql|sh|toml|vue|svelte)\b|(?:^|\s)(?:src|app|lib|tests?|packages)\/[\w/.-]+/i
const SYMBOL = /`[^`]+`|\b[a-z]+[A-Z]\w*\b|\b\w+\(\)|\b(?:fonction|function|classe|class|méthode|composant|component|endpoint|route)\s+\w+/
const VERIFY = /\b(tests?|npm (?:run )?test|pytest|attendu|doit (?:retourner|renvoyer|afficher|passer)|expected|should|v[ée]rifie (?:que|avec)|crit[eè]re|capture)\b/i
const CONSTRAINT = /\b(ne (?:touche|modifie|change) pas|sans |uniquement|seulement|only|don'?t|do not|max(?:imum)?|garde|conserve)\b/i
const MULTI = /(\n\s*(?:\d+[.)]|-|\*)\s.+){4,}|\b(et aussi|en plus|ensuite aussi|also|and then)\b/i

function analyze(text: string): Check[] {
  const tokens = estimateTokens(text)
  const lines = text.split('\n').length
  const pasted = tokens > 1_500 || lines > 40
  return [
    {
      id: 'specific',
      ok: !VAGUE.test(text) || (FILE.test(text) && SYMBOL.test(text)),
      weight: 25,
      label: 'Demande précise',
      advice: 'Les verbes vagues (« améliore », « optimise », « regarde ») déclenchent une exploration large de la base de code. Dites exactement quoi changer.',
    },
    {
      id: 'file',
      ok: FILE.test(text),
      weight: 20,
      label: 'Fichier ciblé',
      advice: 'Nommez le fichier (ex. src/auth/login.ts) : Claude le lit directement au lieu de chercher avec grep et d’ouvrir plusieurs candidats.',
    },
    {
      id: 'symbol',
      ok: SYMBOL.test(text),
      weight: 15,
      label: 'Fonction ou composant nommé',
      advice: 'Citez la fonction, la classe ou le composant visé, entre backticks de préférence.',
    },
    {
      id: 'verify',
      ok: VERIFY.test(text),
      weight: 15,
      label: 'Critère de vérification',
      advice: 'Ajoutez un test à faire passer ou la sortie attendue : Claude vérifie lui-même son travail, ce qui évite des allers-retours de correction.',
    },
    {
      id: 'constraint',
      ok: CONSTRAINT.test(text),
      weight: 10,
      label: 'Périmètre borné',
      advice: 'Dites ce qu’il ne faut pas toucher (« ne modifie pas l’API publique ») pour éviter des changements hors sujet.',
    },
    {
      id: 'single',
      ok: !MULTI.test(text),
      weight: 10,
      label: 'Une seule tâche',
      advice: (
        <>
          Plusieurs tâches d’un coup : passez en mode plan (<Kbd>Maj+Tab</Kbd>) ou découpez, avec un <Kbd>/clear</Kbd> entre
          les tâches sans rapport.
        </>
      ),
    },
    {
      id: 'dump',
      ok: !pasted,
      weight: 5,
      label: 'Pas de gros copier-coller',
      advice: 'Plutôt que de coller des centaines de lignes de logs, indiquez le chemin du fichier et ce qu’il faut y chercher, ou filtrez avec un hook (grep ERROR).',
    },
  ]
}

function template(text: string) {
  const file = text.match(FILE)?.[0]?.trim() ?? '<chemin/du/fichier>'
  const symbol = text.match(SYMBOL)?.[0] ?? '<fonction ou composant>'
  return `Dans ${file}, ${symbol} : <ce qui doit changer, en une phrase>.
Contraintes : ne modifie que ce fichier, garde la signature publique.
Vérification : <commande de test> doit passer / <résultat attendu>.`
}

export default function PromptCheck() {
  const [ex, setEx] = useState('vague')
  const [text, setText] = useState(EXAMPLES[0].text)
  const checks = useMemo(() => analyze(text), [text])
  const score = checks.reduce((s, c) => s + (c.ok ? c.weight : 0), 0)
  const tokens = estimateTokens(text)
  const failing = checks.filter((c) => !c.ok)

  const verdict = score >= 80 ? 'Prompt efficace' : score >= 50 ? 'Correct, peut mieux faire' : 'Risque d’exploration large'

  return (
    <section>
      <SectionHeader
        index="05 — Prompts"
        title="Vérifier un prompt avant de l'envoyer"
        lead="Le coût d'une demande ne vient pas de sa longueur mais de ce qu'elle déclenche : une demande vague fait lire des dizaines de fichiers, une demande précise n'en lit qu'un."
      />

      <div className="mb-3">
        <Segmented
          options={EXAMPLES.map((e) => ({ value: e.value, label: e.label }))}
          value={ex}
          onChange={(v) => {
            setEx(v)
            setText(EXAMPLES.find((e) => e.value === v)!.text)
          }}
        />
      </div>

      <div className="grid gap-6 lg:grid-cols-[1fr_320px]">
        <Card className="self-start">
          <textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            rows={8}
            spellCheck={false}
            placeholder="Collez le prompt que vous allez envoyer à Claude…"
            className="block w-full resize-y rounded-lg bg-transparent p-4 text-[15px] leading-relaxed text-ink outline-none placeholder:text-faint"
          />
          <div className="flex items-center justify-between border-t border-line px-4 py-2 text-xs text-muted">
            <span>
              ≈ <span className="tabular font-mono text-ink">{fmt(tokens)}</span> tokens
            </span>
            <span>{fmt(text.length)} caractères</span>
          </div>
        </Card>

        <div>
          <p className="text-xs text-muted">Score</p>
          <p className="tabular mt-1 font-mono text-5xl text-ink">
            {score}
            <span className="text-xl text-faint">/100</span>
          </p>
          <p className="mt-1 text-sm text-muted">{verdict}</p>
          <div className="mt-3">
            <Meter value={score / 100} tone={score >= 80 ? 'good' : score >= 50 ? 'warn' : 'bad'} />
          </div>
          <ul className="mt-6 space-y-2 text-sm">
            {checks.map((c) => (
              <li key={c.id} className="flex items-center gap-2">
                <span
                  className={`inline-flex h-4 w-4 shrink-0 items-center justify-center rounded-full text-[10px] ${
                    c.ok ? 'bg-good-soft text-good' : 'bg-bad-soft text-bad'
                  }`}
                >
                  {c.ok ? '✓' : '✕'}
                </span>
                <span className={c.ok ? 'text-muted' : 'text-ink'}>{c.label}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>

      {failing.length > 0 && (
        <div className="mt-10">
          <h3 className="font-display text-xl text-ink">À corriger</h3>
          <ol className="mt-4 space-y-4">
            {failing.map((c, i) => (
              <li key={c.id} className="grid grid-cols-[28px_1fr] gap-2 text-sm leading-relaxed">
                <span className="font-mono text-faint">{String(i + 1).padStart(2, '0')}</span>
                <span>
                  <strong className="font-medium text-ink">{c.label}.</strong> <span className="text-muted">{c.advice}</span>
                </span>
              </li>
            ))}
          </ol>
        </div>
      )}

      <div className="mt-10">
        <div className="mb-2 flex items-center justify-between">
          <h3 className="font-display text-xl text-ink">Gabarit</h3>
          <CopyButton text={template(text)} />
        </div>
        <pre className="overflow-x-auto rounded-lg border border-line bg-sunken p-4 font-mono text-[13px] leading-relaxed whitespace-pre-wrap text-ink">
          {template(text)}
        </pre>
      </div>
    </section>
  )
}
