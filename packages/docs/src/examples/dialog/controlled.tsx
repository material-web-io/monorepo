import { Button, Dialog } from '@material-web/react'
import { useState } from 'react'
import { Heading, Text } from 'react-aria-components'

export default function Controlled() {
  const [isOpen, setOpen] = useState(false)
  const [isDeleted, setDeleted] = useState(false)
  return (
    <>
      <Button variant="tonal" isDisabled={isDeleted} onPress={() => setOpen(true)}>
        {isDeleted ? 'Photos deleted' : 'Delete photos'}
      </Button>
      <Dialog isOpen={isOpen} onOpenChange={setOpen}>
        <Heading
          slot="title"
          className="m-0 px-space-300 pb-space-200 text-headline-sm text-on-surface"
        >
          Permanently delete?
        </Heading>
        <Text
          slot="description"
          elementType="p"
          className="m-0 min-h-0 grow overflow-y-auto px-space-300 pb-space-100"
        >
          Deleting the selected photos will also remove them from all synced devices.
        </Text>
        <div className="flex shrink-0 flex-wrap-reverse justify-end gap-space-100 px-space-300 pt-space-200">
          <Button variant="text" slot="close">
            Cancel
          </Button>
          <Button variant="text" slot="close" onPress={() => setDeleted(true)}>
            Delete
          </Button>
        </div>
      </Dialog>
    </>
  )
}
