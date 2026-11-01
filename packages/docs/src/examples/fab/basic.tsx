import { Fab, Icon } from '@material-web/react'
import { Text } from 'react-aria-components'

export default function Basic() {
  return (
    <>
      <Fab aria-label="Compose a new message">
        <Icon name="edit" />
      </Fab>
      <Fab>
        <Icon name="edit" />
        <Text slot="label">Compose</Text>
      </Fab>
    </>
  )
}
