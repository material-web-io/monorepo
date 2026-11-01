import { Icon, IconButton, Switch, twMerge } from '@material-web/react'
import { Screen } from './screen'

// The alarms, by hour, minute and half of the day, and whether each is on.
const alarms = [
  ['07', '30', 'AM', true],
  ['12', '30', 'PM', false],
  ['07', '00', 'PM', true],
  ['09', '30', 'PM', false],
] as const

/** A clock's alarms, each a tile with its time large and a switch: the ones on, filled. */
export default function Alarm() {
  return (
    <Screen edge="top" theme="dark">
      <div className="flex shrink-0 items-center gap-space-150 ps-space-300 pe-space-100 pt-space-200 pb-space-100 text-title-lg icon-24">
        <Icon name="alarm" className="icon-filled" />
        <span className="grow">Mornings</span>
        <IconButton aria-label="More options">
          <Icon name="more_vert" />
        </IconButton>
      </div>
      <div className="grid shrink-0 grid-cols-2 gap-space-100 px-space-200">
        {alarms.map(([hour, minute, half, isOn]) => (
          <div
            key={`${hour}${half}`}
            className={twMerge(
              'flex flex-col items-center gap-space-200 rounded-shape-xl p-space-200',
              isOn
                ? 'bg-primary-container text-on-primary-container'
                : 'bg-surface-container-high text-on-surface-variant',
            )}
          >
            <span className="flex flex-col items-center text-8xl leading-none font-medium tracking-tight">
              <span>{hour}</span>
              <span>{minute}</span>
            </span>
            <span className="text-headline-md">{half}</span>
            <Switch aria-label={`${hour}:${minute} ${half}`} defaultSelected={isOn} />
          </div>
        ))}
      </div>
    </Screen>
  )
}
