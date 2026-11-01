import { Button, ButtonGroup } from '@material-web/react'

const views = ['Day', 'Week', 'Month', 'Year']

export default function Connected() {
  return (
    <div className="w-full max-w-120">
      <ButtonGroup variant="connected" aria-label="View" defaultSelectedKeys={['Week']}>
        {views.map((view) => (
          <Button key={view} id={view} variant="tonal" isSelectable>
            {view}
          </Button>
        ))}
      </ButtonGroup>
    </div>
  )
}
