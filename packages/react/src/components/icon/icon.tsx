import { createContext, type ComponentProps } from 'react'
import { useSlottedContext, type ContextValue } from 'react-aria-components'
import { twMerge } from '../../lib/tv'

// The slots an Icon may take where it is, as a React Aria context gives them: a `slot` not among
// them throws React Aria's `Invalid slot` error. It only checks the slot, and carries no props.
export const IconContext = createContext<ContextValue<Record<string, never>, HTMLSpanElement>>(null)

// The props of a `<span>`, with the `ref` of it. It draws a Material Symbols glyph by ligature,
// `name` in the icon font, which isn't bundled (see --font-icon), in a square box its font size
// (font-icon, icon.css); its classes style the rest: size (`icon-32`), weight (`font-medium`), fill
// (`icon-filled`), grade (`icon-grade-200`) and mirroring (`rtl:icon-mirrored`).
export type IconProps = Omit<ComponentProps<'span'>, 'children'> & {
  /**
   * Ligature name from the Material Symbols set, e.g. `home` or `arrow_back`
   *
   * @see https://fonts.google.com/icons
   * @see https://m3.material.io/styles/icons/overview
   */
  name: string
}

/**
 * Icons are decorative unless given an `aria-label`, in which case they are
 * exposed as an image.
 *
 * @see https://m3.material.io/styles/icons/overview
 * @see https://m3.material.io/styles/icons/applying-icons
 */
export function Icon({ name, className, ...props }: IconProps) {
  useSlottedContext(IconContext, props.slot)
  const labelled = props['aria-label'] !== undefined
  return (
    <span
      role={labelled ? 'img' : undefined}
      aria-hidden={labelled ? undefined : true}
      {...props}
      className={twMerge('font-icon', className)}
    >
      {name}
    </span>
  )
}
