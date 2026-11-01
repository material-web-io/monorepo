import { ButtonGroup, Chip, ChipGroup, Icon, IconButton } from '@material-web/react'
import { Screen } from './screen'

const volumes = [
  ['Mute', 'volume_off'],
  ['Quieter', 'volume_down'],
  ['Louder', 'volume_up'],
] as const

/** A remote for a speaker: big buttons to go back, pause and skip, its volume and its room. */
export default function Speaker() {
  return (
    <Screen edge="bottom" theme="dark">
      <div className="flex shrink-0 flex-col gap-space-100 px-space-200 pb-space-300">
        <ButtonGroup aria-label="Playback" size="l">
          <IconButton aria-label="Back" variant="tonal" size="l" shape="square">
            <Icon name="arrow_back" />
          </IconButton>
          <IconButton aria-label="Pause" variant="filled" size="l" width="wide" className="grow">
            <Icon name="pause" className="icon-filled" />
          </IconButton>
          <IconButton aria-label="Next" variant="tonal" size="l" shape="square">
            <Icon name="skip_next" className="icon-filled" />
          </IconButton>
        </ButtonGroup>
        <ButtonGroup aria-label="Volume" size="m">
          {volumes.map(([action, icon]) => (
            <IconButton key={action} aria-label={action} variant="tonal" size="m" className="grow">
              <Icon name={icon} />
            </IconButton>
          ))}
        </ButtonGroup>
      </div>
      <ChipGroup aria-label="Room" className="shrink-0 px-space-200 pb-space-300">
        <Chip id="room" variant="assist" textValue="Living room">
          <Icon slot="leading" name="speaker" />
          Living room
        </Chip>
      </ChipGroup>
    </Screen>
  )
}
