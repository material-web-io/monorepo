import {
  Icon,
  Snackbar,
  SnackbarCloseButton,
  SnackbarContent,
  SnackbarQueue,
  SnackbarRegion,
} from '@material-web/react'
import { Text } from 'react-aria-components'

/** The site's own snackbars: `snackbars.add('Copied')`. */
export const snackbars = new SnackbarQueue<string>()

// 12dp above the navigation bar of a compact window, and above the window's edge without one.
export function Snackbars() {
  return (
    <SnackbarRegion queue={snackbars} className="bottom-19 medium-screen:bottom-space-150">
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
  )
}
