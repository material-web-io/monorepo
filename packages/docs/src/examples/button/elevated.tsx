import { Button } from '@material-web/react'

export default function Elevated() {
  return (
    <>
      <Button variant="elevated">Elevated</Button>
      <Button variant="elevated" isDisabled>
        Disabled
      </Button>
      <Button variant="elevated" elementType="a" href="#elevated-button">
        Link
      </Button>
    </>
  )
}
