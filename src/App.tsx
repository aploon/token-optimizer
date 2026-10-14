import { useEffect, useState, type ComponentType } from 'react'
import Tokenizer from './sections/Tokenizer'
import Context from './sections/Context'
import Growth from './sections/Growth'
import Cost from './sections/Cost'
import PromptCheck from './sections/PromptCheck'
import ClaudeMd from './sections/ClaudeMd'
import Habits from './sections/Habits'
import Cheatsheet from './sections/Cheatsheet'
import { storageGet, storageSet } from './lib/format'

const SECTIONS: { id: string; label: string; Component: ComponentType }[] = [
  { id: 'tokens', label: 'Tokens', Component: Tokenizer },
  { id: 'contexte', label: 'Contexte', Component: Context },
  { id: 'croissance', label: 'Croissance', Component: Growth },
  { id: 'modeles', label: 'Modèles & coût', Component: Cost },
  { id: 'prompts', label: 'Vérifier un prompt', Component: PromptCheck },
  { id: 'claude-md', label: 'Audit CLAUDE.md', Component: ClaudeMd },
  { id: 'habitudes', label: 'Mes habitudes', Component: Habits },
  { id: 'aide-memoire', label: 'Aide-mémoire', Component: Cheatsheet },
]

type Theme = 'system' | 'light' | 'dark'

function currentHash() {
  const id = window.location.hash.slice(1)
  return SECTIONS.some((s) => s.id === id) ? id : SECTIONS[0].id
}

export default function App() {
  const [active, setActive] = useState(currentHash)
  const [theme, setTheme] = useState<Theme>(() => storageGet<Theme>('carnet-tokens:theme', 'system'))

  useEffect(() => {
    const onHash = () => {
      setActive(currentHash())
      window.scrollTo({ top: 0 })
    }
    window.addEventListener('hashchange', onHash)
    return () => window.removeEventListener('hashchange', onHash)
  }, [])

  useEffect(() => {
    const root = document.documentElement
    if (theme === 'system') root.removeAttribute('data-theme')
    else root.setAttribute('data-theme', theme)
    storageSet('carnet-tokens:theme', theme)
  }, [theme])

  const index = SECTIONS.findIndex((s) => s.id === active)
  const { Component } = SECTIONS[index]
  const prev = SECTIONS[index - 1]
  const next = SECTIONS[index + 1]
  const nextTheme: Record<Theme, Theme> = { system: 'light', light: 'dark', dark: 'system' }
  const themeLabel = { system: 'Thème : auto', light: 'Thème : clair', dark: 'Thème : sombre' }[theme]

  return (
    <div className="mx-auto flex min-h-screen max-w-6xl flex-col lg:flex-row">
      <aside className="border-b border-line px-4 pt-6 pb-3 lg:sticky lg:top-0 lg:h-screen lg:w-60 lg:shrink-0 lg:border-r lg:border-b-0 lg:px-6 lg:py-10">
        <div className="flex items-center justify-between lg:block">
          <a href="#tokens" className="block">
            <p className="font-display text-2xl leading-none text-ink">Carnet de tokens</p>
            <p className="mt-1.5 text-xs text-muted">Mieux utiliser Claude Code</p>
          </a>
          <button
            type="button"
            onClick={() => setTheme(nextTheme[theme])}
            className="text-xs text-muted hover:text-ink lg:mt-6"
          >
            {themeLabel}
          </button>
        </div>

        <nav className="-mx-4 mt-5 overflow-x-auto px-4 lg:mx-0 lg:mt-10 lg:overflow-visible lg:px-0">
          <ol className="flex gap-1 lg:flex-col lg:gap-0.5">
            {SECTIONS.map((s, i) => (
              <li key={s.id} className="shrink-0">
                <a
                  href={`#${s.id}`}
                  className={`flex items-baseline gap-3 rounded-md px-2.5 py-1.5 text-sm whitespace-nowrap transition-colors ${
                    s.id === active ? 'bg-sunken text-ink' : 'text-muted hover:text-ink'
                  }`}
                >
                  <span className={`font-mono text-[11px] ${s.id === active ? 'text-accent' : 'text-faint'}`}>
                    {String(i + 1).padStart(2, '0')}
                  </span>
                  {s.label}
                </a>
              </li>
            ))}
          </ol>
        </nav>
      </aside>

      <main className="min-w-0 flex-1 px-4 py-10 sm:px-8 lg:px-14 lg:py-14">
        <Component key={active} />

        <footer className="mt-16 flex items-center justify-between gap-4 border-t border-line pt-6 text-sm">
          {prev ? (
            <a href={`#${prev.id}`} className="text-muted hover:text-ink">
              ← {prev.label}
            </a>
          ) : (
            <span />
          )}
          {next && (
            <a href={`#${next.id}`} className="text-right text-ink hover:text-accent">
              {next.label} →
            </a>
          )}
        </footer>
      </main>
    </div>
  )
}
