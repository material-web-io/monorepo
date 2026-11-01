import {
  Button,
  Divider,
  Icon,
  IconButton,
  SheetTrigger,
  SideSheet,
  SideSheetHeader,
  TextField,
} from '@material-web/react'
import { Heading } from 'react-aria-components'

export default function PreventDismissal() {
  return (
    <SheetTrigger>
      <Button variant="tonal">Edit profile</Button>
      <SideSheet isModal preventDismissal>
        <SideSheetHeader>
          <Heading slot="title">Edit profile</Heading>
          <IconButton aria-label="Close" slot="close">
            <Icon name="close" />
          </IconButton>
        </SideSheetHeader>
        <div className="min-h-0 grow overflow-y-auto px-space-300 py-space-200">
          <TextField label="Display name" variant="outlined" className="w-full" />
        </div>
        <Divider />
        <div className="flex gap-space-100 px-space-300 pt-space-200 pb-space-300">
          <Button variant="filled" slot="close">
            Save
          </Button>
          <Button variant="outlined" slot="close">
            Cancel
          </Button>
        </div>
      </SideSheet>
    </SheetTrigger>
  )
}
