import { Button, ButtonGroup } from '@material-web/react'

export default function Actions() {
  return (
    <ButtonGroup aria-label="Actions" selectionMode="multiple">
      <Button variant="outlined">Cancel</Button>
      <Button variant="tonal">Save draft</Button>
      <Button>Publish</Button>
    </ButtonGroup>
  )
}
