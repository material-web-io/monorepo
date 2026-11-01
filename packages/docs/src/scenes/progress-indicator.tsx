import { CircularProgressIndicator, LinearProgressIndicator } from '@material-web/react'
import { PhoneTop } from '../components/phone'

const files = [
  ['Summer trip.zip', '1.2 GB of 2.1 GB', 55, 'wavy'],
  ['Field notes.pdf', '19 MB of 24 MB', 80, 'flat'],
  ['Episode 12.mp3', '9 MB of 62 MB', 15, 'wavy'],
] as const

/** Progress indicators on a list of downloads: a circular one for all, a linear one for each. */
export default function ProgressIndicatorScene() {
  return (
    <PhoneTop>
      <span className="px-space-300 pt-space-300 text-headline-sm">Downloads</span>
      <div className="flex shrink-0 items-center gap-space-200 px-space-300 py-space-300">
        <CircularProgressIndicator aria-label="All downloads" value={50} />
        <span className="flex flex-col">
          <span className="text-title-md">3 files</span>
          <span className="text-body-md text-on-surface-variant">About 4 minutes left</span>
        </span>
      </div>
      {files.map(([name, status, value, shape]) => (
        <div key={name} className="flex shrink-0 flex-col gap-space-150 px-space-300 py-space-200">
          <span className="flex justify-between text-body-lg">
            {name}
            <span className="text-body-md text-on-surface-variant">{value}%</span>
          </span>
          <LinearProgressIndicator aria-label={name} shape={shape} value={value} />
          <span className="text-body-sm text-on-surface-variant">{status}</span>
        </div>
      ))}
    </PhoneTop>
  )
}
