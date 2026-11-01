import {
  Button,
  Snackbar,
  SnackbarContent,
  SnackbarQueue,
  SnackbarRegion,
} from '@material-web/react'
import { useState } from 'react'
import { Text } from 'react-aria-components'

const snackbars = new SnackbarQueue<string>()

export default function Timeout() {
  const [isSaved, setSaved] = useState(false)
  return (
    <>
      <Button
        isDisabled={isSaved}
        onPress={() => {
          setSaved(true)
          snackbars.add('All changes saved', { timeout: 5000, onClose: () => setSaved(false) })
        }}
      >
        {isSaved ? 'Saved' : 'Save'}
      </Button>
      <SnackbarRegion queue={snackbars}>
        {({ toast }) => (
          <Snackbar toast={toast}>
            <SnackbarContent>
              <Text slot="title">{toast.content}</Text>
            </SnackbarContent>
          </Snackbar>
        )}
      </SnackbarRegion>
    </>
  )
}
