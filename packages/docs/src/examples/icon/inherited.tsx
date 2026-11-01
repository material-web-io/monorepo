import { Icon } from '@material-web/react'

export default function Inherited() {
  return (
    <div className="flex flex-col gap-space-200">
      <p className="m-0 text-body-lg icon-24">
        <Icon name="info" /> Saved, with a 24dp icon from what holds it
      </p>
      <p className="m-0 text-body-lg">
        <Icon name="info" /> Saved, with an icon of the font size it inherits
      </p>
    </div>
  )
}
