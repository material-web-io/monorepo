import { FabMenu, FabMenuButton, FabMenuItem, FabMenuPopover, Icon } from '@material-web/react'
import { useState } from 'react'
import { MenuTrigger, type Key } from 'react-aria-components'

export default function Actions() {
  const [last, setLast] = useState<Key>()
  return (
    <div className="box-border flex h-80 w-full items-end justify-between p-space-200">
      <p className="m-0 text-body-md text-on-surface-variant">
        {last ? `Last action: ${last}` : 'No action yet'}
      </p>
      <MenuTrigger>
        <FabMenuButton aria-label="Share">
          <Icon name="share" />
        </FabMenuButton>
        <FabMenuPopover>
          <FabMenu onAction={setLast}>
            <FabMenuItem id="link" textValue="Copy link">
              <Icon name="link" />
              Copy link
            </FabMenuItem>
            <FabMenuItem id="email" textValue="Email">
              <Icon name="mail" />
              Email
            </FabMenuItem>
            <FabMenuItem id="print" textValue="Print">
              <Icon name="print" />
              Print
            </FabMenuItem>
          </FabMenu>
        </FabMenuPopover>
      </MenuTrigger>
    </div>
  )
}
