import { Fab, Icon } from '@material-web/react'
import { Text } from 'react-aria-components'
import { SlotCanvas, SlotPicture } from '../components/slot-picture'

/** The slot of a FAB: the label of an extended FAB. */
export function FabSlots({ showLegend }: { showLegend?: boolean }) {
  return (
    <SlotPicture slots={['label']} showLegend={showLegend}>
      <SlotCanvas>
        <Fab>
          <Icon name="edit" />
          <Text slot="label">Compose</Text>
        </Fab>
      </SlotCanvas>
    </SlotPicture>
  )
}
