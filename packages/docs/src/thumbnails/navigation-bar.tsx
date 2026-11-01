import { Icon, NavigationBar, NavigationBarItem } from '@material-web/react'
import { Text } from 'react-aria-components'

const destinations = [
  ['Home', 'home'],
  ['Browse', 'explore'],
  ['Library', 'library_music'],
] as const

/** A navigation bar at the bottom of a phone's screen. */
export default function NavigationBarThumbnail() {
  return (
    <div className="docs-thumbnail-screen h-42 w-64 justify-end self-start rounded-b-shape-xl border-t-0">
      <NavigationBar>
        {destinations.map(([name, icon]) => (
          <NavigationBarItem key={name} isSelected={name === 'Home'}>
            <Icon name={icon} />
            <Text slot="label">{name}</Text>
          </NavigationBarItem>
        ))}
      </NavigationBar>
      {/* The bar's own fill runs on under it, to the screen's edge. */}
      <div className="flex bg-surface-container">
        <div className="docs-thumbnail-indicator" />
      </div>
    </div>
  )
}
