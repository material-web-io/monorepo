import { Ripple, twMerge } from '@material-web/react'
import { Button } from 'react-aria-components'

const host =
  'relative focus-ring flex h-30 w-60 cursor-pointer items-start border-0 bg-surface-container-highest p-space-200 text-title-md text-on-surface outline-none'

export default function Shape() {
  return (
    <>
      <Button className={twMerge(host, 'rounded-shape-md')}>
        <Ripple />
        Medium corners
      </Button>
      <Button className={twMerge(host, 'rounded-shape-xl')}>
        <Ripple />
        Extra large corners
      </Button>
    </>
  )
}
