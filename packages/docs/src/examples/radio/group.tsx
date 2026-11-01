import { Radio, RadioGroup } from '@material-web/react'
import { Label, Text } from 'react-aria-components'

export default function Group() {
  return (
    <RadioGroup defaultValue="home" className="flex flex-col items-start text-body-lg">
      <Label className="ps-space-125 text-label-lg text-on-surface-variant">Ship to</Label>
      <Radio value="home">Home</Radio>
      <Radio value="office">Office</Radio>
      <Radio value="other">Other</Radio>
      <Text slot="description" className="ps-space-125 text-body-sm text-on-surface-variant">
        Weekdays only
      </Text>
    </RadioGroup>
  )
}
