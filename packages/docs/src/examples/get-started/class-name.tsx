import { Button } from '@material-web/react'

export default function ClassName() {
  return (
    <>
      <Button>Default</Button>
      <Button className="bg-tertiary text-on-tertiary">Tertiary</Button>
      <Button className="rounded-shape-md">Medium corners</Button>
      <Button className="w-48">48 wide</Button>
    </>
  )
}
