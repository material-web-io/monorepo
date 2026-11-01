import { Icon, IconButton, twMerge } from '@material-web/react'
import { useState } from 'react'
import { useIsSSR } from 'react-aria'
import { useMediaQuery } from '../media'
import Alarm from './alarm'
import Assistant from './assistant'
import Chat from './chat'
import Event from './event'
import Filters from './filters'
import Garden from './garden'
import Inbox from './inbox'
import Player from './player'
import Speaker from './speaker'
import Studio from './studio'

/**
 * The home page's picture, after m3.material.io's: apps built of the components on phones'
 * screens, in five columns, each set higher or lower than the next, the wall larger than its
 * panel and cut off by it. A few of them move, until the reader pauses them, or only once the
 * reader plays them if they ask for less motion.
 */
export function Wall() {
  const isReduced = useMediaQuery('(prefers-reduced-motion: reduce)')
  const [choice, setChoice] = useState<boolean>()
  const isPlaying = choice ?? !isReduced
  // The components' own animations, a loading indicator's, wait for the page to run: the built
  // page cannot know whether the reader asks for less motion.
  const isStill = useIsSSR() || !isPlaying

  return (
    <div data-theme="light" className="docs-wall-frame">
      <div inert className={twMerge('docs-wall', isStill && 'docs-wall-still')}>
        <div className="docs-wall-column -mt-133">
          <Studio />
          <Garden />
        </div>
        <div className="docs-wall-column -mt-92">
          <Event isPlaying={isPlaying} />
          <Chat />
        </div>
        <div className="docs-wall-column -mt-140">
          <Filters isPlaying={isPlaying} />
          <Player isPlaying={isPlaying} />
        </div>
        <div className="docs-wall-column -mt-87">
          <Assistant />
          <Alarm />
        </div>
        <div className="docs-wall-column -mt-140">
          <Speaker />
          <Inbox />
        </div>
      </div>
      <div className="docs-wall-pause">
        <IconButton
          aria-label="Pause the animation"
          variant="tonal"
          isSelectable
          isSelected={!isPlaying}
          onChange={(isPaused) => setChoice(!isPaused)}
        >
          <Icon name={isPlaying ? 'pause' : 'play_arrow'} className="icon-filled" />
        </IconButton>
      </div>
    </div>
  )
}
