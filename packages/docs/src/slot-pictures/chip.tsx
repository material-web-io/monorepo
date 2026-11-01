import { Chip, ChipGroup, Icon, IconButton } from '@material-web/react'
import { Text } from 'react-aria-components'
import { SlotCanvas, SlotPicture } from '../components/slot-picture'

const slots = ['leading', 'label', 'trailing', 'remove']

/** The slots of a chip: a selected filter chip, and an input chip. */
export function ChipSlots({ showLegend }: { showLegend?: boolean }) {
  return (
    <SlotPicture slots={slots} showLegend={showLegend}>
      <SlotCanvas sides={{ label: 'bottom' }}>
        <ChipGroup aria-label="Diet" selectionMode="multiple" defaultSelectedKeys={['vegan']}>
          <Chip id="vegan" variant="filter" textValue="Vegan">
            <Icon slot="leading" name="check" />
            <Text slot="label">Vegan</Text>
            <Icon slot="trailing" name="arrow_drop_down" />
          </Chip>
        </ChipGroup>
      </SlotCanvas>
      <SlotCanvas sides={{ label: 'bottom' }}>
        <ChipGroup aria-label="Recipients" onRemove={() => {}}>
          <Chip variant="input" textValue="Ann Lee">
            <Icon slot="leading" name="person" />
            <Text slot="label">Ann Lee</Text>
            <IconButton slot="remove" aria-label="Remove">
              <Icon name="close" />
            </IconButton>
          </Chip>
        </ChipGroup>
      </SlotCanvas>
    </SlotPicture>
  )
}
