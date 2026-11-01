import { Ripple } from '@material-web/react'

export default function Disabled() {
  return (
    <button
      type="button"
      disabled
      className="relative h-10 rounded-shape-full border-0 bg-on-surface/disabled-container px-space-300 text-label-lg text-on-surface/disabled-content"
    >
      <Ripple />
      Label
    </button>
  )
}
