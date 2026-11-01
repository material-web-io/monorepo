import { Slider } from '@material-web/react'
import { Label, SliderOutput } from 'react-aria-components'

export default function Output() {
  return (
    <Slider
      maxValue={500}
      step={10}
      defaultValue={[100, 350]}
      formatOptions={{ style: 'currency', currency: 'USD', maximumFractionDigits: 0 }}
      className="w-80 gap-space-100"
    >
      <div className="flex justify-between px-space-150 text-body-md text-on-surface">
        <Label>Price</Label>
        <SliderOutput className="text-on-surface-variant">
          {({ state }) => `${state.getThumbValueLabel(0)} to ${state.getThumbValueLabel(1)}`}
        </SliderOutput>
      </div>
    </Slider>
  )
}
