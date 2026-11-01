import { Button } from '@material-web/react'

export default function Density() {
  return (
    <>
      <Button>Default</Button>
      <Button className="density-1">density-1</Button>
      <Button className="density-2">density-2</Button>
      <div className="flex gap-space-100 density-3">
        <Button variant="tonal">In a</Button>
        <Button variant="tonal">density-3 box</Button>
      </div>
    </>
  )
}
