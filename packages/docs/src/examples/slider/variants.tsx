import { Slider } from '@material-web/react'

export default function Variants() {
  return (
    <div className="flex w-80 flex-col gap-space-300">
      <Slider aria-label="Standard" defaultValue={40} />
      <Slider aria-label="Centered" minValue={-50} maxValue={50} defaultValue={-20} isCentered />
      <Slider aria-label="Range" defaultValue={[30, 70]} />
    </div>
  )
}
