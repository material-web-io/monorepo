import { Card, Divider } from '@material-web/react'

const messages = [
  { title: 'Brunch this weekend?', preview: "I'll be in your neighborhood on Saturday" },
  { title: 'Summer barbecue', preview: "Wish I could come, but I'm out of town" },
  { title: 'Concert tickets', preview: 'There are a couple of good shows next month' },
]

export default function FullWidth() {
  return (
    <Card variant="outlined" className="w-80 py-space-100">
      {messages.map(({ title, preview }, index) => (
        <div key={title}>
          {index > 0 && <Divider />}
          <div className="flex flex-col px-space-200 py-space-150">
            <span className="truncate text-body-lg text-on-surface">{title}</span>
            <span className="truncate text-body-md text-on-surface-variant">{preview}</span>
          </div>
        </div>
      ))}
    </Card>
  )
}
