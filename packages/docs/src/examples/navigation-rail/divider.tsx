import { Icon, NavigationRail, NavigationRailItem } from '@material-web/react'
import { useState } from 'react'
import { Text } from 'react-aria-components'

const destinations = [
  ['Alarm', 'alarm'],
  ['Clock', 'schedule'],
  ['Timer', 'hourglass_empty'],
] as const

export default function Divider() {
  const [page, setPage] = useState<string>('Clock')
  return (
    <div className="flex h-96 bg-surface-container-low">
      <NavigationRail aria-label="Main" className="border-e border-outline-variant bg-transparent">
        {destinations.map(([name, icon]) => (
          <NavigationRailItem key={name} isSelected={page === name} onChange={() => setPage(name)}>
            <Icon name={icon} />
            <Text slot="label">{name}</Text>
          </NavigationRailItem>
        ))}
      </NavigationRail>
      <div className="min-w-0 flex-1 p-space-300 text-title-lg">{page}</div>
    </div>
  )
}
