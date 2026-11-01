import { Icon, Slider } from '@material-web/react'
import { useState } from 'react'

export default function InsetIcon() {
  const [volume, setVolume] = useState(30)
  return (
    <div className="flex w-80 flex-col gap-space-300">
      <Slider
        aria-label="Volume"
        size="l"
        value={volume}
        onChange={setVolume}
        icon={<Icon name={volume === 0 ? 'volume_off' : 'volume_up'} />}
      />
      <Slider
        aria-label="Brightness"
        size="xl"
        defaultValue={5}
        icon={<Icon name="light_mode" />}
      />
    </div>
  )
}
