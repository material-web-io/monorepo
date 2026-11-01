import {
  Button,
  Icon,
  Snackbar,
  SnackbarCloseButton,
  SnackbarContent,
  SnackbarQueue,
  SnackbarRegion,
} from '@material-web/react'
import { Text } from 'react-aria-components'

const snackbars = new SnackbarQueue<{ text: string; isError?: boolean }>()

export default function Custom() {
  return (
    <>
      <Button variant="outlined" onPress={() => snackbars.add({ text: 'Photo uploaded' })}>
        Upload
      </Button>
      <Button
        variant="outlined"
        onPress={() => snackbars.add({ text: 'Upload failed', isError: true })}
      >
        Fail
      </Button>
      <SnackbarRegion queue={snackbars}>
        {({ toast }) => (
          <Snackbar
            toast={toast}
            className={toast.content.isError ? 'bg-error text-on-error' : undefined}
          >
            <SnackbarContent>
              <Text slot="title">{toast.content.text}</Text>
            </SnackbarContent>
            <SnackbarCloseButton className={toast.content.isError ? 'text-on-error' : undefined}>
              <Icon name="close" />
            </SnackbarCloseButton>
          </Snackbar>
        )}
      </SnackbarRegion>
    </>
  )
}
