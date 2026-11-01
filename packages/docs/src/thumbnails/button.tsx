import { Button, Icon } from '@material-web/react'

/** Buttons at the bottom of a screen: the main action between two lesser ones. */
export default function ButtonThumbnail() {
  return (
    <div className="docs-thumbnail-screen h-38 w-full self-start border-x-0 border-t-0">
      <div className="flex grow items-center justify-center gap-space-150">
        <Button variant="tonal">Undo</Button>
        <Button size="m">
          <Icon name="check" />
          Save
        </Button>
        <Button variant="tonal">Redo</Button>
      </div>
      <div className="docs-thumbnail-indicator" />
    </div>
  )
}
