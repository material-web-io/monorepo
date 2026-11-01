import { Icon, NavigationBar, NavigationBarItem } from '@material-web/react'
import { useState } from 'react'
import { Text } from 'react-aria-components'

const destinations = [
  ['Home', 'home'],
  ['Browse', 'explore'],
  ['Radio', 'radio'],
  ['Library', 'library_music'],
] as const

export default function Basic() {
  const [page, setPage] = useState<string>('Home')
  return (
    <div className="flex h-80 w-full flex-col">
      <div className="flex-1 overflow-y-auto p-space-300 text-headline-sm">{page}</div>
      <nav aria-label="Music">
        <NavigationBar>
          {destinations.map(([name, icon]) => (
            <NavigationBarItem key={name} isSelected={page === name} onChange={() => setPage(name)}>
              <Icon name={icon} />
              <Text slot="label">{name}</Text>
            </NavigationBarItem>
          ))}
        </NavigationBar>
      </nav>
    </div>
  )
}
