import { parseDate } from '@internationalized/date'
import { DateField } from '@material-web/react'

export default function Basic() {
  return <DateField label="Date" defaultValue={parseDate('2025-08-17')} className="w-80" />
}
