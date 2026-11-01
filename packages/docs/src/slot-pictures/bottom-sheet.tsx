import { Button } from '@material-web/react'
import { Heading, Text } from 'react-aria-components'
import { SlotCanvas, SlotPicture } from '../components/slot-picture'

/** The slots of a bottom sheet: a modal sheet, drawn in place of the open sheet. */
export function BottomSheetSlots({ showLegend }: { showLegend?: boolean }) {
  return (
    <SlotPicture slots={['title', 'description', 'close']} showLegend={showLegend}>
      <SlotCanvas sides={{ description: 'start' }}>
        <div className="docs-thumbnail-panel w-90 max-w-full rounded-t-shape-xl bg-surface-container-low">
          <div className="mx-auto my-space-250 h-1 w-8 shrink-0 rounded-shape-full bg-on-surface-variant" />
          <div className="flex flex-col gap-space-200 px-space-300 pb-space-300">
            <Heading slot="title" level={3} className="m-0 text-title-lg">
              Discard this draft?
            </Heading>
            <Text slot="description" className="text-on-surface-variant">
              What you have written so far is lost.
            </Text>
            <div className="flex justify-end gap-space-100">
              <Button variant="text" slot="close">
                Keep editing
              </Button>
              <Button slot="close">Discard</Button>
            </div>
          </div>
        </div>
      </SlotCanvas>
    </SlotPicture>
  )
}
