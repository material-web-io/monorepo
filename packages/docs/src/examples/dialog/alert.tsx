import { Button, Dialog, DialogTrigger } from '@material-web/react'
import { Text } from 'react-aria-components'

export default function Alert() {
  return (
    <DialogTrigger>
      <Button variant="tonal">Discard draft</Button>
      <Dialog>
        <Text
          slot="description"
          elementType="p"
          className="m-0 min-h-0 grow overflow-y-auto px-space-300 pb-space-100"
        >
          Discard draft?
        </Text>
        <div className="flex shrink-0 flex-wrap-reverse justify-end gap-space-100 px-space-300 pt-space-200">
          <Button variant="text" slot="close">
            Cancel
          </Button>
          <Button variant="text" slot="close">
            Discard
          </Button>
        </div>
      </Dialog>
    </DialogTrigger>
  )
}
