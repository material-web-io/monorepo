import { CircularProgressIndicator } from '@material-web/react'

export default function CircularColor() {
  return (
    <>
      <CircularProgressIndicator
        aria-label="Loading, secondary"
        isIndeterminate
        className="text-secondary"
      />
      <CircularProgressIndicator
        aria-label="Loading, tertiary"
        isIndeterminate
        className="text-tertiary"
      />
      <CircularProgressIndicator
        aria-label="Loading, error"
        isIndeterminate
        className="text-error"
      />
    </>
  )
}
