import { Fab, Icon } from '@material-web/react'
import { Text } from 'react-aria-components'

/** Three FABs: a baseline one, a medium one, and an extended one. */
export default function FabThumbnail() {
  return (
    <div className="flex shrink-0 items-center gap-space-150">
      <Fab color="tertiary-container" aria-label="Edit">
        <Icon name="edit" />
      </Fab>
      <Fab size="medium" color="primary" aria-label="Create">
        <Icon name="add" />
      </Fab>
      <Fab color="primary-container">
        <Icon name="reply" />
        <Text slot="label">Reply</Text>
      </Fab>
    </div>
  )
}
