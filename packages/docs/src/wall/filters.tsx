import { Button, Icon, IconButton, twMerge } from '@material-web/react'
import { loop, Screen, useSeconds } from './screen'

// The filters, by name and the CSS filter that makes each: one is picked.
const filters = [
  ['None', ''],
  ['Warm', 'sepia'],
  ['Vivid', ''],
  ['Dusk', 'hue-rotate-60'],
  ['Bloom', 'saturate-200'],
  ['Night', 'brightness-50 contrast-150'],
  ['Mono', 'grayscale'],
] as const
const picked = 'Vivid'

const tools = [
  ['Draw', 'draw'],
  ['Crop', 'crop'],
  ['Adjust', 'tune'],
  ['Filters', 'filter_vintage'],
  ['Heal', 'healing'],
] as const

// The seconds of each loop the row of filters is scrolled on by one, as if to see the next.
const scrolled = new Set([2, 3, 4])

type FiltersProps = {
  /** Whether the wall plays: the row of filters scrolls along and back while it does. */
  isPlaying: boolean
}

/** A photo editor's filters: a row of the photo in each, the picked one checked, over its tools. */
export default function Filters({ isPlaying }: FiltersProps) {
  const seconds = useSeconds(isPlaying)
  return (
    <Screen edge="bottom" theme="dark">
      <div className="shrink-0 overflow-hidden px-space-200 pb-space-300">
        <div
          className={twMerge(
            'flex gap-space-100 transition-transform duration-spring-slow-spatial ease-spring-slow-spatial',
            scrolled.has(seconds % loop) && '-translate-x-21',
          )}
        >
          {filters.map(([name, filter]) => (
            <span
              key={name}
              className={twMerge(
                'flex shrink-0 flex-col items-center gap-space-100 text-label-lg',
                name === picked && 'text-primary',
              )}
            >
              {name === picked ? (
                <span className="grid size-19 place-items-center rounded-full bg-primary-container text-on-primary-container icon-32">
                  <Icon name="check" />
                </span>
              ) : (
                <svg
                  aria-hidden="true"
                  viewBox="0 0 76 76"
                  className={twMerge('block size-19 rounded-shape-md bg-tertiary-fixed', filter)}
                >
                  <circle cx="54" cy="20" r="9" className="fill-tertiary-fixed-dim" />
                  <path
                    d="M0 54 24 34 42 48 58 38 76 50V76H0Z"
                    className="fill-primary-fixed-dim"
                  />
                  <path d="M0 64 30 54 76 66V76H0Z" className="fill-on-primary-fixed-variant" />
                </svg>
              )}
              {name}
            </span>
          ))}
        </div>
      </div>
      <div className="flex shrink-0 justify-around px-space-200 pb-space-300">
        {tools.map(([tool, icon]) => (
          <IconButton
            key={tool}
            aria-label={tool}
            variant={tool === 'Filters' ? 'tonal' : 'standard'}
          >
            <Icon name={icon} />
          </IconButton>
        ))}
      </div>
      <div className="flex shrink-0 justify-between px-space-200 pb-space-300">
        <Button variant="text">Cancel</Button>
        <Button>Save</Button>
      </div>
    </Screen>
  )
}
