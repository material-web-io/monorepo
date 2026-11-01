import type { Decorator, Preview } from '@storybook/react-vite'
import { I18nProvider, isRTL } from 'react-aria'
import { INITIAL_VIEWPORTS } from 'storybook/viewport'
import '@fontsource/roboto/400.css'
import '@fontsource/roboto/500.css'
import '@fontsource/roboto/700.css'
import '@fontsource-variable/material-symbols-outlined/full.css'
import './preview.css'

const GRID_STYLE_ID = 'grid-center'

/* Storybook anchors its grid overlay to the canvas's top-left corner; this re-anchors
   it so the major and minor lines cross at the exact center of the canvas. */
const centerGrid: Decorator = (Story, context) => {
  const grid = context.parameters.backgrounds?.grid as
    { cellSize: number; cellAmount: number } | undefined
  if (!grid || context.viewMode !== 'story') return Story()
  const major = `calc(50% + ${(grid.cellSize * grid.cellAmount) / 2}px)`
  const minor = `calc(50% + ${grid.cellSize / 2}px)`
  let style = document.getElementById(GRID_STYLE_ID)
  if (!style) {
    style = document.createElement('style')
    style.id = GRID_STYLE_ID
    document.head.append(style)
  }
  style.textContent = `body.sb-show-main { background-position: ${major} ${major}, ${major} ${major}, ${minor} ${minor}, ${minor} ${minor} !important; }`
  return Story()
}

// The browser's own language, under the one the decorator gives `navigator`.
const browserLanguage = () => Reflect.get(Navigator.prototype, 'language', navigator) as string

const preview: Preview = {
  globalTypes: {
    theme: {
      description: 'Color scheme',
      toolbar: {
        title: 'Theme',
        icon: 'circlehollow',
        items: [
          { value: 'system', title: 'System' },
          { value: 'light', title: 'Light' },
          { value: 'dark', title: 'Dark' },
        ],
        dynamicTitle: true,
      },
    },
    contrast: {
      description: 'Contrast level',
      toolbar: {
        title: 'Contrast',
        icon: 'contrast',
        items: [
          { value: 'standard', title: 'Standard contrast' },
          { value: 'medium', title: 'Medium contrast' },
          { value: 'high', title: 'High contrast' },
        ],
        dynamicTitle: true,
      },
    },
    motion: {
      description: 'Motion scheme',
      toolbar: {
        title: 'Motion',
        icon: 'lightning',
        items: [
          { value: 'expressive', title: 'Expressive motion' },
          { value: 'standard', title: 'Standard motion' },
        ],
        dynamicTitle: true,
      },
    },
    locale: {
      description: 'Locale',
      toolbar: {
        title: 'Locale',
        icon: 'globe',
        items: [
          { value: 'system', title: 'System' },
          // React Aria's supported locales, as its docs list them.
          { value: 'ar-AE', title: 'Arabic (United Arab Emirates)' },
          { value: 'bg-BG', title: 'Bulgarian (Bulgaria)' },
          { value: 'zh-CN', title: 'Chinese (Simplified)' },
          { value: 'zh-TW', title: 'Chinese (Traditional)' },
          { value: 'hr-HR', title: 'Croatian (Croatia)' },
          { value: 'cs-CZ', title: 'Czech (Czech Republic)' },
          { value: 'da-DK', title: 'Danish (Denmark)' },
          { value: 'nl-NL', title: 'Dutch (Netherlands)' },
          { value: 'en-GB', title: 'English (Great Britain)' },
          { value: 'en-US', title: 'English (United States)' },
          { value: 'et-EE', title: 'Estonian (Estonia)' },
          { value: 'fi-FI', title: 'Finnish (Finland)' },
          { value: 'fr-CA', title: 'French (Canada)' },
          { value: 'fr-FR', title: 'French (France)' },
          { value: 'de-DE', title: 'German (Germany)' },
          { value: 'el-GR', title: 'Greek (Greece)' },
          { value: 'he-IL', title: 'Hebrew (Israel)' },
          { value: 'hu-HU', title: 'Hungarian (Hungary)' },
          { value: 'it-IT', title: 'Italian (Italy)' },
          { value: 'ja-JP', title: 'Japanese (Japan)' },
          { value: 'ko-KR', title: 'Korean (Korea)' },
          { value: 'lv-LV', title: 'Latvian (Latvia)' },
          { value: 'lt-LT', title: 'Lithuanian (Lithuania)' },
          { value: 'nb-NO', title: 'Norwegian (Norway)' },
          { value: 'pl-PL', title: 'Polish (Poland)' },
          { value: 'pt-PT', title: 'Portuguese (Portugal)' },
          { value: 'pt-BR', title: 'Portuguese (Brazil)' },
          { value: 'ro-RO', title: 'Romanian (Romania)' },
          { value: 'ru-RU', title: 'Russian (Russia)' },
          { value: 'sr-SP', title: 'Serbian (Serbia)' },
          { value: 'sk-SK', title: 'Slovakian (Slovakia)' },
          { value: 'sl-SI', title: 'Slovenian (Slovenia)' },
          { value: 'es-ES', title: 'Spanish (Spain)' },
          { value: 'sv-SE', title: 'Swedish (Sweden)' },
          { value: 'tr-TR', title: 'Turkish (Turkey)' },
          { value: 'uk-UA', title: 'Ukrainian (Ukraine)' },
        ],
        dynamicTitle: true,
      },
    },
  },
  initialGlobals: { theme: 'system', contrast: 'standard', motion: 'expressive', locale: 'system' },
  decorators: [
    (Story, context) => {
      const theme = context.globals.theme as string
      if (theme === 'system') delete document.documentElement.dataset.theme
      else document.documentElement.dataset.theme = theme
      const contrast = context.globals.contrast as string
      if (contrast === 'standard') delete document.documentElement.dataset.contrast
      else document.documentElement.dataset.contrast = contrast
      document.documentElement.dataset.motion = context.globals.motion as string
      // React Aria's locale, which its components take their direction from, sets the page's too.
      const locale =
        context.globals.locale === 'system' ? browserLanguage() : (context.globals.locale as string)
      document.documentElement.lang = locale
      document.documentElement.dir = isRTL(locale) ? 'rtl' : 'ltr'
      // React Aria writes a date field's errors in the browser's language, not in its locale, as
      // the browser writes its own validation messages: the browser's language is the locale's too.
      Object.defineProperty(navigator, 'language', { configurable: true, value: locale })
      return (
        <I18nProvider locale={locale}>
          <Story />
        </I18nProvider>
      )
    },
    centerGrid,
  ],
  parameters: {
    layout: 'centered',
    backgrounds: { disabled: true, grid: { cellSize: 4, cellAmount: 80, opacity: 0.2 } },
    // Storybook's full list of devices, so that a story's `viewport` global may name a phone.
    viewport: { options: INITIAL_VIEWPORTS },
  },
}

export default preview
