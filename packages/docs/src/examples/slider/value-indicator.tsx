import { Slider } from '@material-web/react'

export default function ValueIndicator() {
  return (
    <div className="flex w-80 flex-col gap-space-600 pt-space-400">
      <Slider aria-label="Brightness" defaultValue={50} showValueIndicator />
      <Slider
        aria-label="Price"
        maxValue={500}
        step={10}
        defaultValue={[100, 350]}
        formatOptions={{ style: 'currency', currency: 'USD', maximumFractionDigits: 0 }}
        showValueIndicator
      />
    </div>
  )
}
