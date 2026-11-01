// The Material 3 spring motion tokens, as CSS custom properties. Emitted into
// src/theme-default.css by generate-tokens.mjs.
//
// M3 defines springs by damping ratio and stiffness (unit mass). CSS has no
// spring easing, so each spring is sampled into a linear() easing and given the
// duration after which it is within 0.1% of its target. The damping and
// stiffness values are the published expressive and standard motion schemes.
const schemes = {
  expressive: {
    'fast-spatial': [0.6, 800],
    'default-spatial': [0.8, 380],
    'slow-spatial': [0.8, 200],
    'fast-effects': [1, 3800],
    'default-effects': [1, 1600],
    'slow-effects': [1, 800],
  },
  standard: {
    'fast-spatial': [0.9, 1400],
    'default-spatial': [0.9, 700],
    'slow-spatial': [0.9, 300],
    'fast-effects': [1, 3800],
    'default-effects': [1, 1600],
    'slow-effects': [1, 800],
  },
}

const samples = 48
const settleThreshold = 0.001

// Position of a spring released from 0 at rest towards 1, at time t seconds.
const position = (damping, stiffness, t) => {
  const w0 = Math.sqrt(stiffness)
  if (damping === 1) return 1 - Math.exp(-w0 * t) * (1 + w0 * t)
  const wd = w0 * Math.sqrt(1 - damping ** 2)
  const decay = damping * w0
  return 1 - Math.exp(-decay * t) * (Math.cos(wd * t) + (decay / wd) * Math.sin(wd * t))
}

// Milliseconds until the spring stays within the threshold of its target,
// rounded up to 10ms.
const settleMs = (damping, stiffness) => {
  let last = 0
  for (let ms = 0; ms <= 5000; ms++) {
    if (Math.abs(1 - position(damping, stiffness, ms / 1000)) > settleThreshold) last = ms
  }
  return Math.ceil((last + 1) / 10) * 10
}

const round = (value) => Number(value.toFixed(4))
const easing = (damping, stiffness, ms) => {
  const points = Array.from({ length: samples + 1 }, (_, i) =>
    i === 0
      ? 0
      : i === samples
        ? 1
        : round(position(damping, stiffness, (ms / 1000) * (i / samples))),
  )
  return `linear(${points.join(', ')})`
}

const declarations = (scheme) =>
  Object.entries(scheme)
    .map(([name, [damping, stiffness]]) => {
      const ms = settleMs(damping, stiffness)
      const prefix = `--md-sys-motion-spring-${name}`
      return [
        `  ${prefix}-damping: ${damping};`,
        `  ${prefix}-stiffness: ${stiffness};`,
        `  ${prefix}-duration: ${ms}ms;`,
        `  ${prefix}-easing: ${easing(damping, stiffness, ms)};`,
      ].join('\n')
    })
    .join('\n\n')

const names = Object.keys(schemes.expressive)

/** The spring token declarations, and a one-line summary. */
export function springTokens() {
  const css = `/* M3 springs: fast/default/slow, spatial (overshoots) or effects; expressive by
 * default, data-motion="standard" switches a subtree. Each is a linear() easing
 * plus its settle duration, to pair; damping and stiffness are for JS springs. */
:root,
[data-motion='expressive'] {
${declarations(schemes.expressive)}
}

[data-motion='standard'] {
${declarations(schemes.standard)}
}

/* With prefers-reduced-motion the springs settle instantly. */
@media (prefers-reduced-motion: reduce) {
  :root,
  [data-motion] {
${names.map((n) => `    --md-sys-motion-spring-${n}-duration: 0.01ms;`).join('\n')}
  }
}
`

  return { css, summary: `${names.length} springs x ${Object.keys(schemes).length} schemes` }
}
