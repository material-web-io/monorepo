import { Icon, IconButton } from '@material-web/react'

export default function Filled() {
  return (
    <>
      <IconButton variant="filled" aria-label="Edit">
        <Icon name="edit" />
      </IconButton>
      <IconButton variant="filled" aria-label="Edit, disabled" isDisabled>
        <Icon name="edit" />
      </IconButton>
      <IconButton variant="filled" elementType="a" href="#filled-icon-button" aria-label="Link">
        <Icon name="link" />
      </IconButton>
    </>
  )
}
