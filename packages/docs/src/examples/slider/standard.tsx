import { Slider } from '@material-web/react'

export default function Standard() {
  return (
    <div className="flex w-80 flex-col gap-space-300">
      <Slider aria-label="Volume" defaultValue={40} />
      <Slider aria-label="Volume, disabled" defaultValue={40} isDisabled />
    </div>
  )
}
