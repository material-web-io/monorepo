import { Button, ButtonGroup } from '@material-web/react'

const variants = ['elevated', 'filled', 'tonal', 'outlined'] as const

export default function ButtonVariants() {
  return (
    <div className="flex flex-col items-center gap-space-300">
      {variants.map((variant) => (
        <ButtonGroup key={variant} aria-label={`View, ${variant}`} defaultSelectedKeys={['week']}>
          <Button id="day" variant={variant} isSelectable>
            Day
          </Button>
          <Button id="week" variant={variant} isSelectable>
            Week
          </Button>
          <Button id="month" variant={variant} isSelectable>
            Month
          </Button>
        </ButtonGroup>
      ))}
    </div>
  )
}
