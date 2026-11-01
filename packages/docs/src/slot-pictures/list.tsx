import { Checkbox, Icon, IconButton, List, ListItem } from '@material-web/react'
import { Text } from 'react-aria-components'
import { SlotCanvas, SlotPicture } from '../components/slot-picture'

/** The slots of a list item: an item with an avatar and two lines, and a selectable one. */
export function ListItemSlots({ showLegend }: { showLegend?: boolean }) {
  return (
    <SlotPicture
      slots={['leading', 'overline', 'label', 'description', 'trailing', 'selection']}
      showLegend={showLegend}
    >
      <SlotCanvas>
        <List aria-label="Messages" className="w-90 max-w-full">
          <ListItem textValue="Ali Connors">
            <span
              slot="leading"
              className="grid size-10 place-items-center rounded-full bg-primary text-title-md text-on-primary"
            >
              A
            </span>
            <Text slot="label">Ali Connors</Text>
            <Text slot="description">Brunch this weekend?</Text>
            <Text slot="trailing">9:41</Text>
          </ListItem>
        </List>
      </SlotCanvas>
      <SlotCanvas sides={{ selection: 'bottom' }}>
        <List
          aria-label="Files"
          selectionMode="multiple"
          defaultSelectedKeys={['report']}
          className="w-90 max-w-full"
        >
          <ListItem id="report" textValue="Quarterly report">
            <Checkbox slot="selection" />
            <Text slot="overline">PDF</Text>
            <Text slot="label">Quarterly report</Text>
            <IconButton slot="trailing" aria-label="Share">
              <Icon name="share" />
            </IconButton>
          </ListItem>
        </List>
      </SlotCanvas>
    </SlotPicture>
  )
}
