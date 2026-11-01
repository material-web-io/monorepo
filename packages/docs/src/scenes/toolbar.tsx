import { Fab, Icon, IconButton, Toolbar } from '@material-web/react'
import { PhoneBottom } from '../components/phone'

const actions = [
  ['Archive', 'archive'],
  ['Delete', 'delete'],
  ['Mark as unread', 'mark_email_unread'],
  ['Star', 'star'],
] as const

/** A floating toolbar beside a FAB, under an email: the actions on what the screen shows. */
export default function ToolbarScene() {
  return (
    <PhoneBottom>
      <div className="flex shrink-0 flex-col px-space-300 pb-space-500">
        <svg
          aria-hidden="true"
          viewBox="0 0 320 150"
          className="mb-space-300 block h-38 w-full shrink-0 rounded-shape-lg bg-primary-container"
        >
          <path d="M0 120 70 70 126 104 176 82 320 132V150H0Z" className="fill-inverse-primary" />
          <path d="M196 108 232 78 268 108V136H196Z" className="fill-primary" />
          <path d="M224 136V116H240V136Z" className="fill-inverse-primary" />
        </svg>
        <span className="text-headline-sm">Cabin for the weekend</span>
        <span className="flex items-center gap-space-150 py-space-200">
          <span className="grid size-10 shrink-0 place-items-center rounded-full bg-tertiary text-title-md text-on-tertiary">
            S
          </span>
          <span className="flex flex-col">
            <span className="text-title-sm">Sandra Adams</span>
            <span className="text-body-sm text-on-surface-variant">to me</span>
          </span>
        </span>
        <p className="m-0 text-body-lg text-on-surface-variant">
          Hey! I’ve got pics and more info on our cabin for the weekend. Get ready to be impressed:
          it looks absolutely incredible from what I can see.
        </p>
      </div>
      <div className="flex shrink-0 items-center justify-center gap-space-100 pb-space-100">
        <Toolbar variant="floating" color="vibrant" aria-label="Message">
          {actions.map(([action, icon]) => (
            <IconButton key={action} aria-label={action}>
              <Icon name={icon} />
            </IconButton>
          ))}
        </Toolbar>
        <Fab color="tertiary-container" aria-label="Reply">
          <Icon name="reply" />
        </Fab>
      </div>
      <div className="docs-thumbnail-indicator" />
    </PhoneBottom>
  )
}
