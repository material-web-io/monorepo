import { AppBar, Icon, IconButton } from '@material-web/react'
import { Heading } from 'react-aria-components'
import { PhoneTop } from '../components/phone'

/** Icon buttons around a photo: in the app bar over it, and in a row of actions under it. */
export default function IconButtonScene() {
  return (
    <PhoneTop>
      <AppBar isScrolled={false}>
        <IconButton slot="leading" aria-label="Back">
          <Icon name="arrow_back" />
        </IconButton>
        <Heading slot="headline">Moraine Lake</Heading>
        <IconButton slot="trailing" aria-label="Favorite" isSelectable isSelected>
          <Icon name="favorite" className="icon-filled" />
        </IconButton>
        <IconButton slot="trailing" aria-label="More options">
          <Icon name="more_vert" />
        </IconButton>
      </AppBar>
      <svg
        aria-hidden="true"
        viewBox="0 0 336 224"
        className="mx-space-200 block h-56 shrink-0 rounded-shape-xl bg-primary-container"
      >
        <circle cx="258" cy="56" r="22" className="fill-inverse-primary" />
        <path d="M0 150 84 74 150 128 214 86 336 158V224H0Z" className="fill-primary" />
        <path d="M0 178H336V224H0Z" className="fill-inverse-primary" />
      </svg>
      <div className="flex shrink-0 items-center justify-center gap-space-150 pt-space-300">
        <IconButton variant="outlined" size="m" width="narrow" aria-label="Edit">
          <Icon name="edit" />
        </IconButton>
        <IconButton variant="tonal" size="m" aria-label="Share">
          <Icon name="share" />
        </IconButton>
        <IconButton variant="filled" size="m" width="wide" aria-label="Send">
          <Icon name="send" />
        </IconButton>
        <IconButton variant="tonal" size="m" aria-label="Delete">
          <Icon name="delete" />
        </IconButton>
      </div>
    </PhoneTop>
  )
}
