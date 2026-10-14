// Tarifs API Anthropic par million de tokens (relevés en octobre 2026).
// Sur un abonnement Pro/Max, on ne paie pas au token mais les limites d'usage
// suivent les mêmes proportions : les ratios restent valables.

export interface ModelInfo {
  id: string
  name: string
  input: number
  output: number
  cacheRead: number
  /** Écriture en cache (TTL 5 min) = 1,25 × le prix d'entrée */
  cacheWrite: number
  usage: string
}

export const MODELS: ModelInfo[] = [
  {
    id: 'haiku',
    name: 'Haiku 5.5',
    input: 0.1,
    output: 0.5,
    cacheRead: 0.01,
    cacheWrite: 0.125,
    usage: 'Sous-agents simples, recherche, résumés, tri de logs',
  },
  {
    id: 'sonnet',
    name: 'Sonnet 5.5',
    input: 2,
    output: 10,
    cacheRead: 0.2,
    cacheWrite: 2.5,
    usage: 'La plupart des tâches de code au quotidien',
  },
  {
    id: 'opus',
    name: 'Opus 5.5',
    input: 4,
    output: 20,
    cacheRead: 0.2,
    cacheWrite: 5,
    usage: 'Architecture, raisonnement multi-étapes, bugs difficiles',
  },
]

export const EFFORTS = [
  { id: 'low', label: 'low', factor: 0.45 },
  { id: 'medium', label: 'medium', factor: 1 },
  { id: 'high', label: 'high', factor: 1.7 },
  { id: 'xhigh', label: 'xhigh', factor: 2.4 },
  { id: 'max', label: 'max', factor: 3.4 },
] as const

export const CONTEXT_WINDOWS = [200_000, 1_000_000]
