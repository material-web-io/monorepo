import { parseDate } from '@internationalized/date'
import { DateField } from '@material-web/react'
import { I18nProvider } from 'react-aria-components'

export default function Format() {
  const date = parseDate('2025-08-07')
  return (
    <I18nProvider locale="en-US">
      <DateField label="Leading zeros" defaultValue={date} className="w-52" />
      <DateField
        label="Locale's digits"
        defaultValue={date}
        shouldForceLeadingZeros={false}
        className="w-52"
      />
    </I18nProvider>
  )
}
