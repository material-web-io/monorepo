import { Button, Card, Divider } from '@material-web/react'

export default function MiddleInset() {
  return (
    <Card variant="outlined" className="w-80">
      <p className="m-0 p-space-200 text-body-md text-on-surface">
        Dividers are one way to visually group components and create hierarchy. They can also be
        used to imply nested parent/child relationships.
      </p>
      <Divider variant="middle-inset" />
      <div className="flex gap-space-100 p-space-200">
        <Button variant="tonal" size="xs">
          Lists
        </Button>
        <Button variant="tonal" size="xs">
          Cards
        </Button>
        <Button variant="tonal" size="xs">
          Menus
        </Button>
      </div>
    </Card>
  )
}
