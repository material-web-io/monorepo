import {
  Icon,
  IconButton,
  NavigationRail,
  NavigationRailHeader,
  NavigationRailItem,
} from '@material-web/react'
import { useState } from 'react'
import { Text } from 'react-aria-components'

const destinations = [
  ['Alarm', 'alarm'],
  ['Clock', 'schedule'],
  ['Timer', 'hourglass_empty'],
] as const

export default function Center() {
  const [isExpanded, setExpanded] = useState(false)
  const [page, setPage] = useState<string>('Clock')
  return (
    <div className="flex h-120">
      <NavigationRail aria-label="Main" arrangement="center" isExpanded={isExpanded}>
        <NavigationRailHeader>
          <IconButton
            aria-label={isExpanded ? 'Collapse' : 'Expand'}
            onPress={() => setExpanded(!isExpanded)}
          >
            <Icon name={isExpanded ? 'menu_open' : 'menu'} />
          </IconButton>
        </NavigationRailHeader>
        {destinations.map(([name, icon]) => (
          <NavigationRailItem key={name} isSelected={page === name} onChange={() => setPage(name)}>
            <Icon name={icon} />
            <Text slot="label">{name}</Text>
          </NavigationRailItem>
        ))}
      </NavigationRail>
      <div className="m-space-200 min-w-0 flex-1 rounded-shape-xl bg-primary-container p-space-300 text-title-lg text-on-primary-container">
        {page}
      </div>
    </div>
  )
}
