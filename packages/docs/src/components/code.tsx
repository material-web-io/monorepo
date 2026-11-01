import { Icon, IconButton, Tooltip, TooltipTrigger } from '@material-web/react'
import { useRef, type ComponentProps } from 'react'
import { snackbars } from './snackbars'

// The copy button over a block of code, which copies the text of the block it is given.
function Copy({ text }: { text: () => string }) {
  return (
    <span className="docs-code-copy">
      <TooltipTrigger>
        <IconButton
          aria-label="Copy code"
          size="xs"
          className="bg-surface-container-highest"
          onPress={async () => {
            try {
              await navigator.clipboard.writeText(text())
              snackbars.add('Copied to clipboard', { timeout: 4000 })
            } catch {
              // On an insecure origin, or with the permission denied.
              snackbars.add('Couldn’t copy to clipboard', { timeout: 4000 })
            }
          }}
        >
          <Icon name="content_copy" />
        </IconButton>
        <Tooltip placement="start">Copy</Tooltip>
      </TooltipTrigger>
    </span>
  )
}

/** A block of code highlighted by the build, as its HTML, with a button that copies `code`. */
export function Code({ html, code }: { html: string; code: string }) {
  return (
    <div className="docs-code">
      <div dangerouslySetInnerHTML={{ __html: html }} />
      <Copy text={() => code} />
    </div>
  )
}

/**
 * A page's own block of code, a fence in its MDX, which the build has highlighted. It takes the
 * focus, as the highlighter has a block of a language it knows do, so that the keyboard can
 * scroll it.
 */
export function Pre(props: ComponentProps<'pre'>) {
  const pre = useRef<HTMLPreElement>(null)
  return (
    <div className="docs-code">
      <pre tabIndex={0} {...props} ref={pre} />
      <Copy text={() => pre.current?.textContent ?? ''} />
    </div>
  )
}
