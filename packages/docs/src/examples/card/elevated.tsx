import { Button, Card } from '@material-web/react'

export default function Elevated() {
  return (
    <Card variant="elevated" className="w-80">
      <div className="p-space-200">
        <div className="text-title-md">Eye Rhymes</div>
        <div className="text-on-surface-variant">Glass & Grace</div>
      </div>
      <div className="flex justify-end p-space-200 pt-0">
        <Button variant="tonal">Play</Button>
      </div>
    </Card>
  )
}
