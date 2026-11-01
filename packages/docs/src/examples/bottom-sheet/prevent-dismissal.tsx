import { BottomSheet, Button, SheetTrigger } from '@material-web/react'
import { Heading, Text } from 'react-aria-components'

export default function PreventDismissal() {
  return (
    <SheetTrigger>
      <Button variant="tonal">Discard draft</Button>
      <BottomSheet isModal preventDismissal role="alertdialog">
        <div className="flex flex-col gap-space-200 px-space-300 pb-space-300">
          <Heading slot="title" className="m-0 text-title-lg">
            Discard this draft?
          </Heading>
          <Text slot="description" className="text-on-surface-variant">
            What you have written so far is lost.
          </Text>
          <div className="flex justify-end gap-space-100">
            <Button variant="text" slot="close">
              Keep editing
            </Button>
            <Button slot="close">Discard</Button>
          </div>
        </div>
      </BottomSheet>
    </SheetTrigger>
  )
}
