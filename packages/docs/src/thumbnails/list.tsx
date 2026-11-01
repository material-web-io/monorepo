import { List, ListItem, twMerge } from '@material-web/react'
import { Text } from 'react-aria-components'

const contacts = [
  ['Ali Connors', 'Brunch this weekend?', 'bg-primary text-on-primary'],
  ['Sandra Adams', 'Oui oui', 'bg-tertiary text-on-tertiary'],
  ['Trevor Hansen', 'Birthday gift', 'bg-secondary text-on-secondary'],
] as const

/** The top of a segmented list: each item a picture, a name and a line under it. */
export default function ListThumbnail() {
  return (
    <div className="flex size-full items-start justify-center pt-space-300">
      <List aria-label="Contacts" variant="segmented" className="w-66 shrink-0">
        {contacts.map(([name, message, colors]) => (
          <ListItem key={name} id={name} textValue={name}>
            <span
              slot="leading"
              className={twMerge(
                'grid size-10 place-items-center rounded-full text-title-md',
                colors,
              )}
            >
              {name[0]}
            </span>
            <Text slot="label">{name}</Text>
            <Text slot="description">{message}</Text>
          </ListItem>
        ))}
      </List>
    </div>
  )
}
