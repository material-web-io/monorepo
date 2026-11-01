import { Divider, twMerge } from '@material-web/react'
import { Fragment } from 'react'

const rows = ['w-24', 'w-36', 'w-28', 'w-32']

/** Inset dividers between the rows of a list on a screen, the rows only blocked in. */
export default function DividerThumbnail() {
  return (
    <div className="docs-thumbnail-screen w-64 justify-center self-stretch border-y-0">
      {rows.map((width, index) => (
        <Fragment key={width}>
          {index > 0 && <Divider variant="inset" />}
          <div className="flex shrink-0 items-center gap-space-200 px-space-200 py-space-150">
            <span className="size-10 shrink-0 rounded-shape-md bg-surface-container-highest" />
            <span className="flex flex-col gap-space-100">
              <span
                className={twMerge('h-2 rounded-shape-full bg-surface-container-highest', width)}
              />
              <span className="h-2 w-16 rounded-shape-full bg-surface-container-highest" />
            </span>
          </div>
        </Fragment>
      ))}
    </div>
  )
}
