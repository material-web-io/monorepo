import { Card, Divider } from '@material-web/react'

function Stat({ value, label }: { value: string; label: string }) {
  return (
    <div className="flex flex-col items-center px-space-300 py-space-200">
      <span className="text-title-lg text-on-surface">{value}</span>
      <span className="text-body-md text-on-surface-variant">{label}</span>
    </div>
  )
}

export default function FlexItem() {
  return (
    <Card variant="outlined" className="flex-row items-center">
      <Stat value="128" label="Posts" />
      <Divider orientation="vertical" />
      <Stat value="2.4K" label="Followers" />
      <Divider orientation="vertical" />
      <Stat value="310" label="Following" />
    </Card>
  )
}
