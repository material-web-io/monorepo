import { Button, Dialog, DialogTrigger } from '@material-web/react'
import { Heading, Text } from 'react-aria-components'

export default function Position() {
  return (
    <DialogTrigger>
      <Button variant="tonal">Turn on backup</Button>
      <Dialog className="ms-auto max-w-80 self-end">
        <Heading
          slot="title"
          className="m-0 px-space-300 pb-space-200 text-headline-sm text-on-surface"
        >
          Back up photos?
        </Heading>
        <Text
          slot="description"
          elementType="p"
          className="m-0 min-h-0 grow overflow-y-auto px-space-300 pb-space-100"
        >
          Photos you take on this device are saved to your account.
        </Text>
        <div className="flex shrink-0 flex-wrap-reverse justify-end gap-space-100 px-space-300 pt-space-200">
          <Button variant="text" slot="close">
            Not now
          </Button>
          <Button variant="text" slot="close">
            Turn on
          </Button>
        </div>
      </Dialog>
    </DialogTrigger>
  )
}
