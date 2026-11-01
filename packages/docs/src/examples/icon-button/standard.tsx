import { Icon, IconButton } from '@material-web/react'

export default function Standard() {
  return (
    <>
      <IconButton variant="standard" aria-label="Edit">
        <Icon name="edit" />
      </IconButton>
      <IconButton variant="standard" aria-label="Edit, disabled" isDisabled>
        <Icon name="edit" />
      </IconButton>
      <IconButton variant="standard" elementType="a" href="#standard-icon-button" aria-label="Link">
        <Icon name="link" />
      </IconButton>
    </>
  )
}
