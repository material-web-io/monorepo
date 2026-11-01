import { Chip, ChipGroup, Icon, IconButton } from '@material-web/react'
import { Text, useListData } from 'react-aria-components'

export default function SelectableRemovable() {
  const tags = useListData({
    initialItems: [
      { id: 'travel', name: 'Travel' },
      { id: 'food', name: 'Food' },
      { id: 'music', name: 'Music' },
      { id: 'film', name: 'Film' },
    ],
  })
  return (
    <ChipGroup
      aria-label="Tags"
      items={tags.items}
      selectionMode="multiple"
      onRemove={(keys) => tags.remove(...keys)}
    >
      {(tag) => (
        <Chip variant="input" textValue={tag.name}>
          <Text slot="label">{tag.name}</Text>
          <IconButton slot="remove" aria-label="Remove">
            <Icon name="close" />
          </IconButton>
        </Chip>
      )}
    </ChipGroup>
  )
}
