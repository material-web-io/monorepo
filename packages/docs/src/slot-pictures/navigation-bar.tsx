import { Icon, NavigationBar, NavigationBarItem } from '@material-web/react'
import { Text } from 'react-aria-components'
import { SlotCanvas, SlotPicture } from '../components/slot-picture'

const destinations = [
  ['Home', 'home'],
  ['Search', 'search'],
  ['Saved', 'bookmark'],
] as const

/** The slot of a navigation bar item: its label. */
export function NavigationBarItemSlots({ showLegend }: { showLegend?: boolean }) {
  return (
    <SlotPicture slots={['label']} showLegend={showLegend}>
      <SlotCanvas>
        <NavigationBar className="w-90 max-w-full">
          {destinations.map(([name, icon]) => (
            <NavigationBarItem key={name} isSelected={name === 'Home'}>
              <Icon name={icon} />
              <Text slot="label">{name}</Text>
            </NavigationBarItem>
          ))}
        </NavigationBar>
      </SlotCanvas>
    </SlotPicture>
  )
}
