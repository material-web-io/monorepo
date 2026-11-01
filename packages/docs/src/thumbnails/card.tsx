import { Card } from '@material-web/react'

/** A card: a picture over a title and a line about it. */
export default function CardThumbnail() {
  return (
    <Card variant="elevated" className="w-60 shrink-0">
      <svg
        aria-hidden="true"
        viewBox="0 0 240 88"
        className="block h-22 w-full bg-tertiary-container"
      >
        <circle cx="186" cy="28" r="13" className="fill-tertiary" />
        <path d="M0 78 70 34 116 62 152 44 240 82V88H0Z" className="fill-tertiary" />
      </svg>
      <div className="p-space-200">
        <div className="text-title-md text-on-surface">Eye Rhymes</div>
        <div className="text-body-md text-on-surface-variant">Glass &amp; Grace</div>
      </div>
    </Card>
  )
}
