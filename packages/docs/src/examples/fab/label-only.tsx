import { Fab } from '@material-web/react'
import { Text } from 'react-aria-components'

export default function LabelOnly() {
  return (
    <Fab color="tertiary-container">
      <Text slot="label">New event</Text>
    </Fab>
  )
}
