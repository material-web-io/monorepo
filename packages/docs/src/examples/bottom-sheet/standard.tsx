import { BottomSheet, Button, Icon, IconButton, List, ListItem } from '@material-web/react'
import { useState } from 'react'
import { UNSAFE_PortalProvider } from 'react-aria'
import { Text } from 'react-aria-components'

const queue = ['Strangers', 'Slow Mornings', 'Tape Hiss', 'Last Train Home', 'Blue Hour']

export default function Standard() {
  // The box stands in for the window: the sheet is rendered in it, and fixed to it.
  const [screen, setScreen] = useState<HTMLElement | null>(null)
  const [isOpen, setOpen] = useState(false)
  return (
    <div
      ref={setScreen}
      className="@container relative h-120 w-full overflow-clip bg-surface contain-layout"
    >
      <div className="flex flex-col items-center gap-space-200 p-space-300">
        <span className="text-body-lg text-on-surface-variant">
          {isOpen ? 'Swipe the player down to dismiss it' : 'Nothing is playing'}
        </span>
        <Button variant="tonal" isDisabled={isOpen} onPress={() => setOpen(true)}>
          Play something
        </Button>
      </div>
      <UNSAFE_PortalProvider getContainer={() => screen}>
        <BottomSheet
          aria-label="Now playing"
          snapPoints={[112]}
          isOpen={isOpen}
          onOpenChange={setOpen}
        >
          <div className="flex h-16 shrink-0 items-center ps-space-300 pe-space-100">
            <span className="grow truncate text-body-lg">Cassette Futurism</span>
            <IconButton aria-label="Pause">
              <Icon name="pause" />
            </IconButton>
            <IconButton aria-label="Next">
              <Icon name="skip_next" />
            </IconButton>
          </div>
          <List aria-label="Up next" className="overflow-y-auto pb-space-200">
            {queue.map((title) => (
              <ListItem key={title} id={title} textValue={title} className="bg-transparent">
                <Icon slot="leading" name="music_note" />
                <Text slot="label">{title}</Text>
              </ListItem>
            ))}
          </List>
        </BottomSheet>
      </UNSAFE_PortalProvider>
    </div>
  )
}
