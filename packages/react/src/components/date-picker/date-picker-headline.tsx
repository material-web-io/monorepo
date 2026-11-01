import { useContext, type ReactNode } from 'react'
import { DateContext } from './context'
import { useHeadlineFormat } from './helpers'

// Its children, what it draws while there is no date.
export type DatePickerHeadlineProps = { children?: ReactNode }

// A DatePicker's headline, in its DatePickerHeader: the date as Compose's headline writes it, in
// React Aria's locale, e.g. `Aug 17, 2025`, or the caller's children while there is none.
export function DatePickerHeadline({ children }: DatePickerHeadlineProps) {
  const { date } = useContext(DateContext)!
  const { format } = useHeadlineFormat()
  return <span className="date-picker-headline">{date ? format(date) : children}</span>
}
