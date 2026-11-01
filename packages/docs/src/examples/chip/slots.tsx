import { Chip, ChipGroup, Icon, IconButton } from '@material-web/react'
import { useState } from 'react'
import { Text } from 'react-aria-components'

export default function Slots() {
  const [price, setPrice] = useState('Under $50')
  return (
    <ChipGroup aria-label="Slots">
      <Chip id="leading" variant="assist" textValue="Leading icon">
        <Icon slot="leading" name="event" />
        Leading icon
      </Chip>
      <Chip id="trailing" variant="filter" textValue="Trailing icon">
        Trailing icon
        <Icon slot="trailing" name="arrow_drop_down" />
      </Chip>
      <Chip id="both" variant="filter" textValue="Both">
        <Icon slot="leading" name="sell" />
        Both
        <Icon slot="trailing" name="arrow_drop_down" />
      </Chip>
      <Chip id="price" variant="filter" textValue={price}>
        <Text slot="label">{price}</Text>
        <IconButton slot="trailing" aria-label="Clear price" onPress={() => setPrice('Any price')}>
          <Icon name="close" />
        </IconButton>
      </Chip>
    </ChipGroup>
  )
}
