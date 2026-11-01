import { Button, Dialog, DialogTrigger, Divider, Radio, RadioGroup } from '@material-web/react'
import { useState } from 'react'
import { Heading } from 'react-aria-components'

const ringtones = ['None', 'Callisto', 'Ganymede', 'Luna', 'Europa', 'Titan', 'Io', 'Oberon']

export default function Scrolling() {
  const [ringtone, setRingtone] = useState<string | null>(null)
  return (
    <DialogTrigger>
      <Button variant="tonal">Phone ringtone</Button>
      <Dialog className="max-h-100">
        <Heading
          slot="title"
          className="m-0 px-space-300 pb-space-200 text-headline-sm text-on-surface"
        >
          Phone ringtone
        </Heading>
        <Divider />
        <RadioGroup
          aria-label="Phone ringtone"
          value={ringtone}
          onChange={setRingtone}
          className="flex min-h-0 grow flex-col overflow-y-auto px-space-300"
        >
          {ringtones.map((name) => (
            <Radio
              key={name}
              value={name}
              className="flex h-12 items-center text-body-lg text-on-surface"
            >
              {name}
            </Radio>
          ))}
        </RadioGroup>
        <Divider />
        <div className="flex shrink-0 flex-wrap-reverse justify-end gap-space-100 px-space-300 pt-space-200">
          <Button variant="text" slot="close">
            Cancel
          </Button>
          <Button variant="text" slot="close" isDisabled={ringtone === null}>
            OK
          </Button>
        </div>
      </Dialog>
    </DialogTrigger>
  )
}
