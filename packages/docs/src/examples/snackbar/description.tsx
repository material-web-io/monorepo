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

const snackbars = new SnackbarQueue<{ title: string; description: string }>()

export default function Description() {
  return (
    <>
      <Button
        variant="tonal"
        onPress={() =>
          snackbars.add({ title: 'Upload paused', description: 'It resumes once you are online.' })
        }
      >
        Pause upload
      </Button>
      <SnackbarRegion queue={snackbars}>
        {({ toast }) => (
          <Snackbar toast={toast}>
            <SnackbarContent>
              <Text slot="title">{toast.content.title}</Text>
              <Text slot="description">{toast.content.description}</Text>
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
