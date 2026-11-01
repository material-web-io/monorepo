import {
  Button,
  Icon,
  Snackbar,
  SnackbarCloseButton,
  SnackbarContent,
  SnackbarQueue,
  SnackbarRegion,
} from '@material-web/react'
import { useState } from 'react'
import { Text } from 'react-aria-components'

const snackbars = new SnackbarQueue<string>()

export default function Consecutive() {
  const [count, setCount] = useState(0)
  return (
    <>
      <Button
        variant="outlined"
        onPress={() => {
          setCount(count + 1)
          snackbars.add(`Message ${count + 1}`)
        }}
      >
        Add a snackbar
      </Button>
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
