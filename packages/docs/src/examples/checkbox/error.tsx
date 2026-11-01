import { Checkbox } from '@material-web/react'

export default function Invalid() {
  return (
    <>
      <Checkbox isInvalid aria-label="Unselected" />
      <Checkbox isInvalid defaultSelected aria-label="Selected" />
      <Checkbox isInvalid isIndeterminate aria-label="Indeterminate" />
    </>
  )
}
