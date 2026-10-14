// Estimation locale du découpage BPE. Le vrai tokenizer de Claude n'est pas public :
// on reproduit ses tendances (espace collé au mot suivant, mots courants = 1 token,
// mots rares/longs = plusieurs fragments, chiffres et ponctuation isolés).
// Pour un compte exact : /context dans Claude Code, ou l'endpoint count_tokens de l'API.

export type TokenKind = 'word' | 'fragment' | 'punct' | 'digit' | 'space' | 'newline'

export interface Token {
  text: string
  kind: TokenKind
}

const COMMON = new Set(
  `le la les un une des de du et à au aux en est sont pour par sur dans avec pas que qui ne se ce
  il elle on nous vous ils je tu mon ton son ma ta sa mes tes ses plus mais ou où donc car si
  the a an of to in is it for on with as at by be this that are was from or and not you your
  my we they he she has have had do does can will if all one new get set use run add fix make
  code file test data type list item name user page app api html css json main src lib`
    .split(/\s+/)
    .filter(Boolean),
)

function splitWord(word: string): string[] {
  const core = word.trimStart()
  const lead = word.length - core.length > 0 ? ' ' : ''
  const lower = core.toLowerCase()
  if (COMMON.has(lower) || core.length <= 4) return [lead + core]
  // Mots longs : fragments de ~4 caractères, plus courts quand il y a des accents
  // (les caractères non ASCII coûtent plus cher en BPE).
  const accented = /[^\p{ASCII}]/u.test(core)
  const size = accented ? 3 : core.length > 10 ? 4 : 5
  const parts: string[] = []
  for (let i = 0; i < core.length; i += size) parts.push(core.slice(i, i + size))
  // Évite un dernier fragment d'une seule lettre
  if (parts.length > 1 && parts[parts.length - 1].length === 1) {
    parts[parts.length - 2] += parts.pop()
  }
  parts[0] = lead + parts[0]
  return parts
}

export function tokenize(input: string): Token[] {
  const tokens: Token[] = []
  const re = / ?[\p{L}]+|\d{1,3}|\n+|[ \t]+|[^\p{L}\d\s]/gu
  for (const m of input.matchAll(re)) {
    const t = m[0]
    if (/^\n+$/.test(t)) tokens.push({ text: t, kind: 'newline' })
    else if (/^[ \t]+$/.test(t)) tokens.push({ text: t, kind: 'space' })
    else if (/^\d+$/.test(t)) tokens.push({ text: t, kind: 'digit' })
    else if (/^ ?\p{L}+$/u.test(t)) {
      const parts = splitWord(t)
      parts.forEach((p) => tokens.push({ text: p, kind: parts.length > 1 ? 'fragment' : 'word' }))
    } else tokens.push({ text: t, kind: 'punct' })
  }
  return tokens
}

/** Estimation rapide pour de gros textes (≈ 3,6 caractères/token en moyenne FR/EN/code). */
export function estimateTokens(text: string): number {
  if (!text) return 0
  if (text.length < 20_000) return tokenize(text).length
  return Math.round(text.length / 3.6)
}
