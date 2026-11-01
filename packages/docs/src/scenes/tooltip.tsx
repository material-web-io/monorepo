import { AppBar, Button, Icon, IconButton, twMerge } from '@material-web/react'
import { Heading } from 'react-aria-components'
import { PhoneTop } from '../components/phone'

const photos = [
  'bg-tertiary-container text-tertiary',
  'bg-primary-container text-primary',
  'bg-secondary-container text-secondary',
  'bg-surface-container-highest text-on-surface-variant',
  'bg-primary-container text-primary',
  'bg-tertiary-container text-tertiary',
]

/**
 * Tooltips as they are shown, which they only are over what they describe: a rich one, with a
 * title, a line and an action, under the button of an album's app bar that a finger is on, and
 * a plain one under the button on one of its photos.
 */
export default function TooltipScene() {
  return (
    <PhoneTop>
      <AppBar isScrolled={false}>
        <IconButton slot="leading" aria-label="Back">
          <Icon name="arrow_back" />
        </IconButton>
        <Heading slot="headline">Summer trip</Heading>
        <IconButton slot="trailing" aria-label="Share album">
          <Icon name="person_add" />
        </IconButton>
        <IconButton slot="trailing" aria-label="More options">
          <Icon name="more_vert" />
        </IconButton>
      </AppBar>
      <div className="grid shrink-0 grid-cols-2 gap-space-150 px-space-200 icon-48 icon-filled">
        {photos.map((photo, index) => (
          <span
            key={index}
            className={twMerge(
              'relative grid aspect-square place-items-center rounded-shape-lg',
              photo,
            )}
          >
            <Icon name="landscape" />
            {index === 2 && (
              <>
                <span className="absolute end-space-100 top-space-100">
                  <IconButton variant="filled" aria-label="Favorite">
                    <Icon name="favorite" />
                  </IconButton>
                </span>
                <span className="absolute end-0 top-13 rounded-shape-xs bg-inverse-surface px-space-100 py-space-50 text-body-sm whitespace-nowrap text-inverse-on-surface">
                  Favorite
                </span>
              </>
            )}
          </span>
        ))}
      </div>
      {/* Over the app bar, which is a layer of its own: the finger, and the tooltip under it. */}
      <span className="absolute end-13 top-11 z-tooltip box-border size-12 rounded-full border-2 border-on-surface bg-on-surface/16" />
      <div className="docs-thumbnail-panel absolute end-space-200 top-24 z-tooltip w-66 items-start rounded-shape-md bg-surface-container px-space-200 pt-space-150 pb-space-50 text-body-md text-on-surface-variant shadow-elevation-2">
        <span className="pb-space-50 text-title-sm">Share this album</span>
        Invite friends and family to this album. People you invite can add their own photos.
        <Button variant="text" className="-ms-space-150 mt-space-100">
          Invite
        </Button>
      </div>
    </PhoneTop>
  )
}
