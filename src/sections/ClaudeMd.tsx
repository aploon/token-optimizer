import { useMemo, useState } from 'react'
import { estimateTokens } from '../lib/tokenize'
import { compact, fmt } from '../lib/format'
import { Card, CopyButton, Kbd, Meter, Note, SectionHeader } from '../components/ui'

const SAMPLE = `# Projet Boutique

Stack : Next.js 15, TypeScript, Prisma, PostgreSQL.
Commandes : \`pnpm dev\`, \`pnpm test\`, \`pnpm lint\`.

## Conventions
- Composants en PascalCase dans src/components
- Pas de default export
- Toujours typer les retours de fonctions

## Revue de pull request
1. Lire la description de la PR
2. Vérifier que les tests couvrent les nouveaux cas
3. Vérifier la sécurité des entrées utilisateur
4. Vérifier les performances des requêtes Prisma
5. Vérifier l'accessibilité des composants
6. Vérifier les traductions
7. Laisser des commentaires constructifs
8. Résumer les points bloquants
9. Approuver ou demander des changements
10. Mettre à jour le changelog
11. Prévenir l'équipe sur Slack
12. Fermer les issues liées

## Migration de base de données
Étapes pour créer une migration :
1. Modifier schema.prisma
2. Lancer \`pnpm prisma migrate dev --name <nom>\`
3. Vérifier le SQL généré
4. Tester sur une copie de prod
5. Mettre à jour les seeds
6. Documenter dans docs/migrations.md
7. Prévenir l'équipe data
8. Déployer en staging
9. Vérifier les métriques
10. Déployer en prod
`

const WORKFLOW = /\b(revue|review|pull request|PR|migration|d[ée]ploie|deploy|release|changelog|onboarding|proc[ée]dure|checklist|[ée]tapes|workflow|runbook|incident)\b/i

interface Section {
  title: string
  lines: number
  tokens: number
  workflow: boolean
  codeLines: number
}

function parse(md: string): Section[] {
  const sections: { title: string; body: string[] }[] = [{ title: '(début du fichier)', body: [] }]
  for (const line of md.split('\n')) {
    const h = line.match(/^#{1,3}\s+(.*)/)
    if (h) sections.push({ title: h[1].trim(), body: [] })
    else sections[sections.length - 1].body.push(line)
  }
  return sections
    .map((s) => {
      const body = s.body.join('\n')
      const lines = s.body.filter((l) => l.trim()).length
      let inCode = false
      let codeLines = 0
      for (const l of s.body) {
        if (l.trim().startsWith('```')) inCode = !inCode
        else if (inCode) codeLines++
      }
      return {
        title: s.title,
        lines,
        tokens: estimateTokens(`${s.title}\n${body}`),
        workflow: lines >= 8 && WORKFLOW.test(`${s.title} ${body.slice(0, 400)}`),
        codeLines,
      }
    })
    .filter((s) => s.lines > 0 || s.title !== '(début du fichier)')
}

export default function ClaudeMd() {
  const [md, setMd] = useState(SAMPLE)
  const [sessionsPerMonth, setSessions] = useState(80)

  const sections = useMemo(() => parse(md), [md])
  const lines = md.split('\n').filter((l) => l.trim()).length
  const tokens = estimateTokens(md)
  const movable = sections.filter((s) => s.workflow)
  const movableTokens = movable.reduce((s, x) => s + x.tokens, 0)
  const bigCode = sections.filter((s) => s.codeLines > 15)
  const hasCompact = /compact instructions|instructions de compaction/i.test(md)
  const dupes = useMemo(() => {
    const seen = new Map<string, number>()
    md.split('\n')
      .map((l) => l.trim())
      .filter((l) => l.length > 25)
      .forEach((l) => seen.set(l, (seen.get(l) ?? 0) + 1))
    return [...seen.entries()].filter(([, n]) => n > 1).length
  }, [md])

  const findings: { tone: 'bad' | 'warn' | 'good'; text: React.ReactNode }[] = []
  if (lines > 200) findings.push({ tone: 'bad', text: `${lines} lignes : au-delà des 200 recommandées. Gardez l'essentiel.` })
  else findings.push({ tone: 'good', text: `${lines} lignes : sous la limite des 200.` })
  movable.forEach((s) =>
    findings.push({
      tone: 'warn',
      text: (
        <>
          « {s.title} » ({fmt(s.tokens)} tokens) ressemble à un workflow ponctuel : déplacez-le dans un skill, chargé seulement
          quand il est invoqué.
        </>
      ),
    }),
  )
  bigCode.forEach((s) =>
    findings.push({
      tone: 'warn',
      text: `« ${s.title} » contient ${s.codeLines} lignes de code. Référencez plutôt un fichier d'exemple.`,
    }),
  )
  if (dupes > 0) findings.push({ tone: 'warn', text: `${dupes} ligne(s) dupliquée(s).` })
  if (!hasCompact)
    findings.push({
      tone: 'warn',
      text: (
        <>
          Pas de section <Kbd># Compact instructions</Kbd> : ajoutez-en une pour indiquer ce que <Kbd>/compact</Kbd> doit
          préserver.
        </>
      ),
    })

  const dot = { bad: 'bg-bad', warn: 'bg-warn', good: 'bg-good' }

  return (
    <section>
      <SectionHeader
        index="06 — CLAUDE.md"
        title="Auditer votre CLAUDE.md"
        lead="Ce fichier est chargé au début de chaque session, que vous en ayez besoin ou non. Collez le vôtre : on repère ce qui pourrait devenir un skill."
      />

      <div className="grid gap-6 lg:grid-cols-[1fr_320px]">
        <Card className="self-start">
          <textarea
            value={md}
            onChange={(e) => setMd(e.target.value)}
            rows={16}
            spellCheck={false}
            className="block w-full resize-y rounded-lg bg-transparent p-4 font-mono text-[13px] leading-relaxed text-ink outline-none"
          />
        </Card>

        <div className="space-y-5">
          <div>
            <p className="text-xs text-muted">Lignes non vides</p>
            <p className="tabular mt-1 font-mono text-3xl text-ink">
              {lines}
              <span className="text-base text-faint"> / 200</span>
            </p>
            <div className="mt-2">
              <Meter value={lines / 200} />
            </div>
          </div>
          <div className="border-t border-line pt-4">
            <p className="text-xs text-muted">Tokens chargés à chaque session</p>
            <p className="tabular mt-1 font-mono text-3xl text-ink">≈ {fmt(tokens)}</p>
          </div>
          <div className="border-t border-line pt-4">
            <p className="text-xs text-muted">Déplaçable vers des skills</p>
            <p className="tabular mt-1 font-mono text-3xl text-good">{fmt(movableTokens)}</p>
            <p className="mt-1 text-xs text-faint">
              soit ≈ {compact(movableTokens * sessionsPerMonth)} tokens/mois sur {sessionsPerMonth} sessions
            </p>
            <input
              type="range"
              min={10}
              max={400}
              step={10}
              value={sessionsPerMonth}
              onChange={(e) => setSessions(Number(e.target.value))}
              className="mt-2 w-full"
              aria-label="Sessions par mois"
            />
          </div>
        </div>
      </div>

      <div className="mt-10 grid gap-10 lg:grid-cols-2">
        <div>
          <h3 className="font-display text-xl text-ink">Constats</h3>
          <ul className="mt-4 space-y-3">
            {findings.map((f, i) => (
              <li key={i} className="grid grid-cols-[14px_1fr] gap-2 text-sm leading-relaxed text-muted">
                <span className={`mt-1.5 h-2 w-2 rounded-full ${dot[f.tone]}`} />
                <span>{f.text}</span>
              </li>
            ))}
          </ul>
        </div>
        <div>
          <h3 className="font-display text-xl text-ink">Sections</h3>
          <div className="mt-4 space-y-2">
            {sections.map((s, i) => (
              <div key={i} className="text-sm">
                <div className="flex justify-between gap-3">
                  <span className={`truncate ${s.workflow ? 'text-warn' : 'text-ink'}`}>{s.title}</span>
                  <span className="tabular shrink-0 font-mono text-xs text-muted">{fmt(s.tokens)}</span>
                </div>
                <div className="mt-1 h-1 rounded-full bg-sunken">
                  <div
                    className={`h-full rounded-full ${s.workflow ? 'bg-warn' : 'bg-faint'}`}
                    style={{ width: `${(s.tokens / Math.max(tokens, 1)) * 100}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="mt-10">
        <div className="mb-2 flex items-center justify-between">
          <h3 className="font-display text-xl text-ink">À ajouter à la fin</h3>
          <CopyButton text={'# Compact instructions\n\nWhen you are using compact, please focus on test output and code changes'} />
        </div>
        <pre className="overflow-x-auto rounded-lg border border-line bg-sunken p-4 font-mono text-[13px] text-ink">
          {'# Compact instructions\n\nWhen you are using compact, please focus on test output and code changes'}
        </pre>
        <div className="mt-4">
          <Note>
            Un skill se crée dans <Kbd>.claude/skills/&lt;nom&gt;/SKILL.md</Kbd> : seule sa description courte reste en
            contexte, le contenu complet ne se charge qu'à l'invocation.
          </Note>
        </div>
      </div>
    </section>
  )
}
