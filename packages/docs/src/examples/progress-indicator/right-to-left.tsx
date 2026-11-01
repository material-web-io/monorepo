import { CircularProgressIndicator, LinearProgressIndicator } from '@material-web/react'

export default function RightToLeft() {
  return (
    <div dir="rtl" className="flex w-full max-w-96 items-center gap-space-400">
      <LinearProgressIndicator aria-label="Loading news article" shape="wavy" value={40} />
      <CircularProgressIndicator aria-label="Refreshing page" shape="wavy" value={40} />
    </div>
  )
}
