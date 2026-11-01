import { twMerge } from '@material-web/react'

const box =
  'cursor-pointer rounded-shape-md border-0 bg-surface-container-high px-space-200 py-space-150 text-label-lg text-on-surface'

export default function FocusRing() {
  return (
    <>
      <button type="button" className={twMerge(box, 'focus-ring')}>
        focus-ring
      </button>
      <button type="button" className={twMerge(box, 'focus-ring-inset')}>
        focus-ring-inset
      </button>
      <span className={twMerge(box, 'focus-indicator cursor-default')}>focus-indicator</span>
    </>
  )
}
