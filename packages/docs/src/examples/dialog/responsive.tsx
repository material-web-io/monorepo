import {
  AppBar,
  Button,
  Dialog,
  DialogTrigger,
  Icon,
  IconButton,
  TextField,
} from '@material-web/react'
import { useSyncExternalStore } from 'react'
import { Heading } from 'react-aria-components'

// A compact window: one narrower than the theme's medium breakpoint.
const compact = '(width < 600px)'

function subscribe(onChange: () => void) {
  const query = window.matchMedia(compact)
  query.addEventListener('change', onChange)
  return () => query.removeEventListener('change', onChange)
}

export default function Responsive() {
  const isCompact = useSyncExternalStore(
    subscribe,
    () => window.matchMedia(compact).matches,
    () => false,
  )
  const field = <TextField label="Album name" variant="outlined" className="w-full" />
  return (
    <DialogTrigger>
      <Button variant="tonal">New album</Button>
      <Dialog isFullScreen={isCompact}>
        {({ state }) =>
          isCompact ? (
            <>
              <AppBar>
                <IconButton slot="leading" aria-label="Close" onPress={() => state.close()}>
                  <Icon name="close" />
                </IconButton>
                <Heading slot="headline">New album</Heading>
                <Button slot="trailing" variant="text" onPress={() => state.close()}>
                  Create
                </Button>
              </AppBar>
              <div className="px-space-300 pt-space-300">{field}</div>
            </>
          ) : (
            <>
              <Heading
                slot="title"
                className="m-0 px-space-300 pb-space-200 text-headline-sm text-on-surface"
              >
                New album
              </Heading>
              <div className="min-h-0 grow overflow-y-auto px-space-300 pt-space-100 pb-space-100">
                {field}
              </div>
              <div className="flex shrink-0 flex-wrap-reverse justify-end gap-space-100 px-space-300 pt-space-200">
                <Button variant="text" slot="close">
                  Cancel
                </Button>
                <Button variant="text" slot="close">
                  Create
                </Button>
              </div>
            </>
          )
        }
      </Dialog>
    </DialogTrigger>
  )
}
