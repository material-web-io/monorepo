import { Icon, Ripple } from '@material-web/react'

const host =
  'relative focus-ring grid size-10 cursor-pointer place-items-center rounded-shape-full border-0 bg-transparent text-on-surface outline-none icon-24'

export default function Variant() {
  return (
    <>
      <button type="button" aria-label="Favorite" className={host}>
        <Ripple />
        <Icon name="favorite" />
      </button>
      <button type="button" aria-label="Favorite, pressed in primary" className={host}>
        <Ripple variant="primary" />
        <Icon name="favorite" />
      </button>
      <button type="button" aria-label="Delete, pressed in error" className={host}>
        <Ripple variant="error" />
        <Icon name="delete" />
      </button>
    </>
  )
}
