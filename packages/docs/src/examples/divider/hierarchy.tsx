import { Card, Divider, Icon } from '@material-web/react'

function Message({ title, preview }: { title: string; preview: string }) {
  return (
    <div className="flex items-center gap-space-200 px-space-200 py-space-150">
      <span className="flex size-10 shrink-0 items-center justify-center rounded-shape-full bg-primary-container text-on-primary-container">
        <Icon name="person" className="icon-24" />
      </span>
      <div className="flex min-w-0 flex-col">
        <span className="truncate text-body-lg text-on-surface">{title}</span>
        <span className="truncate text-body-md text-on-surface-variant">{preview}</span>
      </div>
    </div>
  )
}

export default function Hierarchy() {
  return (
    <Card variant="outlined" className="w-80 py-space-100">
      <div className="px-space-200 py-space-100 text-label-lg text-on-surface-variant">Today</div>
      <Message title="Brunch this weekend?" preview="I'll be in your neighborhood on Saturday" />
      <Divider variant="inset" />
      <Message title="Summer barbecue" preview="Wish I could come, but I'm out of town" />
      <Divider />
      <div className="px-space-200 py-space-100 text-label-lg text-on-surface-variant">
        Yesterday
      </div>
      <Message title="Concert tickets" preview="There are a couple of good shows next month" />
    </Card>
  )
}
