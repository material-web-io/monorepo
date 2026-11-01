import { Button, Icon } from '@material-web/react'

export default function LinkButton() {
  return (
    <Button
      variant="tonal"
      elementType="a"
      href="https://m3.material.io/components/buttons"
      target="_blank"
      rel="noreferrer"
    >
      Read the spec
      <Icon name="open_in_new" />
    </Button>
  )
}
