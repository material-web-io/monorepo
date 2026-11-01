import { Card, Icon, IconButton, Slider } from '@material-web/react'

export default function First() {
  return (
    <Card className="w-80 gap-space-200 p-space-200 icon-filled">
      <div className="grid h-40 place-items-center rounded-shape-lg bg-tertiary-container text-on-tertiary-container">
        <Icon name="album" className="icon-96" />
      </div>
      <div className="px-space-100">
        <div className="text-title-lg">Eye Rhymes</div>
        <div className="text-on-surface-variant">Glass & Grace</div>
      </div>
      <Slider aria-label="Position" defaultValue={35} />
      <div className="flex items-center justify-center gap-space-100">
        <IconButton aria-label="Previous">
          <Icon name="skip_previous" />
        </IconButton>
        <IconButton
          variant="filled"
          size="m"
          width="wide"
          aria-label="Play"
          isSelectable
          defaultSelected
        >
          {({ isSelected }) => <Icon name={isSelected ? 'pause' : 'play_arrow'} />}
        </IconButton>
        <IconButton aria-label="Next">
          <Icon name="skip_next" />
        </IconButton>
      </div>
    </Card>
  )
}
