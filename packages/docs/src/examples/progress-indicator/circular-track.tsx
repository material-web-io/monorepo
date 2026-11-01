import { CircularProgressIndicator } from '@material-web/react'

export default function CircularTrack() {
  return (
    <>
      <CircularProgressIndicator aria-label="Loading news article" value={40} />
      <CircularProgressIndicator aria-label="Loading, no track" value={40} showTrack={false} />
      <CircularProgressIndicator
        aria-label="Refreshing, no track"
        isIndeterminate
        showTrack={false}
      />
    </>
  )
}
