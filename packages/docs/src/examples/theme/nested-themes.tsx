import { Button } from '@material-web/react'

const box =
  'flex flex-col items-start gap-space-150 rounded-shape-lg bg-surface p-space-300 text-on-surface inset-ring-1 inset-ring-outline-variant'

export default function NestedThemes() {
  return (
    <>
      <div data-theme="light" className={box}>
        <span className="text-title-md">data-theme="light"</span>
        <Button>Action</Button>
      </div>
      <div data-theme="dark" className={box}>
        <span className="text-title-md">data-theme="dark"</span>
        <Button>Action</Button>
      </div>
      <div data-theme="dark" data-contrast="high" className={box}>
        <span className="text-title-md">dark, high contrast</span>
        <Button>Action</Button>
      </div>
    </>
  )
}
