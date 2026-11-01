import {
  Button,
  Icon,
  IconButton,
  SheetTrigger,
  SideSheet,
  SideSheetHeader,
} from '@material-web/react'
import { Heading } from 'react-aria-components'

export default function ModalDetached() {
  return (
    <SheetTrigger>
      <Button variant="tonal">Show details</Button>
      <SideSheet isModal isDetached>
        <SideSheetHeader>
          <Heading slot="title">Details</Heading>
          <IconButton aria-label="Close" slot="close">
            <Icon name="close" />
          </IconButton>
        </SideSheetHeader>
        <p className="m-0 px-space-300 py-space-200 text-on-surface-variant">
          Twelve tracks by various artists, 48 minutes.
        </p>
      </SideSheet>
    </SheetTrigger>
  )
}
