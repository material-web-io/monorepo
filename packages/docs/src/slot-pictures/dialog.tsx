import { Button } from '@material-web/react'
import { Heading, Text } from 'react-aria-components'
import { SlotCanvas, SlotPicture } from '../components/slot-picture'

/** The slots of a dialog: a basic dialog's container, drawn in place of the open dialog. */
export function DialogSlots({ showLegend }: { showLegend?: boolean }) {
  return (
    <SlotPicture slots={['title', 'description', 'close']} showLegend={showLegend}>
      <SlotCanvas sides={{ description: 'start' }}>
        <div className="docs-thumbnail-panel w-80 max-w-full rounded-shape-xl bg-surface-container-high py-space-300 text-body-md text-on-surface-variant">
          <Heading
            slot="title"
            level={3}
            className="m-0 px-space-300 pb-space-200 text-headline-sm text-on-surface"
          >
            Use location service?
          </Heading>
          <Text slot="description" elementType="p" className="m-0 px-space-300 pb-space-100">
            Let this service help other apps determine your location.
          </Text>
          <div className="flex justify-end gap-space-100 px-space-300 pt-space-200">
            <Button variant="text" slot="close">
              Disagree
            </Button>
            <Button variant="text" slot="close">
              Agree
            </Button>
          </div>
        </div>
      </SlotCanvas>
    </SlotPicture>
  )
}
