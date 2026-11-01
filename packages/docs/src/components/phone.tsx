import { Icon, twMerge } from '@material-web/react'
import type { ReactNode } from 'react'

/** Across the top of a phone's screen in a picture: the time, and the phone's signals. */
export function StatusBar() {
  return (
    <div className="docs-thumbnail-status">
      <span>9:30</span>
      <span className="flex gap-space-25">
        <Icon name="wifi" />
        <Icon name="signal_cellular_4_bar" />
        <Icon name="battery_full" />
      </span>
    </div>
  )
}

type PhoneProps = {
  /** What is on its screen, from the top down. */
  children: ReactNode
  className?: string
}

/**
 * A phone in a component page's picture (scenes/), its top in view under the status bar: the
 * picture is shorter than it is, and cuts it off.
 */
export function PhoneTop({ children, className }: PhoneProps) {
  return (
    <div className={twMerge('docs-device docs-device-top', className)}>
      <StatusBar />
      {children}
    </div>
  )
}

/**
 * A phone in a component page's picture, its bottom in view: what is on its screen ends at
 * the screen's end, and the picture cuts its top off.
 */
export function PhoneBottom({ children, className }: PhoneProps) {
  return <div className={twMerge('docs-device docs-device-bottom', className)}>{children}</div>
}
