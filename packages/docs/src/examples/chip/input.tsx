import { Chip, ChipGroup, Icon, IconButton } from '@material-web/react'
import { Text, useListData } from 'react-aria-components'

export default function Input() {
  const people = useListData({
    initialItems: [
      { id: 'ann', name: 'Ann Lee' },
      { id: 'bo', name: 'Bo Chen' },
      { id: 'cy', name: 'Cy Park' },
    ],
  })
  return (
    <ChipGroup
      aria-label="Recipients"
      items={people.items}
      onRemove={(keys) => people.remove(...keys)}
      renderEmptyState={() => (
        <span className="text-body-md text-on-surface-variant">No recipients</span>
      )}
    >
      {(person) => (
        <Chip variant="input" textValue={person.name}>
          <Icon slot="leading" name="person" />
          <Text slot="label">{person.name}</Text>
          <IconButton slot="remove" aria-label="Remove">
            <Icon name="close" />
          </IconButton>
        </Chip>
      )}
    </ChipGroup>
  )
}
