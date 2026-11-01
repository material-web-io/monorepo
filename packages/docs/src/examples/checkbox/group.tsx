import { Checkbox, CheckboxGroup } from '@material-web/react'
import { Label, Text } from 'react-aria-components'

export default function Group() {
  return (
    <CheckboxGroup
      name="extras"
      defaultValue={['pickles', 'cheese']}
      className="flex flex-col items-start text-body-lg"
    >
      <Label className="ps-space-150 text-label-lg text-on-surface-variant">Extras</Label>
      <Checkbox value="pickles">Pickles</Checkbox>
      <Checkbox value="tomato">Tomato</Checkbox>
      <Checkbox value="lettuce">Lettuce</Checkbox>
      <Checkbox value="cheese">Cheese</Checkbox>
      <Text slot="description" className="ps-space-150 text-body-sm text-on-surface-variant">
        Free of charge
      </Text>
    </CheckboxGroup>
  )
}
