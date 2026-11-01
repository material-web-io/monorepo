import { Button } from '@material-web/react'

export default function Outlined() {
  return (
    <>
      <Button variant="outlined">Outlined</Button>
      <Button variant="outlined" isDisabled>
        Disabled
      </Button>
      <Button variant="outlined" elementType="a" href="#outlined-button">
        Link
      </Button>
    </>
  )
}
