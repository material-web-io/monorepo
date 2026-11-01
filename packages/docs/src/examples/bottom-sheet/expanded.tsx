import { BottomSheet, Button, Icon, IconButton, List, ListItem } from '@material-web/react'
import { useState } from 'react'
import { UNSAFE_PortalProvider } from 'react-aria'
import { Heading, Text } from 'react-aria-components'

const queue = ['Strangers', 'Slow Mornings', 'Tape Hiss', 'Last Train Home', 'Blue Hour']

export default function Expanded() {
  // The box stands in for the window: the sheet is rendered in it, and fixed to it.
  const [screen, setScreen] = useState<HTMLElement | null>(null)
  const [isOpen, setOpen] = useState(false)
  const [isExpanded, setExpanded] = useState(false)
  return (
    <div
      ref={setScreen}
      className="@container relative h-120 w-full overflow-clip bg-surface contain-layout"
    >
      <div className="flex justify-center gap-space-100 p-space-300">
        <Button variant="tonal" isDisabled={isOpen} onPress={() => setOpen(true)}>
          Show the queue
        </Button>
        <Button variant="outlined" isDisabled={!isOpen} onPress={() => setExpanded(!isExpanded)}>
          {isExpanded ? 'Collapse' : 'Expand'}
        </Button>
      </div>
      <UNSAFE_PortalProvider getContainer={() => screen}>
        <BottomSheet
          snapPoints={[104]}
          isOpen={isOpen}
          onOpenChange={setOpen}
          isExpanded={isExpanded}
          onExpandedChange={setExpanded}
        >
          <div className="flex shrink-0 items-center ps-space-300 pe-space-100 pb-space-100">
            <Heading slot="title" className="m-0 grow text-title-lg">
              Up next
            </Heading>
            <IconButton
              aria-label={isExpanded ? 'Collapse' : 'Expand'}
              onPress={() => setExpanded(!isExpanded)}
            >
              <Icon name={isExpanded ? 'keyboard_arrow_down' : 'keyboard_arrow_up'} />
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
