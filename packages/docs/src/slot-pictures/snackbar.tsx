import { Icon, SnackbarAction, SnackbarCloseButton, SnackbarContent } from '@material-web/react'
import { Text } from 'react-aria-components'
import { SlotCanvas, SlotPicture } from '../components/slot-picture'

/** The slots of a snackbar's content: its title and description, in a snackbar drawn in place. */
export function SnackbarContentSlots({ showLegend }: { showLegend?: boolean }) {
  return (
    <SlotPicture slots={['title', 'description']} showLegend={showLegend}>
      <SlotCanvas>
        <div className="flex w-86 max-w-full items-center rounded-shape-xs bg-inverse-surface py-space-50 ps-space-200 pe-space-50 text-body-md text-inverse-on-surface shadow-elevation-3">
          <SnackbarContent>
            <Text slot="title">Photo saved</Text>
            <Text slot="description">Added to your summer album</Text>
          </SnackbarContent>
          <SnackbarAction>View</SnackbarAction>
          <SnackbarCloseButton aria-label="Close">
            <Icon name="close" />
          </SnackbarCloseButton>
        </div>
      </SlotCanvas>
    </SlotPicture>
  )
}
