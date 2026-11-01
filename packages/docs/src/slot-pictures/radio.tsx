import { Radio, RadioGroup } from '@material-web/react'
import { Label, Text } from 'react-aria-components'
import { SlotCanvas, SlotPicture } from '../components/slot-picture'

/** The slot of a radio group: its description. */
export function RadioGroupSlots({ showLegend }: { showLegend?: boolean }) {
  return (
    <SlotPicture slots={['description']} showLegend={showLegend}>
      <SlotCanvas>
        <RadioGroup defaultValue="home" className="flex flex-col items-start text-body-lg">
          <Label className="ps-space-125 text-label-lg text-on-surface-variant">Ship to</Label>
          <Radio value="home">Home</Radio>
          <Radio value="office">Office</Radio>
          <Text slot="description" className="ps-space-125 text-body-sm text-on-surface-variant">
            Weekdays only
          </Text>
        </RadioGroup>
      </SlotCanvas>
    </SlotPicture>
  )
}
