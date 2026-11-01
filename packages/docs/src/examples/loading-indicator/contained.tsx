import { LoadingIndicator } from '@material-web/react'

export default function Contained() {
  return (
    <>
      <LoadingIndicator aria-label="Loading news article" />
      <LoadingIndicator aria-label="Refreshing page" isContained />
    </>
  )
}
