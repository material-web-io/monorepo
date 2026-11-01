import { AppBar, Icon, IconButton, TextField } from '@material-web/react'
import { Heading } from 'react-aria-components'
import { PhoneTop } from '../components/phone'

/** Text fields on the form of a new contact: two filled in, two still empty. */
export default function TextFieldScene() {
  return (
    <PhoneTop>
      <AppBar isScrolled={false}>
        <IconButton slot="leading" aria-label="Close">
          <Icon name="close" />
        </IconButton>
        <Heading slot="headline">New contact</Heading>
        <IconButton slot="trailing" variant="tonal" aria-label="Save">
          <Icon name="check" />
        </IconButton>
      </AppBar>
      <div className="flex shrink-0 flex-col gap-space-250 px-space-300 pt-space-100">
        <TextField
          variant="outlined"
          label="First name"
          defaultValue="Ali"
          className="w-full"
          leading={<Icon name="person" />}
        />
        <TextField variant="outlined" label="Last name" defaultValue="Connors" className="w-full" />
        <TextField
          variant="outlined"
          label="Phone"
          className="w-full"
          leading={<Icon name="call" />}
        />
        <TextField
          variant="outlined"
          label="Email"
          className="w-full"
          leading={<Icon name="mail" />}
        />
      </div>
    </PhoneTop>
  )
}
