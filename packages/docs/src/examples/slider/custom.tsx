import { Slider } from '@material-web/react'
import { Label, SliderOutput } from 'react-aria-components'

export default function Custom() {
  return (
    <Slider
      defaultValue={40}
      className="w-80 gap-space-100 text-on-surface-variant has-dragging:text-primary"
    >
      <div className="flex justify-between px-space-150 text-body-md">
        <Label>Volume</Label>
        <SliderOutput />
      </div>
    </Slider>
  )
}
