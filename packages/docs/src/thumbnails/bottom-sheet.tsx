import { Icon, List, ListItem } from '@material-web/react'
import { Text } from 'react-aria-components'

const actions = [
  ['Share', 'share'],
  ['Get link', 'link'],
] as const

/**
 * A bottom sheet as it is open, which it only is over a page: a panel with its drag handle,
 * over the scrim, at the bottom of a phone's screen.
 */
export default function BottomSheetThumbnail() {
  return (
    <div className="docs-thumbnail-screen h-42 w-64 justify-end self-start rounded-b-shape-xl border-t-0">
      <div className="absolute inset-0 bg-scrim/32" />
      <div className="docs-thumbnail-panel relative rounded-t-shape-xl bg-surface-container-low">
        <div className="mx-auto my-space-250 h-1 w-8 rounded-shape-full bg-on-surface-variant" />
        <List aria-label="Collection actions">
          {actions.map(([name, icon]) => (
            <ListItem key={name} id={name} textValue={name} className="bg-transparent">
              <Icon slot="leading" name={icon} />
              <Text slot="label">{name}</Text>
            </ListItem>
          ))}
        </List>
      </div>
    </div>
  )
}
