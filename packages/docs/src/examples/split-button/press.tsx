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

export default function Press() {
  const [action, setAction] = useState<string>()
  return (
    <>
      <SplitButton>
        <SplitButtonLeading onPress={() => setAction('reply')}>Reply</SplitButtonLeading>
        <MenuTrigger>
          <SplitButtonTrailing aria-label="More reply options" />
          <MenuPopover>
            <Menu onAction={(id) => setAction(String(id))}>
              <MenuItem id="reply-all">Reply all</MenuItem>
              <MenuItem id="forward">Forward</MenuItem>
            </Menu>
          </MenuPopover>
        </MenuTrigger>
      </SplitButton>
      <span className="text-body-md text-on-surface-variant">
        {action ? `Last action: ${action}` : 'No action yet'}
      </span>
    </>
  )
}
