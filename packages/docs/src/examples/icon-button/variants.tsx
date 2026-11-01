import { Icon, IconButton } from '@material-web/react'

export default function Variants() {
  return (
    <>
      <IconButton variant="filled" aria-label="Edit, filled">
        <Icon name="edit" />
      </IconButton>
      <IconButton variant="tonal" aria-label="Edit, tonal">
        <Icon name="edit" />
      </IconButton>
      <IconButton variant="outlined" aria-label="Edit, outlined">
        <Icon name="edit" />
      </IconButton>
      <IconButton variant="standard" aria-label="Edit, standard">
        <Icon name="edit" />
      </IconButton>
    </>
  )
}
