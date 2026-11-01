import {
  Divider,
  Icon,
  IconButton,
  SplitButton,
  SplitButtonLeading,
  SplitButtonTrailing,
} from '@material-web/react'
import { PhoneBottom } from '../components/phone'

/** A split button at the end of a new email: it sends it, or opens the other ways to. */
export default function SplitButtonScene() {
  return (
    <PhoneBottom>
      <div className="flex shrink-0 flex-col text-body-lg">
        <span className="px-space-300 pb-space-200 text-headline-sm">New email</span>
        <Divider />
        <span className="flex gap-space-200 px-space-300 py-space-200">
          <span className="text-on-surface-variant">To</span>
          ali.connors@example.com
        </span>
        <Divider />
        <span className="px-space-300 py-space-200">Brunch this weekend?</span>
        <Divider />
        <p className="m-0 px-space-300 py-space-200 text-on-surface-variant">
          Hi Ali, are you free on Sunday? There’s a new place by the lake that I’d like to try, and
          they take bookings until Friday.
        </p>
      </div>
      <div className="flex shrink-0 items-center justify-between px-space-200 pt-space-500 pb-space-100">
        <span className="flex">
          <IconButton aria-label="Attach a file">
            <Icon name="attach_file" />
          </IconButton>
          <IconButton aria-label="Add a picture">
            <Icon name="image" />
          </IconButton>
        </span>
        <SplitButton size="m">
          <SplitButtonLeading>
            <Icon name="send" />
            Send
          </SplitButtonLeading>
          <SplitButtonTrailing aria-label="More ways to send" />
        </SplitButton>
      </div>
      <div className="docs-thumbnail-indicator" />
    </PhoneBottom>
  )
}
