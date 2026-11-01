import { useContext, type CSSProperties, type ReactNode } from 'react'
import {
  composeRenderProps,
  MenuItem as AriaMenuItem,
  type MenuItemProps as AriaMenuItemProps,
  type MenuItemRenderProps as AriaMenuItemRenderProps,
} from 'react-aria-components'
import type { RefProps } from '../../lib/aria'
import { tv } from '../../lib/tv'
import { laidOutWidth, useMeasuredWidth } from '../../lib/use-measured-width'
import { buttonStyles } from '../button/button'
import { Ripple } from '../ripple'
import { FabMenuContext } from './context'

/* An item: a tonal medium Button's look, React Aria's MenuItem. `justify-end` keeps the icon
 * and label pinned to the trailing edge as `width` grows from nothing, which it is while the
 * stack enters or leaves (`entering`, `exiting`, see fab-menu-popover.tsx's stack). */
const item = tv({
  // Its MenuItem is a `<div>`, disabled with data-disabled, never natively, which disabled:
  // reads too. It is given a disabled button's default cursor there, which a `<div>` lacks, and
  // the border box a `<button>` has, which the width it opens to, content and padding, is.
  base: 'box-border w-(--fab-menu-item-width) justify-end overflow-hidden transition-width-fade-color-shadow fab-menu-item-stagger group-entering/md-fab-menu:w-0 group-entering/md-fab-menu:opacity-0 group-exiting/md-fab-menu:w-0 group-exiting/md-fab-menu:opacity-0 hover:shadow-none disabled:cursor-default',
  variants: {
    color: {
      primary: 'bg-primary-container text-on-primary-container',
      secondary: 'bg-secondary-container text-on-secondary-container',
      tertiary: 'bg-tertiary-container text-on-tertiary-container',
    },
  },
})

// What an item passes its children, given as a function: the state React Aria reports of
// its MenuItem.
export type FabMenuItemRenderProps = AriaMenuItemRenderProps

// The props of React Aria's MenuItem, which an item is, rendered as a `<div>` in the `menuitem`
// role, or as an `<a>` given an `href`, with the `ref` of that element. Its children are its icon
// and then its label, drawn in that order, or a function that returns them, called with its state
// (`FabMenuItemRenderProps`). `textValue` is what typing finds it by: its children when they are a
// plain string, else the textValue the types then require, of a string alone as the children, or
// of a textValue with any children.
export type FabMenuItemProps = AriaMenuItemProps &
  RefProps<HTMLDivElement> &
  ({ children: string; textValue?: string } | { textValue: string })

// The width an item opens to: its content's as laid out, to the fraction (scrollWidth rounds, and
// a fraction rounded off would come out of the leading padding), plus the item's own padding -
// read from the computed style, since `className` can override it.
const itemWidth = (content: HTMLElement) => {
  const { paddingLeft, paddingRight } = getComputedStyle(content.parentElement!)
  return laidOutWidth(content) + parseFloat(paddingLeft) + parseFloat(paddingRight)
}

/**
 * The icons shouldn’t be removed since they make each item easy to
 * identify.
 *
 * Only remove the icon if necessary. The icon provides a
 * differentiation between items.
 *
 * @see https://m3.material.io/components/fab-menu/guidelines
 * @see https://m3.material.io/components/fab-menu/accessibility
 */
export function FabMenuItem({ className, children, style, ...props }: FabMenuItemProps) {
  const { color } = useContext(FabMenuContext)
  // The content is measured once React Aria has drawn it: it draws an item from the children
  // it collected here, mounted after this has rendered, so the ref is a callback.
  const { ref: contentRef, width = 0 } = useMeasuredWidth<HTMLSpanElement>(children, itemWidth)
  const content = (nodes: ReactNode) => (
    <>
      <Ripple />
      <span ref={contentRef} className="flex items-center gap-space-100 icon-24">
        {nodes}
      </span>
    </>
  )
  // React Aria types to an item by its children when they are text, but it is handed a function.
  return (
    <AriaMenuItem
      textValue={typeof children === 'string' ? children : undefined}
      {...props}
      style={composeRenderProps(
        style,
        (style) => ({ ...style, '--fab-menu-item-width': `${width}px` }) as CSSProperties,
      )}
      className={composeRenderProps(className, (className) =>
        buttonStyles({ variant: 'tonal', size: 'm', className: item({ color, className }) }),
      )}
    >
      {composeRenderProps(children, content)}
    </AriaMenuItem>
  )
}
