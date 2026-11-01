import {
  Button,
  Dialog,
  DialogTrigger,
  Icon,
  Snackbar,
  SnackbarCloseButton,
  SnackbarContent,
  SnackbarQueue,
  SnackbarRegion,
} from '@material-web/react'
import { Heading, Text } from 'react-aria-components'

const snackbars = new SnackbarQueue<string>()

export default function InDialog() {
  return (
    <>
      <DialogTrigger>
        <Button variant="tonal">Share album</Button>
        <Dialog>
          <Heading
            slot="title"
            className="m-0 px-space-300 pb-space-200 text-headline-sm text-on-surface"
          >
            Share album
          </Heading>
          <Text slot="description" elementType="p" className="m-0 px-space-300 pb-space-100">
            Anyone with the link can view this album.
          </Text>
          <div className="flex shrink-0 justify-end gap-space-100 px-space-300 pt-space-200">
            <Button variant="text" onPress={() => snackbars.add('Link copied', { timeout: 5000 })}>
              Copy link
            </Button>
            <Button variant="text" slot="close">
              Done
            </Button>
          </div>
        </Dialog>
      </DialogTrigger>
      <SnackbarRegion queue={snackbars}>
        {({ toast }) => (
          <Snackbar toast={toast}>
            <SnackbarContent>
              <Text slot="title">{toast.content}</Text>
            </SnackbarContent>
            <SnackbarCloseButton>
              <Icon name="close" />
            </SnackbarCloseButton>
          </Snackbar>
        )}
      </SnackbarRegion>
    </>
  )
}
