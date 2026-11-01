import { Button, Dialog, DialogTrigger } from '@material-web/react'
import { Heading, Text } from 'react-aria-components'

export default function Transition() {
  return (
    <DialogTrigger>
      <Button variant="tonal">Sign out</Button>
      <Dialog className="entering:translate-y-12 exiting:translate-y-12">
        <Heading
          slot="title"
          className="m-0 px-space-300 pb-space-200 text-headline-sm text-on-surface"
        >
          Sign out?
        </Heading>
        <Text
          slot="description"
          elementType="p"
          className="m-0 min-h-0 grow overflow-y-auto px-space-300 pb-space-100"
        >
          You will need your password to sign in again on this device.
        </Text>
        <div className="flex shrink-0 flex-wrap-reverse justify-end gap-space-100 px-space-300 pt-space-200">
          <Button variant="text" slot="close">
            Cancel
          </Button>
          <Button variant="text" slot="close">
            Sign out
          </Button>
        </div>
      </Dialog>
    </DialogTrigger>
  )
}
