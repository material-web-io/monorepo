import { Button, ButtonGroup } from '@material-web/react'

export default function Multiple() {
  return (
    <ButtonGroup
      variant="connected"
      className="w-auto"
      aria-label="Filters"
      selectionMode="multiple"
      defaultSelectedKeys={['open']}
    >
      <Button id="open" variant="tonal" isSelectable>
        Open
      </Button>
      <Button id="assigned" variant="tonal" isSelectable>
        Assigned to me
      </Button>
      <Button id="mentioned" variant="tonal" isSelectable>
        Mentioned
      </Button>
    </ButtonGroup>
  )
}
