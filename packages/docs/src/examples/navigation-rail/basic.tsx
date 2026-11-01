import {
  Fab,
  Icon,
  IconButton,
  NavigationRail,
  NavigationRailHeader,
  NavigationRailItem,
  NavigationRailSection,
} from '@material-web/react'
import { useState } from 'react'
import { Text } from 'react-aria-components'

export default function Basic() {
  const [isExpanded, setExpanded] = useState(false)
  const [page, setPage] = useState('Inbox')
  return (
    <div className="flex h-120 w-full">
      <nav aria-label="Mail" className="flex">
        <NavigationRail isExpanded={isExpanded}>
          <NavigationRailHeader>
            <IconButton
              aria-label={isExpanded ? 'Collapse' : 'Expand'}
              onPress={() => setExpanded(!isExpanded)}
            >
              <Icon name={isExpanded ? 'menu_open' : 'menu'} />
            </IconButton>
            <Fab isExtended={isExpanded} aria-label="Compose">
              <Icon name="edit" className="icon-filled" />
              <Text slot="label">Compose</Text>
            </Fab>
          </NavigationRailHeader>
          <NavigationRailItem isSelected={page === 'Inbox'} onChange={() => setPage('Inbox')}>
            <Icon name="inbox" />
            <Text slot="label">Inbox</Text>
          </NavigationRailItem>
          <NavigationRailItem isSelected={page === 'Sent'} onChange={() => setPage('Sent')}>
            <Icon name="send" />
            <Text slot="label">Sent</Text>
          </NavigationRailItem>
          <NavigationRailSection aria-labelledby="rail-labels">
            <Text slot="header" id="rail-labels">
              Labels
            </Text>
            <NavigationRailItem isSelected={page === 'Family'} onChange={() => setPage('Family')}>
              <Icon name="label" />
              <Text slot="label">Family</Text>
            </NavigationRailItem>
          </NavigationRailSection>
        </NavigationRail>
      </nav>
      <div className="m-space-200 min-w-0 flex-1 rounded-shape-xl bg-primary-container p-space-300 text-title-lg text-on-primary-container">
        {page}
      </div>
    </div>
  )
}
