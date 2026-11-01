import {
  Menu,
  MenuItem,
  MenuPopover,
  SplitButton,
  SplitButtonLeading,
  SplitButtonTrailing,
} from '@material-web/react'
import { useState } from 'react'
import { MenuTrigger } from 'react-aria-components'

export default function Loading() {
  const [isSending, setSending] = useState(false)
  const send = async () => {
    setSending(true)
    await new Promise((resolve) => setTimeout(resolve, 3000))
    setSending(false)
  }
  return (
    <SplitButton size="m">
      <SplitButtonLeading isPending={isSending} onPress={send}>
        Send
      </SplitButtonLeading>
      <MenuTrigger>
        <SplitButtonTrailing aria-label="More send options" />
        <MenuPopover>
          <Menu>
            <MenuItem>Schedule send</MenuItem>
            <MenuItem>Save as draft</MenuItem>
          </Menu>
        </MenuPopover>
      </MenuTrigger>
    </SplitButton>
  )
}
