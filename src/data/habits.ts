// Habitudes tirées de https://code.claude.com/docs/fr/costs#reduce-token-usage
export type Impact = 'fort' | 'moyen' | 'faible'

export interface Habit {
  id: string
  group: string
  title: string
  detail: string
  impact: Impact
  cmd?: string
}

export const HABITS: Habit[] = [
  {
    id: 'clear',
    group: 'Contexte',
    title: 'Faire /clear entre deux tâches sans rapport',
    detail: 'Le contexte obsolète est relu à chaque message suivant. /clear ne coûte rien, contrairement à /compact.',
    impact: 'fort',
    cmd: '/clear',
  },
  {
    id: 'rename',
    group: 'Contexte',
    title: 'Nommer la session avant de l’effacer',
    detail: '/rename puis /resume pour y revenir plus tard sans garder tout l’historique ouvert.',
    impact: 'faible',
    cmd: '/rename',
  },
  {
    id: 'compact',
    group: 'Contexte',
    title: 'Guider la compaction',
    detail: 'Indiquer quoi préserver : /compact Focus on code samples and API usage, ou une section « Compact instructions » dans CLAUDE.md.',
    impact: 'moyen',
    cmd: '/compact <consigne>',
  },
  {
    id: 'usage',
    group: 'Contexte',
    title: 'Surveiller sa consommation',
    detail: '/usage pour l’utilisation, /context pour voir ce qui occupe la fenêtre, ou une barre de statut qui l’affiche en continu.',
    impact: 'moyen',
    cmd: '/context',
  },
  {
    id: 'pause',
    group: 'Contexte',
    title: 'Éviter de reprendre une grosse session après une longue pause',
    detail: 'Au-delà de la durée de vie du cache (1 h sur abonnement, 5 min en API), tout le contexte est retraité au plein tarif. Reprendre depuis un résumé.',
    impact: 'moyen',
  },
  {
    id: 'sonnet',
    group: 'Modèle',
    title: 'Sonnet par défaut, Opus seulement quand ça vaut le coup',
    detail: 'Opus pour l’architecture et le raisonnement multi-étapes. /model pour changer en cours de session, /config pour le défaut.',
    impact: 'fort',
    cmd: '/model',
  },
  {
    id: 'effort',
    group: 'Modèle',
    title: 'Baisser l’effort sur les tâches simples',
    detail: 'Les tokens de réflexion sont facturés comme de la sortie. /effort low ou medium pour du renommage, du formatage, des questions rapides.',
    impact: 'moyen',
    cmd: '/effort',
  },
  {
    id: 'haiku-sub',
    group: 'Modèle',
    title: 'model: haiku pour les sous-agents simples',
    detail: 'Un passage à Opus s’applique aussi aux sous-agents qui héritent du modèle de session.',
    impact: 'moyen',
  },
  {
    id: 'mcp',
    group: 'Outils',
    title: 'Désactiver les serveurs MCP inutilisés',
    detail: '/mcp liste les serveurs configurés. Leurs noms d’outils et instructions occupent le contexte même sans être utilisés.',
    impact: 'fort',
    cmd: '/mcp',
  },
  {
    id: 'cli',
    group: 'Outils',
    title: 'Préférer les CLI aux serveurs MCP',
    detail: 'gh, aws, gcloud, sentry-cli : aucune liste d’outils à charger, Claude les exécute directement.',
    impact: 'moyen',
  },
  {
    id: 'lsp',
    group: 'Outils',
    title: 'Installer un plugin d’intelligence de code',
    detail: 'Pour les langages typés : un « aller à la définition » remplace un grep suivi de plusieurs lectures de fichiers.',
    impact: 'moyen',
  },
  {
    id: 'claudemd',
    group: 'Configuration',
    title: 'CLAUDE.md sous les 200 lignes',
    detail: 'Il est chargé à chaque session. Ne garder que l’essentiel.',
    impact: 'fort',
  },
  {
    id: 'skills',
    group: 'Configuration',
    title: 'Déplacer les workflows spécialisés vers des skills',
    detail: 'Revue de PR, migrations, déploiement : un skill ne se charge que lorsqu’il est invoqué.',
    impact: 'moyen',
  },
  {
    id: 'hooks',
    group: 'Configuration',
    title: 'Filtrer les sorties volumineuses avec des hooks',
    detail: 'Un hook PreToolUse peut ne renvoyer que les échecs de tests ou les lignes ERROR d’un log : des dizaines de milliers de tokens deviennent quelques centaines.',
    impact: 'fort',
  },
  {
    id: 'subagents',
    group: 'Configuration',
    title: 'Déléguer les opérations verbeuses aux sous-agents',
    detail: 'Tests, documentation, logs : la sortie reste dans le contexte du sous-agent, seul un résumé revient.',
    impact: 'moyen',
  },
  {
    id: 'teams',
    group: 'Configuration',
    title: 'Garder les équipes d’agents petites',
    detail: 'Environ 7× plus de tokens qu’une session standard en mode plan : chaque coéquipier a son propre contexte.',
    impact: 'moyen',
  },
  {
    id: 'specific',
    group: 'Prompts',
    title: 'Écrire des demandes précises',
    detail: '« Ajoute la validation des entrées à login() dans auth.ts » plutôt que « améliore le code ».',
    impact: 'fort',
  },
  {
    id: 'plan',
    group: 'Prompts',
    title: 'Mode plan pour les tâches complexes',
    detail: 'Maj+Tab avant d’implémenter : Claude propose une approche à valider, ce qui évite de refaire le travail.',
    impact: 'moyen',
    cmd: 'Maj+Tab',
  },
  {
    id: 'esc',
    group: 'Prompts',
    title: 'Corriger la trajectoire tôt',
    detail: 'Échap pour arrêter, /rewind ou double Échap pour revenir à un checkpoint.',
    impact: 'moyen',
    cmd: '/rewind',
  },
  {
    id: 'verify',
    group: 'Prompts',
    title: 'Donner des critères de vérification',
    detail: 'Cas de test, sortie attendue, capture d’écran : Claude détecte ses erreurs avant que vous ayez à les signaler.',
    impact: 'moyen',
  },
  {
    id: 'incremental',
    group: 'Prompts',
    title: 'Avancer par petites étapes testées',
    detail: 'Écrire un fichier, le tester, puis continuer.',
    impact: 'faible',
  },
]
