// The Material 3 color roles and tonal palettes for a seed color, as CSS custom
// properties. Emitted into src/theme-default.css by generate-tokens.mjs.
//
// Palettes follow the M3 baseline recipe (primary chroma >= 48, secondary 16,
// tertiary +60deg / 24, neutral 6, neutral variant 8) on the 2021 color spec.
// The error palette is the fixed M3 baseline one, whatever the seed.
import {
  argbFromHex,
  DynamicColor,
  DynamicScheme,
  Hct,
  hexFromArgb,
  MaterialDynamicColors,
  TonalPalette,
  Variant,
} from '@material/material-color-utilities'

// The error palette does not depend on the seed. It is the fixed table of
// published M3 baseline tokens (error40 is #B3261E); deriving it from a key color
// gives visibly different tones (error40 #BA1A1A, error80 #FFB4AB, ...).
const baselineError = Object.fromEntries(
  Object.entries({
    0: '#000000',
    10: '#410E0B',
    20: '#601410',
    30: '#8C1D18',
    40: '#B3261E',
    50: '#DC362E',
    60: '#E46962',
    70: '#EC928E',
    80: '#F2B8B5',
    90: '#F9DEDC',
    95: '#FCEEEE',
    99: '#FFFBF9',
    100: '#FFFFFF',
  }).map(([tone, hex]) => [tone, argbFromHex(hex)]),
)
class BaselineErrorPalette extends TonalPalette {
  constructor() {
    const { hue, chroma, keyColor } = TonalPalette.fromInt(baselineError[40])
    super(hue, chroma, keyColor)
  }
  tone(tone) {
    return baselineError[tone] ?? super.tone(tone)
  }
}

/** The color token declarations for `seedHex` (#RRGGBB), and a one-line summary. */
export function colorTokens(seedHex) {
  const source = Hct.fromInt(argbFromHex(seedHex))
  const createScheme = (isDark, contrastLevel = 0) =>
    new DynamicScheme({
      sourceColorHct: source,
      variant: Variant.TONAL_SPOT,
      contrastLevel,
      isDark,
      specVersion: '2021',
      primaryPalette: TonalPalette.fromHueAndChroma(source.hue, Math.max(48, source.chroma)),
      secondaryPalette: TonalPalette.fromHueAndChroma(source.hue, 16),
      tertiaryPalette: TonalPalette.fromHueAndChroma(source.hue + 60, 24),
      errorPalette: new BaselineErrorPalette(),
      neutralPalette: TonalPalette.fromHueAndChroma(source.hue, 6),
      neutralVariantPalette: TonalPalette.fromHueAndChroma(source.hue, 8),
    })

  // Contrast levels of the M3 color spec: standard (0), medium (0.5) and high (1).
  // Standard is the default; the others apply with data-contrast="medium|high".
  const contrasts = { standard: 0, medium: 0.5, high: 1 }
  const schemes = Object.fromEntries(
    Object.entries(contrasts).flatMap(([contrast, level]) => [
      [`light-${contrast}`, createScheme(false, level)],
      [`dark-${contrast}`, createScheme(true, level)],
    ]),
  )
  const light = schemes['light-standard']

  // The six reference palettes of a scheme, by name.
  const palettesOf = (scheme) => ({
    primary: scheme.primaryPalette,
    secondary: scheme.secondaryPalette,
    tertiary: scheme.tertiaryPalette,
    error: scheme.errorPalette,
    neutral: scheme.neutralPalette,
    'neutral-variant': scheme.neutralVariantPalette,
  })

  // At standard contrast every role is exactly one tone of one palette. Find
  // which, so the role can point at the palette variable instead of repeating its
  // hex. Returns null when the role is not a plain tone.
  const plainTone = (color, scheme) => {
    const palettes = palettesOf(scheme)
    const name = Object.keys(palettes).find((n) => palettes[n] === color.palette(scheme))
    const tone = color.getTone(scheme)
    if (!name || !Number.isInteger(tone) || palettes[name].tone(tone) !== color.getArgb(scheme)) {
      return null
    }
    return { name, tone }
  }

  // Throws if a standard-contrast role ever stops being a plain palette tone.
  const paletteTone = (color, scheme) => {
    const ref = plainTone(color, scheme)
    if (!ref) throw new Error(`Color role "${color.name}" is not a plain tone of a tonal palette`)
    return ref
  }

  // The medium and high contrast schemes move roles to computed tones (primary at
  // tone 22.6, ...) that are not palette tones. Those roles are emitted as hex;
  // the ones that still land on a palette tone keep pointing at the palette.
  const contrastValue = (color, scheme) =>
    plainTone(color, scheme) ?? { hex: hexFromArgb(color.getArgb(scheme)) }

  const kebab = (name) => name.replace(/[A-Z]/g, (c) => `-${c.toLowerCase()}`)
  const roles = Object.entries(MaterialDynamicColors)
    .filter(([name, value]) => value instanceof DynamicColor && !name.endsWith('PaletteKeyColor'))
    .map(([name, color]) => ({
      name: kebab(name),
      // Value of the role per scheme, keyed like `schemes`.
      values: Object.fromEntries(
        Object.entries(schemes).map(([key, scheme]) => [
          key,
          key.endsWith('-standard') ? paletteTone(color, scheme) : contrastValue(color, scheme),
        ]),
      ),
    }))

  const paletteVar = ({ name, tone }) => `--md-ref-palette-${name}${tone}`
  const roleValue = (ref) => ref.hex ?? `var(${paletteVar(ref)})`
  const declarations = (scheme) =>
    roles.map((r) => `  --md-sys-color-${r.name}: ${roleValue(r.values[scheme])};`).join('\n')

  // Reference tonal palettes. They do not change with the color scheme or the
  // contrast level, so every mode reads them from the light scheme. Tailwind gets utilities for `tones`
  // only; the roles also use a few in-between neutral tones (surface-container
  // at 92/94/96, dark surface at 6, ...), which stay plain CSS variables.
  const tones = [0, 10, 20, 30, 40, 50, 60, 70, 80, 90, 95, 99, 100]
  const usedTones = (name) =>
    roles
      .flatMap((r) => Object.values(r.values))
      .filter((ref) => ref.name === name)
      .map((ref) => ref.tone)
  const palettes = Object.entries(palettesOf(light)).flatMap(([name, palette]) =>
    [...new Set([...tones, ...usedTones(name)])]
      .sort((a, b) => a - b)
      .map((tone) => ({ name, tone, hex: hexFromArgb(palette.tone(tone)) })),
  )
  const css = `/* Light is the default; dark applies when the OS prefers it, unless the page
 * opts out with data-theme="light". data-theme on any element re-themes its
 * subtree. Per scheme, not light-dark(): minifiers resolve that once on :root. */

/* Every selector weighs one class, the rest of it inside :where(): the rules win by
 * their order alone, and a role set after this file, on :root or [data-theme], holds. */
:root,
[data-theme='light'] {
  color-scheme: light;
${declarations('light-standard')}
}

@media (prefers-color-scheme: dark) {
  :root:where(:not([data-theme='light'])) {
    color-scheme: dark;
${declarations('dark-standard').replace(/^/gm, '  ')}
  }
}

[data-theme='dark'] {
  color-scheme: dark;
${declarations('dark-standard')}
}

/* Contrast levels: data-contrast="medium|high" on <html> or any element raises
 * the scheme in effect (OS or data-theme). Mirrors the three rules above and
 * must stay after them: dark follows light on one element, both beat standard. */
${Object.keys(contrasts)
  .filter((contrast) => contrast !== 'standard')
  .map(
    (c) => `:root:where([data-contrast='${c}']),
[data-theme='light']:where([data-contrast='${c}']),
:where([data-contrast='${c}']) [data-theme='light'] {
${declarations(`light-${c}`)}
}

@media (prefers-color-scheme: dark) {
  :root:where(:not([data-theme='light'])[data-contrast='${c}']) {
${declarations(`dark-${c}`).replace(/^/gm, '  ')}
  }
}

[data-theme='dark']:where([data-contrast='${c}']),
:where([data-contrast='${c}']) [data-theme='dark'] {
${declarations(`dark-${c}`)}
}
`,
  )
  .join('\n')}

/* Tonal palettes: the reference colors the roles above point at, named like
 * the Material spec (--md-ref-palette-primary40). */
:root {
${palettes.map((p) => `  ${paletteVar(p)}: ${p.hex};`).join('\n')}
}

`

  return {
    css,
    summary:
      `${roles.length} color roles x ${Object.keys(schemes).length} schemes and ${palettes.length} palette tones ` +
      `(seed ${seedHex.toUpperCase()})`,
  }
}
