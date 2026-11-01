import { parseDate } from '@internationalized/date'
import { DateField } from '@material-web/react'

export default function Description() {
  const date = parseDate('2025-08-17')
  return (
    <div className="flex flex-wrap items-start justify-center gap-space-200">
      <DateField label="Check-in" defaultValue={date} className="w-52" />
      <DateField
        label="Check-in"
        description="The day you arrive"
        defaultValue={date}
        className="w-52"
      />
      <DateField label="Check-in" description={null} defaultValue={date} className="w-52" />
    </div>
  )
}
