import { LoadingIndicator } from '@material-web/react'

export default function Color() {
  return (
    <>
      <LoadingIndicator aria-label="Loading, tertiary" className="text-tertiary" />
      <LoadingIndicator aria-label="Loading, error" className="text-error" />
      <LoadingIndicator
        aria-label="Loading, tertiary container"
        isContained
        className="bg-tertiary-container text-on-tertiary-container"
      />
    </>
  )
}
