import { Button, TooltipPopover } from '@material-web/react'
import { Dialog, DialogTrigger, Heading, Text } from 'react-aria-components'

export default function Persistent() {
  return (
    <>
      <DialogTrigger>
        <Button variant="outlined">Image quality</Button>
        <TooltipPopover isNonModal>
          <Dialog>
            <Heading slot="title">New settings available</Heading>
            <Text>Now you can adjust the uploaded image quality.</Text>
            <Button variant="text" slot="close">
              Got it
            </Button>
          </Dialog>
        </TooltipPopover>
      </DialogTrigger>
      <Button variant="text">Storage</Button>
    </>
  )
}
