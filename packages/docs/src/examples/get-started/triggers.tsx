import {
  Button,
  Dialog,
  DialogTrigger,
  Icon,
  IconButton,
  Menu,
  MenuItem,
  MenuPopover,
} from '@material-web/react'
import { Heading, MenuTrigger } from 'react-aria-components'

export default function Triggers() {
  return (
    <>
      <MenuTrigger>
        <IconButton aria-label="More options">
          <Icon name="more_vert" />
        </IconButton>
        <MenuPopover>
          <Menu>
            <MenuItem id="rename">Rename</MenuItem>
            <MenuItem id="duplicate">Duplicate</MenuItem>
            <MenuItem id="remove">Remove</MenuItem>
          </Menu>
        </MenuPopover>
      </MenuTrigger>

      <DialogTrigger>
        <Button variant="tonal">Remove</Button>
        <Dialog>
          <Heading
            slot="title"
            className="m-0 px-space-300 pb-space-200 text-headline-sm text-on-surface"
          >
            Remove this file?
          </Heading>
          <div className="flex shrink-0 justify-end gap-space-100 px-space-300 pt-space-200">
            <Button variant="text" slot="close">
              Cancel
            </Button>
            <Button variant="text" slot="close">
              Remove
            </Button>
          </div>
        </Dialog>
      </DialogTrigger>
    </>
  )
}
