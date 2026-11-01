import { Chip, ChipGroup, Fab, Icon, IconButton, Toolbar, twMerge } from '@material-web/react'
import { Screen } from './screen'

// The clips of a song in the making, a lane each: how long each runs and its color.
const lanes = [
  [
    ['w-40', 'bg-primary-container'],
    ['grow', 'bg-tertiary-container'],
  ],
  [
    ['w-20', 'bg-surface-container-highest'],
    ['w-48', 'bg-secondary-container'],
  ],
  [['grow', 'bg-primary-container']],
] as const

const tools = [
  ['Mixer', 'tune'],
  ['Effects', 'graphic_eq'],
  ['Record', 'mic'],
  ['Cut', 'content_cut'],
] as const

/** A song being made in a studio app: its lanes of clips, over a toolbar of what to do to them. */
export default function Studio() {
  return (
    <Screen edge="bottom" theme="dark">
      <div className="flex shrink-0 flex-col gap-space-150 px-space-200 pb-space-300">
        <span className="flex items-center justify-between pb-space-100 text-title-lg">
          Night drive
          <IconButton aria-label="Add a lane" variant="filled" size="s">
            <Icon name="add" />
          </IconButton>
        </span>
        <ChipGroup aria-label="Voices">
          <Chip id="voice" variant="assist" textValue="Second voice">
            <Icon slot="leading" name="mic" />
            Second voice
          </Chip>
        </ChipGroup>
        {lanes.map((clips, lane) => (
          <div key={lane} className="flex gap-space-100">
            {clips.map(([width, color]) => (
              <span key={color} className={twMerge('h-14 rounded-shape-md', width, color)} />
            ))}
          </div>
        ))}
      </div>
      <div className="flex shrink-0 items-center justify-center gap-space-100 pb-space-100">
        <Toolbar variant="floating" aria-label="Song">
          {tools.map(([tool, icon]) => (
            <IconButton key={tool} aria-label={tool}>
              <Icon name={icon} />
            </IconButton>
          ))}
        </Toolbar>
        <Fab color="primary-container" aria-label="Share">
          <Icon name="ios_share" />
        </Fab>
      </div>
    </Screen>
  )
}
