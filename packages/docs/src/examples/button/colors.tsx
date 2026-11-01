import { Button } from '@material-web/react'

export default function Colors() {
  return (
    <>
      <Button variant="text" className="text-tertiary">
        Tertiary
      </Button>
      <Button variant="tonal" className="bg-tertiary-container text-on-tertiary-container">
        Tertiary container
      </Button>
      <Button className="bg-error text-on-error">Error</Button>
    </>
  )
}
