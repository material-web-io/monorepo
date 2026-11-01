import { Icon } from '@material-web/react'

export default function Labelled() {
  return (
    <p className="m-0 flex items-center gap-space-100 text-body-lg icon-24">
      Ada Lovelace
      <Icon name="verified" aria-label="Verified" className="text-primary icon-filled" />
    </p>
  )
}
