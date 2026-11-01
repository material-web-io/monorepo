import { Icon, NavigationRail, NavigationRailItem } from '@material-web/react'
import { useState } from 'react'
import { Text } from 'react-aria-components'

const destinations = [
  ['Alarm', 'alarm'],
  ['Clock', 'schedule'],
  ['Timer', 'hourglass_empty'],
] as const

export default function Expanded() {
  const [page, setPage] = useState<string>('Clock')
  return (
    <div className="flex h-96">
      <NavigationRail aria-label="Main" isExpanded>
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
