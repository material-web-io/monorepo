import {
  AppBar,
  Button,
  Dialog,
  DialogTrigger,
  Icon,
  IconButton,
  TextField,
} from '@material-web/react'
import { Heading } from 'react-aria-components'

export default function FullScreen() {
  return (
    <DialogTrigger>
      <Button variant="tonal">New event</Button>
      <Dialog isFullScreen>
        {({ state }) => (
          <>
            <AppBar>
              <IconButton slot="leading" aria-label="Close" onPress={() => state.close()}>
                <Icon name="close" />
              </IconButton>
              <Heading slot="headline">New event</Heading>
              <Button slot="trailing" variant="text" onPress={() => state.close()}>
                Save
              </Button>
            </AppBar>
            <div className="flex flex-col gap-space-200 px-space-300 pt-space-300">
              {['Event name', 'Location', 'Guests', 'Description'].map((label) => (
                <TextField key={label} label={label} variant="outlined" className="w-full" />
              ))}
            </div>
          </>
        )}
      </Dialog>
    </DialogTrigger>
  )
}
