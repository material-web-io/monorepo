import { Icon, IconButton } from '@material-web/react'

export default function Basic() {
  return (
    <>
      <IconButton aria-label="Search">
        <Icon name="search" />
      </IconButton>
      <IconButton variant="tonal" aria-label="Share">
        <Icon name="share" />
      </IconButton>
      <IconButton variant="filled" aria-label="Send message">
        <Icon name="send" className="rtl:icon-mirrored" />
      </IconButton>
    </>
  )
}
