import { Icon, IconButton } from '@material-web/react'

export default function LinkIconButton() {
  return (
    <IconButton
      variant="tonal"
      elementType="a"
      href="https://m3.material.io/components/icon-buttons"
      target="_blank"
      rel="noreferrer"
      aria-label="Read the spec"
    >
      <Icon name="open_in_new" />
    </IconButton>
  )
}
