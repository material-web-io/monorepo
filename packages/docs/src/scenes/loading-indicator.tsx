import { AppBar, Icon, IconButton, LoadingIndicator, twMerge } from '@material-web/react'
import { Heading } from 'react-aria-components'
import { PhoneTop } from '../components/phone'

const rows = ['w-40', 'w-52', 'w-36', 'w-48']

/** A loading indicator as a library is refreshed: contained, over rows that are still to come. */
export default function LoadingIndicatorScene() {
  return (
    <PhoneTop>
      <AppBar isScrolled={false}>
        <Heading slot="headline">Library</Heading>
        <IconButton slot="trailing" aria-label="Search">
          <Icon name="search" />
        </IconButton>
      </AppBar>
      <div className="flex shrink-0 justify-center pt-space-100 pb-space-300">
        <LoadingIndicator aria-label="Refreshing library" size={64} isContained />
      </div>
      {rows.map((width) => (
        <div
          key={width}
          className="flex shrink-0 items-center gap-space-200 px-space-200 py-space-150"
        >
          <span className="size-14 shrink-0 rounded-shape-md bg-surface-container-highest" />
          <span className="flex flex-col gap-space-150">
            <span
              className={twMerge('h-3 rounded-shape-full bg-surface-container-highest', width)}
            />
            <span className="h-3 w-24 rounded-shape-full bg-surface-container-high" />
          </span>
        </div>
      ))}
    </PhoneTop>
  )
}
