import { Chip, ChipGroup, Icon, IconButton } from '@material-web/react'
import { useState } from 'react'
import { Text } from 'react-aria-components'

const toppings = [
  { id: 'basil', name: 'Basil' },
  { id: 'garlic', name: 'Garlic' },
  { id: 'olives', name: 'Olives' },
  { id: 'peppers', name: 'Peppers' },
  { id: 'onions', name: 'Onions' },
]

export default function ChipArray() {
  const [added, setAdded] = useState(toppings.slice(0, 2))
  const others = toppings.filter((topping) => !added.includes(topping))
  return (
    <div className="flex w-full max-w-96 flex-col gap-space-200">
      <ChipGroup
        aria-label="Toppings"
        items={added}
        onRemove={(keys) => setAdded(added.filter((topping) => !keys.has(topping.id)))}
        renderEmptyState={() => (
          <span className="text-body-md text-on-surface-variant">No toppings</span>
        )}
      >
        {(topping) => (
          <Chip variant="input" textValue={topping.name}>
            <Text slot="label">{topping.name}</Text>
            <IconButton slot="remove" aria-label="Remove">
              <Icon name="close" />
            </IconButton>
          </Chip>
        )}
      </ChipGroup>
      <ChipGroup
        aria-label="More toppings"
        items={others}
        onAction={(id) => setAdded([...added, toppings.find((topping) => topping.id === id)!])}
      >
        {(topping) => (
          <Chip variant="suggestion" textValue={topping.name}>
            <Icon slot="leading" name="add" />
            {topping.name}
          </Chip>
        )}
      </ChipGroup>
    </div>
  )
}
