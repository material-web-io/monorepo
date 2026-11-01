import { parseDate } from '@internationalized/date'
import { DateField } from '@material-web/react'
import { useState } from 'react'
import type { DateValue } from 'react-aria-components'

export default function Value() {
  const [date, setDate] = useState<DateValue | null>(parseDate('2025-08-17'))
  return (
    <div className="flex flex-col gap-space-100">
      <DateField label="Date" value={date} onChange={setDate} className="w-80" />
      <span className="px-space-200 text-body-md text-on-surface-variant">
        {date ? date.toString() : 'null'}
      </span>
    </div>
  )
}
