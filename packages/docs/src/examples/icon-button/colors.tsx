import { Icon, IconButton } from '@material-web/react'

export default function Colors() {
  return (
    <>
      <IconButton className="text-tertiary" aria-label="Favorite, tertiary">
        <Icon name="favorite" />
      </IconButton>
      <IconButton
        variant="tonal"
        className="bg-tertiary-container text-on-tertiary-container"
        aria-label="Favorite, tertiary container"
      >
        <Icon name="favorite" />
      </IconButton>
      <IconButton variant="filled" className="bg-error text-on-error" aria-label="Delete">
        <Icon name="delete" />
      </IconButton>
    </>
  )
}
