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

type Message = { text: string; action?: string }

const snackbars = new SnackbarQueue<Message>()

const messages: [label: string, message: Message][] = [
  ['Single line', { text: 'Photo archived' }],
  ['With action', { text: 'Photo added to “Natural Light” album', action: 'View' }],
  [
    'Two lines',
    { text: 'The item already has the label “travel.” Add a new label, or choose another one.' },
  ],
  [
    'Longer action',
    { text: 'Can’t add photo to your favorites', action: 'Learn more about storage' },
  ],
]

export default function Configurations() {
  return (
    <div className="box-border flex h-64 w-full flex-wrap content-start justify-center gap-space-100 p-space-300">
      {messages.map(([label, message]) => (
        <Button key={label} variant="outlined" onPress={() => snackbars.add(message)}>
          {label}
        </Button>
      ))}
      <SnackbarRegion queue={snackbars} className="max-w-86">
        {({ toast }) => (
          <Snackbar toast={toast}>
            <SnackbarContent>
              <Text slot="title">{toast.content.text}</Text>
            </SnackbarContent>
            {toast.content.action && (
              <SnackbarAction onPress={() => snackbars.close(toast.key)}>
                {toast.content.action}
              </SnackbarAction>
            )}
            <SnackbarCloseButton>
              <Icon name="close" />
            </SnackbarCloseButton>
          </Snackbar>
        )}
      </SnackbarRegion>
    </div>
  )
}
