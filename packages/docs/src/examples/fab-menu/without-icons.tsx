import { FabMenu, FabMenuButton, FabMenuItem, FabMenuPopover, Icon } from '@material-web/react'
import { MenuTrigger } from 'react-aria-components'

export default function WithoutIcons() {
  return (
    <div className="box-border flex h-80 w-full items-end justify-end p-space-200">
      <MenuTrigger>
        <FabMenuButton aria-label="Create">
          <Icon name="add" />
        </FabMenuButton>
        <FabMenuPopover>
          <FabMenu>
            <FabMenuItem>Email</FabMenuItem>
            <FabMenuItem>Message</FabMenuItem>
            <FabMenuItem>Folder</FabMenuItem>
          </FabMenu>
        </FabMenuPopover>
      </MenuTrigger>
    </div>
  )
}
