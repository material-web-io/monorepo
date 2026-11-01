import {
  Icon,
  NavigationRail,
  NavigationRailItem,
  NavigationRailSection,
} from '@material-web/react'
import { useState } from 'react'
import { Text } from 'react-aria-components'

const destinations = [
  ['Alarm', 'alarm'],
  ['Clock', 'schedule'],
  ['Timer', 'hourglass_empty'],
] as const

const secondary = [
  ['Sounds', 'music_note'],
  ['Wind down', 'self_improvement'],
] as const

export default function Sections() {
  const [page, setPage] = useState<string>('Clock')
  const item = ([name, icon]: readonly [string, string]) => (
    <NavigationRailItem key={name} isSelected={page === name} onChange={() => setPage(name)}>
      <Icon name={icon} />
      <Text slot="label">{name}</Text>
    </NavigationRailItem>
  )
  return (
    <div className="flex h-120">
      <NavigationRail aria-label="Main" isExpanded>
        {destinations.map(item)}
        <NavigationRailSection aria-label="More">{item(['Bedtime', 'bed'])}</NavigationRailSection>
        <NavigationRailSection aria-labelledby="sleep-well">
          <Text slot="header" id="sleep-well">
            Sleep well
          </Text>
          {secondary.map(item)}
        </NavigationRailSection>
      </NavigationRail>
      <div className="m-space-200 min-w-0 flex-1 rounded-shape-xl bg-primary-container p-space-300 text-title-lg text-on-primary-container">
        {page}
      </div>
    </div>
  )
}
