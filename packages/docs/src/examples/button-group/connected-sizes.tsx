import { Button, ButtonGroup } from '@material-web/react'

const sizes = ['xs', 's', 'm', 'l'] as const

export default function ConnectedSizes() {
  return (
    <div className="flex flex-col items-center gap-space-300">
      {sizes.map((size) => (
        <ButtonGroup
          key={size}
          variant="connected"
          size={size}
          className="w-auto"
          aria-label={`Rating, ${size}`}
          defaultSelectedKeys={['2']}
        >
          <Button id="1" size={size} variant="tonal" isSelectable>
            1
          </Button>
          <Button id="2" size={size} variant="tonal" isSelectable>
            2
          </Button>
          <Button id="3" size={size} variant="tonal" isSelectable>
            3
          </Button>
        </ButtonGroup>
      ))}
    </div>
  )
}
