import { Button, Card, Divider } from '@material-web/react'

export default function Basic() {
  return (
    <Card variant="outlined" className="w-80">
      <div className="flex flex-col gap-space-50 p-space-200">
        <span className="text-title-md text-on-surface">Glass & Grace</span>
        <span className="text-body-md text-on-surface-variant">
          Sound Check: Making of Eye Rhymes
        </span>
      </div>
      <Divider />
      <div className="flex justify-end p-space-100">
        <Button variant="text">Read more</Button>
      </div>
    </Card>
  )
}
