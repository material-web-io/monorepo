import { Button } from '@material-web/react'

export default function Text() {
  return (
    <>
      <Button variant="text">Text</Button>
      <Button variant="text" isDisabled>
        Disabled
      </Button>
      <Button variant="text" elementType="a" href="#text-button">
        Link
      </Button>
    </>
  )
}
