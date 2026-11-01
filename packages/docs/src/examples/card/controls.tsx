import { Card, Icon, IconButton } from '@material-web/react'

const cover = `data:image/svg+xml,${encodeURIComponent(
  '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 160 160"><rect width="160" height="160" fill="#E8DEF8"/><circle cx="80" cy="80" r="44" fill="#6750A4" opacity=".6"/><circle cx="80" cy="80" r="12" fill="#E8DEF8"/></svg>',
)}`

export default function Controls() {
  return (
    <Card variant="filled" className="w-88 flex-row">
      <div className="flex flex-1 flex-col justify-between">
        <div className="p-space-200">
          <div className="text-title-md">Eye Rhymes</div>
          <div className="text-on-surface-variant">Glass & Grace</div>
        </div>
        <div className="flex items-center gap-space-50 p-space-100">
          <IconButton aria-label="Previous">
            <Icon name="skip_previous" />
          </IconButton>
          <IconButton variant="filled" aria-label="Play">
            <Icon name="play_arrow" />
          </IconButton>
          <IconButton aria-label="Next">
            <Icon name="skip_next" />
          </IconButton>
        </div>
      </div>
      <img src={cover} alt="" className="w-35 object-cover" />
    </Card>
  )
}
