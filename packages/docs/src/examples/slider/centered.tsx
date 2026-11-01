import { Slider } from '@material-web/react'

export default function Centered() {
  return (
    <div className="flex w-80 flex-col gap-space-300">
      <Slider aria-label="Balance" minValue={-50} maxValue={50} defaultValue={-20} isCentered />
      <Slider
        aria-label="Balance, disabled"
        minValue={-50}
        maxValue={50}
        defaultValue={20}
        isCentered
        isDisabled
      />
    </div>
  )
}
