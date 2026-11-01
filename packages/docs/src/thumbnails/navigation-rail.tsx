import {
  Fab,
  Icon,
  NavigationRail,
  NavigationRailHeader,
  NavigationRailItem,
  twMerge,
} from '@material-web/react'
import { Text } from 'react-aria-components'

const destinations = [
  ['Inbox', 'inbox'],
  ['Sent', 'send'],
] as const

// A rail down the side of a screen, collapsed or expanded.
function Rail({ isExpanded, className }: { isExpanded: boolean; className: string }) {
  return (
    <div className={twMerge('docs-thumbnail-screen self-stretch border-y-0 border-e-0', className)}>
      <NavigationRail isExpanded={isExpanded}>
        <NavigationRailHeader>
          <Fab isExtended={isExpanded} aria-label="Compose">
            <Icon name="edit" />
            <Text slot="label">Compose</Text>
          </Fab>
        </NavigationRailHeader>
        {destinations.map(([name, icon]) => (
          <NavigationRailItem key={name} isSelected={name === 'Inbox'}>
            <Icon name={icon} />
            <Text slot="label">{name}</Text>
          </NavigationRailItem>
        ))}
      </NavigationRail>
    </div>
  )
}

/** A navigation rail on two screens: collapsed on one, expanded on the other. */
export default function NavigationRailThumbnail() {
  return (
    <div className="flex size-full gap-space-300 ps-space-400">
      <Rail isExpanded={false} className="w-25" />
      <Rail isExpanded className="min-w-56 grow" />
    </div>
  )
}
