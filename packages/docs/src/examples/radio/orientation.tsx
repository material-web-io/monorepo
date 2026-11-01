import { Radio, RadioGroup } from '@material-web/react'
import { Label } from 'react-aria-components'

export default function Orientation() {
  return (
    <RadioGroup
      orientation="horizontal"
      defaultValue="standard"
      className="flex flex-wrap items-center gap-x-space-100 text-body-lg"
    >
      <Label className="pe-space-100 text-label-lg text-on-surface-variant">Delivery</Label>
      <Radio value="standard">Standard</Radio>
      <Radio value="express">Express</Radio>
      <Radio value="pickup">Pickup</Radio>
    </RadioGroup>
  )
}
