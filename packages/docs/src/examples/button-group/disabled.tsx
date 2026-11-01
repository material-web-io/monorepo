import { Button, ButtonGroup } from '@material-web/react'

const views = ['Day', 'Week', 'Month', 'Year']

export default function Disabled() {
  return (
    <div className="flex flex-col items-center gap-space-300">
      <ButtonGroup
        variant="connected"
        className="w-auto"
        aria-label="View, disabled"
        defaultSelectedKeys={['Week']}
        isDisabled
      >
        {views.map((view) => (
          <Button key={view} id={view} variant="outlined" isSelectable>
            {view}
          </Button>
        ))}
      </ButtonGroup>
      <ButtonGroup
        variant="connected"
        className="w-auto"
        aria-label="View, month disabled"
        defaultSelectedKeys={['Week']}
      >
        {views.map((view) => (
          <Button
            key={view}
            id={view}
            variant="outlined"
            isSelectable
            isDisabled={view === 'Month'}
          >
            {view}
          </Button>
        ))}
      </ButtonGroup>
    </div>
  )
}
