import { parseDate } from '@internationalized/date'
import { DateField } from '@material-web/react'

export default function ReadOnlyAndDisabled() {
  const date = parseDate('2025-08-17')
  return (
    <>
      <DateField label="Read-only" defaultValue={date} isReadOnly className="w-52" />
      <DateField label="Disabled" defaultValue={date} isDisabled className="w-52" />
    </>
  )
}
