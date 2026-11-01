import { Button, ButtonGroup } from '@material-web/react'

export default function Standard() {
  return (
    <ButtonGroup variant="standard" aria-label="View" defaultSelectedKeys={['week']}>
      <Button id="day" variant="outlined" isSelectable>
        Day
      </Button>
      <Button id="week" variant="outlined" isSelectable>
        Week
      </Button>
      <Button id="month" variant="outlined" isSelectable>
        Month
      </Button>
    </ButtonGroup>
  )
}
