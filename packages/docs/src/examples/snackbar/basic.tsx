import {
  Button,
  Icon,
  Snackbar,
  SnackbarAction,
  SnackbarCloseButton,
  SnackbarContent,
  SnackbarQueue,
  SnackbarRegion,
} from '@material-web/react'
import { Text } from 'react-aria-components'

const snackbars = new SnackbarQueue<string>()

export default function Basic() {
  return (
    <>
      <Button variant="tonal" onPress={() => snackbars.add('Email archived')}>
        Archive email
      </Button>
      <SnackbarRegion queue={snackbars}>
        {({ toast }) => (
          <Snackbar toast={toast}>
            <SnackbarContent>
              <Text slot="title">{toast.content}</Text>
            </SnackbarContent>
            <SnackbarAction onPress={() => snackbars.close(toast.key)}>Undo</SnackbarAction>
            <SnackbarCloseButton>
              <Icon name="close" />
            </SnackbarCloseButton>
          </Snackbar>
        )}
      </SnackbarRegion>
    </>
  )
}
