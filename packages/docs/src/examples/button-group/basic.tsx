import { Button, ButtonGroup } from '@material-web/react'

export default function Basic() {
  return (
    <ButtonGroup aria-label="View" defaultSelectedKeys={['week']}>
      <Button id="day" variant="tonal" isSelectable>
        Day
      </Button>
      <Button id="week" variant="tonal" isSelectable>
        Week
      </Button>
      <Button id="month" variant="tonal" isSelectable>
        Month
      </Button>
    </ButtonGroup>
  )
}
