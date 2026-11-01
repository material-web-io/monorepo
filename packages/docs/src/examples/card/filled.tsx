import { Button, Card } from '@material-web/react'

export default function Filled() {
  return (
    <Card variant="filled" className="w-80">
      <div className="p-space-200">
        <div className="text-title-md">Warped Speed</div>
        <div className="text-on-surface-variant">Trapezoid</div>
      </div>
      <div className="flex justify-end p-space-200 pt-0">
        <Button>Play</Button>
      </div>
    </Card>
  )
}
