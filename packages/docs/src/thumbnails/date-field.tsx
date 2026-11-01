import { parseDate } from '@internationalized/date'
import { DateField } from '@material-web/react'

/** Two date fields on a screen: one with a date entered, one still empty. */
export default function DateFieldThumbnail() {
  return (
    <div className="docs-thumbnail-screen w-64 justify-center gap-space-200 self-stretch border-y-0 px-space-250">
      <DateField label="Check in" defaultValue={parseDate('2025-08-17')} className="w-full" />
      <DateField label="Check out" className="w-full" />
    </div>
  )
}
