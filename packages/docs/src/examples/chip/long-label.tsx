import { Chip, ChipGroup, Icon } from '@material-web/react'
import { Text } from 'react-aria-components'

export default function LongLabel() {
  return (
    <div className="w-64">
      <ChipGroup aria-label="Filters">
        <Chip id="distance" variant="filter" textValue="Within 25 kilometers of the city center">
          <Text slot="label">Within 25 kilometers of the city center</Text>
          <Icon slot="trailing" name="arrow_drop_down" />
        </Chip>
        <Chip id="price" variant="filter" textValue="Any price" className="w-full">
          <Text slot="label">Any price</Text>
          <Icon slot="trailing" name="arrow_drop_down" />
        </Chip>
      </ChipGroup>
    </div>
  )
}
