import { AppBar, Divider, Icon, IconButton, Switch } from '@material-web/react'
import { Fragment } from 'react'
import { Heading } from 'react-aria-components'
import { PhoneTop } from '../components/phone'

const settings = [
  ['Wi-Fi', 'Home network', true],
  ['Bluetooth', 'Off', false],
  ['Mobile data', 'On', true],
  ['Airplane mode', 'Off', false],
  ['Hotspot', 'Off', false],
] as const

/** A phone's network settings, a switch at the end of each: some on, some off. */
export default function SwitchScene() {
  return (
    <PhoneTop>
      <AppBar isScrolled={false}>
        <IconButton slot="leading" aria-label="Back">
          <Icon name="arrow_back" />
        </IconButton>
        <Heading slot="headline">Network</Heading>
      </AppBar>
      {settings.map(([name, status, isOn], index) => (
        <Fragment key={name}>
          {index > 0 && <Divider />}
          <div className="flex shrink-0 items-center justify-between px-space-300 py-space-150">
            <span className="flex flex-col">
              <span className="text-body-lg">{name}</span>
              <span className="text-body-md text-on-surface-variant">{status}</span>
            </span>
            <Switch aria-label={name} icons="selected" defaultSelected={isOn} />
          </div>
        </Fragment>
      ))}
    </PhoneTop>
  )
}
