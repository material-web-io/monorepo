import { createCssVariablesTheme, createHighlighter, type Highlighter } from 'shiki'

/* One theme, whose colors are custom properties (--shiki-token-keyword, ...) the stylesheet
 * sets to Material color roles, so that code follows the page's theme and contrast. */
export const codeTheme = createCssVariablesTheme({ name: 'material', variablePrefix: '--shiki-' })

export const languages = ['tsx', 'ts', 'css', 'html', 'sh', 'json']

let highlighter: Promise<Highlighter> | undefined

/** `code` as the HTML of a highlighted `<pre>`. */
export async function highlight(code: string, lang: string) {
  highlighter ??= createHighlighter({ themes: [codeTheme], langs: languages })
  return (await highlighter).codeToHtml(code, { lang, theme: codeTheme.name! })
}
