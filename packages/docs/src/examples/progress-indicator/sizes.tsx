import { CircularProgressIndicator } from '@material-web/react'

export default function Sizes() {
  return (
    <>
      <CircularProgressIndicator aria-label="Loading, 24dp" shape="wavy" size={24} value={40} />
      <CircularProgressIndicator aria-label="Loading, 48dp" shape="wavy" size={48} value={40} />
      <CircularProgressIndicator aria-label="Loading, 96dp" shape="wavy" size={96} value={40} />
      <CircularProgressIndicator aria-label="Loading, 240dp" shape="wavy" size={240} value={40} />
    </>
  )
}
