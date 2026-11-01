import { Ripple, twMerge } from '@material-web/react'

const host =
  'relative focus-ring h-10 cursor-pointer rounded-shape-full border-0 px-space-300 text-label-lg outline-none'

export default function Colors() {
  return (
    <>
      <button type="button" className={twMerge(host, 'bg-primary text-on-primary')}>
        <Ripple />
        On primary
      </button>
      <button
        type="button"
        className={twMerge(host, 'bg-secondary-container text-on-secondary-container')}
      >
        <Ripple />
        On secondary container
      </button>
      <button type="button" className={twMerge(host, 'bg-transparent text-primary')}>
        <Ripple />
        Primary
      </button>
    </>
  )
}
