import { Card } from '@material-web/react'

export default function Variants() {
  return (
    <>
      <Card variant="elevated" className="w-52 p-space-200">
        <div className="text-title-md">Elevated</div>
        <div className="text-on-surface-variant">A drop shadow lifts it off the background.</div>
      </Card>
      <Card variant="filled" className="w-52 p-space-200">
        <div className="text-title-md">Filled</div>
        <div className="text-on-surface-variant">
          A fill sets it subtly apart from the background.
        </div>
      </Card>
      <Card variant="outlined" className="w-52 p-space-200">
        <div className="text-title-md">Outlined</div>
        <div className="text-on-surface-variant">A visual boundary runs around the container.</div>
      </Card>
    </>
  )
}
