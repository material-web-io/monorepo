import { Button } from '@material-web/react'

export default function Filled() {
  return (
    <>
      <Button>Filled</Button>
      <Button isDisabled>Disabled</Button>
      <Button elementType="a" href="#filled-button">
        Link
      </Button>
    </>
  )
}
