# @material-web/tailwind

The [Material 3](https://m3.material.io) design tokens for [Tailwind CSS](https://tailwindcss.com) v4, as Tailwind classes and CSS custom properties. CSS only, with no JavaScript and no dependencies.

Use it with your own markup or components, in React or any other framework. For Material 3 components for React, use [`@material-web/react`](https://github.com/material3-web/monorepo/tree/main/packages/react#readme), which installs this theme.

> **Beta.** This library is in beta. Its API may change between releases until the first stable version.

## Installation

The theme needs Tailwind CSS v4 in your project. To add it, follow Tailwind's [installation guide](https://tailwindcss.com/docs/installation).

```sh
npm install @material-web/tailwind
```

Import the theme after Tailwind. It extends Tailwind's [default theme](https://tailwindcss.com/docs/theme#default-theme-variables), so Tailwind's own classes keep working.

```css
@import 'tailwindcss';
@import '@material-web/tailwind';
```

Import Roboto and Material Symbols Outlined from Google Fonts at the top of your CSS, above any other import:

```css
@import url('https://fonts.googleapis.com/css2?family=Roboto:wght@400;500;700&family=Material+Symbols+Outlined:opsz,wght,FILL,GRAD@20..48,100..700,0..1,-50..200');
```

The theme does not set the color or the typeface of the page. Add the page's color roles, its typeface and its type style to the `body`:

```html
<body class="bg-surface font-plain text-body-lg text-on-surface"></body>
```

## Usage

Use the theme's classes in your markup, next to Tailwind's own:

```html
<div
  class="rounded-shape-lg bg-primary-container p-space-200 text-on-primary-container shadow-elevation-1"
>
  <h2 class="text-title-lg">Material 3</h2>
  <p class="text-body-md">The tokens, as Tailwind classes.</p>
</div>
```

In your own CSS, use any token as a custom property, named as in the Material 3 spec: `var(--md-sys-color-primary)`, `var(--md-sys-shape-corner-medium)`, `var(--md-sys-motion-easing-emphasized)`.

## Tokens

| Tokens         | Utilities                                                                                                             | Examples                               |
| -------------- | --------------------------------------------------------------------------------------------------------------------- | -------------------------------------- |
| Color          | Color roles for the light and dark schemes at every contrast level                                                    | `bg-primary`, `text-on-surface`        |
| Tonal palettes | The tones that the color roles come from, as a separate import. See [Tonal palettes](#tonal-palettes).                | `bg-primary-40`, `text-neutral-90`     |
| Typography     | The type scale, where each style sets its size, line height, tracking and weight, with the typefaces and font weights | `text-title-lg`, `font-brand`          |
| Shape          | The corner radius scale, for all corners or for a single side or corner, and the shape library                        | `rounded-shape-lg`, `shape-heart`      |
| Spacing        | The spacing scale, for every spacing utility, next to Tailwind's own scale                                            | `p-space-200`, `gap-space-100`         |
| Elevation      | The elevation levels, as shadows                                                                                      | `shadow-elevation-1`                   |
| Motion         | Easings, durations and springs, with transition presets                                                               | `ease-emphasized`, `duration-medium-2` |
| State          | State layer opacities, disabled opacities and focus rings                                                             | `opacity-state-hover`, `focus-ring`    |
| Layout         | Breakpoints for the window size, the stacking order and the scrollbar                                                 | `expanded-screen:`, `z-dialog`         |
| Density        | Spacing that adjusts to the density level of an element or its container                                              | `py-space-150-variable`, `density-1`   |
| Accessibility  | Touch targets, forced colors utilities and raised contrast variants                                                   | `touch-target`, `contrast-raised:`     |

Use one set of breakpoints on an element. Tailwind sorts the theme's breakpoints, set in `px`, before its own, set in `rem`, whatever their widths, so `md:` overrides `expanded-screen:` even though it is narrower.

## Tonal palettes

The tonal palettes are a separate file. Import it after the theme:

```css
@import 'tailwindcss';
@import '@material-web/tailwind';
@import '@material-web/tailwind/palettes.css';
```

The palettes are `primary`, `secondary`, `tertiary`, `error`, `neutral` and `neutral-variant`, each in the tones 0, 10 to 90 by tens, 95, 99 and 100. `neutral-50` and `neutral-100` are Material's tones, and `neutral-200` to `neutral-950` remain Tailwind's grays.

## Theming

Set these attributes on the root element, or on any element for what is inside it:

| Attribute       | Values           | Use                                                                                                          |
| --------------- | ---------------- | ------------------------------------------------------------------------------------------------------------ |
| `data-theme`    | `light`, `dark`  | The color scheme. Without it, the scheme follows the system's.                                               |
| `data-contrast` | `medium`, `high` | The contrast level, on the root, or on or around an element that has `data-theme`. Standard without it.      |
| `data-motion`   | `standard`       | The standard motion scheme. The expressive scheme is the default; `expressive` returns part of a page to it. |

With `prefers-reduced-motion`, every duration token, a spring's too, is close to zero, so you do not need `motion-reduce:` classes.

To change a token, set its custom property after the import, such as `--md-ref-typeface-brand` and `--md-ref-typeface-plain` for other typefaces, or `--font-icon` for another icon font.

### Seed color

Every color comes from one seed color, `#6750A4` by default, the Material 3 baseline. To use another, write its palettes and color roles to a file with the package's command:

```sh
npx @material-web/tailwind --seed "#0b6a5b" --out src/theme.css
```

Import the file after the theme, where it replaces the default colors:

```css
@import 'tailwindcss';
@import '@material-web/tailwind';
@import './theme.css';
```

The error palette is Material's baseline one for every seed.

## React Aria components

The theme's state variants are [Tailwind's own](https://tailwindcss.com/docs/hover-focus-and-other-states). To style [React Aria](https://react-aria.adobe.com/) components, which report their state as data attributes, install React Aria's [Tailwind plugin](https://react-aria.adobe.com/styling#tailwind-css), `tailwindcss-react-aria-components`, and load it after the theme. The theme's utilities then follow its variants too.

```css
@import 'tailwindcss';
@import '@material-web/tailwind';
@plugin 'tailwindcss-react-aria-components';
```

The focus rings, `focus-ring`, `focus-ring-inset` and `focus-ring-icon`, show while the element has keyboard focus: the browser's `:focus-visible`, or a React Aria component's `data-focus-visible`.

## Global styles

The theme includes no CSS reset, so the existing styles of your page are not changed. These are the only styles that apply to the whole page:

- **Color scheme:** `color-scheme` follows the theme, on the root element and on any element with `data-theme`, so that the browser's own controls match it.
- **Scrollbars:** The scrollbar of the page and of every scroll container is a 4dp thumb with no track. Add `scrollbar-hidden` to an element to hide its scrollbar.

## Single files

`@material-web/tailwind` imports every file of the theme except `palettes.css`. To use part of the theme, import its files by name, with the files they need:

```css
@import 'tailwindcss';
@import '@material-web/tailwind/theme-default.css';
@import '@material-web/tailwind/colors.css';
```

| File                | Contents                                                                  | Needs                                             |
| ------------------- | ------------------------------------------------------------------------- | ------------------------------------------------- |
| `theme-default.css` | The color roles, tonal palettes and springs as `--md-*` custom properties |                                                   |
| `colors.css`        | The color role utilities                                                  | `theme-default.css`                               |
| `typography.css`    | The type scale, typefaces, font weights, and the icon font and its sizes  |                                                   |
| `shape.css`         | The corner radius scale                                                   |                                                   |
| `shape-library.css` | The shape library                                                         |                                                   |
| `spacing.css`       | The spacing scale, density spacing and density levels                     |                                                   |
| `elevation.css`     | The elevation levels                                                      | `theme-default.css`                               |
| `motion.css`        | The easings and durations                                                 |                                                   |
| `transitions.css`   | The springs and the transition presets                                    | `theme-default.css`                               |
| `state.css`         | The state layer opacities and focus rings                                 | `theme-default.css`, `motion.css`, `stacking.css` |
| `layout.css`        | The breakpoints and the scrollbar                                         | `theme-default.css`, `shape.css`, `spacing.css`   |
| `stacking.css`      | The stacking order                                                        |                                                   |
| `accessibility.css` | Touch targets and the forced colors utilities                             |                                                   |
| `palettes.css`      | The tonal palette utilities                                               | `theme-default.css`                               |

## License

[MIT](LICENSE). Material Design is a trademark of Google LLC; this project is independent and not affiliated with or endorsed by Google.
