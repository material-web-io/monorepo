import {
  Icon,
  IconButton,
  NavigationRail,
  NavigationRailHeader,
  NavigationRailItem,
} from '@material-web/react'
import { useRef, useState } from 'react'
import { Text } from 'react-aria-components'
import { flushSync } from 'react-dom'

const destinations = [
  ['Alarm', 'alarm'],
  ['Clock', 'schedule'],
  ['Timer', 'hourglass_empty'],
] as const

export default function HiddenOnCollapse() {
  const [isExpanded, setExpanded] = useState(false)
  const [page, setPage] = useState<string>('Clock')
  const show = useRef<HTMLButtonElement>(null)
  const hide = useRef<HTMLButtonElement>(null)
  // Each menu button takes the keyboard focus from the other.
  const turn = (next: boolean) => {
    flushSync(() => setExpanded(next))
    ;(next ? hide : show).current?.focus()
  }
  return (
    <div className="flex h-96">
      <NavigationRail aria-label="Main" isExpanded={isExpanded} isHiddenOnCollapse>
        <NavigationRailHeader>
          <IconButton ref={hide} aria-label="Hide navigation" onPress={() => turn(false)}>
            <Icon name="menu_open" />
          </IconButton>
        </NavigationRailHeader>
        {destinations.map(([name, icon]) => (
          <NavigationRailItem key={name} isSelected={page === name} onChange={() => setPage(name)}>
            <Icon name={icon} />
            <Text slot="label">{name}</Text>
          </NavigationRailItem>
        ))}
      </NavigationRail>
      <div className="relative flex min-w-0 flex-1 items-center justify-center bg-primary-container text-display-lg text-on-primary-container">
        {!isExpanded && (
          <IconButton
            ref={show}
            aria-label="Show navigation"
            className="absolute start-7 top-13"
            onPress={() => turn(true)}
          >
            <Icon name="menu" />
          </IconButton>
        )}
        8:30
      </div>
    </div>
  )
}
