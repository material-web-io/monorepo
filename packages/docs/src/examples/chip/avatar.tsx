import { Chip, ChipGroup, Icon, IconButton } from '@material-web/react'
import { Text, useListData } from 'react-aria-components'

const avatar = (initial: string, color: string) =>
  `data:image/svg+xml,${encodeURIComponent(
    `<svg xmlns="http://www.w3.org/2000/svg" width="48" height="48"><rect width="48" height="48" fill="${color}"/><text x="24" y="32" font-family="sans-serif" font-size="24" fill="white" text-anchor="middle">${initial}</text></svg>`,
  )}`

export default function Avatar() {
  const people = useListData({
    initialItems: [
      { id: 'ann', name: 'Ann Lee', avatar: avatar('A', '#6750a4') },
      { id: 'bo', name: 'Bo Chen', avatar: avatar('B', '#386a20') },
    ],
  })
  return (
    <ChipGroup aria-label="Guests" items={people.items} onRemove={(keys) => people.remove(...keys)}>
      {(person) => (
        <Chip variant="input" textValue={person.name}>
          <img slot="leading" alt="" src={person.avatar} />
          <Text slot="label">{person.name}</Text>
          <IconButton slot="remove" aria-label="Remove">
            <Icon name="close" />
          </IconButton>
        </Chip>
      )}
    </ChipGroup>
  )
}
