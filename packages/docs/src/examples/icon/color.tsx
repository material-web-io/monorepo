import { Icon } from '@material-web/react'

export default function Color() {
  return (
    <div className="flex gap-space-300 icon-32">
      <Icon name="favorite" />
      <Icon name="favorite" className="text-primary" />
      <Icon name="favorite" className="text-tertiary" />
      <Icon name="favorite" className="text-error" />
      <span className="flex gap-space-300 text-on-surface-variant">
        <Icon name="home" />
        <Icon name="search" />
      </span>
    </div>
  )
}
