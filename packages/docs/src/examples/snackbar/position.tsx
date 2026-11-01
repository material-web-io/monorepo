import {
  Button,
  Fab,
  Icon,
  Snackbar,
  SnackbarAction,
  SnackbarContent,
  SnackbarQueue,
  SnackbarRegion,
} from '@material-web/react'
import { Text } from 'react-aria-components'

const snackbars = new SnackbarQueue<string>()

export default function Position() {
  return (
    <div className="relative flex h-64 w-full items-start justify-center">
      <Button
        variant="outlined"
        className="mt-space-300"
        onPress={() => snackbars.add('Draft saved')}
      >
        Save draft
      </Button>
      <Fab aria-label="Compose" className="absolute end-space-200 bottom-space-200">
        <Icon name="edit" />
      </Fab>
      <SnackbarRegion queue={snackbars} className="bottom-22">
        {({ toast }) => (
          <Snackbar toast={toast}>
            <SnackbarContent>
              <Text slot="title">{toast.content}</Text>
            </SnackbarContent>
            <SnackbarAction onPress={() => snackbars.close(toast.key)}>Undo</SnackbarAction>
          </Snackbar>
        )}
      </SnackbarRegion>
    </div>
  )
}
