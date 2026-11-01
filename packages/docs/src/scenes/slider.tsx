import { AppBar, Icon, IconButton, Slider } from '@material-web/react'
import { Heading } from 'react-aria-components'
import { PhoneTop } from '../components/phone'

const volumes = [
  ['Media volume', 'music_note', 60, false],
  ['Call volume', 'call', 80, false],
  ['Ring volume', 'notifications', 40, true],
  ['Alarm volume', 'alarm', 50, false],
] as const

/** Sliders on a phone's sound settings: one for each volume, one of them with stops. */
export default function SliderScene() {
  return (
    <PhoneTop>
      <AppBar isScrolled={false}>
        <IconButton slot="leading" aria-label="Back">
          <Icon name="arrow_back" />
        </IconButton>
        <Heading slot="headline">Sound</Heading>
      </AppBar>
      {volumes.map(([name, icon, volume, hasStops]) => (
        <div key={name} className="flex shrink-0 flex-col gap-space-100 px-space-300 py-space-150">
          <span className="flex items-center gap-space-200 text-body-lg icon-24">
            <Icon name={icon} />
            {name}
          </span>
          <Slider
            aria-label={name}
            defaultValue={volume}
            step={hasStops ? 20 : 1}
            showStops={hasStops}
            className="w-full"
          />
        </div>
      ))}
    </PhoneTop>
  )
}
