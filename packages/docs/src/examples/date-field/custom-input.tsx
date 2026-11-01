import { parseDate } from '@internationalized/date'
import { DateField } from '@material-web/react'

export default function CustomInput() {
  return (
    <DateField
      label="Date"
      defaultValue={parseDate('2025-08-17')}
      input={(props) => <div {...props} title="Month, day and year" />}
      className="w-80"
    />
  )
}
