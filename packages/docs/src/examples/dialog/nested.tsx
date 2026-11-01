import {
  AppBar,
  Button,
  Dialog,
  DialogTrigger,
  Icon,
  IconButton,
  TextField,
} from '@material-web/react'
import { useState } from 'react'
import { Heading, Text } from 'react-aria-components'

export default function Nested() {
  const [isEditing, setEditing] = useState(false)
  const [isChanged, setChanged] = useState(false)
  const [isConfirming, setConfirming] = useState(false)
  const close = () => {
    setEditing(false)
    setConfirming(false)
    setChanged(false)
  }
  const leave = () => (isChanged ? setConfirming(true) : close())
  return (
    <>
      <DialogTrigger
        isOpen={isEditing}
        onOpenChange={(isOpen) => (isOpen ? setEditing(true) : leave())}
      >
        <Button variant="tonal">Write a note</Button>
        <Dialog isFullScreen>
          <AppBar>
            <IconButton slot="leading" aria-label="Close" onPress={leave}>
              <Icon name="close" />
            </IconButton>
            <Heading slot="headline">New note</Heading>
            <Button slot="trailing" variant="text" onPress={close}>
              Save
            </Button>
          </AppBar>
          <div className="px-space-300 pt-space-300">
            <TextField
              label="Note"
              variant="outlined"
              className="w-full"
              onChange={() => setChanged(true)}
            />
          </div>
        </Dialog>
      </DialogTrigger>
      <Dialog isOpen={isConfirming} onOpenChange={setConfirming} aria-label="Discard draft">
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
          <Button variant="text" onPress={close}>
            Discard
          </Button>
        </div>
      </Dialog>
    </>
  )
}
