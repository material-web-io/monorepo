import { Icon, NavigationBar, NavigationBarItem, twMerge } from '@material-web/react'
import { Text } from 'react-aria-components'
import { PhoneBottom } from '../components/phone'

const albums = [
  ['Eye Rhymes', 'Glass & Grace', 'bg-tertiary-container text-on-tertiary-container'],
  ['Night Drive', 'Luna Park', 'bg-primary-container text-on-primary-container'],
  ['Slow Mornings', 'The Paper Kites', 'bg-secondary-container text-on-secondary-container'],
  ['Field Notes', 'Ana Ortiz', 'bg-surface-container-highest text-on-surface-variant'],
] as const

const destinations = [
  ['Home', 'home'],
  ['Browse', 'explore'],
  ['Radio', 'radio'],
  ['Library', 'library_music'],
] as const

/** A navigation bar at the bottom of a music app, under the albums of its first destination. */
export default function NavigationBarScene() {
  return (
    <PhoneBottom>
      <div className="grid shrink-0 grid-cols-2 gap-space-200 p-space-200">
        {albums.map(([title, artist, colors]) => (
          <div key={title} className="flex flex-col">
            <span
              className={twMerge(
                'grid aspect-square place-items-center rounded-shape-lg icon-48 icon-filled',
                colors,
              )}
            >
              <Icon name="album" />
            </span>
            <span className="pt-space-100 text-title-sm">{title}</span>
            <span className="text-body-sm text-on-surface-variant">{artist}</span>
          </div>
        ))}
      </div>
      <NavigationBar>
        {destinations.map(([name, icon]) => (
          <NavigationBarItem key={name} isSelected={name === 'Home'}>
            <Icon name={icon} />
            <Text slot="label">{name}</Text>
          </NavigationBarItem>
        ))}
      </NavigationBar>
      {/* The bar's own fill runs on under it, to the screen's edge. */}
      <div className="flex shrink-0 bg-surface-container">
        <div className="docs-thumbnail-indicator" />
      </div>
    </PhoneBottom>
  )
}
