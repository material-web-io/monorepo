import { Slider } from '@material-web/react'
import { Label, SliderOutput } from 'react-aria-components'

export default function Basic() {
  return (
    <Slider defaultValue={40} className="w-80 gap-space-100">
      <div className="flex justify-between gap-space-200 px-space-150 text-body-md text-on-surface">
        <Label>Volume</Label>
        <SliderOutput className="text-on-surface-variant" />
      </div>
    </Slider>
  )
}
