import { Icon, twMerge } from '@material-web/react'
import { PhoneTop } from '../components/phone'

const tiles = [
  ['Wi-Fi', 'wifi', true],
  ['Bluetooth', 'bluetooth', false],
  ['Flashlight', 'flashlight_on', false],
  ['Do not disturb', 'do_not_disturb_on', false],
  ['Airplane mode', 'flight', false],
  ['Battery saver', 'battery_saver', true],
] as const

/**
 * A ripple as it spreads, which it only does under a press: one of a phone's quick settings
 * with the press circle part way across it, grown from where a finger is on it.
 */
export default function RippleScene() {
  return (
    <PhoneTop className="px-space-200">
      <span className="px-space-100 pt-space-300 pb-space-200 text-headline-sm">
        Quick settings
      </span>
      <div className="grid shrink-0 grid-cols-2 gap-space-150 icon-24 icon-filled">
        {tiles.map(([name, icon, isOn]) => (
          <div
            key={name}
            className={twMerge(
              'relative flex h-22 items-center gap-space-150 overflow-hidden rounded-shape-xl px-space-200 text-title-sm',
              isOn ? 'bg-primary text-on-primary' : 'bg-surface-container-highest text-on-surface',
            )}
          >
            <Icon name={icon} />
            {name}
            {name === 'Wi-Fi' && (
              <span className="absolute -end-12 -top-10 size-44 rounded-full bg-current opacity-state-pressed" />
            )}
          </div>
        ))}
      </div>
      <span className="absolute start-32 top-34 box-border size-12 rounded-full border-2 border-on-primary bg-on-primary/32" />
    </PhoneTop>
  )
}
