import { LinearProgressIndicator } from '@material-web/react'

export default function LinearIndeterminate() {
  return (
    <div className="w-full max-w-96">
      <LinearProgressIndicator aria-label="Loading news article" isIndeterminate />
    </div>
  )
}
