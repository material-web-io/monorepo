import { FabMenu, FabMenuButton, FabMenuItem, FabMenuPopover, Icon } from '@material-web/react'
import { MenuTrigger } from 'react-aria-components'

export default function Disabled() {
  return (
    <div className="box-border flex h-80 w-full items-end justify-center gap-space-600 p-space-200">
      <MenuTrigger>
        <FabMenuButton aria-label="Create, disabled" isDisabled>
          <Icon name="add" />
        </FabMenuButton>
        <FabMenuPopover>
          <FabMenu>
            <FabMenuItem>Email</FabMenuItem>
            <FabMenuItem>Message</FabMenuItem>
          </FabMenu>
        </FabMenuPopover>
      </MenuTrigger>
      <MenuTrigger>
        <FabMenuButton aria-label="Create">
          <Icon name="add" />
        </FabMenuButton>
        <FabMenuPopover>
          <FabMenu>
            <FabMenuItem textValue="Email">
              <Icon name="mail" />
              Email
            </FabMenuItem>
            <FabMenuItem textValue="Message" isDisabled>
              <Icon name="chat" />
              Message
            </FabMenuItem>
            <FabMenuItem textValue="Folder">
              <Icon name="folder" />
              Folder
            </FabMenuItem>
          </FabMenu>
        </FabMenuPopover>
      </MenuTrigger>
    </div>
  )
}
