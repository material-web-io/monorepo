import { Slider } from '@material-web/react'

export default function Stops() {
  return (
    <div className="flex w-80 flex-col gap-space-300">
      <Slider aria-label="Standard" step={10} defaultValue={40} showStops />
      <Slider
        aria-label="Centered"
        minValue={-50}
        maxValue={50}
        step={10}
        defaultValue={20}
        isCentered
        showStops
      />
      <Slider aria-label="Range" step={10} defaultValue={[20, 60]} showStops />
    </div>
  )
}
