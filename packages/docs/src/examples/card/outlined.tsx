import { Button, Card } from '@material-web/react'

export default function Outlined() {
  return (
    <Card variant="outlined" className="w-80">
      <div className="p-space-200">
        <div className="text-title-md">Personal Voice</div>
        <div className="text-on-surface-variant">Decorations</div>
      </div>
      <div className="flex justify-end p-space-200 pt-0">
        <Button>Play</Button>
      </div>
    </Card>
  )
}
