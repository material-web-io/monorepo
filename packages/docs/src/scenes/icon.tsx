import { Icon, twMerge } from '@material-web/react'
import { PhoneTop } from '../components/phone'

const shortcuts = [
  ['Home', 'home', 'bg-primary-container text-on-primary-container'],
  ['Favorites', 'favorite', 'bg-tertiary-container text-on-tertiary-container icon-filled'],
  ['Search', 'search', 'bg-secondary-container text-on-secondary-container'],
  ['Mail', 'mail', 'bg-primary text-on-primary icon-filled'],
  ['Photos', 'photo_library', 'bg-secondary-container text-on-secondary-container'],
  ['Maps', 'map', 'bg-tertiary-container text-on-tertiary-container'],
  ['Music', 'music_note', 'bg-secondary-container text-on-secondary-container'],
  ['Calendar', 'calendar_month', 'bg-primary-container text-on-primary-container icon-filled'],
  ['Settings', 'settings', 'bg-tertiary text-on-tertiary icon-filled'],
] as const

/** Icons as an app's shortcuts, each on a tile over its name: outlined and filled. */
export default function IconScene() {
  return (
    <PhoneTop>
      <span className="px-space-300 pt-space-300 pb-space-300 text-headline-sm">Shortcuts</span>
      <div className="grid shrink-0 grid-cols-3 gap-y-space-300 px-space-200 icon-32">
        {shortcuts.map(([name, icon, colors]) => (
          <div key={name} className="flex flex-col items-center gap-space-100 text-label-lg">
            <span className={twMerge('grid size-18 place-items-center rounded-shape-xl', colors)}>
              <Icon name={icon} />
            </span>
            {name}
          </div>
        ))}
      </div>
    </PhoneTop>
  )
}
