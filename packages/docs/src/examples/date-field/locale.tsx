import { parseDate } from '@internationalized/date'
import { DateField } from '@material-web/react'
import { I18nProvider } from 'react-aria-components'

export default function Locale() {
  const date = parseDate('2025-08-17')
  return (
    <>
      <I18nProvider locale="en-GB">
        <DateField label="Date" defaultValue={date} className="w-52" />
      </I18nProvider>
      <I18nProvider locale="de-DE">
        <DateField label="Datum" defaultValue={date} className="w-52" />
      </I18nProvider>
      <I18nProvider locale="ja-JP">
        <DateField label="日付" defaultValue={date} className="w-52" />
      </I18nProvider>
    </>
  )
}
