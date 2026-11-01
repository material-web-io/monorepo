import { Fab, Icon } from '@material-web/react'
import { Text } from 'react-aria-components'

export default function FunctionChildren() {
  return (
    <Fab>
      {({ isHovered, isPressed }) => (
        <>
          <Icon name="edit" className={isHovered || isPressed ? 'icon-filled' : undefined} />
          <Text slot="label">Compose</Text>
        </>
      )}
    </Fab>
  )
}
