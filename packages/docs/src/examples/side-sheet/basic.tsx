import {
  Button,
  Checkbox,
  Divider,
  Icon,
  IconButton,
  SheetTrigger,
  SideSheet,
  SideSheetHeader,
} from '@material-web/react'
import { Heading } from 'react-aria-components'

const labels = ['Events', 'Personal', 'Projects', 'Reminders', 'Family', 'Travel', 'Work']

export default function Basic() {
  return (
    <SheetTrigger>
      <Button variant="tonal">Show filters</Button>
      <SideSheet isModal>
        <SideSheetHeader>
          <Heading slot="title">Filters</Heading>
          <IconButton aria-label="Close" slot="close">
            <Icon name="close" />
          </IconButton>
        </SideSheetHeader>
        <div className="flex min-h-0 grow flex-col items-start overflow-y-auto px-space-300 py-space-200 text-body-lg">
          {labels.map((label) => (
            <Checkbox key={label} className="h-14 shrink-0">
              {label}
            </Checkbox>
          ))}
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
