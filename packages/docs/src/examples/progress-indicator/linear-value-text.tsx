import { LinearProgressIndicator } from '@material-web/react'

export default function LinearValueText() {
  return (
    <div className="flex w-full max-w-96 flex-col gap-space-400">
      <LinearProgressIndicator
        aria-label="Uploading photos"
        value={3}
        maxValue={8}
        valueLabel="3 of 8 photos"
      />
      <LinearProgressIndicator
        aria-label="Downloading update"
        value={12}
        maxValue={20}
        formatOptions={{ style: 'unit', unit: 'megabyte' }}
      />
    </div>
  )
}
