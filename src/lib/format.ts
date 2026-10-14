const nf = new Intl.NumberFormat('fr-FR')

export const fmt = (n: number) => nf.format(Math.round(n))

export function compact(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(n >= 10_000_000 ? 0 : 1).replace('.', ',')} M`
  if (n >= 1_000) return `${(n / 1_000).toFixed(n >= 100_000 ? 0 : 1).replace('.', ',')} k`
  return fmt(n)
}

export function money(n: number): string {
  const digits = n < 1 ? 3 : 2
  return new Intl.NumberFormat('fr-FR', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: digits,
    maximumFractionDigits: digits,
  }).format(n)
}

export const pct = (n: number, digits = 0) => `${(n * 100).toFixed(digits).replace('.', ',')} %`

export function storageGet<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key)
    return raw ? (JSON.parse(raw) as T) : fallback
  } catch {
    return fallback
  }
}

export function storageSet(key: string, value: unknown) {
  try {
    localStorage.setItem(key, JSON.stringify(value))
  } catch {
    /* stockage indisponible : on ignore */
  }
}
