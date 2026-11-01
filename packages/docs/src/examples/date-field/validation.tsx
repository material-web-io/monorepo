import { parseDate } from '@internationalized/date'
import { DateField } from '@material-web/react'

export default function Validation() {
  return (
    <div className="flex flex-wrap items-start justify-center gap-space-200">
      <DateField
        label="Invalid"
        description="Pick a day in September"
        defaultValue={parseDate('2025-08-17')}
        isInvalid
        className="w-64"
      />
      <DateField
        label="Check-in"
        description="A day in September 2025"
        minValue={parseDate('2025-09-01')}
        maxValue={parseDate('2025-09-30')}
        className="w-64"
      />
    </div>
  )
}
