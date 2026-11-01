import { Icon, IconButton } from '@material-web/react'

export default function Widths() {
  return (
    <>
      <IconButton variant="tonal" size="m" width="narrow" aria-label="Add, narrow">
        <Icon name="add" />
      </IconButton>
      <IconButton variant="tonal" size="m" width="default" aria-label="Add, default">
        <Icon name="add" />
      </IconButton>
      <IconButton variant="tonal" size="m" width="wide" aria-label="Add, wide">
        <Icon name="add" />
      </IconButton>
    </>
  )
}
