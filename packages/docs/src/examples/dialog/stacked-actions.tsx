import { Button, Dialog, DialogTrigger } from '@material-web/react'
import { Heading, Text } from 'react-aria-components'

export default function StackedActions() {
  return (
    <DialogTrigger>
      <Button variant="tonal">Speed boost</Button>
      <Dialog className="max-w-70">
        <Heading
          slot="title"
          className="m-0 px-space-300 pb-space-200 text-headline-sm text-on-surface"
        >
          Turn on speed boost?
        </Heading>
        <Text
          slot="description"
          elementType="p"
          className="m-0 min-h-0 grow overflow-y-auto px-space-300 pb-space-100"
        >
          Speed boost compresses data sent to and from your phone to load maps and directions
          faster.
        </Text>
        <div className="flex shrink-0 flex-wrap-reverse justify-end gap-space-100 px-space-300 pt-space-200">
          <Button variant="text" slot="close">
            No thanks
          </Button>
          <Button variant="text" slot="close">
            Turn on speed boost
          </Button>
        </div>
      </Dialog>
    </DialogTrigger>
  )
}
