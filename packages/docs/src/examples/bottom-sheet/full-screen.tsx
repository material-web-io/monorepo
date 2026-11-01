import { BottomSheet, Button } from '@material-web/react'
import { useState } from 'react'
import { UNSAFE_PortalProvider } from 'react-aria'
import { Heading } from 'react-aria-components'

const places = [
  ['Mud Island Amphitheater', 'Outdoor seasonal theater · 0.6 mi'],
  ['Overton Park Shell', 'Amphitheater · 1.2 mi'],
  ['Crosstown Concourse', 'Shopping center · 2.1 mi'],
  ['Shelby Farms Park', 'Park · 9.4 mi'],
] as const

export default function FullScreen() {
  // The box stands in for the window: the sheet is rendered in it, and fixed to it.
  const [screen, setScreen] = useState<HTMLElement | null>(null)
  const [isOpen, setOpen] = useState(false)
  return (
    <div
      ref={setScreen}
      className="@container relative h-120 w-full overflow-clip bg-surface-container contain-layout"
    >
      <div className="flex justify-center p-space-300">
        <Button variant="tonal" isDisabled={isOpen} onPress={() => setOpen(true)}>
          Explore the area
        </Button>
      </div>
      <UNSAFE_PortalProvider getContainer={() => screen}>
        <BottomSheet isFullScreen snapPoints={[200]} isOpen={isOpen} onOpenChange={setOpen}>
          <Heading slot="title" className="m-0 px-space-300 pb-space-200 text-title-lg">
            Latest in the area
          </Heading>
          {places.map(([name, about]) => (
            <div key={name} className="flex flex-col px-space-300 py-space-150">
              <span className="text-title-sm">{name}</span>
              <span className="text-body-sm text-on-surface-variant">{about}</span>
            </div>
          ))}
        </BottomSheet>
      </UNSAFE_PortalProvider>
    </div>
  )
}
