import { Icon, SplitButton, SplitButtonLeading, SplitButtonTrailing } from '@material-web/react'

/** A split button: its action, and the button that opens the menu of the others. */
export default function SplitButtonThumbnail() {
  return (
    <SplitButton size="m" className="shrink-0">
      <SplitButtonLeading>
        <Icon name="download" />
        Download
      </SplitButtonLeading>
      <SplitButtonTrailing aria-label="More download options" />
    </SplitButton>
  )
}
