import { Icon } from '@material-web/react'

const photo = `data:image/svg+xml,${encodeURIComponent(
  '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 160 160"><rect width="160" height="160" fill="#E8DEF8"/><circle cx="112" cy="52" r="22" fill="#FFD8E4"/><path d="M0 118 52 76 92 108 122 88 160 116V160H0Z" fill="#6750A4"/></svg>',
)}`

export default function ShapeContainers() {
  return (
    <>
      <img src={photo} alt="" className="size-32 object-cover shape-9-sided-cookie" />
      <div className="flex size-32 items-center justify-center bg-primary-container text-on-primary-container shape-sunny">
        <Icon name="favorite" className="icon-48" />
      </div>
      <div className="flex size-32 items-center justify-center bg-tertiary-container text-display-md text-on-tertiary-container shape-4-sided-cookie">
        A
      </div>
    </>
  )
}
