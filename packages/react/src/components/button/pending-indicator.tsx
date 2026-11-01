import type { CSSProperties } from 'react'

/**
 * The loading indicator a pending button shows in place of its children (button-pending): the
 * shape of `LoadingIndicator` alone (loading-indicator.css), `size` dp across, in the label's
 * color, at the button's center. Hidden from assistive technology, since nothing here gives it a
 * name: the button is still named by its children or label, and React Aria announces the change.
 */
export function PendingIndicator({ size }: { size: number }) {
  return (
    <span aria-hidden className="button-pending-indicator">
      <span
        className="loading-indicator"
        style={{ '--loading-indicator-size': size } as CSSProperties}
      >
        <span className="loading-indicator-active" />
      </span>
    </span>
  )
}
