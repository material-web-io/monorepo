import { FabMenu, FabMenuButton, FabMenuItem, FabMenuPopover, Icon } from '@material-web/react'
import { useState } from 'react'
import { MenuTrigger } from 'react-aria-components'

export default function Loading() {
  const [isUploading, setUploading] = useState(false)
  const upload = async () => {
    setUploading(true)
    await new Promise((resolve) => setTimeout(resolve, 3000))
    setUploading(false)
  }
  return (
    <div className="box-border flex h-80 w-full items-end justify-end p-space-200">
      <MenuTrigger>
        <FabMenuButton aria-label="Upload" isPending={isUploading}>
          <Icon name="upload" />
        </FabMenuButton>
        <FabMenuPopover>
          <FabMenu onAction={upload}>
            <FabMenuItem textValue="Photo">
              <Icon name="image" />
              Photo
            </FabMenuItem>
            <FabMenuItem textValue="Document">
              <Icon name="description" />
              Document
            </FabMenuItem>
          </FabMenu>
        </FabMenuPopover>
      </MenuTrigger>
    </div>
  )
}
