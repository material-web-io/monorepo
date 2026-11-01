import { Icon, IconButton } from '@material-web/react'

export default function Outlined() {
  return (
    <>
      <IconButton variant="outlined" aria-label="Edit">
        <Icon name="edit" />
      </IconButton>
      <IconButton variant="outlined" aria-label="Edit, disabled" isDisabled>
        <Icon name="edit" />
      </IconButton>
      <IconButton variant="outlined" elementType="a" href="#outlined-icon-button" aria-label="Link">
        <Icon name="link" />
      </IconButton>
    </>
  )
}
