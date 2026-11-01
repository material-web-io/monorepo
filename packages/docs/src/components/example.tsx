import { tv } from '@material-web/react'
import { useState, type ComponentType } from 'react'
import { UNSAFE_PortalProvider } from 'react-aria'
import { useScrolls } from '../scroll'
import { Code } from './code'

/** What `<file>.tsx?example` exports: the example, and its source as text and highlighted. */
export type ExampleSource = {
  Component: ComponentType
  code: string
  html: string
}

const preview = tv({
  base: 'docs-example-preview',
  variants: {
    // An example drawn edge to edge is one that fills its frame: a bar, a sheet's page.
    isFlush: { true: 'docs-example-flush block p-0', false: '' },
    // A frame that stands in for the window holds what the example puts at the end of the page,
    // fixed to the frame.
    isWindow: { true: 'contain-layout', false: '' },
    // A sample of the type scale is in the theme's letter spacing, where the site has its own.
    hasThemeTracking: { true: 'docs-theme-tracking', false: '' },
  },
})

export type ExampleProps = ExampleSource & {
  /** Draws the example to the frame's edges, for one that is a page or a bar across it. */
  isFlush?: boolean
  /**
   * Draws the example in a frame that stands in for the window, for one written as an app writes
   * it: what it renders at the end of the page, such as a snackbar region, is in the frame.
   */
  isWindow?: boolean
  /** Shows the example's source under it: on unless set, off for a chart of tokens. */
  showCode?: boolean
  /** Draws the example in the theme's own letter spacing, for a sample of the type scale. */
  hasThemeTracking?: boolean
}

/** An example running in the page, over the code it is written in. */
export function Example({
  Component,
  code,
  html,
  isFlush = false,
  isWindow = false,
  showCode = true,
  hasThemeTracking = false,
}: ExampleProps) {
  const [frame, setFrame] = useState<HTMLElement | null>(null)
  // A preview wider than the page scrolls, and then takes the focus, for the keyboard to scroll it.
  const scrolls = useScrolls(frame)
  return (
    <div className="docs-example">
      <div
        ref={setFrame}
        tabIndex={scrolls ? 0 : undefined}
        className={preview({ isFlush, isWindow, hasThemeTracking })}
      >
        {isWindow ? (
          <UNSAFE_PortalProvider getContainer={() => frame}>
            <Component />
          </UNSAFE_PortalProvider>
        ) : (
          <Component />
        )}
      </div>
      {showCode && <Code html={html} code={code} />}
    </div>
  )
}
