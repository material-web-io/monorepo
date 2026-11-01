import { twMerge } from '@material-web/react'

const pill =
  'rounded-space-125-variable bg-secondary-container px-space-200 py-space-125-variable text-label-lg text-on-secondary-container'

export default function Density() {
  return (
    <>
      <span className={pill}>40dp</span>
      <span className={twMerge(pill, 'density-1')}>36dp</span>
      <span className={twMerge(pill, 'density-2')}>32dp</span>
      <span className={twMerge(pill, 'density-3')}>28dp</span>
    </>
  )
}
