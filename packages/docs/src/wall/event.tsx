import { Button, ButtonGroup, Icon } from '@material-web/react'
import { loop, Photo, Screen, useSeconds } from './screen'

const details = [
  ['Where', 'Harbor Hall ↗'],
  ['Doors', 'Open'],
  ['When', '8:30pm'],
  ['Hosted by Mira', '64 going'],
] as const

const answers = [
  ['going', 'Going', 'check'],
  ['not-going', 'Not going', 'block'],
  ['maybe', 'Maybe', 'help'],
] as const

// The seconds of each loop that "Going" is picked in, as someone makes up their mind.
const going = new Set([1, 2, 3, 6, 7])

type EventProps = {
  /** Whether the wall plays: "Going" is picked and unpicked while it does. */
  isPlaying: boolean
}

/** An invitation to a concert: a photo, where and when, and a connected group to answer it. */
export default function Event({ isPlaying }: EventProps) {
  const seconds = useSeconds(isPlaying)
  const isGoing = going.has(seconds % loop)
  return (
    <Screen edge="bottom" theme="light" className="bg-primary-container text-on-primary-container">
      <Photo of="/get-started/installation" className="mx-space-200 h-80 rounded-shape-xl" />
      <dl className="m-0 grid shrink-0 grid-cols-2 gap-x-space-200 gap-y-space-300 px-space-300 pt-space-400 pb-space-300 font-mono text-body-lg">
        {details.map(([term, value]) => (
          <div key={term}>
            <dt>{term}</dt>
            <dd className="m-0 font-medium">{value}</dd>
          </div>
        ))}
      </dl>
      {/* Three buttons as wide as each other across the screen, 24px in from its sides. */}
      <div className="shrink-0 px-space-300 pb-space-300">
        <ButtonGroup
          variant="connected"
          size="s"
          aria-label="Your answer"
          selectedKeys={isGoing ? ['going'] : []}
        >
          {answers.map(([id, answer, icon]) => (
            <Button key={id} id={id} variant="filled" size="s" isSelectable className="basis-0">
              <Icon name={icon} />
              {answer}
            </Button>
          ))}
        </ButtonGroup>
      </div>
    </Screen>
  )
}
