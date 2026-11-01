import { Button, Radio, RadioGroup } from '@material-web/react'
import { PhoneTop } from '../components/phone'

const settings = [
  ['Media volume', 'Music, videos and games'],
  ['Call volume', 'Calls on this phone'],
  ['Phone ringtone', 'Callisto'],
  ['Default notification sound', 'Pixie Dust'],
  ['Default alarm sound', 'Bright Morning'],
  ['Vibration & haptics', 'On'],
  ['Dial pad tones', 'Off'],
] as const

const ringtones = ['None', 'Callisto', 'Ganymede', 'Luna']

/**
 * A dialog as it is open, which it only is over a page: its container, with a title, the
 * choices and its two actions, over a page of settings under the scrim.
 */
export default function DialogScene() {
  return (
    <PhoneTop>
      {settings.map(([name, value]) => (
        <div key={name} className="flex shrink-0 flex-col px-space-300 py-space-150">
          <span className="text-body-lg">{name}</span>
          <span className="text-body-md text-on-surface-variant">{value}</span>
        </div>
      ))}
      <div className="absolute inset-0 bg-scrim/32" />
      <div className="docs-thumbnail-panel absolute inset-x-space-300 top-26 rounded-shape-xl bg-surface-container-high pt-space-300 pb-space-250">
        <span className="px-space-300 pb-space-150 text-headline-sm">Phone ringtone</span>
        <RadioGroup
          aria-label="Phone ringtone"
          defaultValue="Callisto"
          className="flex flex-col items-start px-space-150 text-body-lg"
        >
          {ringtones.map((ringtone) => (
            <Radio key={ringtone} value={ringtone}>
              {ringtone}
            </Radio>
          ))}
        </RadioGroup>
        <div className="flex justify-end gap-space-100 px-space-300 pt-space-200">
          <Button variant="text">Cancel</Button>
          <Button variant="text">OK</Button>
        </div>
      </div>
    </PhoneTop>
  )
}
