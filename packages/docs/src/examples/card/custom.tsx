import { Button, Card } from '@material-web/react'

export default function Custom() {
  return (
    <Card
      variant="filled"
      className="w-80 rounded-shape-xl bg-tertiary-container text-on-tertiary-container"
    >
      <div className="p-space-300">
        <div className="text-title-lg">Glass & Grace</div>
        <div>Live at the lighthouse, Friday at 8 PM.</div>
      </div>
      <div className="flex justify-end p-space-300 pt-0">
        <Button className="bg-tertiary text-on-tertiary">Get tickets</Button>
      </div>
    </Card>
  )
}
