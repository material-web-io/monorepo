import { Icon, NavigationBar, NavigationBarItem } from '@material-web/react'
import { useState } from 'react'
import { Text } from 'react-aria-components'

const destinations = [
  ['Home', 'home'],
  ['Browse', 'explore'],
  ['Radio', 'radio'],
  ['Library', 'library_music'],
] as const

export default function Arrangements() {
  const [page, setPage] = useState<string>('Home')
  const items = destinations.map(([name, icon]) => (
    <NavigationBarItem key={name} isSelected={page === name} onChange={() => setPage(name)}>
      <Icon name={icon} />
      <Text slot="label">{name}</Text>
    </NavigationBarItem>
  ))
  return (
    <div className="flex h-64 flex-col justify-end gap-space-300">
      <NavigationBar aria-label="Equal weight" layout="horizontal" arrangement="equal-weight">
        {items}
      </NavigationBar>
      <NavigationBar aria-label="Centered" layout="vertical" arrangement="centered">
        {items}
      </NavigationBar>
    </div>
  )
}
