import { twMerge } from '@material-web/react'

const size = 'rounded-shape-sm px-space-150 py-space-100 text-label-lg'
const off = 'bg-surface-container-high text-on-surface-variant'

export default function Breakpoints() {
  return (
    <>
      <span className={twMerge(size, 'bg-primary text-on-primary')}>compact</span>
      <span
        className={twMerge(size, off, 'medium-screen:bg-primary medium-screen:text-on-primary')}
      >
        medium-screen:
      </span>
      <span
        className={twMerge(size, off, 'expanded-screen:bg-primary expanded-screen:text-on-primary')}
      >
        expanded-screen:
      </span>
      <span className={twMerge(size, off, 'large-screen:bg-primary large-screen:text-on-primary')}>
        large-screen:
      </span>
      <span
        className={twMerge(
          size,
          off,
          'extra-large-screen:bg-primary extra-large-screen:text-on-primary',
        )}
      >
        extra-large-screen:
      </span>
    </>
  )
}
