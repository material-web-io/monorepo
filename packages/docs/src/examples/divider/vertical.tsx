import { Card, Divider, Icon } from '@material-web/react'

export default function Vertical() {
  return (
    <Card variant="outlined" className="w-full max-w-xl">
      <div className="flex gap-space-300 p-space-300">
        <div className="flex flex-1 items-center justify-center rounded-shape-md bg-primary-container text-on-primary-container">
          <Icon name="image" className="icon-48" />
        </div>
        <Divider orientation="vertical" />
        <div className="flex flex-1 flex-col gap-space-50">
          <span className="text-label-md text-on-surface-variant">by Selen Zeynep</span>
          <span className="text-title-md text-on-surface">
            What buttons are artists pushing when they perform live
          </span>
          <span className="text-body-md text-on-surface-variant">
            A vertical divider can be used to arrange content on a larger screen, such as separating
            paragraph text from video or imagery media.
          </span>
        </div>
      </div>
    </Card>
  )
}
