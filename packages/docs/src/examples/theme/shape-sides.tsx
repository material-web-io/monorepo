import { twMerge } from '@material-web/react'

export default function ShapeSides() {
  const box = 'size-24 bg-tertiary-container'
  return (
    <>
      <div className={twMerge(box, 'rounded-t-shape-xl')} />
      <div className={twMerge(box, 'rounded-e-shape-xl')} />
      <div className={twMerge(box, 'rounded-b-shape-xl')} />
      <div className={twMerge(box, 'rounded-s-shape-xl')} />
      <div className={twMerge(box, 'rounded-tl-shape-2xl rounded-br-shape-2xl')} />
    </>
  )
}
