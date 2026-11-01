import { Icon, NavigationBar, NavigationBarItem } from '@material-web/react'
import { useState } from 'react'
import { Text } from 'react-aria-components'

const destinations = [
  ['Home', 'home'],
  ['Browse', 'explore'],
  ['Library', 'library_music'],
] as const

export default function Vertical() {
  const [page, setPage] = useState<string>('Home')
  return (
    <div className="flex h-64 flex-col justify-end">
      <NavigationBar aria-label="Main">
        {destinations.map(([name, icon]) => (
          <NavigationBarItem key={name} isSelected={page === name} onChange={() => setPage(name)}>
            <Icon name={icon} />
            <Text slot="label">{name}</Text>
          </NavigationBarItem>
        ))}
      </NavigationBar>
    </div>
  )
}
