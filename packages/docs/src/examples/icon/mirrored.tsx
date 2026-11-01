import { Icon } from '@material-web/react'

export default function Mirrored() {
  return (
    <>
      <div dir="ltr" className="flex items-center gap-space-200 icon-32">
        <Icon name="arrow_back" className="rtl:icon-mirrored" />
        <Icon name="check" />
        <span className="text-label-lg text-on-surface-variant">Left to right</span>
      </div>
      <div dir="rtl" className="flex items-center gap-space-200 icon-32">
        <Icon name="arrow_back" className="rtl:icon-mirrored" />
        <Icon name="check" />
        <span className="text-label-lg text-on-surface-variant">Right to left</span>
      </div>
    </>
  )
}
