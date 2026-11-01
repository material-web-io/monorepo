import { Icon } from '@material-web/react'

export default function Fill() {
  return (
    <>
      <Icon name="favorite" className="icon-40" />
      <Icon name="favorite" className="icon-40 icon-filled" />
      <div className="flex gap-space-200 text-primary icon-40 icon-filled">
        <Icon name="home" />
        <Icon name="bookmark" />
        <Icon name="delete" className="icon-outlined" />
      </div>
    </>
  )
}
