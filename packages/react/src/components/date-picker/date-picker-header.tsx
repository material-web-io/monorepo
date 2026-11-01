import { useContext, type ComponentProps } from 'react'
import { twMerge } from '../../lib/tv'
import { PickerContext } from './context'

// The `className`, `style` and children of its `<div>`.
export type DatePickerHeaderProps = Pick<ComponentProps<'div'>, 'className' | 'style' | 'children'>

// The header of a DatePicker or DateRangePicker, over a divider, holding what the caller writes:
// React Aria's Heading in the `title` slot, which names the dialog it is in, a headline, and the
// mode toggle at the end of the headline's line.
export function DatePickerHeader({ className, ...props }: DatePickerHeaderProps) {
  const { header } = useContext(PickerContext)!
  return <div {...props} ref={header} className={twMerge('date-picker-header', className)} />
}
