import { Icon, List, ListItem, twMerge } from '@material-web/react'
import { Text } from 'react-aria-components'
import { PhoneBottom } from '../components/phone'

const photos = [
  'col-span-2 row-span-2 bg-tertiary-container',
  'bg-primary-container',
  'bg-surface-container-highest',
  'bg-surface-container-highest',
  'col-span-2 bg-primary-container',
]

const actions = [
  ['Share', 'share'],
  ['Get link', 'link'],
  ['Edit name', 'edit'],
  ['Delete collection', 'delete'],
] as const

/**
 * A bottom sheet as it is open, which it only is over a page: a panel with its drag handle and
 * a list of actions, over a collection of photos under the scrim.
 */
export default function BottomSheetScene() {
  return (
    <PhoneBottom>
      <div className="grid min-h-0 grow grid-cols-3 grid-rows-3 gap-space-50">
        {photos.map((photo, index) => (
          <span key={index} className={twMerge('rounded-shape-xs', photo)} />
        ))}
      </div>
      <div className="absolute inset-0 bg-scrim/32" />
      <div className="docs-thumbnail-panel relative rounded-t-shape-xl bg-surface-container-low">
        <div className="mx-auto my-space-250 h-1 w-8 shrink-0 rounded-shape-full bg-on-surface-variant" />
        <List aria-label="Collection actions">
          {actions.map(([name, icon]) => (
            <ListItem key={name} id={name} textValue={name} className="bg-transparent">
              <Icon slot="leading" name={icon} />
              <Text slot="label">{name}</Text>
            </ListItem>
          ))}
        </List>
        <div className="docs-thumbnail-indicator" />
      </div>
    </PhoneBottom>
  )
}
