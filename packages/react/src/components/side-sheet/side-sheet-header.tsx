import type { ComponentProps } from 'react'
import { twMerge } from '../../lib/tv'

// Every prop of a `<div>`, `className` and the ref included, is the header's own.
export type SideSheetHeaderProps = ComponentProps<'div'>

// First in a `SideSheet`, a row of what it is given, drawn as written (side-sheet.css): a back
// `IconButton` of yours, React Aria's `Heading` in the `title` slot, which names the sheet in
// either kind as a Dialog's title does, then your close `IconButton` and others before it. With
// no heading, the last is at the end all the same.
/**
 * Side sheets can contain a back icon for navigation
 *
 * People can navigate to another region within the sheet
 *
 * Icon buttons can provide ways to exit a side sheet or move to a different experience.
 *
 * A close icon button is highly recommended, increases accessibility, and makes focused side
 * sheets easier to close.
 *
 * Because the primary content behind or beside a side sheet is always visible, it’s important
 * to provide affordances for leaving a side sheet and returning to the primary content.
 *
 * Keyboard navigation:
 *
 * - Tab: Focus lands on (non-disabled) icon button
 * - Space or Enter: Activates the (non-disabled) icon button
 *
 * Side sheet padding and size measurements:
 *
 * - Start/end padding: 24dp
 * - Start padding with icon: 16dp
 * - Padding between top elements: 12dp
 *
 * @see https://m3.material.io/components/side-sheets/overview
 * @see https://m3.material.io/components/side-sheets/guidelines
 * @see https://m3.material.io/components/side-sheets/specs
 * @see https://m3.material.io/components/side-sheets/accessibility
 */
export function SideSheetHeader({ className, ...props }: SideSheetHeaderProps) {
  return <div {...props} className={twMerge('side-sheet-header', className)} />
}
