import { Fab, Icon } from '@material-web/react'
import { Text } from 'react-aria-components'

export default function Disabled() {
  return (
    <>
      <Fab aria-label="Compose a new message" isDisabled>
        <Icon name="edit" />
      </Fab>
      <Fab isDisabled>
        <Icon name="edit" />
        <Text slot="label">Compose</Text>
      </Fab>
    </>
  )
}
