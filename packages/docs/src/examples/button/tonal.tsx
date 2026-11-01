import { Button } from '@material-web/react'

export default function Tonal() {
  return (
    <>
      <Button variant="tonal">Tonal</Button>
      <Button variant="tonal" isDisabled>
        Disabled
      </Button>
      <Button variant="tonal" elementType="a" href="#tonal-button">
        Link
      </Button>
    </>
  )
}
