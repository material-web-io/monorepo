import { Icon, IconButton } from '@material-web/react'

export default function Tonal() {
  return (
    <>
      <IconButton variant="tonal" aria-label="Edit">
        <Icon name="edit" />
      </IconButton>
      <IconButton variant="tonal" aria-label="Edit, disabled" isDisabled>
        <Icon name="edit" />
      </IconButton>
      <IconButton variant="tonal" elementType="a" href="#tonal-icon-button" aria-label="Link">
        <Icon name="link" />
      </IconButton>
    </>
  )
}
