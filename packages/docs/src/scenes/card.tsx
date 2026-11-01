import { Button, Card } from '@material-web/react'
import { PhoneTop } from '../components/phone'

/** Cards in a feed: one with a picture, a title and its actions, over the next one. */
export default function CardScene() {
  return (
    <PhoneTop className="gap-space-200 px-space-200">
      <span className="px-space-100 pt-space-200 text-headline-sm">For you</span>
      <Card variant="elevated" className="shrink-0">
        <svg
          aria-hidden="true"
          viewBox="0 0 336 140"
          className="block h-35 w-full bg-tertiary-container"
        >
          <circle cx="262" cy="42" r="19" className="fill-tertiary" />
          <path d="M0 122 96 56 160 100 212 72 336 130V140H0Z" className="fill-tertiary" />
        </svg>
        <div className="p-space-200">
          <div className="text-title-md text-on-surface">Eye Rhymes</div>
          <div className="text-body-md text-on-surface-variant">Glass &amp; Grace</div>
        </div>
        <div className="flex justify-end gap-space-100 p-space-200 pt-0">
          <Button variant="text">Share</Button>
          <Button>Play</Button>
        </div>
      </Card>
      <Card variant="outlined" className="shrink-0">
        <div className="p-space-200">
          <div className="text-title-md text-on-surface">Night Drive</div>
          <div className="text-body-md text-on-surface-variant">
            Luna Park plays the whole record live, with two new songs.
          </div>
        </div>
        <div className="flex justify-end gap-space-100 p-space-200 pt-0">
          <Button variant="text">Read more</Button>
        </div>
      </Card>
    </PhoneTop>
  )
}
