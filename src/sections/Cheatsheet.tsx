import { useState } from 'react'
import { CopyButton, Kbd, Note, SectionHeader, Segmented } from '../components/ui'

const COMMANDS: { cmd: string; what: string; when: string }[] = [
  { cmd: '/context', what: 'Affiche ce qui occupe la fenêtre de contexte', when: 'Quand une session semble lourde' },
  { cmd: '/usage', what: 'Utilisation des tokens et répartition', when: 'Régulièrement' },
  { cmd: '/clear', what: 'Repart d’un contexte vide (gratuit)', when: 'Entre deux tâches sans rapport' },
  { cmd: '/rename', what: 'Nomme la session pour la retrouver', when: 'Juste avant /clear' },
  { cmd: '/resume', what: 'Reprend une session nommée', when: 'Pour revenir sur un sujet' },
  { cmd: '/compact <consigne>', what: 'Résume l’historique en gardant l’essentiel', when: 'Pour continuer la même tâche' },
  { cmd: '/model', what: 'Change de modèle en cours de session', when: 'Opus → Sonnet après la phase de conception' },
  { cmd: '/effort', what: 'Règle la profondeur de réflexion', when: 'low/medium pour les tâches simples' },
  { cmd: '/config', what: 'Modèle par défaut, réflexion, suggestions', when: 'Une fois' },
  { cmd: '/mcp', what: 'Liste et désactive les serveurs MCP', when: 'Dès qu’un serveur ne sert plus' },
  { cmd: '/hooks', what: 'Vérifie les hooks configurés', when: 'Après avoir ajouté un filtre' },
  { cmd: '/rewind', what: 'Revient à un checkpoint (conversation + code)', when: 'Quand Claude part dans la mauvaise direction' },
  { cmd: 'Maj+Tab', what: 'Bascule en mode plan', when: 'Avant une tâche complexe' },
  { cmd: 'Échap', what: 'Interrompt Claude immédiatement', when: 'Dès qu’il dévie' },
]

const HOOK_SETTINGS = `{
  "hooks": {
    "PreToolUse": [
      {
        "matcher": "Bash",
        "hooks": [
          {
            "type": "command",
            "command": "~/.claude/hooks/filter-test-output.sh"
          }
        ]
      }
    ]
  }
}`

const HOOK_SCRIPT = `#!/bin/bash
input=$(cat)
cmd=$(echo "$input" | jq -r '.tool_input.command')

# If running tests, filter to show only failures
if [[ "$cmd" =~ ^(npm test|pytest|go test) ]]; then
  filtered_cmd="$cmd 2>&1 | grep -A 5 -E '(FAIL|ERROR|error:)' | head -100"
  echo "$input" | jq --arg filtered "$filtered_cmd" \\
    '{hookSpecificOutput: {hookEventName: "PreToolUse", permissionDecision: "allow", updatedInput: (.tool_input + {command: $filtered})}}'
else
  echo "{}"
fi`

const SUBAGENT = `---
name: log-reader
description: Lit des fichiers de logs volumineux et résume les erreurs
model: haiku
---

Lis les logs indiqués, regroupe les erreurs par type
et renvoie un résumé de moins de 20 lignes.`

const SNIPPETS = {
  settings: { label: 'settings.json', code: HOOK_SETTINGS },
  script: { label: 'filter-test-output.sh', code: HOOK_SCRIPT },
  agent: { label: 'Sous-agent Haiku', code: SUBAGENT },
} as const

export default function Cheatsheet() {
  const [tab, setTab] = useState<keyof typeof SNIPPETS>('settings')

  return (
    <section>
      <SectionHeader
        index="08 — Aide-mémoire"
        title="Commandes et configurations"
        lead="Les raccourcis qui font la différence, et deux configurations prêtes à copier."
      />

      <div className="overflow-x-auto">
        <table className="w-full min-w-140 text-sm">
          <thead>
            <tr className="border-b border-ink text-left text-xs text-muted">
              <th className="py-2 pr-4 font-normal">Commande</th>
              <th className="py-2 pr-4 font-normal">Effet</th>
              <th className="py-2 font-normal">Quand</th>
            </tr>
          </thead>
          <tbody>
            {COMMANDS.map((c) => (
              <tr key={c.cmd} className="border-b border-line">
                <td className="py-2.5 pr-4 whitespace-nowrap">
                  <Kbd>{c.cmd}</Kbd>
                </td>
                <td className="py-2.5 pr-4 text-ink">{c.what}</td>
                <td className="py-2.5 text-muted">{c.when}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="mt-12">
        <h3 className="font-display text-xl text-ink">Filtrer les sorties de tests avec un hook</h3>
        <p className="mt-2 max-w-2xl text-sm leading-relaxed text-muted">
          Ce hook <Kbd>PreToolUse</Kbd> réécrit les commandes de test pour ne renvoyer que les échecs. Un log de 10 000 lignes
          devient quelques centaines de tokens.
        </p>
        <div className="mt-4 mb-2 flex flex-wrap items-center justify-between gap-2">
          <Segmented
            options={Object.entries(SNIPPETS).map(([k, v]) => ({ value: k as keyof typeof SNIPPETS, label: v.label }))}
            value={tab}
            onChange={setTab}
          />
          <CopyButton text={SNIPPETS[tab].code} />
        </div>
        <pre className="overflow-x-auto rounded-lg border border-line bg-sunken p-4 font-mono text-[13px] leading-relaxed text-ink">
          {SNIPPETS[tab].code}
        </pre>
        <div className="mt-4 space-y-3">
          <Note>
            Script : <Kbd>mkdir -p ~/.claude/hooks</Kbd> puis <Kbd>chmod +x ~/.claude/hooks/filter-test-output.sh</Kbd>.
            Vérifiez avec <Kbd>/hooks</Kbd>. Nécessite <Kbd>jq</Kbd>.
          </Note>
          <Note>
            Sous-agent : à placer dans <Kbd>.claude/agents/log-reader.md</Kbd>. La sortie volumineuse reste dans son contexte,
            seul le résumé revient.
          </Note>
          <Note>
            Modèles à budget de réflexion fixe : <Kbd>MAX_THINKING_TOKENS=8000</Kbd>. Les modèles à raisonnement adaptatif
            l'ignorent, utilisez <Kbd>/effort</Kbd>.
          </Note>
        </div>
      </div>

      <p className="mt-12 text-xs text-faint">
        Source :{' '}
        <a
          href="https://code.claude.com/docs/fr/costs#reduce-token-usage"
          target="_blank"
          rel="noreferrer"
          className="underline decoration-line underline-offset-2 hover:text-ink"
        >
          code.claude.com/docs/fr/costs
        </a>
      </p>
    </section>
  )
}
