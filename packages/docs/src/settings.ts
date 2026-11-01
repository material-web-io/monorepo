import { useSyncExternalStore } from 'react'

/** How the reader has the site drawn: the theme's own switches, kept in the browser. */
export type Settings = {
  theme: 'system' | 'light' | 'dark'
  contrast: 'standard' | 'medium' | 'high'
  motion: 'expressive' | 'standard'
}

const defaults: Settings = { theme: 'system', contrast: 'standard', motion: 'expressive' }
const key = 'material3-docs-settings'

// The theme reads its switches from the root's data-theme, data-contrast and data-motion, each
// absent for its default.
function apply({ theme, contrast, motion }: Settings) {
  const { dataset } = document.documentElement
  if (theme === 'system') delete dataset.theme
  else dataset.theme = theme
  if (contrast === 'standard') delete dataset.contrast
  else dataset.contrast = contrast
  if (motion === 'expressive') delete dataset.motion
  else dataset.motion = motion
}

function read(): Settings {
  try {
    return { ...defaults, ...JSON.parse(localStorage.getItem(key) ?? '{}') }
  } catch {
    return defaults
  }
}

/* What the page runs in its <head>, before it is drawn, so that a stored theme is the first
 * one shown: the built page is the same for every reader, and is drawn before React starts. */
export const settingsScript = `try {
  const stored = JSON.parse(localStorage.getItem(${JSON.stringify(key)}) ?? '{}')
  const { dataset } = document.documentElement
  if (stored.theme === 'light' || stored.theme === 'dark') dataset.theme = stored.theme
  if (stored.contrast === 'medium' || stored.contrast === 'high') dataset.contrast = stored.contrast
  if (stored.motion === 'standard') dataset.motion = stored.motion
} catch {}`

let settings: Settings | undefined
const listeners = new Set<() => void>()

const subscribe = (listener: () => void) => {
  listeners.add(listener)
  return () => listeners.delete(listener)
}

/** Changes the settings, for this visit and the next ones. */
export function setSettings(change: Partial<Settings>) {
  settings = { ...(settings ?? read()), ...change }
  apply(settings)
  try {
    localStorage.setItem(key, JSON.stringify(settings))
  } catch {
    // Kept for this visit alone.
  }
  for (const listener of listeners) listener()
}

/** The settings: the defaults in the built page, the reader's once it runs in a browser. */
export function useSettings() {
  return useSyncExternalStore(
    subscribe,
    () => (settings ??= read()),
    () => defaults,
  )
}
