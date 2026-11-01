import { Icon, NavigationBar, NavigationBarItem } from '@material-web/react'
import { useState } from 'react'
import { Text } from 'react-aria-components'

const destinations = [
  ['Home', 'home'],
  ['Browse', 'explore'],
  ['Radio', 'radio'],
  ['Library', 'library_music'],
] as const

const rows = Array.from({ length: 12 }, (_, index) => (
  <p key={index} className="m-0 px-space-300 py-space-150 text-body-lg">
    Song {index + 1}
  </p>
))

export default function FixedPositioning() {
  const [page, setPage] = useState<string>('Home')
  return (
    <div className="flex h-80 flex-col">
      <div tabIndex={0} className="focus-ring-inset flex-1 overflow-y-auto">
        {rows}
      </div>
      <nav aria-label="Music player">
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
