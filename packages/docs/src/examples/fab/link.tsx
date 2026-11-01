import { Fab, Icon } from '@material-web/react'
import { Text } from 'react-aria-components'

export default function LinkFab() {
  return (
    <Fab
      color="secondary-container"
      elementType="a"
      href="https://m3.material.io/components/floating-action-button"
      target="_blank"
      rel="noreferrer"
    >
      <Icon name="open_in_new" />
      <Text slot="label">Read the spec</Text>
    </Fab>
  )
}
