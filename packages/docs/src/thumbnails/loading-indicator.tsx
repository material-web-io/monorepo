import { LoadingIndicator } from '@material-web/react'

/**
 * Two loading indicators on the card's ground, softened by a veil of the surface for indicators
 * as slight as these: one bare, one contained.
 */
export default function LoadingIndicatorThumbnail() {
  return (
    <div className="absolute inset-0 flex items-center justify-center gap-space-700 bg-surface/30">
      <LoadingIndicator aria-label="Loading" size={88} />
      <LoadingIndicator aria-label="Loading, contained" size={88} isContained />
    </div>
  )
}
