import { Icon, IconButton, SideSheet, SideSheetHeader } from '@material-web/react'
import { useState, useSyncExternalStore } from 'react'
import { Heading } from 'react-aria-components'

// A compact window: one narrower than the theme's medium breakpoint.
const compact = '(width < 600px)'

function subscribe(onChange: () => void) {
  const query = window.matchMedia(compact)
  query.addEventListener('change', onChange)
  return () => query.removeEventListener('change', onChange)
}

export default function Responsive() {
  const isCompact = useSyncExternalStore(
    subscribe,
    () => window.matchMedia(compact).matches,
    () => false,
  )
  const [isOpen, setOpen] = useState(false)
  return (
    <div className="flex h-96 w-full bg-surface">
      <div className="box-border min-w-0 grow overflow-y-auto p-space-300">
        <div className="flex items-center justify-between pb-space-200">
          <span className="text-title-lg">Cassette Futurism</span>
          <IconButton aria-label="Info" onPress={() => setOpen(!isOpen)}>
            <Icon name="info" />
          </IconButton>
        </div>
        <div className="h-40 rounded-shape-md bg-tertiary-container" />
      </div>
      <SideSheet isModal={isCompact} isOpen={isOpen} onOpenChange={setOpen}>
        <SideSheetHeader>
          <Heading slot="title">Info</Heading>
          <IconButton aria-label="Close" slot="close">
            <Icon name="close" />
          </IconButton>
        </SideSheetHeader>
        <p className="m-0 px-space-300 py-space-200 text-on-surface-variant">
          Twelve tracks by various artists, 48 minutes.
        </p>
      </SideSheet>
    </div>
  )
}
