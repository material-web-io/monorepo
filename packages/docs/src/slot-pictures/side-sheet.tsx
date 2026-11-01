import { Button, Checkbox, Divider, Icon, IconButton, SideSheetHeader } from '@material-web/react'
import { Heading } from 'react-aria-components'
import { SlotCanvas, SlotPicture } from '../components/slot-picture'

/** The slots of a side sheet: a modal sheet's panel, drawn in place of the open sheet. */
export function SideSheetSlots({ showLegend }: { showLegend?: boolean }) {
  return (
    <SlotPicture slots={['title', 'close']} showLegend={showLegend}>
      <SlotCanvas>
        <div className="docs-thumbnail-panel w-80 max-w-full rounded-s-shape-lg bg-surface-container-low">
          <SideSheetHeader>
            <Heading slot="title" level={3}>
              Filters
            </Heading>
            <IconButton aria-label="Close" slot="close">
              <Icon name="close" />
            </IconButton>
          </SideSheetHeader>
          <div className="flex flex-col items-start px-space-300 py-space-200 text-body-lg">
            <Checkbox className="h-14 shrink-0">Events</Checkbox>
            <Checkbox className="h-14 shrink-0">Projects</Checkbox>
          </div>
          <Divider />
          <div className="flex gap-space-100 px-space-300 pt-space-200 pb-space-300">
            <Button variant="filled" slot="close">
              Save
            </Button>
            <Button variant="outlined" slot="close">
              Cancel
            </Button>
          </div>
        </div>
      </SlotCanvas>
    </SlotPicture>
  )
}
