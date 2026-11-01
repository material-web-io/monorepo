import { Icon, Slider } from '@material-web/react'

export default function Vertical() {
  return (
    <div className="flex h-64 gap-space-600 ps-space-600">
      <Slider aria-label="Bass" orientation="vertical" defaultValue={40} showValueIndicator />
      <Slider aria-label="Treble" orientation="vertical" step={10} defaultValue={60} showStops />
      <Slider
        aria-label="Brightness"
        orientation="vertical"
        size="m"
        defaultValue={70}
        icon={<Icon name="light_mode" />}
      />
    </div>
  )
}
