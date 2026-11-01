import { Icon, twMerge } from '@material-web/react'

const icons = [
  ['home', 'bg-surface text-on-surface'],
  ['favorite', 'bg-primary text-on-primary icon-filled'],
  ['search', 'bg-surface text-on-surface'],
  ['settings', 'bg-tertiary-container text-on-tertiary-container icon-filled'],
] as const

/** Four icons, each on a tile: outlined and filled. */
export default function IconThumbnail() {
  return (
    <div className="flex shrink-0 gap-space-150 icon-32">
      {icons.map(([name, colors]) => (
        <span
          key={name}
          className={twMerge('grid size-14 place-items-center rounded-shape-lg', colors)}
        >
          <Icon name={name} />
        </span>
      ))}
    </div>
  )
}
