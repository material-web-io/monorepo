import { Button, ButtonGroup } from '@material-web/react'

const sizes = ['xs', 's', 'm', 'l'] as const

export default function Sizes() {
  return (
    <div className="flex flex-col items-center gap-space-300">
      {sizes.map((size) => (
        <ButtonGroup
          key={size}
          size={size}
          aria-label={`View, ${size}`}
          defaultSelectedKeys={['week']}
        >
          <Button id="day" size={size} variant="tonal" isSelectable>
            Day
          </Button>
          <Button id="week" size={size} variant="tonal" isSelectable>
            Week
          </Button>
          <Button id="month" size={size} variant="tonal" isSelectable>
            Month
          </Button>
        </ButtonGroup>
      ))}
    </div>
  )
}
