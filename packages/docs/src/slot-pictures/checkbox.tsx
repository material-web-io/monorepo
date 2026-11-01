import { Checkbox, CheckboxGroup } from '@material-web/react'
import { Label, Text } from 'react-aria-components'
import { SlotCanvas, SlotPicture } from '../components/slot-picture'

/** The slot of a checkbox group: its description. */
export function CheckboxGroupSlots({ showLegend }: { showLegend?: boolean }) {
  return (
    <SlotPicture slots={['description']} showLegend={showLegend}>
      <SlotCanvas>
        <CheckboxGroup
          defaultValue={['pickles']}
          className="flex flex-col items-start text-body-lg"
        >
          <Label className="ps-space-150 text-label-lg text-on-surface-variant">Extras</Label>
          <Checkbox value="pickles">Pickles</Checkbox>
          <Checkbox value="tomato">Tomato</Checkbox>
          <Text slot="description" className="ps-space-150 text-body-sm text-on-surface-variant">
            Free of charge
          </Text>
        </CheckboxGroup>
      </SlotCanvas>
    </SlotPicture>
  )
}
