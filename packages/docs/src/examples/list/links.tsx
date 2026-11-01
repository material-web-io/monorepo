import { Icon, List, ListItem } from '@material-web/react'
import { Text } from 'react-aria-components'

const pages = [
  { id: 'overview', label: 'Overview', description: 'What lists are for' },
  { id: 'specs', label: 'Specs', description: 'Measurements and tokens' },
  { id: 'guidelines', label: 'Guidelines', description: 'Usage and behavior' },
]

export default function Links() {
  return (
    <List aria-label="Material Design pages on lists" variant="segmented" className="w-90">
      {pages.map((page) => (
        <ListItem
          key={page.id}
          id={page.id}
          textValue={page.label}
          href={`https://m3.material.io/components/lists/${page.id}`}
          target="_blank"
          rel="noreferrer"
        >
          <Icon slot="leading" name="article" />
          <Text slot="label">{page.label}</Text>
          <Text slot="description">{page.description}</Text>
          <Icon slot="trailing" name="open_in_new" />
        </ListItem>
      ))}
    </List>
  )
}
