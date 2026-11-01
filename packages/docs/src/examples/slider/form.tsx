import { Button, Slider } from '@material-web/react'
import { useState } from 'react'
import { Label, SliderOutput } from 'react-aria-components'

export default function Form() {
  const [sent, setSent] = useState('Nothing sent yet')
  return (
    <form
      className="flex flex-col items-start gap-space-300"
      onSubmit={(event) => {
        event.preventDefault()
        const entries = [...new FormData(event.currentTarget)]
        setSent(entries.map(([name, value]) => `${name}=${String(value)}`).join('&'))
      }}
      onReset={() => setSent('Nothing sent yet')}
    >
      <Slider name="volume" defaultValue={40} className="w-80 gap-space-100">
        <div className="flex justify-between px-space-150 text-body-md text-on-surface">
          <Label>Volume</Label>
          <SliderOutput className="text-on-surface-variant" />
        </div>
      </Slider>
      <Slider
        name="price"
        maxValue={500}
        step={10}
        defaultValue={[100, 350]}
        className="w-80 gap-space-100"
      >
        <div className="flex justify-between px-space-150 text-body-md text-on-surface">
          <Label>Price</Label>
          <SliderOutput className="text-on-surface-variant" />
        </div>
      </Slider>
      <div className="flex gap-space-100">
        <Button type="reset" variant="text">
          Reset
        </Button>
        <Button type="submit">Save</Button>
      </div>
      <output className="text-body-sm text-on-surface-variant">{sent}</output>
    </form>
  )
}
