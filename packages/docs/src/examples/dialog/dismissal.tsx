import { Button, Dialog, DialogTrigger } from '@material-web/react'
import { Heading, Text } from 'react-aria-components'

export default function Dismissal() {
  return (
    <DialogTrigger>
      <Button variant="tonal">Reset settings</Button>
      <Dialog isDismissable={false} isKeyboardDismissDisabled>
        <Heading
          slot="title"
          className="m-0 px-space-300 pb-space-200 text-headline-sm text-on-surface"
        >
          Reset settings?
        </Heading>
        <Text
          slot="description"
          elementType="p"
          className="m-0 min-h-0 grow overflow-y-auto px-space-300 pb-space-100"
        >
          This will reset your app preferences back to their default settings.
        </Text>
        <div className="flex shrink-0 flex-wrap-reverse justify-end gap-space-100 px-space-300 pt-space-200">
          <Button variant="text" slot="close">
            Cancel
          </Button>
          <Button variant="text" slot="close">
            Reset
          </Button>
        </div>
      </Dialog>
    </DialogTrigger>
  )
}
