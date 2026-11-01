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

const snackbars = new SnackbarQueue<string>()

export default function Aligned() {
  return (
    <>
      <Button variant="outlined" onPress={() => snackbars.add('Photo archived')}>
        Archive photo
      </Button>
      <SnackbarRegion queue={snackbars} className="mx-0 max-w-86">
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
