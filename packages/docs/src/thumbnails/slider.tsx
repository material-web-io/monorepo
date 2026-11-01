import { Slider } from '@material-web/react'
import { Label, SliderOutput } from 'react-aria-components'

const volumes = [
  ['Media', 60],
  ['Alarm', 25],
] as const

/** Two sliders on a screen, each under its name and its value. */
export default function SliderThumbnail() {
  return (
    <div className="docs-thumbnail-screen w-64 justify-center gap-space-250 self-stretch border-y-0 px-space-200">
      {volumes.map(([name, volume]) => (
        <Slider key={name} defaultValue={volume} className="w-full gap-space-100">
          <div className="flex justify-between px-space-150 text-body-md text-on-surface">
            <Label>{name}</Label>
            <SliderOutput className="text-on-surface-variant" />
          </div>
        </Slider>
      ))}
    </div>
  )
}
