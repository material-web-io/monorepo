import { parseDate } from '@internationalized/date'
import { Button, DateField } from '@material-web/react'
import { PhoneTop } from '../components/phone'

/** Date fields on the form of a stay: one with a date entered, one still empty. */
export default function DateFieldScene() {
  return (
    <PhoneTop className="gap-space-300 px-space-300">
      <div className="flex shrink-0 flex-col pt-space-300">
        <span className="text-headline-sm">Plan a stay</span>
        <span className="text-body-md text-on-surface-variant">Lake Louise, Alberta</span>
      </div>
      <DateField label="Check in" defaultValue={parseDate('2025-08-17')} className="w-full" />
      <DateField label="Check out" className="w-full" />
      <Button size="m" className="w-full">
        Search stays
      </Button>
    </PhoneTop>
  )
}
