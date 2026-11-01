import { AppBar, Checkbox, Divider, Icon, IconButton } from '@material-web/react'
import { Fragment } from 'react'
import { Heading } from 'react-aria-components'
import { PhoneTop } from '../components/phone'

const permissions = [
  ['Microphone', true],
  ['Location', true],
  ['Contacts', false],
  ['Camera', false],
  ['Notifications', true],
  ['Photos and videos', false],
  ['Nearby devices', false],
] as const

/** An app's permissions: a checkbox at the end of each row, some selected. */
export default function CheckboxScene() {
  return (
    <PhoneTop>
      <AppBar isScrolled={false}>
        <IconButton slot="leading" aria-label="Back">
          <Icon name="arrow_back" />
        </IconButton>
        <Heading slot="headline">Maps</Heading>
      </AppBar>
      <span className="px-space-300 pt-space-100 pb-space-100 text-title-sm text-primary">
        Allow access
      </span>
      {permissions.map(([name, isAllowed], index) => (
        <Fragment key={name}>
          {index > 0 && <Divider />}
          <div className="flex shrink-0 items-center justify-between py-space-100 ps-space-300 pe-space-150 text-body-lg">
            {name}
            <Checkbox aria-label={name} defaultSelected={isAllowed} />
          </div>
        </Fragment>
      ))}
    </PhoneTop>
  )
}
