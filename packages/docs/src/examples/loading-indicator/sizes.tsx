import { LoadingIndicator } from '@material-web/react'

export default function Sizes() {
  return (
    <>
      <LoadingIndicator aria-label="Loading, 24dp" size={24} />
      <LoadingIndicator aria-label="Loading, 48dp" size={48} />
      <LoadingIndicator aria-label="Loading, 96dp" size={96} />
      <LoadingIndicator aria-label="Loading, 96dp, contained" size={96} isContained />
      <LoadingIndicator aria-label="Loading, 240dp" size={240} />
    </>
  )
}
