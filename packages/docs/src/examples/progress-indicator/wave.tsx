import { CircularProgressIndicator, LinearProgressIndicator } from '@material-web/react'

export default function Wave() {
  return (
    <div className="flex w-full max-w-96 flex-col items-center gap-space-400">
      <LinearProgressIndicator aria-label="Loading" shape="wavy" value={60} />
      <LinearProgressIndicator
        aria-label="Loading, a taller and shorter wave"
        shape="wavy"
        amplitude={6}
        wavelength={24}
        value={60}
      />
      <div className="flex gap-space-400">
        <CircularProgressIndicator aria-label="Refreshing" shape="wavy" value={60} />
        <CircularProgressIndicator
          aria-label="Refreshing, a longer wave"
          shape="wavy"
          wavelength={30}
          value={60}
        />
      </div>
    </div>
  )
}
