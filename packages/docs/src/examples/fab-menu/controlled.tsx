import { FabMenu, FabMenuButton, FabMenuItem, FabMenuPopover, Icon } from '@material-web/react'
import { useState } from 'react'
import { MenuTrigger } from 'react-aria-components'

export default function Controlled() {
  const [isOpen, setOpen] = useState(false)
  return (
    <div className="box-border flex h-80 w-full items-end justify-between p-space-200">
      <p className="m-0 text-body-md text-on-surface-variant">
        {isOpen ? 'The menu is open' : 'The menu is closed'}
      </p>
      <MenuTrigger isOpen={isOpen} onOpenChange={setOpen}>
        <FabMenuButton aria-label="Create">
          <Icon name="add" />
        </FabMenuButton>
        <FabMenuPopover>
          <FabMenu>
            <FabMenuItem textValue="Email">
              <Icon name="mail" />
              Email
            </FabMenuItem>
            <FabMenuItem textValue="Message">
              <Icon name="chat" />
              Message
            </FabMenuItem>
          </FabMenu>
        </FabMenuPopover>
      </MenuTrigger>
    </div>
  )
}
