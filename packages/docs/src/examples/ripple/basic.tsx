import { Ripple } from '@material-web/react'

export default function Basic() {
  return (
    <button
      type="button"
      className="relative focus-ring h-10 cursor-pointer rounded-shape-full border-0 bg-primary px-space-300 text-label-lg text-on-primary outline-none"
    >
      <Ripple />
      Label
    </button>
  )
}
