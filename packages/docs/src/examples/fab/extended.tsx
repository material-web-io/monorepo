import { Fab, Icon } from '@material-web/react'
import { Text } from 'react-aria-components'

export default function Extended() {
  return (
    <>
      <Fab size="baseline">
        <Icon name="edit" />
        <Text slot="label">Compose</Text>
      </Fab>
      <Fab size="medium">
        <Icon name="edit" />
        <Text slot="label">Compose</Text>
      </Fab>
      <Fab size="large">
        <Icon name="edit" />
        <Text slot="label">Compose</Text>
      </Fab>
    </>
  )
}
