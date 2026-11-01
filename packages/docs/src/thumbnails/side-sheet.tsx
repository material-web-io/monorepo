import { Checkbox, Icon, IconButton, SideSheetHeader } from '@material-web/react'
import { Heading } from 'react-aria-components'

/**
 * A side sheet as it is open, which it only is beside a page: a panel at the side of a screen,
 * its header with a way back and a way out, over what it holds.
 */
export default function SideSheetThumbnail() {
  return (
    <div className="docs-thumbnail-screen me-space-600 h-42 grow basis-0 flex-row justify-end self-end rounded-se-shape-xl border-s-0 border-b-0">
      <div className="docs-thumbnail-panel w-56 rounded-ss-shape-lg bg-surface-container-low shadow-elevation-1">
        <SideSheetHeader>
          <IconButton aria-label="Back">
            <Icon name="arrow_back" />
          </IconButton>
          <Heading slot="title">Labels</Heading>
          <IconButton aria-label="Close">
            <Icon name="close" />
          </IconButton>
        </SideSheetHeader>
        <div className="flex flex-col items-start px-space-100 pt-space-100 text-body-lg">
          <Checkbox defaultSelected className="h-14 shrink-0">
            <span className="ps-space-50">Events</span>
          </Checkbox>
          <Checkbox className="h-14 shrink-0">
            <span className="ps-space-50">Personal</span>
          </Checkbox>
        </div>
      </div>
    </div>
  )
}
