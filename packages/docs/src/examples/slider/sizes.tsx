import { Slider } from '@material-web/react'

export default function Sizes() {
  return (
    <div className="flex w-80 flex-col gap-space-300">
      <Slider aria-label="Extra small" size="xs" defaultValue={40} />
      <Slider aria-label="Small" size="s" defaultValue={40} />
      <Slider aria-label="Medium" size="m" defaultValue={40} />
      <Slider aria-label="Large" size="l" defaultValue={40} />
      <Slider aria-label="Extra large" size="xl" defaultValue={40} />
    </div>
  )
}
