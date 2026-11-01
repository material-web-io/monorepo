import { Button, Icon, IconButton } from '@material-web/react'

const actions = [
  ['Email', 'mail'],
  ['Message', 'chat'],
] as const

/**
 * A FAB menu as it is open, which it only is over a page: its items, each a tonal button in the
 * menu's color, over the button that closes it.
 */
export default function FabMenuThumbnail() {
  return (
    <div className="flex shrink-0 flex-col items-end gap-space-50">
      {actions.map(([action, icon]) => (
        <Button
          key={action}
          size="m"
          variant="tonal"
          className="bg-primary-container text-on-primary-container"
        >
          <Icon name={icon} />
          {action}
        </Button>
      ))}
      <IconButton variant="filled" size="m" aria-label="Close" className="mt-space-50">
        <Icon name="close" />
      </IconButton>
    </div>
  )
}
