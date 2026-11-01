import { BottomSheet, Button, Icon, List, ListItem } from '@material-web/react'
import { useState } from 'react'
import { UNSAFE_PortalProvider } from 'react-aria'
import { Heading, Text } from 'react-aria-components'

const stops = ['Union Square', 'Market Street', 'Civic Center', 'Mission', 'Glen Park', 'Daly City']

export default function SnapPoints() {
  // The box stands in for the window: the sheet is rendered in it, and fixed to it.
  const [screen, setScreen] = useState<HTMLElement | null>(null)
  const [isOpen, setOpen] = useState(false)
  return (
    <div
      ref={setScreen}
      className="@container relative h-120 w-full overflow-clip bg-surface contain-layout"
    >
      <div className="flex justify-center p-space-300">
        <Button variant="tonal" isDisabled={isOpen} onPress={() => setOpen(true)}>
          Show the route
        </Button>
      </div>
      <UNSAFE_PortalProvider getContainer={() => screen}>
        <BottomSheet snapPoints={[104, '50%']} isOpen={isOpen} onOpenChange={setOpen}>
          <Heading slot="title" className="m-0 shrink-0 px-space-300 pb-space-200 text-title-lg">
            6 stops, 24 min
          </Heading>
          <List aria-label="Stops" className="overflow-y-auto pb-space-200">
            {stops.map((stop) => (
              <ListItem key={stop} id={stop} textValue={stop} className="bg-transparent">
                <Icon slot="leading" name="train" />
                <Text slot="label">{stop}</Text>
              </ListItem>
            ))}
          </List>
        </BottomSheet>
      </UNSAFE_PortalProvider>
    </div>
  )
}
