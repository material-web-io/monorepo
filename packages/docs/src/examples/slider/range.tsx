import { Slider } from '@material-web/react'

export default function Range() {
  return (
    <div className="flex w-80 flex-col gap-space-300">
      <Slider aria-label="Price" defaultValue={[30, 70]} />
      <Slider aria-label="Price, disabled" step={10} defaultValue={[30, 70]} showStops isDisabled />
    </div>
  )
}
