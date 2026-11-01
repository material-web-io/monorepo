import { Icon, twMerge } from '@material-web/react'
import { useEffect, useState, type ReactNode } from 'react'
import { art } from '../art'
import { HeroArt } from '../components/hero'

type ScreenProps = {
  /**
   * The end of the phone the wall shows: its top, under the status bar, or its bottom, over
   * the line a swipe starts from. The wall cuts the other end off.
   */
  edge: 'top' | 'bottom'
  /** The scheme the app is in, whatever the site's. */
  theme: 'light' | 'dark'
  className?: string
  /** What is on the screen, from the top down. */
  children: ReactNode
}

/** A phone's screen on the home page's wall: no device around it, only its round corners. */
export function Screen({ edge, theme, className, children }: ScreenProps) {
  return (
    <div
      data-theme={theme}
      className={twMerge('docs-wall-screen', edge === 'bottom' && 'justify-end', className)}
    >
      {edge === 'top' && (
        <div className="docs-wall-status">
          <span>9:30</span>
          <span className="docs-wall-camera" />
          <span className="docs-wall-signals">
            <Icon name="android_cell_4_bar" className="icon-20" />
            <Icon name="wifi" className="icon-17" />
            <Icon name="battery_android_full" className="icon-24" />
          </span>
        </div>
      )}
      {children}
      {edge === 'bottom' && <div className="docs-thumbnail-indicator" />}
    </div>
  )
}

type PhotoProps = {
  /** The page whose picture (art/) stands for a photo. */
  of: string
  className?: string
}

/** A photo in an app on the wall: one of the site's pictures, filling its box. */
export function Photo({ of, className }: PhotoProps) {
  const picture = art[of]
  return (
    <div className={twMerge('relative shrink-0 overflow-hidden', className)}>
      {picture && <HeroArt {...picture} />}
    </div>
  )
}

/** The seconds the wall has played for, counted while it plays: the clock its apps move by. */
export function useSeconds(isPlaying: boolean) {
  const [seconds, setSeconds] = useState(0)
  useEffect(() => {
    if (!isPlaying) return
    const timer = setInterval(() => setSeconds((count) => count + 1), 1000)
    return () => clearInterval(timer)
  }, [isPlaying])
  return seconds
}

/** How long the wall's moves take to come round again, in seconds: as long as m3's. */
export const loop = 9
