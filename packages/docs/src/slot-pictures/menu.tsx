import { Icon, Menu, MenuItem } from '@material-web/react'
import { Keyboard, Text } from 'react-aria-components'
import { SlotCanvas, SlotPicture } from '../components/slot-picture'

/** The slots of a menu item: an item with an icon, a description and a keyboard command. */
export function MenuItemSlots({ showLegend }: { showLegend?: boolean }) {
  return (
    <SlotPicture slots={['leading', 'label', 'description', 'trailing']} showLegend={showLegend}>
      <SlotCanvas>
        <div className="docs-thumbnail-panel w-70 max-w-full overflow-clip rounded-shape-lg shadow-elevation-2">
          <Menu aria-label="Edit">
            <MenuItem textValue="Copy">
              <Icon slot="leading" name="content_copy" />
              <Text slot="label">Copy</Text>
              <Text slot="description">Copies the selection</Text>
              <Keyboard slot="trailing">⌘C</Keyboard>
            </MenuItem>
          </Menu>
        </div>
      </SlotCanvas>
    </SlotPicture>
  )
}
