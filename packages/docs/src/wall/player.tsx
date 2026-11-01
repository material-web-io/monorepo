import { Button, Icon, IconButton, Slider } from '@material-web/react'
import { shapes } from '../components/shapes'
import { Photo, Screen, useSeconds } from './screen'

// The song: how long it is and how far in it starts, in seconds.
const length = 195
const start = 42

const clock = (seconds: number) =>
  `${Math.floor(seconds / 60)}:${String(seconds % 60).padStart(2, '0')}`

type PlayerProps = {
  /** Whether the wall plays: the song does too, a second at a time. */
  isPlaying: boolean
}

/**
 * A music player: the album's cover in a cookie, the song's title large, and big
 * buttons to play it and skip, over where it is in the song.
 */
export default function Player({ isPlaying }: PlayerProps) {
  const at = (start + useSeconds(isPlaying)) % length
  return (
    <Screen edge="top" theme="dark" className="bg-primary-40 text-on-primary-container">
      {/* The cover's outline in its 260px box: Material's nine-sided cookie, a bump at its top,
          turning slowly while the picture in it holds still. */}
      <svg aria-hidden="true" className="absolute size-0">
        <clipPath id="docs-wall-album" clipPathUnits="userSpaceOnUse">
          <path
            d={shapes.cookie}
            transform="scale(130) rotate(-90)"
            className="docs-wall-album-outline"
          />
        </clipPath>
      </svg>
      <Photo of="/" className="docs-wall-album mx-auto mt-space-100 size-65" />
      <span className="shrink-0 px-space-200 text-8xl leading-none font-bold tracking-tight text-tertiary-fixed">
        Lumen
      </span>
      <div className="flex shrink-0 gap-space-100 px-space-200 pt-space-200">
        <Button size="l" className="grow bg-tertiary-fixed text-on-tertiary-fixed">
          Play
        </Button>
        <IconButton
          size="l"
          aria-label="Previous"
          className="bg-tertiary-fixed text-on-tertiary-fixed"
        >
          <Icon name="skip_previous" className="icon-filled" />
        </IconButton>
      </div>
      <div className="flex shrink-0 items-center gap-space-200 px-space-200 pt-space-100">
        <IconButton size="l" aria-label="Next" className="bg-tertiary-fixed text-on-tertiary-fixed">
          <Icon name="skip_next" className="icon-filled" />
        </IconButton>
        <div className="flex grow flex-col gap-space-50">
          <Slider aria-label="Position" maxValue={length} value={at} className="w-full" />
          <span className="flex justify-between font-mono text-label-lg">
            <span>{clock(at)}</span>
            <span>{clock(length)}</span>
          </span>
        </div>
      </div>
    </Screen>
  )
}
