import { Button } from '@material-web/react'
import { PhoneBottom } from '../components/phone'

/** The end of a payment: who it goes to and how much, over the buttons that send it or not. */
export default function ButtonScene() {
  return (
    <PhoneBottom className="items-center px-space-300 text-center">
      <span className="grid size-24 shrink-0 place-items-center rounded-full bg-tertiary-container text-display-sm text-on-tertiary-container">
        A
      </span>
      <span className="pt-space-200 text-headline-sm">Ali Connors</span>
      <span className="text-body-md text-on-surface-variant">@ali-connors</span>
      <span className="pt-space-300 text-body-lg">
        Thanks for getting the groceries. I’ll do them next week.
      </span>
      <span className="py-space-400 text-display-md">$159.32</span>
      <Button size="m" className="w-full">
        Send payment
      </Button>
      <Button size="m" variant="text" className="mt-space-100 w-full">
        Not now
      </Button>
      <div className="pt-space-200">
        <div className="docs-thumbnail-indicator" />
      </div>
    </PhoneBottom>
  )
}
