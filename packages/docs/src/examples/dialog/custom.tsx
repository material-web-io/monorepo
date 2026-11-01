import { Button, Dialog, DialogTrigger, Divider, Icon, IconButton } from '@material-web/react'
import { Heading, Text } from 'react-aria-components'

export default function Custom() {
  return (
    <DialogTrigger>
      <Button variant="tonal">What's new</Button>
      <Dialog className="max-w-100">
        <div className="flex shrink-0 items-center gap-space-200 ps-space-300 pe-space-200 pb-space-200">
          <Heading slot="title" className="m-0 grow text-headline-sm text-on-surface">
            What's new
          </Heading>
          <IconButton slot="close" aria-label="Close">
            <Icon name="close" />
          </IconButton>
        </div>
        <Divider />
        <Text
          slot="description"
          elementType="p"
          className="m-0 min-h-0 grow overflow-y-auto px-space-300 py-space-200"
        >
          Shared albums now show who added each photo, and you can sort an album by the date a photo
          was taken or added.
        </Text>
        <Divider />
        <div className="flex shrink-0 flex-wrap-reverse justify-end gap-space-100 px-space-300 pt-space-200">
          <Button variant="text" slot="close">
            Got it
          </Button>
        </div>
      </Dialog>
    </DialogTrigger>
  )
}
